import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { userApi, publicApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function UserDashboard() {
  const { user } = useUserAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [projectsRes, bookmarksRes, questionsRes] = await Promise.all([
          publicApi.get('/projects', { params: { limit: 6 } }),
          userApi.get('/bookmarks'),
          publicApi.get('/questions', { params: { limit: 5 } }),
        ]);
        if (!active) return;
        setRecent(projectsRes.data.projects || []);
        setStats({
          bookmarks: bookmarksRes.data.bookmarks?.length || 0,
          questions: questionsRes.data.pagination?.total || 0,
          projects: projectsRes.data.pagination?.total || 0,
        });
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
  }, []);

  const canMentor = user?.role === 'mentor' || user?.role === 'both';

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Welcome, {user?.name}</h2>
          <p>Your role: <strong>{user?.role}</strong>{user?.college ? ` · ${user.college}` : ''}</p>
        </div>
        {canMentor && (
          <Link to="/app/upload" className="btn btn-primary">
            Upload Project
          </Link>
        )}
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <LoadingInline />
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat">
              <span>Approved projects</span>
              <strong>{stats?.projects || 0}</strong>
            </div>
            <div className="stat">
              <span>Your bookmarks</span>
              <strong>{stats?.bookmarks || 0}</strong>
            </div>
            <div className="stat">
              <span>Open discussions</span>
              <strong>{stats?.questions || 0}</strong>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h3>Recently shared projects</h3>
              <Link to="/app/projects">View all</Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState title="No projects yet" description="Approved mentor projects will appear here." />
            ) : (
              <div className="project-grid">
                {recent.map((p) => (
                  <Link key={p._id} to={`/app/projects/${p._id}`} className="project-tile">
                    <span className="tag">{p.category}</span>
                    <h4>{p.title}</h4>
                    <p>{p.description?.slice(0, 110)}...</p>
                    <small>by {p.author?.name}</small>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
