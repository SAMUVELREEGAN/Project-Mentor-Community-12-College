import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/projects', {
        params: { status: status === 'all' ? undefined : status },
      });
      setProjects(data.projects || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 20000);
    return () => clearInterval(timer);
  }, [load]);

  const verify = async (id, nextStatus, rejectionReason = '') => {
    setBusyId(id);
    setError('');
    try {
      const { data } = await adminApi.patch(`/admin/projects/${id}/verify`, {
        status: nextStatus,
        rejectionReason,
      });
      setMessage(`Project ${nextStatus}`);
      setRejectId(null);
      setReason('');

      const updated = data.project;
      setProjects((prev) => {
        if (status !== 'all' && status !== nextStatus) {
          return prev.filter((p) => p._id !== id);
        }
        return prev.map((p) => (p._id === id ? updated || { ...p, status: nextStatus } : p));
      });

      await load(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this project permanently?')) return;
    setBusyId(id);
    setError('');
    try {
      await adminApi.delete(`/admin/projects/${id}`);
      setMessage('Project deleted');
      setProjects((prev) => prev.filter((p) => p._id !== id));
      await load(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Project Moderation</h2>
          <p>Verify mentor uploads before they appear publicly.</p>
        </div>
      </div>

      <div className="filters">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        <button type="button" className="btn btn-outline" onClick={() => load(false)}>
          Refresh
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      {loading && projects.length === 0 ? (
        <LoadingInline />
      ) : projects.length === 0 ? (
        <EmptyState title="No projects in this filter" />
      ) : (
        <div className="list-stack">
          {projects.map((p) => (
            <div key={p._id} className="list-item static">
              <div>
                <div className="row-between">
                  <h4>{p.title}</h4>
                  <span className={`badge ${p.status}`}>{p.status}</span>
                </div>
                <p>{p.description?.slice(0, 180)}...</p>
                <small>
                  {p.author?.name} · {p.category} · {new Date(p.createdAt).toLocaleString()}
                </small>
                {p.rejectionReason && <p className="muted small">Rejection: {p.rejectionReason}</p>}
              </div>
              <div className="table-actions">
                {p.status !== 'approved' && (
                  <button
                    type="button"
                    className="btn btn-primary sm"
                    disabled={busyId === p._id}
                    onClick={() => verify(p._id, 'approved')}
                  >
                    {busyId === p._id ? 'Saving...' : 'Approve'}
                  </button>
                )}
                {p.status !== 'rejected' && (
                  <button
                    type="button"
                    className="btn btn-outline sm"
                    disabled={busyId === p._id}
                    onClick={() => setRejectId(p._id)}
                  >
                    Reject
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger sm"
                  disabled={busyId === p._id}
                  onClick={() => remove(p._id)}
                >
                  Delete
                </button>
              </div>
              {rejectId === p._id && (
                <div className="reject-box full-span">
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Rejection reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-danger sm"
                    disabled={busyId === p._id}
                    onClick={() => verify(p._id, 'rejected', reason)}
                  >
                    Confirm reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
