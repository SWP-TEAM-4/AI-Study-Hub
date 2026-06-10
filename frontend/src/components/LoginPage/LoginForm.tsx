import React, { useState } from 'react';

interface LoginFormProps {
  onLoginSuccess?: () => void; // Thêm prop này nếu muốn báo cho Panel biết khi đăng nhập xong
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    if (!email.endsWith('@gmail.com')) {
      setError('Vui lòng nhập đúng định dạng @gmail.com!');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        alert(`Chào mừng ${data.user.username}!`);
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(data.message || 'Tài khoản hoặc mật khẩu không đúng!');
      }
    } catch (err) {
      setError('Không thể kết nối tới máy chủ Back-end!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {error && <p style={{ color: 'red', margin: 0 }}>⚠️ {error}</p>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label>Tài khoản Gmail:</label>
        <input 
          type="email" 
          placeholder="example@gmail.com" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label>Mật khẩu:</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
      </button>
    </form>
  );
};