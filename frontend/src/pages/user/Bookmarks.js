import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await userApi.get('/bookmarks');
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (projectId) => {
    try {
      await userApi.delete(`/bookmarks/${projectId}`);
      setBookmarks((prev) => prev.filter((b) => b.project?._id !== projectId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Bookmarks</h2>
          <p>Saved solutions and projects for quick reference.</p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <LoadingInline />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          description="Bookmark useful projects while browsing."
          action={
            <Link to="/app/projects" className="btn btn-primary">
              Browse projects
            </Link>
          }
        />
      ) : (
        <div className="project-grid">
          {bookmarks.map((b) =>
            b.project ? (
              <div key={b._id} className="project-tile static">
                <span className="tag">{b.project.category}</span>
                <h4>
                  <Link to={`/app/projects/${b.project._id}`}>{b.project.title}</Link>
                </h4>
                <p>{b.project.description?.slice(0, 110)}...</p>
                <div className="tile-meta">
                  <small>{b.project.author?.name}</small>
                  <button type="button" className="btn btn-ghost sm" onClick={() => remove(b.project._id)}>
                    Remove
                  </button>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
