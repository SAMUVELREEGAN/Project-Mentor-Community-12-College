import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PasswordInput from '../../components/common/PasswordInput';
import { Alert } from '../../components/common/UI';
import { useUserAuth } from '../../context/UserAuthContext';

export default function Register() {
  const { register } = useUserAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'junior',
    college: '',
    year: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/app', { replace: true });
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
          <h1>Join MentorHub</h1>
          <p className="muted">Register as a junior learner, mentor, or both.</p>
          <Alert type="error" message={error} onClose={() => setError('')} />

          <label htmlFor="name">Full name</label>
          <input id="name" className="input" name="name" value={form.name} onChange={onChange} required />

          <label htmlFor="email">Email</label>
          <input id="email" className="input" name="email" type="email" value={form.email} onChange={onChange} required />

          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            autoComplete="new-password"
          />

          <label htmlFor="role">I want to join as</label>
          <select id="role" className="input" name="role" value={form.role} onChange={onChange}>
            <option value="junior">Junior Student</option>
            <option value="mentor">Mentor / Senior</option>
            <option value="both">Both</option>
          </select>

          <div className="form-row">
            <div>
              <label htmlFor="college">College</label>
              <input id="college" className="input" name="college" value={form.college} onChange={onChange} />
            </div>
            <div>
              <label htmlFor="year">Year</label>
              <input id="year" className="input" name="year" value={form.year} onChange={onChange} placeholder="e.g. 2nd Year" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="auth-footer">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
