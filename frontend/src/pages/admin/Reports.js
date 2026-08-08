import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Alert, LoadingInline } from '../../components/common/UI';

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/reports');
      setReport(data.report);
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

  if (loading && !report) return <LoadingInline message="Generating report..." />;

  const summary = report?.summary || {};

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>
            Generated {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : ''}
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={load}>
          Regenerate
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="stat-grid">
        {Object.entries(summary).map(([key, value]) => (
          <div className="stat" key={key}>
            <span>{key.replace(/([A-Z])/g, ' $1')}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <section className="panel">
        <h3>Projects by month</h3>
        {(report?.monthlyProjects || []).length === 0 ? (
          <p className="muted">No monthly data yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Projects</th>
                </tr>
              </thead>
              <tbody>
                {report.monthlyProjects.map((row) => (
                  <tr key={`${row._id.year}-${row._id.month}`}>
                    <td>
                      {row._id.month}/{row._id.year}
                    </td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Latest user activity in report</h3>
        <div className="activity-list">
          {(report?.recentActivities || []).slice(0, 20).map((a) => (
            <div key={a._id} className="activity-item">
              <p>{a.description}</p>
              <small>{new Date(a.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
