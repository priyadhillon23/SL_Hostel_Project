import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const navItems = [
  { path: '', icon: '🏠', label: 'Dashboard' },
  { path: '/leave', icon: '📋', label: 'Leave Management' },
  { path: '/mess', icon: '🍽️', label: 'Mess Menu' },
  { path: '/complaints', icon: '🔧', label: 'Complaints' },
  { path: '/profile', icon: '👤', label: 'My Profile' },
  { path: '/change-password', icon: '🔐', label: 'Change Password' },
];

function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ leaves: [], complaints: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [lv, cp] = await Promise.all([
          api.get('/leave/my'),
          api.get('/complaints/my')
        ]);
        setStats({ leaves: lv.data.data, complaints: cp.data.data });
      } catch {}
    };
    fetchStats();
  }, []);

  const student = user?.student;
  const pendingLeaves = stats.leaves.filter(l => l.status === 'pending').length;
  const approvedLeaves = stats.leaves.filter(l => l.status === 'approved').length;
  const openComplaints = stats.complaints.filter(c => c.status !== 'resolved').length;
  const resolvedComplaints = stats.complaints.filter(c => c.status === 'resolved').length;

  return (
    <div>
      <div style={{marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 16, color: 'white'}}>
        <h2 style={{fontSize: 22, fontWeight: 800}}>Welcome back, {user?.name}! 👋</h2>
        <p style={{opacity: 0.85, marginTop: 4}}>Room {student?.roomNumber} • Roll No: {student?.rollNumber}</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">📋</div>
          <div className="stat-info">
            <div className="stat-value">{pendingLeaves}</div>
            <div className="stat-label">Pending Leaves</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <div className="stat-value">{approvedLeaves}</div>
            <div className="stat-label">Approved Leaves</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">🔧</div>
          <div className="stat-info">
            <div className="stat-value">{openComplaints}</div>
            <div className="stat-label">Open Complaints</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🏠</div>
          <div className="stat-info">
            <div className="stat-value">{student?.roomNumber || '-'}</div>
            <div className="stat-label">Room Number</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Recent Leaves</span><button className="btn btn-sm btn-primary" onClick={() => navigate('/student/leave')}>Apply Leave</button></div>
          <div className="card-body" style={{padding: 0}}>
            {stats.leaves.length === 0 ? (
              <div className="empty-state" style={{padding: 32}}><div className="empty-state-icon">📭</div><p>No leave requests yet</p></div>
            ) : (
              <div style={{maxHeight: 300, overflowY: 'auto'}}>
                {stats.leaves.slice(0,5).map(l => (
                  <div key={l._id} style={{padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontSize: 14, fontWeight: 600}}>{new Date(l.fromDate).toLocaleDateString()} – {new Date(l.toDate).toLocaleDateString()}</div>
                      <div style={{fontSize: 12, color: '#64748b', marginTop: 2}}>{l.reason}</div>
                    </div>
                    <span className={`badge badge-${l.status}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">🔧 Recent Complaints</span><button className="btn btn-sm btn-primary" onClick={() => navigate('/student/complaints')}>Raise Complaint</button></div>
          <div className="card-body" style={{padding: 0}}>
            {stats.complaints.length === 0 ? (
              <div className="empty-state" style={{padding: 32}}><div className="empty-state-icon">✅</div><p>No complaints raised</p></div>
            ) : (
              <div style={{maxHeight: 300, overflowY: 'auto'}}>
                {stats.complaints.slice(0,5).map(c => (
                  <div key={c._id} style={{padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <span className="complaint-type-badge">{c.complaintType}</span>
                      <div style={{fontSize: 12, color: '#64748b', marginTop: 4}}>{c.description.substring(0,50)}...</div>
                    </div>
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaveManagement() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const student = user?.student;

  useEffect(() => { fetchLeaves(); }, []);
  
  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/leave/my');
      setLeaves(data.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leave', form);
      toast.success('Leave applied successfully!');
      setShowModal(false);
      setForm({ fromDate: '', toDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply leave');
    } finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title" style={{margin: 0}}>📋 Leave Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Apply Leave</button>
      </div>

      <div className="filter-tabs">
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr>
              <th>From</th><th>To</th><th>Duration</th><th>Reason</th><th>Status</th><th>Remark</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📭</div><p>No leave requests</p></div></td></tr>
              ) : filtered.map(l => {
                const days = Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000*60*60*24)) + 1;
                return (
                  <tr key={l._id}>
                    <td>{new Date(l.fromDate).toLocaleDateString('en-IN')}</td>
                    <td>{new Date(l.toDate).toLocaleDateString('en-IN')}</td>
                    <td>{days} day{days > 1 ? 's' : ''}</td>
                    <td style={{maxWidth: 200}}>{l.reason}</td>
                    <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                    <td style={{color: '#64748b', fontSize: 13}}>{l.remark || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Apply for Leave</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="alert alert-info">Auto-filled from your profile.</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-control" value={user?.name || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input className="form-control" value={student?.rollNumber || ''} readOnly />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Room Number</label>
                    <input className="form-control" value={student?.roomNumber || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <input className="form-control" value={user?.mobile || ''} readOnly />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Parent Mobile</label>
                    <input className="form-control" value={student?.parentMobile || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent Email</label>
                    <input className="form-control" value={student?.parentEmail || ''} readOnly />
                  </div>
                </div>
                <hr style={{margin: '8px 0 16px', borderColor: '#e2e8f0'}}/>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">From Date *</label>
                    <input type="date" className="form-control" value={form.fromDate} min={new Date().toISOString().split('T')[0]} onChange={e => setForm({...form, fromDate: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date *</label>
                    <input type="date" className="form-control" value={form.toDate} min={form.fromDate || new Date().toISOString().split('T')[0]} onChange={e => setForm({...form, toDate: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <textarea className="form-control" rows={3} placeholder="Enter reason for leave..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Leave'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MessModule() {
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [mealType, setMealType] = useState('general');
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [m, s] = await Promise.all([api.get('/mess/menu'), api.get('/mess/reviews/stats')]);
        setMenus(m.data.data);
        setAvgRating(s.data.avgRating);
      } catch {}
    };
    fetch();
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a rating'); return; }
    try {
      await api.post('/mess/review', { rating, feedback, mealType });
      toast.success('Review submitted!');
      setShowReview(false); setRating(0); setFeedback('');
    } catch (err) { toast.error('Failed to submit review'); }
  };

  const renderStars = (val, setVal) => (
    <div className="stars">
      {[1,2,3,4,5].map(s => (
        <span key={s} className="star" style={{color: s <= val ? '#f59e0b' : '#d1d5db'}} onClick={() => setVal && setVal(s)}>★</span>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title" style={{margin: 0}}>🍽️ Mess Menu</h2>
        <div className="flex items-center gap-4">
          <div style={{display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0'}}>
            {renderStars(Math.round(avgRating), null)}
            <span style={{fontSize: 14, fontWeight: 700}}>{avgRating}/5</span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowReview(true)}>⭐ Give Review</button>
        </div>
      </div>

      {menus.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">🍽️</div><h3>No menu available</h3><p>Menu for this week hasn't been uploaded yet.</p></div></div>
      ) : (
        <div className="grid-3">
          {menus.map(m => (
            <div key={m._id} className="menu-day-card">
              <div className="menu-day-header">
                <div className="menu-day-name">{m.dayOfWeek}</div>
                <div className="menu-day-date">{new Date(m.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</div>
              </div>
              <div className="menu-meal"><div className="menu-meal-label">🌅 Breakfast</div><div className="menu-meal-items">{m.breakfast}</div></div>
              <div className="menu-meal"><div className="menu-meal-label">☀️ Lunch</div><div className="menu-meal-items">{m.lunch}</div></div>
              <div className="menu-meal"><div className="menu-meal-label">🌙 Dinner</div><div className="menu-meal-items">{m.dinner}</div></div>
              {m.snacks && <div className="menu-meal"><div className="menu-meal-label">🍎 Snacks</div><div className="menu-meal-items">{m.snacks}</div></div>}
            </div>
          ))}
        </div>
      )}

      {showReview && (
        <div className="modal-overlay" onClick={() => setShowReview(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⭐ Submit Review</span>
              <button className="modal-close" onClick={() => setShowReview(false)}>✕</button>
            </div>
            <form onSubmit={submitReview}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Meal Type</label>
                  <select className="form-control" value={mealType} onChange={e => setMealType(e.target.value)}>
                    <option value="general">General</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                    {renderStars(rating, setRating)}
                    <span style={{fontSize: 14, color: '#64748b', marginLeft: 8}}>{rating > 0 ? ['','Poor','Fair','Good','Very Good','Excellent'][rating] : 'Select rating'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Feedback (Optional)</label>
                  <textarea className="form-control" rows={3} placeholder="Share your experience..." value={feedback} onChange={e => setFeedback(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowReview(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ComplaintsModule() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ complaintType: 'electrical', description: '' });
  const [loading, setLoading] = useState(false);
  const student = user?.student;

  useEffect(() => { fetchComplaints(); }, []);
  const fetchComplaints = async () => {
    try { const { data } = await api.get('/complaints/my'); setComplaints(data.data); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/complaints', form);
      toast.success('Complaint raised successfully!');
      setShowModal(false);
      setForm({ complaintType: 'electrical', description: '' });
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to raise complaint'); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title" style={{margin: 0}}>🔧 Complaints</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Raise Complaint</button>
      </div>

      <div className="filter-tabs">
        {['all','pending','working','resolved'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Type</th><th>Room</th><th>Description</th><th>Status</th><th>Assigned To</th><th>Resolution</th><th>Date</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">✅</div><p>No complaints found</p></div></td></tr>
              ) : filtered.map(c => (
                <tr key={c._id}>
                  <td><span className="complaint-type-badge">{c.complaintType}</span></td>
                  <td>{c.roomNumber}</td>
                  <td style={{maxWidth: 200, fontSize: 13}}>{c.description}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td style={{fontSize: 13}}>{c.assignedTo?.name || '-'}</td>
                  <td style={{fontSize: 13, maxWidth: 150}}>{c.resolutionNote || '-'}</td>
                  <td style={{fontSize: 12, color: '#64748b'}}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Raise a Complaint</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Room Number (auto-filled)</label>
                  <input className="form-control" value={student?.roomNumber || ''} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Complaint Type *</label>
                  <select className="form-control" value={form.complaintType} onChange={e => setForm({...form, complaintType: e.target.value})}>
                    <option value="electrical">⚡ Electrical</option>
                    <option value="plumbing">💧 Plumbing</option>
                    <option value="carpentry">🪚 Carpentry</option>
                    <option value="cleaning">🧹 Cleaning</option>
                    <option value="internet">📶 Internet</option>
                    <option value="furniture">🪑 Furniture</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-control" rows={4} placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Complaint'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Profile() {
  const { user } = useAuth();
  const student = user?.student;
  return (
    <div>
      <h2 className="section-title">👤 My Profile</h2>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Personal Information</span></div>
          <div className="card-body">
            <div className="profile-grid">
              <div className="profile-item"><div className="profile-item-label">Full Name</div><div className="profile-item-value">{user?.name}</div></div>
              <div className="profile-item"><div className="profile-item-label">Email</div><div className="profile-item-value" style={{wordBreak:'break-all'}}>{user?.email}</div></div>
              <div className="profile-item"><div className="profile-item-label">Mobile</div><div className="profile-item-value">{user?.mobile}</div></div>
              <div className="profile-item"><div className="profile-item-label">Roll Number</div><div className="profile-item-value">{student?.rollNumber}</div></div>
              <div className="profile-item"><div className="profile-item-label">Room Number</div><div className="profile-item-value">{student?.roomNumber}</div></div>
              <div className="profile-item"><div className="profile-item-label">Course</div><div className="profile-item-value">{student?.course || '-'}</div></div>
              <div className="profile-item"><div className="profile-item-label">Year</div><div className="profile-item-value">{student?.year || '-'}</div></div>
              <div className="profile-item"><div className="profile-item-label">Hostel Block</div><div className="profile-item-value">{student?.hostelBlock || '-'}</div></div>
            </div>
            <div className="profile-item" style={{marginTop: 12}}>
              <div className="profile-item-label">Address</div>
              <div className="profile-item-value">{user?.address || '-'}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Parent/Guardian Information</span></div>
          <div className="card-body">
            <div className="profile-grid">
              <div className="profile-item"><div className="profile-item-label">Parent Name</div><div className="profile-item-value">{student?.parentName || '-'}</div></div>
              <div className="profile-item"><div className="profile-item-label">Parent Mobile</div><div className="profile-item-value">{student?.parentMobile || '-'}</div></div>
              <div className="profile-item" style={{gridColumn: '1/-1'}}><div className="profile-item-label">Parent Email</div><div className="profile-item-value">{student?.parentEmail || '-'}</div></div>
            </div>
            <div className="alert alert-info" style={{marginTop: 16}}>📌 To update parent contact info, please contact the warden's office.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 className="section-title">🔐 Change Password</h2>
      <div className="card" style={{maxWidth: 480}}>
        <div className="card-body">
          <div className="alert alert-warning">💡 Default password is your mobile number. Change it after first login.</div>
          <form onSubmit={handleSubmit}>
            {['currentPassword','newPassword','confirmPassword'].map(f => (
              <div className="form-group" key={f}>
                <label className="form-label">{f === 'currentPassword' ? 'Current Password' : f === 'newPassword' ? 'New Password' : 'Confirm New Password'}</label>
                <input type="password" className="form-control" value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})} required />
              </div>
            ))}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Updating...' : 'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const pageTitles = { '': 'Dashboard', '/leave': 'Leave Management', '/mess': 'Mess Menu', '/complaints': 'Complaints', '/profile': 'My Profile', '/change-password': 'Change Password' };
  const [activeTitle, setActiveTitle] = useState('Dashboard');

  return (
    <div className="layout">
      <Sidebar navItems={navItems} basePath="/student" />
      <div className="main-content">
        <TopBar title="🏫 Student Portal" />
        <div className="page-content">
          <Routes>
            <Route path="" element={<DashboardHome />} />
            <Route path="/leave" element={<LeaveManagement />} />
            <Route path="/mess" element={<MessModule />} />
            <Route path="/complaints" element={<ComplaintsModule />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ChangePassword />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
