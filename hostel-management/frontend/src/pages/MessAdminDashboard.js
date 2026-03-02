import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const navItems = [
  { path: '', icon: '🏠', label: 'Dashboard' },
  { path: '/menu', icon: '📅', label: 'Manage Menu' },
  { path: '/reviews', icon: '⭐', label: 'Reviews & Feedback' },
];

function MessHome() {
  const [stats, setStats] = useState({ menus: 0, reviews: 0, avg: 0 });
  const navigate = useNavigate();
  
  useEffect(() => {
    Promise.all([
      api.get('/mess/menu/all'),
      api.get('/mess/reviews')
    ]).then(([m, r]) => {
      setStats({ menus: m.data.data.length, reviews: r.data.data.length, avg: r.data.avgRating });
    }).catch(()=>{});
  }, []);

  const renderStars = (val) => '★'.repeat(Math.round(val)) + '☆'.repeat(5 - Math.round(val));

  return (
    <div>
      <div style={{marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #059669, #0d9488)', borderRadius: 16, color: 'white'}}>
        <h2 style={{fontSize: 22, fontWeight: 800}}>Mess Admin Dashboard 🍽️</h2>
        <p style={{opacity: 0.85, marginTop: 4}}>Manage daily menus and view student feedback</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon green">📅</div><div className="stat-info"><div className="stat-value">{stats.menus}</div><div className="stat-label">Menu Entries</div></div></div>
        <div className="stat-card"><div className="stat-icon yellow">⭐</div><div className="stat-info"><div className="stat-value">{stats.avg}/5</div><div className="stat-label">Average Rating</div></div></div>
        <div className="stat-card"><div className="stat-icon blue">💬</div><div className="stat-info"><div className="stat-value">{stats.reviews}</div><div className="stat-label">Total Reviews</div></div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">⚡ Quick Actions</span></div>
        <div className="card-body" style={{display:'flex', gap:16, flexWrap:'wrap'}}>
          <button className="btn btn-success" onClick={() => navigate('/mess-admin/menu')}>📅 Manage Menu</button>
          <button className="btn btn-outline" onClick={() => navigate('/mess-admin/reviews')}>⭐ View Reviews</button>
        </div>
      </div>
    </div>
  );
}

function ManageMenu() {
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ date: '', breakfast: '', lunch: '', dinner: '', snacks: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchMenus(); }, []);
  const fetchMenus = async () => {
    try { const { data } = await api.get('/mess/menu/all'); setMenus(data.data); } catch {}
  };

  const openAdd = () => { setEditing(null); setForm({ date: new Date().toISOString().split('T')[0], breakfast: '', lunch: '', dinner: '', snacks: '' }); setShowModal(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ date: m.date.split('T')[0], breakfast: m.breakfast, lunch: m.lunch, dinner: m.dinner, snacks: m.snacks || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/mess/menu/${editing._id}`, form);
        toast.success('Menu updated!');
      } else {
        await api.post('/mess/menu', form);
        toast.success('Menu added!');
      }
      setShowModal(false); fetchMenus();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu entry?')) return;
    try { await api.delete(`/mess/menu/${id}`); toast.success('Deleted!'); fetchMenus(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title" style={{margin:0}}>📅 Manage Menu</h2>
        <button className="btn btn-success" onClick={openAdd}>+ Add Menu</button>
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Day</th><th>Date</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Snacks</th><th>Actions</th></tr></thead>
            <tbody>
              {menus.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><p>No menu entries. Add the weekly menu!</p></div></td></tr>
              ) : menus.map(m => (
                <tr key={m._id}>
                  <td style={{fontWeight:600}}>{m.dayOfWeek}</td>
                  <td>{new Date(m.date).toLocaleDateString('en-IN')}</td>
                  <td style={{fontSize:13}}>{m.breakfast}</td>
                  <td style={{fontSize:13}}>{m.lunch}</td>
                  <td style={{fontSize:13}}>{m.dinner}</td>
                  <td style={{fontSize:13}}>{m.snacks || '-'}</td>
                  <td>
                    <div style={{display:'flex', gap:6}}>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(m)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{maxWidth: 580}} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">{editing ? 'Edit Menu' : 'Add Menu'}</span><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                {['breakfast','lunch','dinner','snacks'].map(f => (
                  <div className="form-group" key={f}>
                    <label className="form-label">{f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'snacks' && '*'}</label>
                    <input className="form-control" placeholder={`e.g. ${f === 'breakfast' ? 'Idli Sambhar, Tea' : f === 'lunch' ? 'Dal, Rice, Roti' : f === 'dinner' ? 'Paneer Masala, Naan' : 'Fruits, Milk'}`} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})} required={f !== 'snacks'} />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Menu' : 'Add Menu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsFeedback() {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    api.get('/mess/reviews').then(r => { setReviews(r.data.data); setAvgRating(r.data.avgRating); }).catch(()=>{});
  }, []);

  const renderStars = (val) => [1,2,3,4,5].map(s => (
    <span key={s} style={{color: s <= val ? '#f59e0b' : '#d1d5db', fontSize: 16}}>★</span>
  ));

  const ratingCounts = [5,4,3,2,1].map(r => ({ r, count: reviews.filter(v => v.rating === r).length }));

  return (
    <div>
      <h2 className="section-title">⭐ Reviews & Feedback</h2>
      <div className="grid-2" style={{marginBottom: 24}}>
        <div className="card">
          <div className="card-body" style={{textAlign:'center'}}>
            <div style={{fontSize: 56, fontWeight: 800, color: '#f59e0b'}}>{avgRating}</div>
            <div style={{display:'flex', justifyContent:'center', margin: '8px 0'}}>{renderStars(Math.round(avgRating))}</div>
            <div style={{color:'#64748b', fontSize: 14}}>Average Rating • {reviews.length} Reviews</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            {ratingCounts.map(({r, count}) => (
              <div key={r} style={{display:'flex', alignItems:'center', gap: 12, marginBottom: 10}}>
                <span style={{fontSize: 13, width: 20, textAlign:'right', fontWeight:600}}>{r}★</span>
                <div style={{flex:1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow:'hidden'}}>
                  <div style={{height:'100%', width: `${reviews.length ? (count/reviews.length)*100 : 0}%`, background:'#f59e0b', borderRadius:4, transition:'width 0.4s'}}></div>
                </div>
                <span style={{fontSize: 13, color:'#64748b', width: 24}}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">All Reviews</span></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Student</th><th>Rating</th><th>Meal</th><th>Feedback</th><th>Date</th></tr></thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><p>No reviews yet</p></div></td></tr>
              ) : reviews.map(r => (
                <tr key={r._id}>
                  <td style={{fontWeight:600}}>{r.studentId?.userId?.name || 'Student'}</td>
                  <td><div style={{display:'flex'}}>{renderStars(r.rating)}</div></td>
                  <td><span className="complaint-type-badge">{r.mealType}</span></td>
                  <td style={{fontSize:13, maxWidth:200}}>{r.feedback || '-'}</td>
                  <td style={{fontSize:12, color:'#64748b'}}>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MessAdminDashboard() {
  return (
    <div className="layout">
      <Sidebar navItems={navItems} basePath="/mess-admin" />
      <div className="main-content">
        <div className="top-bar">
          <span className="top-bar-title">🍽️ Mess Admin Portal</span>
          <span style={{fontSize: 13, color: '#64748b'}}>Hostel Management System</span>
        </div>
        <div className="page-content">
          <Routes>
            <Route path="" element={<MessHome />} />
            <Route path="/menu" element={<ManageMenu />} />
            <Route path="/reviews" element={<ReviewsFeedback />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
