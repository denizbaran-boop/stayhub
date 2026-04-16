import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 2C10.477 2 6 6.477 6 12c0 7 10 18 10 18s10-11 10-18c0-5.523-4.477-10-10-10zm0 13.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" fill="#FF5A5F"/>
          </svg>
          <span>StayHub</span>
        </Link>

        <div className="navbar-actions">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: white;
          border-bottom: 1px solid var(--border-light);
          box-shadow: var(--shadow-sm);
          height: var(--navbar-height);
        }
        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
