import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PasswordInput from '../../components/common/PasswordInput';
import { Alert } from '../../components/common/UI';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const { login } = useAdminAuth();
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
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page auth-page admin-auth">
      <div className="auth-wrap">
        <form className="auth-card" onSubmit={onSubmit}>
          <Link to="/" className="logo auth-logo">
            Mentor<span>Hub</span>
          </Link>
          <h1>Admin Login</h1>
          <p className="muted">Moderate content, manage users, and view reports.</p>
          <Alert type="error" message={error} onClose={() => setError('')} />

          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            className="input"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            autoComplete="username"
          />

          <label htmlFor="admin-password">Password</label>
          <PasswordInput
            id="admin-password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
          />

          <button type="submit" className="btn btn-primary full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in as Admin'}
          </button>

          <p className="demo-hint">Default admin: test@gamil.com / 123</p>
          <p className="auth-footer">
            <Link to="/">Back to home</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
