import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';

export default function UserLayout() {
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canMentor = user?.role === 'mentor' || user?.role === 'both';

  const links = [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/projects', label: 'Browse Projects' },
    { to: '/app/questions', label: 'Discussions' },
    { to: '/app/chat', label: 'Group Chat' },
    { to: '/app/bookmarks', label: 'Bookmarks' },
    ...(canMentor
      ? [
          { to: '/app/my-projects', label: 'My Projects' },
          { to: '/app/upload', label: 'Upload Project' },
        ]
      : []),
    { to: '/app/profile', label: 'Profile' },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/app" onClick={() => setMenuOpen(false)}>
            Mentor<span>Hub</span>
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
          <div className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.role}</small>
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
            <h1>Project Mentor Community</h1>
            <p>Learn from real project experience</p>
          </div>
          <Link to="/" className="btn btn-outline sm">
            Home
          </Link>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
