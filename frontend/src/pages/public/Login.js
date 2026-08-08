import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PasswordInput from '../../components/common/PasswordInput';
import { Alert } from '../../components/common/UI';
import { useUserAuth } from '../../context/UserAuthContext';

export default function Login() {
  const { login } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page auth-page">
      <PublicNavbar />
      <div className="auth-wrap">
        <form className="auth-card" onSubmit={onSubmit}>
          <h1>Student Login</h1>
          <p className="muted">Access projects, discussions, and mentorship tools.</p>
          <Alert type="error" message={error} onClose={() => setError('')} />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            autoComplete="email"
          />

          <label htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" value={form.password} onChange={onChange} required />

          <button type="submit" className="btn btn-primary full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="auth-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>
          <p className="demo-hint">Demo: user@example.com / 123 or junior@example.com / 123</p>
        </form>
      </div>
    </div>
  );
}
