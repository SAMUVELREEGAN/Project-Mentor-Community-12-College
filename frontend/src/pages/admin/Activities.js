import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Alert, EmptyState, LoadingInline } from '../../components/common/UI';

export default function AdminActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await adminApi.get('/admin/activities', { params: { limit: 100 } });
      setActivities(data.activities || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Activity Feed</h2>
          <p>User actions sync here so admins stay up to date.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={load}>
          Refresh
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {loading && activities.length === 0 ? (
        <LoadingInline />
      ) : activities.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <div className="activity-list dense panel">
          {activities.map((a) => (
            <div key={a._id} className="activity-item">
              <div>
                <strong className="action-chip">{a.action}</strong>
                <p>{a.description}</p>
              </div>
              <small>{new Date(a.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
