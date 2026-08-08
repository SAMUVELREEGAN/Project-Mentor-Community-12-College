import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/comments');
      setComments(data.comments || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 20000);
    return () => clearInterval(timer);
  }, [load]);

  const toggle = async (id, isHidden) => {
    try {
      await adminApi.patch(`/admin/comments/${id}/visibility`, { isHidden: !isHidden });
      setMessage('Comment visibility updated');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await adminApi.delete(`/admin/comments/${id}`);
      setMessage('Comment deleted');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Comments</h2>
          <p>Moderate project discussion threads.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => load(false)}>
          Refresh
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      {loading ? (
        <LoadingInline />
      ) : comments.length === 0 ? (
        <EmptyState title="No comments yet" />
      ) : (
        <div className="list-stack">
          {comments.map((c) => (
            <div key={c._id} className="list-item static">
              <div>
                <h4>{c.project?.title || 'Project'}</h4>
                <p>{c.content}</p>
                <small>
                  {c.author?.name} · {new Date(c.createdAt).toLocaleString()} ·{' '}
                  {c.isHidden ? 'Hidden' : 'Visible'}
                </small>
              </div>
              <div className="table-actions">
                <button type="button" className="btn btn-outline sm" onClick={() => toggle(c._id, c.isHidden)}>
                  {c.isHidden ? 'Unhide' : 'Hide'}
                </button>
                <button type="button" className="btn btn-danger sm" onClick={() => remove(c._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
