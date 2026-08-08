import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const links = [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/projects', label: 'Projects' },
    { to: '/admin/comments', label: 'Comments' },
    { to: '/admin/questions', label: 'Discussions' },
    { to: '/admin/admins', label: 'Admins' },
    { to: '/admin/activities', label: 'Activity Feed' },
    { to: '/admin/reports', label: 'Reports' },
  ];

  return (
    <div className="app-shell admin-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/admin" onClick={() => setMenuOpen(false)}>
            Admin<span>Panel</span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar admin">{admin?.name?.charAt(0)?.toUpperCase()}</div>
          <div>
            <strong>{admin?.name}</strong>
            <small>{admin?.email}</small>
          </div>
        </div>
        <button type="button" className="btn btn-ghost logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {menuOpen && <button type="button" className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button type="button" className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            <span />
            <span />
            <span />
          </button>
          <div className="topbar-title">
            <h1>Administration</h1>
            <p>Manage users, content, and reports</p>
          </div>
          <Link to="/" className="btn btn-outline sm">
            Site
          </Link>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
