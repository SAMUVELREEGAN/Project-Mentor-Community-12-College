import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicApi, userApi } from '../../api/client';
import { useUserAuth } from '../../context/UserAuthContext';
import { Alert, LoadingInline } from '../../components/common/UI';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { UPLOAD_BASE } from '../../api/config';

export function ProjectDetailView({ embedded = false }) {
  const { id } = useParams();
  const { isAuthenticated, user } = useUserAuth();
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await publicApi.get(`/projects/${id}`);
        if (!active) return;
        setProject(data.project);
        setComments(data.comments || []);
        if (isAuthenticated) {
          try {
            const check = await userApi.get(`/bookmarks/check/${id}`);
            if (active) setBookmarked(check.data.bookmarked);
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, isAuthenticated]);

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      setError('Please login to bookmark projects');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (bookmarked) {
        await userApi.delete(`/bookmarks/${id}`);
        setBookmarked(false);
        setSuccess('Bookmark removed');
      } else {
        await userApi.post('/bookmarks', { projectId: id });
        setBookmarked(true);
        setSuccess('Project bookmarked');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please login to comment');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await userApi.post('/comments', { content: comment, projectId: id });
      setComments((prev) => [...prev, data.comment]);
      setComment('');
      setSuccess('Comment posted');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="stack">
      {loading ? (
        <LoadingInline />
      ) : !project ? (
        <Alert type="error" message={error || 'Project not found'} />
      ) : (
        <>
          <div className="page-header">
            <div>
              <span className="tag">{project.category}</span>
              <h2>{project.title}</h2>
              <p>
                by {project.author?.name} · {project.views} views ·{' '}
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="action-row">
              {isAuthenticated && (
                <button type="button" className="btn btn-outline" onClick={toggleBookmark} disabled={saving}>
                  {bookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
              )}
              {!embedded && !isAuthenticated && (
                <Link to="/login" className="btn btn-primary">
                  Login to interact
                </Link>
              )}
            </div>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          <section className="panel prose">
            <h3>Overview</h3>
            <p>{project.description}</p>
            <div className="tech-list large">
              {(project.technologies || []).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </section>

          {[
            ['challenges', 'Implementation Challenges'],
            ['commonErrors', 'Common Errors'],
            ['debuggingTechniques', 'Debugging Techniques'],
            ['solutions', 'Solutions'],
            ['documentation', 'Documentation'],
            ['resources', 'Useful Resources'],
          ].map(([key, label]) =>
            project[key] ? (
              <section key={key} className="panel prose">
                <h3>{label}</h3>
                <p className="pre-wrap">{project[key]}</p>
              </section>
            ) : null
          )}

          {project.attachments?.length > 0 && (
            <section className="panel">
              <h3>Attachments</h3>
              <ul className="link-list">
                {project.attachments.map((file) => (
                  <li key={file}>
                    <a href={`${UPLOAD_BASE}/${file}`} target="_blank" rel="noreferrer">
                      {file}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel">
            <h3>Discussion ({comments.length})</h3>
            {comments.length === 0 && <p className="muted">No comments yet. Start the discussion.</p>}
            <div className="comment-list">
              {comments.map((c) => (
                <div key={c._id} className="comment-item">
                  <strong>{c.author?.name}</strong>
                  <small>{new Date(c.createdAt).toLocaleString()}</small>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
            {isAuthenticated && (
              <form className="stack-sm" onSubmit={submitComment}>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Ask a question or share feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Posting...' : 'Post comment'}
                </button>
              </form>
            )}
          </section>

          {project.author && (
            <section className="panel">
              <h3>Mentor</h3>
              <p>
                <strong>{project.author.name}</strong> · {project.author.role}
              </p>
              {project.author.bio && <p className="muted">{project.author.bio}</p>}
            </section>
          )}

          {user && String(user.id) === String(project.author?._id || project.author?.id) && (
            <Link to="/app/my-projects" className="btn btn-outline">
              Manage in My Projects
            </Link>
          )}
        </>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="public-page">
      <PublicNavbar />
      <div className="public-container">{content}</div>
    </div>
  );
}

export default function ProjectDetail() {
  return <ProjectDetailView embedded />;
}
