import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiSearch, FiUser, FiEye, FiXCircle, FiCheckCircle, FiTrash2 } from 'react-icons/fi';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', status: '', q: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: filters });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const toggleActive = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/active`, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="admin-page page">
      <div className="page-content">
        <div className="admin-nav">
          <Link to="/admin" className="admin-nav-link active">Users</Link>
          <Link to="/admin/revenue" className="admin-nav-link">Revenue</Link>
          <Link to="/admin/disputes" className="admin-nav-link">Disputes</Link>
        </div>
        <h1 className="section-title">User Management ({total})</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSearch} className="admin-filters">
          <div className="filter-input">
            <FiSearch className="filter-icon" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={filters.q}
              onChange={e => setFilters({ ...filters, q: e.target.value })}
              className="form-input"
            />
          </div>
          <select className="form-select" value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All roles</option>
            <option value="guest">Guest</option>
            <option value="host">Host</option>
            <option value="admin">Admin</option>
          </select>
          <select className="form-select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
          <button type="submit" className="btn btn-primary">Apply</button>
        </form>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th>Bookings</th>
                  <th>Listings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="user-avatar" />
                        ) : (
                          <div className="user-avatar user-avatar-placeholder"><FiUser size={14} /></div>
                        )}
                        <span>{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-active" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                    <td>{u.email}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>{u.booking_count}</td>
                    <td>{u.property_count}</td>
                    <td>
                      {u.is_active ? (
                        <span className="badge badge-active">Active</span>
                      ) : (
                        <span className="badge badge-inactive">Deactivated</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/users/${u.id}`} className="btn btn-secondary btn-sm" title="View profile"><FiEye size={12} /></Link>
                        <button
                          onClick={() => toggleActive(u)}
                          className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {u.is_active ? <FiXCircle size={12} /> : <FiCheckCircle size={12} />}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="btn btn-danger btn-sm"
                          title="Delete user"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-page { padding-top: var(--navbar-height); min-height: 100vh; background: var(--bg-light); }
        .admin-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; }
        .admin-nav-link {
          padding: 12px 20px; border-bottom: 2px solid transparent; font-weight: 600;
          color: var(--text-medium); margin-bottom: -1px;
        }
        .admin-nav-link.active { color: var(--text-dark); border-bottom-color: var(--text-dark); }
        .admin-filters {
          display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
          background: white; padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light);
        }
        .admin-filters .form-select, .admin-filters .form-input { min-width: 180px; }
        .filter-input { position: relative; flex: 1; min-width: 220px; }
        .filter-icon { position: absolute; top: 50%; left: 12px; transform: translateY(-50%); color: var(--text-medium); }
        .filter-input .form-input { padding-left: 36px; }
        .admin-table-wrap {
          background: white; border-radius: var(--radius-md); overflow: hidden;
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
          overflow-x: auto;
        }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 12px 14px; text-align: left; font-size: 14px; border-bottom: 1px solid var(--border-light); }
        .admin-table th { background: var(--bg-light); font-size: 12px; text-transform: uppercase; color: var(--text-medium); letter-spacing: 0.5px; }
        .admin-table tbody tr:hover { background: var(--bg-light); }
        .user-cell { display: flex; align-items: center; gap: 8px; }
        .user-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
        .user-avatar-placeholder { background: var(--bg-light); display: flex; align-items: center; justify-content: center; color: var(--text-medium); }
        .table-actions { display: flex; gap: 6px; }
      `}</style>
    </div>
  );
};

export default AdminUsersPage;
