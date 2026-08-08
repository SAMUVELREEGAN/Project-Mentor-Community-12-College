import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/users', { params: { search: search || undefined } });
      setUsers(data.users || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const toggleStatus = async (id, isActive) => {
    try {
      await adminApi.patch(`/admin/users/${id}/status`, { isActive: !isActive });
      setMessage('User status updated');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this user and related content?')) return;
    try {
      await adminApi.delete(`/admin/users/${id}`);
      setMessage('User deleted');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Users</h2>
          <p>Activate, deactivate, or remove student accounts.</p>
        </div>
      </div>

      <div className="filters">
        <input
          className="input"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn btn-outline" onClick={load}>
          Refresh
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      {loading ? (
        <LoadingInline />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>College</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.college || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'approved' : 'rejected'}`}>
                      {u.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button type="button" className="btn btn-outline sm" onClick={() => toggleStatus(u._id || u.id, u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="btn btn-danger sm" onClick={() => remove(u._id || u.id)}>
                      Delete
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
