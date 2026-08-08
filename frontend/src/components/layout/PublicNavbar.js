import React from 'react';
import { Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function PublicNavbar() {
  const { isAuthenticated: userAuth, user } = useUserAuth();
  const { isAuthenticated: adminAuth } = useAdminAuth();

  return (
    <nav className="public-nav">
      <Link to="/" className="logo">
        Mentor<span>Hub</span>
      </Link>
      <div className="public-nav-links">
        <Link to="/projects">Projects</Link>
        <Link to="/questions">Discussions</Link>
        {userAuth ? (
          <Link to="/app" className="btn btn-primary sm">
            {user?.name?.split(' ')[0] || 'Dashboard'}
          </Link>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary sm">
              Join
            </Link>
          </>
        )}
        {adminAuth ? (
          <Link to="/admin" className="btn btn-outline sm">
            Admin
          </Link>
        ) : (
          <Link to="/admin/login" className="nav-muted">
            Admin
          </Link>
        )}
      </div>
    </nav>
  );
}
