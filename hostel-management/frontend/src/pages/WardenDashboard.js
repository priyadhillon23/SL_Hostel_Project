import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import api from '../utils/api';
import toast from 'react-hot-toast';
import DiscussionPanel from '../components/DiscussionPanel';

const navItems = [
  { path: '', icon: '🏠', label: 'Dashboard' },
  { path: '/leaves', icon: '📋', label: 'Leave Requests' },
  { path: '/complaints', icon: '📢', label: 'Complaints' },
  { path: '/mess-menu', icon: '🍽️', label: 'Weekly Mess Menu' },
  { path: '/rooms', icon: '🛏️', label: 'Room Allocation' },
  { path: '/students', icon: '🎓', label: 'Student Directory' },
];

function WardenHome() {
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    api.get('/admin/analytics').then(r => setStats(r.data.data)).catch(()=>{});
  }, []);

  return (
    <div>
      <div style={{marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)', borderRadius: 16, color: 'white'}}>
        <h2 style={{fontSize: 22, fontWeight: 800}}>Warden Dashboard 👮</h2>
        <p style={{opacity: 0.85, marginTop: 4}}>Manage hostel operations and student welfare</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon purple">🎓</div><div className="stat-info"><div className="stat-value">{stats.totalStudents || 0}</div><div className="stat-label">Total Students</div></div></div>
        <div className="stat-card"><div className="stat-icon yellow">⏳</div><div className="stat-info"><div className="stat-value">{stats.pendingLeaves || 0}</div><div className="stat-label">Pending Leaves</div></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><div className="stat-value">{stats.approvedLeaves || 0}</div><div className="stat-label">Approved Leaves</div></div></div>
        <div className="stat-card"><div className="stat-icon blue">📋</div><div className="stat-info"><div className="stat-value">{stats.totalLeaves || 0}</div><div className="stat-label">Total Leave Requests</div></div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">⚡ Quick Actions</span></div>
        <div className="card-body" style={{display:'flex', gap:16, flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={() => navigate('/warden/leaves')}>📋 Review Pending Leaves ({stats.pendingLeaves || 0})</button>
          <button className="btn btn-outline" onClick={() => navigate('/warden/complaints')}>📢 View Complaints</button>
          <button className="btn btn-outline" onClick={() => navigate('/warden/mess-menu')}>🍽️ View Weekly Mess Menu</button>
          <button className="btn btn-outline" onClick={() => navigate('/warden/students')}>🎓 View Student Directory</button>
        </div>
      </div>
      <div style={{marginTop: 16}}>
        <DiscussionPanel />
      </div>
    </div>
  );
}

function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLeaves(); }, [filter]);
  const fetchLeaves = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { data } = await api.get(`/leave/all${params}`);
      setLeaves(data.data);
    } catch {}
  };

  const handleAction = async (leaveId, status) => {
    setLoading(true);
    try {
      await api.put(`/leave/${leaveId}`, { status, remark });
      toast.success(`Leave ${status} successfully! Email notification sent.`);
      setSelected(null); setRemark('');
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setLoading(false); }
  };

  const filtered = leaves.filter(l => {
    if (!search) return true;
    const name = l.studentId?.userId?.name?.toLowerCase() || '';
    const roll = l.studentId?.rollNumber?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || roll.includes(search.toLowerCase());
  });

  return (
    <div>
      <h2 className="section-title">📋 Leave Requests</h2>
      <div className="flex items-center gap-4 mb-4" style={{flexWrap:'wrap'}}>
        <div className="filter-tabs" style={{margin:0}}>
          {['all','pending','approved','rejected'].map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input className="form-control" style={{maxWidth: 240}} placeholder="🔍 Search by name/roll..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Student</th><th>Roll No</th><th>Room</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Applied</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">📭</div><p>No leave requests</p></div></td></tr>
              ) : filtered.map(l => (
                <tr key={l._id}>
                  <td style={{fontWeight: 600}}>{l.studentId?.userId?.name}</td>
                  <td>{l.studentId?.rollNumber}</td>
                  <td>{l.studentId?.roomNumber}</td>
                  <td>{new Date(l.fromDate).toLocaleDateString('en-IN')}</td>
                  <td>{new Date(l.toDate).toLocaleDateString('en-IN')}</td>
                  <td style={{maxWidth: 160, fontSize: 13}}>{l.reason}</td>
                  <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                  <td style={{fontSize: 12, color: '#64748b'}}>{new Date(l.appliedAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    {l.status === 'pending' && (
                      <button className="btn btn-sm btn-primary" onClick={() => { setSelected(l); setRemark(''); }}>Review</button>
                    )}
                    {l.status !== 'pending' && <span style={{fontSize: 12, color: '#64748b'}}>{l.remark || 'Reviewed'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Review Leave Request</span>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="profile-grid" style={{marginBottom: 16}}>
                <div className="profile-item"><div className="profile-item-label">Student</div><div className="profile-item-value">{selected.studentId?.userId?.name}</div></div>
                <div className="profile-item"><div className="profile-item-label">Roll Number</div><div className="profile-item-value">{selected.studentId?.rollNumber}</div></div>
                <div className="profile-item"><div className="profile-item-label">From</div><div className="profile-item-value">{new Date(selected.fromDate).toDateString()}</div></div>
                <div className="profile-item"><div className="profile-item-label">To</div><div className="profile-item-value">{new Date(selected.toDate).toDateString()}</div></div>
                <div className="profile-item"><div className="profile-item-label">Parent Mobile</div><div className="profile-item-value">{selected.studentId?.parentMobile || '-'}</div></div>
                <div className="profile-item"><div className="profile-item-label">Parent Email</div><div className="profile-item-value" style={{wordBreak:'break-all'}}>{selected.studentId?.parentEmail || '-'}</div></div>
              </div>
              <div className="profile-item" style={{marginBottom: 16}}><div className="profile-item-label">Reason</div><div className="profile-item-value">{selected.reason}</div></div>
              <div className="alert alert-info">📧 Email notification will be sent to parent on action.</div>
              <div className="form-group">
                <label className="form-label">Remark (required for rejection)</label>
                <textarea className="form-control" rows={2} placeholder="Add remark..." value={remark} onChange={e => setRemark(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={loading} onClick={() => { if(!remark.trim()){toast.error('Please add a remark for rejection');return;} handleAction(selected._id, 'rejected'); }}>❌ Reject</button>
              <button className="btn btn-success" disabled={loading} onClick={() => handleAction(selected._id, 'approved')}>✅ Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WardenComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints/all');
      setComplaints(data.data);
    } catch {}
  };

  const filtered = complaints.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (!search) return true;
    const name = c.studentId?.userId?.name?.toLowerCase() || '';
    const room = c.roomNumber?.toLowerCase() || '';
    const type = c.complaintType?.toLowerCase() || '';
    return (
      name.includes(search.toLowerCase()) ||
      room.includes(search.toLowerCase()) ||
      type.includes(search.toLowerCase())
    );
  });

  return (
    <div>
      <h2 className="section-title">📢 Complaints Overview</h2>
      <div className="flex items-center gap-4 mb-4" style={{flexWrap:'wrap'}}>
        <div className="filter-tabs" style={{margin:0}}>
          {['all','pending','working','resolved'].map(f => (
            <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input
          className="form-control"
          style={{maxWidth:260}}
          placeholder="🔍 Search by student/room/type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
                <th>Student</th>
                <th>Assigned To</th>
                <th>Raised On</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <p>No complaints found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c._id}>
                  <td style={{fontWeight:600}}>{c.roomNumber}</td>
                  <td><span className="complaint-type-badge">{c.complaintType}</span></td>
                  <td style={{fontSize:13, maxWidth:220}}>{c.description}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td style={{fontSize:13}}>{c.studentId?.userId?.name}</td>
                  <td style={{fontSize:13}}>
                    {c.assignedTo ? `${c.assignedTo.name} (${c.assignedTo.employeeId || '-'})` : 'Unassigned'}
                  </td>
                  <td style={{fontSize:12, color:'#64748b'}}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WardenMessMenu() {
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    api.get('/mess/menu').then(r => setMenus(r.data.data || [])).catch(()=>{});
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });

  return (
    <div>
      <h2 className="section-title">🍽️ Weekly Mess Menu</h2>
      <p style={{marginBottom:16, color:'#64748b', fontSize:13}}>
        Upcoming 7 days menu for the hostel mess, day wise.
      </p>
      {menus.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>No menu available</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16}}>
            {menus.map(m => (
              <div key={m._id} className="mini-card" style={{borderRadius:12, padding:14, background:'#f8fafc', border:'1px solid #e2e8f0'}}>
                <div style={{marginBottom:6, fontWeight:700, fontSize:15}}>{m.dayOfWeek}</div>
                <div style={{marginBottom:8, fontSize:12, color:'#64748b'}}>{formatDate(m.date)}</div>
                <div style={{fontSize:13, marginBottom:6}}>
                  <strong>Breakfast:</strong> {m.breakfast || '-'}
                </div>
                <div style={{fontSize:13, marginBottom:6}}>
                  <strong>Lunch:</strong> {m.lunch || '-'}
                </div>
                <div style={{fontSize:13}}>
                  <strong>Dinner:</strong> {m.dinner || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoomAllocation() {
  const [data, setData] = useState({ allocated: [], vacant: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/rooms/summary');
        setData(data.data || { allocated: [], vacant: [] });
      } catch {
        setData({ allocated: [], vacant: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2 className="section-title">🛏️ Room Allocation</h2>
      <p style={{marginBottom:16, color:'#64748b', fontSize:13}}>
        Overview of allocated rooms with student roll numbers and list of currently vacant rooms.
      </p>
      {loading ? (
        <div className="card"><div className="card-body"><p>Loading room data...</p></div></div>
      ) : (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">🏠 Allocated Rooms</span></div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Room No</th>
                    <th>Block</th>
                    <th>Student Roll No</th>
                    <th>Student Name</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allocated.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📭</div>
                          <p>No allocated rooms configured</p>
                        </div>
                      </td>
                    </tr>
                  ) : data.allocated.map(r => (
                    <tr key={r.roomNumber}>
                      <td>{r.roomNumber}</td>
                      <td>{r.hostelBlock || '-'}</td>
                      <td>{r.studentRollNumber || '-'}</td>
                      <td>{r.studentName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">📄 Vacant Rooms</span></div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Room No</th>
                    <th>Block</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vacant.length === 0 ? (
                    <tr>
                      <td colSpan={2}>
                        <div className="empty-state">
                          <div className="empty-state-icon">✅</div>
                          <p>No vacant rooms listed</p>
                        </div>
                      </td>
                    </tr>
                  ) : data.vacant.map(r => (
                    <tr key={r.roomNumber}>
                      <td>{r.roomNumber}</td>
                      <td>{r.hostelBlock || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/admin/users?role=student').then(r => setStudents(r.data.data)).catch(()=>{});
  }, []);

  const filtered = students.filter(s => {
    const name = s.name?.toLowerCase() || '';
    const roll = s.student?.rollNumber?.toLowerCase() || '';
    const room = s.student?.roomNumber?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || roll.includes(search.toLowerCase()) || room.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title" style={{margin:0}}>🎓 Student Directory</h2>
        <input className="form-control" style={{maxWidth: 280}} placeholder="🔍 Search by name/roll/room..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Roll No</th><th>Room</th><th>Mobile</th><th>Course</th><th>Parent Mobile</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🎓</div><p>No students found</p></div></td></tr>
              ) : filtered.map(s => (
                <tr key={s._id}>
                  <td style={{fontWeight:600}}>{s.name}</td>
                  <td>{s.student?.rollNumber}</td>
                  <td>{s.student?.roomNumber}</td>
                  <td>{s.mobile}</td>
                  <td>{s.student?.course || '-'}</td>
                  <td>{s.student?.parentMobile || '-'}</td>
                  <td><button className="btn btn-sm btn-outline" onClick={() => setSelected(s)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Student Details</span><button className="modal-close" onClick={() => setSelected(null)}>✕</button></div>
            <div className="modal-body">
              <div className="profile-grid">
                <div className="profile-item"><div className="profile-item-label">Name</div><div className="profile-item-value">{selected.name}</div></div>
                <div className="profile-item"><div className="profile-item-label">Email</div><div className="profile-item-value" style={{wordBreak:'break-all'}}>{selected.email}</div></div>
                <div className="profile-item"><div className="profile-item-label">Roll Number</div><div className="profile-item-value">{selected.student?.rollNumber}</div></div>
                <div className="profile-item"><div className="profile-item-label">Room Number</div><div className="profile-item-value">{selected.student?.roomNumber}</div></div>
                <div className="profile-item"><div className="profile-item-label">Mobile</div><div className="profile-item-value">{selected.mobile}</div></div>
                <div className="profile-item"><div className="profile-item-label">Course</div><div className="profile-item-value">{selected.student?.course || '-'}</div></div>
                <div className="profile-item"><div className="profile-item-label">Parent Name</div><div className="profile-item-value">{selected.student?.parentName || '-'}</div></div>
                <div className="profile-item"><div className="profile-item-label">Parent Mobile</div><div className="profile-item-value">{selected.student?.parentMobile || '-'}</div></div>
                <div className="profile-item" style={{gridColumn:'1/-1'}}><div className="profile-item-label">Address</div><div className="profile-item-value">{selected.address || '-'}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WardenDashboard() {
  return (
    <div className="layout">
      <Sidebar navItems={navItems} basePath="/warden" />
      <div className="main-content">
        <TopBar title="👮 Warden Portal" />
        <div className="page-content">
          <Routes>
            <Route path="" element={<WardenHome />} />
            <Route path="/leaves" element={<LeaveRequests />} />
            <Route path="/complaints" element={<WardenComplaints />} />
            <Route path="/mess-menu" element={<WardenMessMenu />} />
            <Route path="/rooms" element={<RoomAllocation />} />
            <Route path="/students" element={<StudentDirectory />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
