import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';

const roles = [
  { id: 'student', label: 'Student', icon: '🎓', hint: 'Use Roll Number or Email + Password (default: mobile number)' },
  { id: 'warden', label: 'Warden', icon: '👮', hint: 'Use Employee ID + Password' },
  { id: 'mess_admin', label: 'Mess Admin', icon: '🍽️', hint: 'Use Employee ID + Password' },
  { id: 'worker', label: 'Worker', icon: '⚡', hint: 'Use Employee ID + Password' },
  { id: 'super_admin', label: 'Super Admin', icon: '🛡️', hint: 'Use Employee ID + Password' },
];

export default function LoginPage() {
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const selectedRole = roles.find(r => r.id === role);
  
  const getDashboard = (r) => {
    switch(r) {
      case 'student': return '/student';
      case 'warden': return '/warden';
      case 'mess_admin': return '/mess-admin';
      case 'worker': return '/worker';
      case 'super_admin': return '/super-admin';
      default: return '/login';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // Read from form DOM to support browser autofill (which doesn't trigger onChange)
    const formData = new FormData(e.target);
    const idVal = (formData.get('identifier') ?? identifier).trim();
    const pwdVal = (formData.get('password') ?? password).trim();
    if (!idVal || !pwdVal) {
      toast.error('Please enter all fields');
      return;
    }
    setLoading(true);
    try {
      const data = await login(idVal, pwdVal, role);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate(getDashboard(data.user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">
              <AppLogo className="login-logo-img" />
            </div>
            <h1>Hostel Management</h1>
            <p>Smart Hostel Administration System</p>
          </div>

          <div style={{marginBottom: 20}}>
            <p style={{fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#64748b'}}>SELECT YOUR ROLE</p>
            <div className="role-selector">
              {roles.map(r => (
                <button
                  key={r.id}
                  className={`role-btn ${role === r.id ? 'active' : ''}`}
                  onClick={() => { setRole(r.id); setIdentifier(''); setPassword(''); }}
                >
                  <span className="role-btn-icon">{r.icon}</span>
                  <span className="role-btn-label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">
                {role === 'student' ? 'Roll Number or Email' : 'Employee ID'}
              </label>
              <input
                name="identifier"
                type="text"
                className="form-control"
                placeholder={role === 'student' ? 'CS2021001 or student@college.edu' : 'Enter Employee ID'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                name="password"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <div className="login-hint">💡 {selectedRole?.hint}</div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? '🔄 Signing in...' : `Sign In as ${selectedRole?.label}`}
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
}
