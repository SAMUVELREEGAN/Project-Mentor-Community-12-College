import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data } = await userApi.get('/projects/mine');
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 10000);
    return () => clearInterval(timer);
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await userApi.delete(`/projects/${id}`);
      setMessage('Project deleted');
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>My Projects</h2>
          <p>Track verification status and manage your uploads.</p>
        </div>
        <Link to="/app/upload" className="btn btn-primary">
          Upload new
        </Link>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      {loading && projects.length === 0 ? (
        <LoadingInline />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No uploads yet"
          description="Share a completed project to mentor juniors."
          action={
            <Link to="/app/upload" className="btn btn-primary">
              Upload project
            </Link>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link to={`/app/projects/${p._id}`}>{p.title}</Link>
                    {p.status === 'rejected' && p.rejectionReason && (
                      <div className="muted small">Reason: {p.rejectionReason}</div>
                    )}
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <span className={`badge ${p.status}`}>{p.status}</span>
                  </td>
                  <td>{p.views}</td>
                  <td className="table-actions">
                    {p.status === 'approved' && (
                      <Link to={`/app/projects/${p._id}`} className="btn btn-outline sm">
                        View
                      </Link>
                    )}
                    <button type="button" className="btn btn-danger sm" onClick={() => remove(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
