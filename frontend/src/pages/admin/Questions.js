import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/questions');
      setQuestions(data.questions || []);
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
      await adminApi.patch(`/admin/questions/${id}/visibility`, { isHidden: !isHidden });
      setMessage('Question visibility updated');
      await load(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this discussion?')) return;
    try {
      await adminApi.delete(`/admin/questions/${id}`);
      setMessage('Question deleted');
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      await load(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Discussions</h2>
          <p>Moderate questions and answers across the community.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => load(false)}>
          Refresh
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      {loading && questions.length === 0 ? (
        <LoadingInline />
      ) : questions.length === 0 ? (
        <EmptyState title="No discussions yet" />
      ) : (
        <div className="list-stack">
          {questions.map((q) => (
            <div key={q._id} className="list-item static">
              <div>
                <div className="row-between">
                  <h4>{q.title}</h4>
                  <span className={`badge ${q.isHidden ? 'rejected' : q.status}`}>{q.isHidden ? 'hidden' : q.status}</span>
                </div>
                <p>{q.content?.slice(0, 160)}...</p>
                <small>
                  {q.author?.name} · {q.answers?.length || 0} answers · {new Date(q.createdAt).toLocaleString()}
                </small>
              </div>
              <div className="table-actions">
                <button type="button" className="btn btn-outline sm" onClick={() => toggle(q._id, q.isHidden)}>
                  {q.isHidden ? 'Unhide' : 'Hide'}
                </button>
                <button type="button" className="btn btn-danger sm" onClick={() => remove(q._id)}>
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
