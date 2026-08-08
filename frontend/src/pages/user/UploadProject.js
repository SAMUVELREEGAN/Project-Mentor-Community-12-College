import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/client';
import { Alert } from '../../components/common/UI';

const CATEGORIES = [
  'Web Development',
  'Mobile App',
  'Machine Learning',
  'Data Science',
  'IoT',
  'Desktop Application',
  'Other',
];

const initial = {
  title: '',
  description: '',
  technologies: '',
  challenges: '',
  commonErrors: '',
  debuggingTechniques: '',
  solutions: '',
  documentation: '',
  resources: '',
  category: 'Web Development',
};

export default function UploadProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      files.forEach((file) => data.append('attachments', file));

      await userApi.post('/projects', data);
      setSuccess('Project submitted for admin verification.');
      setForm(initial);
      setFiles([]);
      setTimeout(() => navigate('/app/my-projects'), 900);
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
          <h2>Upload Project</h2>
          <p>Share challenges, errors, solutions, and documentation for juniors.</p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <form className="panel form-grid" onSubmit={onSubmit}>
        <div className="full">
          <label htmlFor="title">Project title</label>
          <input id="title" className="input" name="title" value={form.title} onChange={onChange} required />
        </div>

        <div>
          <label htmlFor="category">Category</label>
          <select id="category" className="input" name="category" value={form.category} onChange={onChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="technologies">Technologies (comma separated)</label>
          <input
            id="technologies"
            className="input"
            name="technologies"
            value={form.technologies}
            onChange={onChange}
            placeholder="React, Node.js, MongoDB"
          />
        </div>

        <div className="full">
          <label htmlFor="description">Description</label>
          <textarea id="description" className="input" name="description" rows={4} value={form.description} onChange={onChange} required />
        </div>

        {[
          ['challenges', 'Implementation challenges'],
          ['commonErrors', 'Common errors'],
          ['debuggingTechniques', 'Debugging techniques'],
          ['solutions', 'Solutions'],
          ['documentation', 'Documentation notes'],
          ['resources', 'Useful resources'],
        ].map(([name, label]) => (
          <div className="full" key={name}>
            <label htmlFor={name}>{label}</label>
            <textarea id={name} className="input" name={name} rows={3} value={form[name]} onChange={onChange} />
          </div>
        ))}

        <div className="full">
          <label htmlFor="attachments">Attachments (optional)</label>
          <input
            id="attachments"
            className="input"
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </div>

        <div className="full">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit for verification'}
          </button>
        </div>
      </form>
    </div>
  );
}
