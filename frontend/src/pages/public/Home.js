import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { useUserAuth } from '../../context/UserAuthContext';

export default function Home() {
  const { isAuthenticated } = useUserAuth();

  return (
    <div className="public-page">
      <PublicNavbar />
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="brand-mark">MentorHub</p>
          <h1>Learn from projects that already faced the hard parts</h1>
          <p className="hero-sub">
            Seniors share real implementation challenges, debugging paths, and solutions. Juniors explore, ask
            questions, and start stronger.
          </p>
          <div className="hero-cta">
            {isAuthenticated ? (
              <Link to="/app" className="btn btn-primary">
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/projects" className="btn btn-light">
                  Browse Projects
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>How it works</h2>
          <p>A mentoring loop built around completed academic projects.</p>
        </div>
        <div className="feature-grid">
          <article>
            <h3>Share experience</h3>
            <p>Mentors upload projects with errors, fixes, documentation, and useful resources.</p>
          </article>
          <article>
            <h3>Study real issues</h3>
            <p>Juniors browse approved projects and learn practical approaches before starting their own work.</p>
          </article>
          <article>
            <h3>Ask and discuss</h3>
            <p>Questions, comments, and mentorship keep knowledge moving across batches.</p>
          </article>
        </div>
      </section>

      <section className="section muted">
        <div className="section-head">
          <h2>Built for college project teams</h2>
          <p>Secure roles for students, mentors, and admins with content verification and reporting.</p>
        </div>
        <div className="cta-row">
          <Link to="/register" className="btn btn-primary">
            Create student account
          </Link>
          <Link to="/admin/login" className="btn btn-outline">
            Admin access
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <p>Project Mentor Community · Peer learning for academic projects</p>
      </footer>
    </div>
  );
}
