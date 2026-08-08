import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client';
import { Alert, LoadingInline } from '../../components/common/UI';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminApi.get('/admin/dashboard');
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 15000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading && !data) return <LoadingInline message="Loading admin overview..." />;

  const stats = data?.stats || {};

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Admin Overview</h2>
          <p>Live snapshot of users, content, and recent activity.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => load(false)}>
          Refresh
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="stat-grid">
        <div className="stat">
          <span>Users</span>
          <strong>{stats.totalUsers || 0}</strong>
        </div>
        <div className="stat">
          <span>Pending projects</span>
          <strong>{stats.pendingProjects || 0}</strong>
        </div>
        <div className="stat">
          <span>Approved projects</span>
          <strong>{stats.approvedProjects || 0}</strong>
        </div>
        <div className="stat">
          <span>Discussions</span>
          <strong>{stats.totalQuestions || 0}</strong>
        </div>
        <div className="stat">
          <span>Comments</span>
          <strong>{stats.totalComments || 0}</strong>
        </div>
        <div className="stat">
          <span>Bookmarks</span>
          <strong>{stats.totalBookmarks || 0}</strong>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h3>Quick links</h3>
          </div>
          <div className="quick-links">
            <Link to="/admin/projects">Verify projects</Link>
            <Link to="/admin/users">Manage users</Link>
            <Link to="/admin/comments">Moderate comments</Link>
            <Link to="/admin/activities">Activity feed</Link>
            <Link to="/admin/reports">Generate reports</Link>
            <Link to="/admin/admins">Add admin</Link>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Recent activity</h3>
            <Link to="/admin/activities">View all</Link>
          </div>
          <div className="activity-list">
            {(data?.recentActivities || []).map((a) => (
              <div key={a._id} className="activity-item">
                <p>{a.description}</p>
                <small>{new Date(a.createdAt).toLocaleString()}</small>
              </div>
            ))}
            {(data?.recentActivities || []).length === 0 && <p className="muted">No activity yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
