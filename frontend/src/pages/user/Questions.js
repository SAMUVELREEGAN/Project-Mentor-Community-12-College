import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi, userApi } from '../../api/client';
import { useUserAuth } from '../../context/UserAuthContext';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';
import PublicNavbar from '../../components/layout/PublicNavbar';

export function QuestionsList({ embedded = false }) {
  const { isAuthenticated } = useUserAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', projectId: '' });
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await publicApi.get('/questions');
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!showForm) return;
    publicApi.get('/projects', { params: { limit: 50 } }).then(({ data }) => {
      setProjects(data.projects || []);
    }).catch(() => {});
  }, [showForm]);

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await userApi.post('/questions', {
        title: form.title,
        content: form.content,
        projectId: form.projectId || undefined,
      });
      setQuestions((prev) => [data.question, ...prev]);
      setForm({ title: '', content: '', projectId: '' });
      setShowForm(false);
      navigate(embedded ? `/app/questions/${data.question._id}` : `/questions/${data.question._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const detailPath = (id) => (embedded ? `/app/questions/${id}` : `/questions/${id}`);

  const content = (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Discussion Forum</h2>
          <p>Ask implementation questions and get guidance from mentors.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Ask a question'}
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {showForm && (
        <form className="panel form-grid" onSubmit={submit}>
          <div className="full">
            <label htmlFor="q-title">Title</label>
            <input
              id="q-title"
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="full">
            <label htmlFor="q-content">Details</label>
            <textarea
              id="q-content"
              className="input"
              rows={4}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              required
            />
          </div>
          <div className="full">
            <label htmlFor="q-project">Related project (optional)</label>
            <select
              id="q-project"
              className="input"
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="full">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Posting...' : 'Post question'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingInline />
      ) : questions.length === 0 ? (
        <EmptyState title="No questions yet" description="Be the first to start a discussion." />
      ) : (
        <div className="list-stack">
          {questions.map((q) => (
            <Link key={q._id} to={detailPath(q._id)} className="list-item">
              <div>
                <h4>{q.title}</h4>
                <p>{q.content?.slice(0, 140)}...</p>
                <small>
                  {q.author?.name} · {q.answers?.length || 0} answers · {q.status}
                  {q.project?.title ? ` · ${q.project.title}` : ''}
                </small>
              </div>
            </Link>
          ))}
        </div>
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

export default function Questions() {
  return <QuestionsList embedded />;
}
