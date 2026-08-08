import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';
import PublicNavbar from '../../components/layout/PublicNavbar';

const CATEGORIES = [
  'All',
  'Web Development',
  'Mobile App',
  'Machine Learning',
  'Data Science',
  'IoT',
  'Desktop Application',
  'Other',
];

export function ProjectBrowser({ embedded = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const page = Number(searchParams.get('page') || 1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await publicApi.get('/projects', {
        params: {
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          page,
          limit: 9,
        },
      });
      setProjects(data.projects || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => {
    load();
  }, [load]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'All') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const detailPath = (id) => (embedded ? `/app/projects/${id}` : `/projects/${id}`);

  const content = (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Browse Projects</h2>
          <p>Study challenges, errors, and solutions shared by mentors.</p>
        </div>
      </div>

      <div className="filters">
        <input
          className="input"
          placeholder="Search projects or technologies..."
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParam('search', e.target.value.trim());
          }}
        />
        <select className="input" value={category} onChange={(e) => updateParam('category', e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <LoadingInline />
      ) : projects.length === 0 ? (
        <EmptyState title="No projects found" description="Try another search or category." />
      ) : (
        <>
          <div className="project-grid">
            {projects.map((p) => (
              <Link key={p._id} to={detailPath(p._id)} className="project-tile">
                <span className="tag">{p.category}</span>
                <h4>{p.title}</h4>
                <p>{p.description?.slice(0, 120)}...</p>
                <div className="tile-meta">
                  <small>{p.author?.name}</small>
                  <small>{p.views} views</small>
                </div>
                <div className="tech-list">
                  {(p.technologies || []).slice(0, 4).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-outline sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                type="button"
                className="btn btn-outline sm"
                disabled={page >= pagination.pages}
                onClick={() => updateParam('page', String(page + 1))}
              >
                Next
              </button>
            </div>
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

export default function ProjectsPage() {
  return <ProjectBrowser embedded />;
}
