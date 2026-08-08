import React, { useState } from 'react';
import { userApi } from '../../api/client';
import { useUserAuth } from '../../context/UserAuthContext';
import { Alert } from '../../components/common/UI';

export default function Profile() {
  const { user, updateUser } = useUserAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    college: user?.college || '',
    year: user?.year || '',
    bio: user?.bio || '',
    skills: (user?.skills || []).join(', '),
    role: user?.role || 'junior',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await userApi.put('/users/profile', form);
      updateUser(data.user);
      setSuccess('Profile updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Profile</h2>
          <p>Keep your mentoring role and details up to date.</p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <form className="panel form-grid" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" className="input" name="name" value={form.name} onChange={onChange} required />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" className="input" value={user?.email || ''} disabled />
        </div>
        <div>
          <label htmlFor="role">Role</label>
          <select id="role" className="input" name="role" value={form.role} onChange={onChange}>
            <option value="junior">Junior Student</option>
            <option value="mentor">Mentor / Senior</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label htmlFor="year">Year</label>
          <input id="year" className="input" name="year" value={form.year} onChange={onChange} />
        </div>
        <div className="full">
          <label htmlFor="college">College</label>
          <input id="college" className="input" name="college" value={form.college} onChange={onChange} />
        </div>
        <div className="full">
          <label htmlFor="skills">Skills (comma separated)</label>
          <input id="skills" className="input" name="skills" value={form.skills} onChange={onChange} />
        </div>
        <div className="full">
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" className="input" name="bio" rows={4} value={form.bio} onChange={onChange} />
        </div>
        <div className="full">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
