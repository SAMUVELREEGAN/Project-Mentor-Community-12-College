import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../api/client';
import { useUserAuth } from '../../context/UserAuthContext';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  );
}

function isSystemMessage(content = '') {
  return / (created this chat|joined the chat|added |Chat opened for project)/.test(content) || content.startsWith('Chat opened for project');
}

export default function Chat() {
  const { user } = useUserAuth();

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [directory, setDirectory] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [mobilePane, setMobilePane] = useState('list');

  const threadRef = useRef(null);
  const lastStampRef = useRef(null);
  const stickBottomRef = useRef(true);

  const loadProjects = useCallback(async (silent = false) => {
    if (!silent) setLoadingProjects(true);
    try {
      const { data } = await userApi.get('/chat/projects');
      setProjects(data.projects || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoadingProjects(false);
    }
  }, []);

  const loadMessages = useCallback(async (roomId, { silent = false, incremental = false } = {}) => {
    if (!roomId) return;
    if (!silent && !incremental) setLoadingMessages(true);
    try {
      const params = {};
      if (incremental && lastStampRef.current) params.after = lastStampRef.current;
      const { data } = await userApi.get(`/chat/rooms/${roomId}/messages`, { params });
      const next = data.messages || [];

      if (incremental) {
        if (next.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m._id));
            const merged = [...prev];
            next.forEach((m) => {
              if (!seen.has(m._id)) merged.push(m);
            });
            return merged;
          });
          lastStampRef.current = next[next.length - 1].createdAt;
        }
      } else {
        setMessages(next);
        lastStampRef.current = next.length ? next[next.length - 1].createdAt : null;
      }
    } catch (err) {
      if (!incremental) setError(err.message);
    } finally {
      if (!silent && !incremental) setLoadingMessages(false);
    }
  }, []);

  const openProject = useCallback(
    async (projectId) => {
      setActiveProjectId(projectId);
      setMobilePane('chat');
      setShowMembers(false);
      setError('');
      setLoadingMessages(true);
      try {
        const { data } = await userApi.post(`/chat/projects/${projectId}/open`);
        setRoom(data.room);
        setProject(data.project);
        lastStampRef.current = null;
        stickBottomRef.current = true;
        await loadMessages(data.room._id);
        await loadProjects(true);
      } catch (err) {
        setError(err.message);
        setRoom(null);
        setProject(null);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [loadMessages, loadProjects]
  );

  useEffect(() => {
    loadProjects(false);
  }, [loadProjects]);

  useEffect(() => {
    const timer = setInterval(() => loadProjects(true), 15000);
    return () => clearInterval(timer);
  }, [loadProjects]);

  useEffect(() => {
    if (!projects.length) return;
    if (activeProjectId && projects.some((item) => item.project._id === activeProjectId)) return;
    openProject(projects[0].project._id);
  }, [projects, activeProjectId, openProject]);

  useEffect(() => {
    if (!room?._id || !room?.isMember) return undefined;
    const timer = setInterval(() => loadMessages(room._id, { silent: true, incremental: true }), 2500);
    return () => clearInterval(timer);
  }, [room?._id, room?.isMember, loadMessages]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el || !stickBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, room?._id]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(({ project: p, room: r }) => {
      const haystack = [
        p.title,
        p.description,
        p.category,
        p.author?.name,
        ...(p.technologies || []),
        r?.lastMessagePreview,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, search]);

  const loadDirectory = async (query = '') => {
    try {
      const { data } = await userApi.get('/chat/directory', { params: { search: query || undefined } });
      setDirectory(data.users || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addMembers = async (e) => {
    e.preventDefault();
    if (!room?._id || selectedMembers.length === 0) return;
    setError('');
    try {
      const { data } = await userApi.post(`/chat/rooms/${room._id}/members`, { memberIds: selectedMembers });
      setRoom(data.room);
      setSelectedMembers([]);
      setShowMembers(false);
      await loadMessages(room._id, { silent: true });
      await loadProjects(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !room?._id || sending) return;

    setSending(true);
    setError('');
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: {
        _id: user.id,
        name: user.name,
        role: user.role,
      },
      pending: true,
    };

    stickBottomRef.current = true;
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');

    try {
      const { data } = await userApi.post(`/chat/rooms/${room._id}/messages`, { content });
      setMessages((prev) => prev.map((m) => (m._id === tempId ? data.message : m)));
      lastStampRef.current = data.message.createdAt;
      setProjects((prev) =>
        prev
          .map((item) =>
            item.project._id === activeProjectId
              ? {
                  ...item,
                  room: {
                    ...(item.room || {}),
                    _id: room._id,
                    lastMessageAt: data.message.createdAt,
                    lastMessagePreview: content.slice(0, 160),
                    memberCount: room.members?.length || item.room?.memberCount || 1,
                    isMember: true,
                  },
                }
              : item
          )
          .sort(
            (a, b) =>
              new Date(b.room?.lastMessageAt || b.project.createdAt) -
              new Date(a.room?.lastMessageAt || a.project.createdAt)
          )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setDraft(content);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const onThreadScroll = () => {
    const el = threadRef.current;
    if (!el) return;
    stickBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  return (
    <div className="chat-page">
      <div className="page-header chat-page-header">
        <div>
          <h2>Project Group Chat</h2>
          <p>Pick a project on the left. Chat with the owner and juniors together on the right.</p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className={`chat-shell ${mobilePane === 'chat' ? 'show-chat' : 'show-list'}`}>
        <aside className="chat-sidebar">
          <div className="chat-sidebar-head">
            <label className="chat-sidebar-label" htmlFor="project-search">
              Projects
            </label>
            <input
              id="project-search"
              className="input"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loadingProjects && projects.length === 0 ? (
            <LoadingInline message="Loading projects..." />
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title="No approved projects"
              description="Approved mentor projects will appear here for group discussion."
              action={
                <Link to="/app/projects" className="btn btn-outline sm">
                  Browse projects
                </Link>
              }
            />
          ) : (
            <div className="chat-room-list">
              {filteredProjects.map(({ project: p, room: r }) => (
                <button
                  key={p._id}
                  type="button"
                  className={`chat-room-item ${activeProjectId === p._id ? 'active' : ''}`}
                  onClick={() => openProject(p._id)}
                >
                  <div className="chat-room-avatar">{initials(p.title)}</div>
                  <div className="chat-room-meta">
                    <div className="chat-room-top">
                      <strong>{p.title}</strong>
                      <span>{formatTime(r?.lastMessageAt || p.createdAt)}</span>
                    </div>
                    <p>{r?.lastMessagePreview || p.description?.slice(0, 80) || 'Start the project chat'}</p>
                    <div className="chat-room-tags">
                      <span className="tag">{p.category}</span>
                      <span className="tag">{r?.memberCount || 0} chatting</span>
                      <span className="muted small">by {p.author?.name}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="chat-main">
          {!room || !project ? (
            <div className="chat-empty">
              <EmptyState title="Select a project" description="Choose a project on the left to open its group chat." />
            </div>
          ) : (
            <>
              <header className="chat-main-head">
                <button type="button" className="btn btn-ghost sm chat-back" onClick={() => setMobilePane('list')}>
                  Projects
                </button>
                <div className="chat-main-title">
                  <h3>{project.title}</h3>
                  <p>
                    {project.category} · owner {project.author?.name || room.owner?.name} ·{' '}
                    {room.members?.length || 0} in chat
                  </p>
                </div>
                <div className="chat-member-stack" title={room.members?.map((m) => m.name).join(', ')}>
                  {(room.members || []).slice(0, 5).map((m) => (
                    <span key={m._id} className="chat-face" data-role={m.role}>
                      {initials(m.name)}
                    </span>
                  ))}
                  {(room.members || []).length > 5 && (
                    <span className="chat-face more">+{(room.members || []).length - 5}</span>
                  )}
                </div>
                <Link to={`/app/projects/${project._id}`} className="btn btn-outline sm">
                  View project
                </Link>
                {room.isOwner && (
                  <button
                    type="button"
                    className="btn btn-outline sm"
                    onClick={() => {
                      setShowMembers(true);
                      setSelectedMembers([]);
                      loadDirectory();
                    }}
                  >
                    Add people
                  </button>
                )}
              </header>

              <div className="chat-thread" ref={threadRef} onScroll={onThreadScroll}>
                {loadingMessages ? (
                  <LoadingInline message="Loading messages..." />
                ) : messages.length === 0 ? (
                  <EmptyState
                    title="No messages yet"
                    description="Ask questions, share tips, or discuss this project with everyone in the room."
                  />
                ) : (
                  messages.map((m, index) => {
                    const mine = String(m.author?._id || m.author?.id) === String(user?.id || user?._id);
                    const system = isSystemMessage(m.content);
                    const prev = messages[index - 1];
                    const sameAuthor =
                      prev && String(prev.author?._id || prev.author?.id) === String(m.author?._id || m.author?.id);

                    if (system) {
                      return (
                        <div key={m._id} className="chat-system">
                          <span>{m.content}</span>
                        </div>
                      );
                    }

                    return (
                      <div key={m._id} className={`chat-row ${mine ? 'mine' : 'theirs'} ${sameAuthor ? 'grouped' : ''}`}>
                        {!mine && !sameAuthor && <div className="chat-face">{initials(m.author?.name)}</div>}
                        {!mine && sameAuthor && <div className="chat-face spacer" />}
                        <div className={`chat-bubble ${m.pending ? 'pending' : ''}`}>
                          {!mine && !sameAuthor && (
                            <div className="chat-author">
                              {m.author?.name}
                              <span>{m.author?.role}</span>
                            </div>
                          )}
                          <p>{m.content}</p>
                          <time>{formatTime(m.createdAt)}</time>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form className="chat-composer" onSubmit={sendMessage}>
                <textarea
                  className="input"
                  rows={1}
                  placeholder={`Message everyone about ${project.title}...`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {showMembers && room && (
        <div className="chat-modal-backdrop" onClick={() => setShowMembers(false)} role="presentation">
          <form className="chat-modal panel" onClick={(e) => e.stopPropagation()} onSubmit={addMembers}>
            <div className="panel-head">
              <h3>Add people to {project?.title}</h3>
              <button type="button" className="icon-btn" onClick={() => setShowMembers(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="chat-picker-head">
              <strong>Invite juniors or mentors</strong>
              <input
                className="input sm-input"
                placeholder="Search people..."
                onChange={(e) => loadDirectory(e.target.value)}
              />
            </div>
            <div className="chat-picker">
              {directory
                .filter((u) => !(room.members || []).some((m) => String(m._id) === String(u._id)))
                .map((u) => (
                  <label key={u._id} className={`chat-pick ${selectedMembers.includes(u._id) ? 'on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(u._id)}
                      onChange={() => toggleMember(u._id)}
                    />
                    <span className="chat-face">{initials(u.name)}</span>
                    <span>
                      <strong>{u.name}</strong>
                      <small>
                        {u.role}
                        {u.college ? ` · ${u.college}` : ''}
                      </small>
                    </span>
                  </label>
                ))}
            </div>
            <div className="action-row">
              <button type="button" className="btn btn-outline" onClick={() => setShowMembers(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={selectedMembers.length === 0}>
                Add to chat
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
