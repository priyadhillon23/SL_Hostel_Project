import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const navItems = [
  { path: '', icon: '📊', label: 'Analytics' },
  { path: '/users', icon: '👥', label: 'Manage Users' },
  { path: '/add-user', icon: '➕', label: 'Add User' },
];

function Analytics() {
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    api.get('/admin/analytics').then(r => setStats(r.data.data)).catch(()=>{});
  }, []);

  return (
    <div>
      <div style={{marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', borderRadius: 16, color: 'white'}}>
        <h2 style={{fontSize: 22, fontWeight: 800}}>Super Admin Dashboard 🛡️</h2>
        <p style={{opacity: 0.85, marginTop: 4}}>Full system control and analytics</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon purple">🎓</div><div className="stat-info"><div className="stat-value">{stats.totalStudents||0}</div><div className="stat-label">Students</div></div></div>
        <div className="stat-card"><div className="stat-icon yellow">📋</div><div className="stat-info"><div className="stat-value">{stats.pendingLeaves||0}</div><div className="stat-label">Pending Leaves</div></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><div className="stat-value">{stats.approvedLeaves||0}</div><div className="stat-label">Approved Leaves</div></div></div>
        <div className="stat-card"><div className="stat-icon red">🔧</div><div className="stat-info"><div className="stat-value">{stats.pendingComplaints||0}</div><div className="stat-label">Open Complaints</div></div></div>
        <div className="stat-card"><div className="stat-icon blue">📝</div><div className="stat-info"><div className="stat-value">{stats.totalLeaves||0}</div><div className="stat-label">Total Leaves</div></div></div>
        <div className="stat-card"><div className="stat-icon orange">⭐</div><div className="stat-info"><div className="stat-value">{stats.avgMessRating||0}</div><div className="stat-label">Mess Rating</div></div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">⚡ Quick Actions</span></div>
        <div className="card-body" style={{display:'flex', gap:16, flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={() => navigate('/super-admin/add-user')}>➕ Add User</button>
          <button className="btn btn-outline" onClick={() => navigate('/super-admin/users')}>👥 Manage Users</button>
        </div>
      </div>
    </div>
  );
}

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchUsers(); }, [roleFilter]);
  const fetchUsers = async () => {
    try {
      const params = roleFilter !== 'all' ? `?role=${roleFilter}` : '';
      const { data } = await api.get(`/admin/users${params}`);
      setUsers(data.data);
    } catch {}
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); fetchUsers(); } catch (err) { toast.error('Failed to delete'); }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch {}
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${resetModal._id}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
      setResetModal(null); setNewPassword('');
    } catch {}
  };

  const filtered = users.filter(u => {
    const name = u.name?.toLowerCase() || '';
    const email = u.email?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const roleColors = { student: '#e0e7ff', warden: '#fef9c3', mess_admin: '#dcfce7', worker: '#ffedd5', super_admin: '#fce7f3' };
  const roleTextColors = { student: '#4338ca', warden: '#854d0e', mess_admin: '#166534', worker: '#c2410c', super_admin: '#be185d' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title" style={{margin:0}}>👥 Manage Users</h2>
        <input className="form-control" style={{maxWidth:260}} placeholder="🔍 Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="filter-tabs">
        {['all','student','warden','mess_admin','worker'].map(r => (
          <button key={r} className={`filter-tab ${roleFilter===r?'active':''}`} onClick={() => setRoleFilter(r)}>
            {r === 'mess_admin' ? 'Mess Admin' : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Employee/Roll ID</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><p>No users found</p></div></td></tr>
              ) : filtered.map(u => (
                <tr key={u._id}>
                  <td style={{fontWeight:600}}>{u.name}</td>
                  <td style={{fontSize:13}}>{u.email}</td>
                  <td>
                    <span style={{padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: roleColors[u.role]||'#f1f5f9', color: roleTextColors[u.role]||'#64748b'}}>
                      {u.role?.replace('_',' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{fontSize:13}}>{u.student?.rollNumber || u.employeeId || '-'}</td>
                  <td>
                    <span style={{padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: u.isActive?'#dcfce7':'#fee2e2', color: u.isActive?'#166534':'#991b1b'}}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{display:'flex', gap:6}}>
                      <button className="btn btn-sm btn-outline" onClick={() => { setResetModal(u); setNewPassword(''); }}>🔑</button>
                      <button className="btn btn-sm" style={{background: u.isActive?'#fff7ed':'#dcfce7', color: u.isActive?'#c2410c':'#166534', border:'1px solid', borderColor: u.isActive?'#fed7aa':'#bbf7d0'}} onClick={() => handleToggleActive(u)}>{u.isActive?'Disable':'Enable'}</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u._id, u.name)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetModal && (
        <div className="modal-overlay" onClick={() => setResetModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Reset Password - {resetModal.name}</span><button className="modal-close" onClick={() => setResetModal(null)}>✕</button></div>
            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setResetModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AddUser() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    name:'', email:'', password:'', mobile:'', address:'', employeeId:'',
    rollNumber:'', roomNumber:'', parentName:'', parentMobile:'', parentEmail:'',
    course:'', year:'', hostelBlock:''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/users', { ...form, role });
      toast.success('User created successfully!');
      navigate('/super-admin/users');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
    finally { setLoading(false); }
  };

  const f = (key, label, type='text', required=false, placeholder='') => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}{required && ' *'}</label>
      <input type={type} className="form-control" placeholder={placeholder} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} required={required} />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/super-admin/users')}>← Back</button>
        <h2 className="section-title" style={{margin:0}}>➕ Add New User</h2>
      </div>
      <div className="card" style={{maxWidth: 700}}>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
              <option value="student">🎓 Student</option>
              <option value="warden">👮 Warden</option>
              <option value="mess_admin">🍽️ Mess Admin</option>
              <option value="worker">⚡ Worker</option>
            </select>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              {f('name','Full Name','text',true,'Enter full name')}
              {f('email','Email Address','email',true,'user@college.edu')}
            </div>
            <div className="form-row">
              {f('password','Password (default: mobile)','password',true,'Min 6 characters')}
              {f('mobile','Mobile Number','text',false,'10-digit mobile')}
            </div>
            {role !== 'student' && (
              <div className="form-group">
                {f('employeeId','Employee ID','text',true,'e.g. W002')}
              </div>
            )}
            {f('address','Address','text',false,'Full address')}
            
            {role === 'student' && (
              <>
                <hr style={{margin:'8px 0 16px', borderColor:'#e2e8f0'}}/>
                <p style={{fontSize:14, fontWeight:700, color:'#64748b', marginBottom:12}}>STUDENT DETAILS</p>
                <div className="form-row">
                  {f('rollNumber','Roll Number','text',true,'e.g. CS2021002')}
                  {f('roomNumber','Room Number','text',true,'e.g. A-102')}
                </div>
                <div className="form-row">
                  {f('course','Course','text',false,'e.g. B.Tech CSE')}
                  {f('year','Year','number',false,'1-4')}
                </div>
                {f('hostelBlock','Hostel Block','text',false,'e.g. Block A')}
                <hr style={{margin:'8px 0 16px', borderColor:'#e2e8f0'}}/>
                <p style={{fontSize:14, fontWeight:700, color:'#64748b', marginBottom:12}}>PARENT/GUARDIAN DETAILS</p>
                <div className="form-row">
                  {f('parentName','Parent Name','text',true,'')}
                  {f('parentMobile','Parent Mobile','text',true,'')}
                </div>
                {f('parentEmail','Parent Email','email',true,'')}
              </>
            )}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{marginTop:8}}>
              {loading ? 'Creating...' : `➕ Create ${role.replace('_',' ')} Account`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <div className="layout">
      <Sidebar navItems={navItems} basePath="/super-admin" />
      <div className="main-content">
        <div className="top-bar">
          <span className="top-bar-title">🛡️ Super Admin Portal</span>
          <span style={{fontSize: 13, color: '#64748b'}}>Hostel Management System</span>
        </div>
        <div className="page-content">
          <Routes>
            <Route path="" element={<Analytics />} />
            <Route path="/users" element={<ManageUsers />} />
            <Route path="/add-user" element={<AddUser />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
