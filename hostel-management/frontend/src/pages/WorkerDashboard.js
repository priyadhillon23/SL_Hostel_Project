import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const navItems = [
  { path: '', icon: '🏠', label: 'Dashboard' },
  { path: '/complaints', icon: '🔧', label: 'My Complaints' },
];

function WorkerHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, working: 0, resolved: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/complaints/all').then(r => {
      const c = r.data.data;
      setStats({ pending: c.filter(x=>x.status==='pending').length, working: c.filter(x=>x.status==='working').length, resolved: c.filter(x=>x.status==='resolved').length });
    }).catch(()=>{});
  }, []);

  return (
    <div>
      <div style={{marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #d97706, #ea580c)', borderRadius: 16, color: 'white'}}>
        <h2 style={{fontSize: 22, fontWeight: 800}}>Worker Dashboard ⚡</h2>
        <p style={{opacity: 0.85, marginTop: 4}}>Welcome, {user?.name} | Employee ID: {user?.employeeId}</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon yellow">⏳</div><div className="stat-info"><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Complaints</div></div></div>
        <div className="stat-card"><div className="stat-icon blue">🔨</div><div className="stat-info"><div className="stat-value">{stats.working}</div><div className="stat-label">In Progress</div></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><div className="stat-value">{stats.resolved}</div><div className="stat-label">Resolved</div></div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">⚡ Quick Actions</span></div>
        <div className="card-body"><button className="btn btn-primary" onClick={() => navigate('/worker/complaints')}>🔧 View All Complaints</button></div>
      </div>
    </div>
  );
}

function WorkerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: '', resolutionNote: '', completionDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchComplaints(); }, []);
  const fetchComplaints = async () => {
    try { const { data } = await api.get('/complaints/all'); setComplaints(data.data); } catch {}
  };

  const openUpdate = (c) => {
    setSelected(c);
    setForm({ status: c.status, resolutionNote: c.resolutionNote || '', completionDate: c.completionDate ? c.completionDate.split('T')[0] : '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/complaints/${selected._id}`, form);
      toast.success('Complaint updated!');
      setSelected(null);
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  return (
    <div>
      <h2 className="section-title">🔧 Complaints Queue</h2>
      <div className="filter-tabs">
        {['all','pending','working','resolved'].map(f => (
          <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Room</th><th>Type</th><th>Description</th><th>Status</th><th>Student</th><th>Raised On</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">✅</div><p>No complaints</p></div></td></tr>
              ) : filtered.map(c => (
                <tr key={c._id}>
                  <td style={{fontWeight:700}}>{c.roomNumber}</td>
                  <td><span className="complaint-type-badge">{c.complaintType}</span></td>
                  <td style={{fontSize:13, maxWidth:200}}>{c.description}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td style={{fontSize:13}}>{c.studentId?.userId?.name}</td>
                  <td style={{fontSize:12, color:'#64748b'}}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>{c.status !== 'resolved' && <button className="btn btn-sm btn-primary" onClick={() => openUpdate(c)}>Update</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Update Complaint</span><button className="modal-close" onClick={() => setSelected(null)}>✕</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="profile-grid" style={{marginBottom:16}}>
                  <div className="profile-item"><div className="profile-item-label">Room</div><div className="profile-item-value">{selected.roomNumber}</div></div>
                  <div className="profile-item"><div className="profile-item-label">Type</div><div className="profile-item-value">{selected.complaintType}</div></div>
                  <div className="profile-item" style={{gridColumn:'1/-1'}}><div className="profile-item-label">Description</div><div className="profile-item-value">{selected.description}</div></div>
                </div>
                <div className="form-group">
                  <label className="form-label">Update Status *</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})} required>
                    <option value="pending">⏳ Pending</option>
                    <option value="working">🔨 Working</option>
                    <option value="resolved">✅ Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Resolution Note</label>
                  <textarea className="form-control" rows={3} placeholder="Describe what was done..." value={form.resolutionNote} onChange={e => setForm({...form, resolutionNote: e.target.value})} />
                </div>
                {form.status === 'resolved' && (
                  <div className="form-group">
                    <label className="form-label">Completion Date</label>
                    <input type="date" className="form-control" value={form.completionDate} onChange={e => setForm({...form, completionDate: e.target.value})} />
                  </div>
                )}
                {form.status === 'resolved' && <div className="alert alert-info">📧 Student will be notified by email.</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update Status'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkerDashboard() {
  return (
    <div className="layout">
      <Sidebar navItems={navItems} basePath="/worker" />
      <div className="main-content">
        <div className="top-bar">
          <span className="top-bar-title">⚡ Worker Portal</span>
          <span style={{fontSize: 13, color: '#64748b'}}>Hostel Management System</span>
        </div>
        <div className="page-content">
          <Routes>
            <Route path="" element={<WorkerHome />} />
            <Route path="/complaints" element={<WorkerComplaints />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
