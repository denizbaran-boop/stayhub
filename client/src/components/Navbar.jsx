import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu, FiUser, FiHome, FiLogOut, FiGrid, FiPlusSquare } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

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
          {user?.role === 'host' && (
            <Link to="/create-listing" className="navbar-host-link">
              <FiPlusSquare size={16} />
              Add Listing
            </Link>
          )}

          <div className="navbar-user-menu" ref={menuRef}>
            <button
              className="navbar-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <FiMenu size={18} />
              <div className="navbar-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.first_name} />
                ) : (
                  <FiUser size={16} />
                )}
              </div>
            </button>

            {menuOpen && (
              <div className="navbar-dropdown">
                {user ? (
                  <>
                    <div className="navbar-dropdown-user">
                      <span className="navbar-dropdown-name">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="navbar-dropdown-email">{user.email}</span>
                    </div>
                    <hr />
                    {user.role === 'host' ? (
                      <>
                        <Link
                          to="/dashboard/host"
                          onClick={() => setMenuOpen(false)}
                          className="navbar-dropdown-item"
                        >
                          <FiGrid size={15} /> Host Dashboard
                        </Link>
                        <Link
                          to="/create-listing"
                          onClick={() => setMenuOpen(false)}
                          className="navbar-dropdown-item"
                        >
                          <FiPlusSquare size={15} /> Add Listing
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/dashboard/guest"
                        onClick={() => setMenuOpen(false)}
                        className="navbar-dropdown-item"
                      >
                        <FiHome size={15} /> My Bookings
                      </Link>
                    )}
                    <hr />
                    <button
                      onClick={handleLogout}
                      className="navbar-dropdown-item navbar-dropdown-logout"
                    >
                      <FiLogOut size={15} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="navbar-dropdown-item"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="navbar-dropdown-item"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
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
          gap: 16px;
        }
        .navbar-host-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-dark);
          background: var(--bg-light);
          transition: var(--transition);
          text-decoration: none;
        }
        .navbar-host-link:hover {
          background: var(--border);
        }
        .navbar-user-menu {
          position: relative;
        }
        .navbar-menu-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px 6px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          background: white;
          cursor: pointer;
          transition: var(--transition);
        }
        .navbar-menu-btn:hover {
          box-shadow: var(--shadow-md);
        }
        .navbar-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-light);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: var(--text-medium);
        }
        .navbar-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .navbar-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .navbar-dropdown-user {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .navbar-dropdown-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-dark);
        }
        .navbar-dropdown-email {
          font-size: 13px;
          color: var(--text-medium);
        }
        .navbar-dropdown hr {
          border: none;
          border-top: 1px solid var(--border-light);
          margin: 0;
        }
        .navbar-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          font-size: 14px;
          color: var(--text-dark);
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: var(--transition);
          text-decoration: none;
          font-family: inherit;
        }
        .navbar-dropdown-item:hover {
          background-color: var(--bg-light);
        }
        .navbar-dropdown-logout {
          color: var(--primary);
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
