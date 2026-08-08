import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicApi, userApi } from '../../api/client';
import { useUserAuth } from '../../context/UserAuthContext';
import { Alert, LoadingInline } from '../../components/common/UI';
import PublicNavbar from '../../components/layout/PublicNavbar';

export function QuestionDetailView({ embedded = false }) {
  const { id } = useParams();
  const { isAuthenticated } = useUserAuth();
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await publicApi.get(`/questions/${id}`);
        if (active) setQuestion(data.question);
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
  }, [id]);

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please login to answer');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await userApi.post(`/questions/${id}/answers`, { content: answer });
      setQuestion(data.question);
      setAnswer('');
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
      ) : !question ? (
        <Alert type="error" message={error || 'Question not found'} />
      ) : (
        <>
          <Link to={embedded ? '/app/questions' : '/questions'} className="back-link">
            ← Back to discussions
          </Link>
          <div className="panel">
            <span className={`badge ${question.status}`}>{question.status}</span>
            <h2>{question.title}</h2>
            <p className="pre-wrap">{question.content}</p>
            <small>
              Asked by {question.author?.name} · {new Date(question.createdAt).toLocaleString()}
              {question.project?.title ? ` · Project: ${question.project.title}` : ''}
            </small>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />

          <section className="panel">
            <h3>Answers ({question.answers?.length || 0})</h3>
            {(question.answers || []).length === 0 && <p className="muted">No answers yet.</p>}
            <div className="comment-list">
              {(question.answers || []).map((a) => (
                <div key={a._id} className="comment-item">
                  <strong>{a.author?.name}</strong>
                  <small>{new Date(a.createdAt).toLocaleString()}</small>
                  <p className="pre-wrap">{a.content}</p>
                </div>
              ))}
            </div>

            {isAuthenticated ? (
              <form className="stack-sm" onSubmit={submitAnswer}>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Share guidance, debugging tips, or a solution..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Posting...' : 'Post answer'}
                </button>
              </form>
            ) : (
              <Link to="/login" className="btn btn-outline">
                Login to answer
              </Link>
            )}
          </section>
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

export default function QuestionDetail() {
  return <QuestionDetailView embedded />;
}
