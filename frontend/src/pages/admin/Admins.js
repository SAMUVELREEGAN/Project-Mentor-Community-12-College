import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import PasswordInput from '../../components/common/PasswordInput';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/admins');
      setAdmins(data.admins || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.post('/admin/admins', form);
      setMessage('Admin added successfully');
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await adminApi.patch(`/admin/admins/${id}/status`, { isActive: !isActive });
      setMessage('Admin status updated');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Admin List</h2>
          <p>Manage administrator accounts for the platform.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add Admin'}
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      {showForm && (
        <form className="panel form-grid" onSubmit={onSubmit}>
          <div>
            <label htmlFor="admin-name">Name</label>
            <input id="admin-name" className="input" name="name" value={form.name} onChange={onChange} required />
          </div>
          <div>
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              className="input"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
          <div className="full">
            <label htmlFor="admin-password">Password</label>
            <PasswordInput
              id="admin-password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="full">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create admin'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingInline />
      ) : admins.length === 0 ? (
        <EmptyState title="No admins found" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id || a._id}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>
                    <span className={`badge ${a.isActive ? 'approved' : 'rejected'}`}>
                      {a.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline sm"
                      onClick={() => toggleStatus(a.id || a._id, a.isActive)}
                    >
                      {a.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
