import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function DiscussionPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    // Optional: auto-refresh every 30s
    const id = setInterval(fetchMessages, 30000);
    return () => clearInterval(id);
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/discussion?limit=50');
      setMessages(data.data || []);
      scrollToBottom();
    } catch {}
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/discussion', { message: text });
      setMessages(prev => [...prev, data.data]);
      setText('');
      scrollToBottom();
    } catch {
      // ignore for now; toaster handled globally
    } finally {
      setLoading(false);
    }
  };

  const roleBadges = {
    student: '🎓 Student',
    warden: '👮 Warden',
    mess_admin: '🍽️ Mess Admin',
    worker: '🔧 Repair Staff',
    super_admin: '🛡️ Super Admin',
  };

  return (
    <div className="card" style={{ maxHeight: 420, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="card-title">💬 Discussion Board</span>
      </div>
      <div className="card-body" style={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280' }}>
          Share updates, important notices or quick questions with all hostel members.
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: '#f9fafb' }}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <p>No messages yet. Start the discussion!</p>
            </div>
          ) : (
            messages.map(m => (
              <div key={m._id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {m.userId?.name || 'User'}{' '}
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      • {roleBadges[m.userId?.role] || roleBadges[m.role] || ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {new Date(m.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>{m.message}</div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-control"
              placeholder="Write a message to everyone..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

