import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    if (!email.endsWith('@gmail.com')) {
      setError('Vui lòng sử dụng tài khoản @gmail.com hợp lệ');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.data?.accessToken || data.token || data.accessToken;
        const user = data.data?.user || data.user;
        localStorage.setItem('auth_token', token || '');
        localStorage.setItem('auth_user', JSON.stringify(user || {}));

        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(data.message || 'Tài khoản hoặc mật khẩu không đúng');
      }
    } catch (err) {
      setError('Không thể kết nối tới máy chủ, vui lòng thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-5 w-full max-w-sm mx-auto">
      
      {/* Error Message with Shake Animation */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-xl border border-destructive/20"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Email Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground ml-1">Email</label>
        <div className="relative group">
          <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="email" 
            placeholder="example@gmail.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={loading}
            className="w-full h-12 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground ml-1">Mật khẩu</label>
        <div className="relative group">
          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={loading}
            className="w-full h-12 pl-10 pr-12 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button 
        whileHover={!loading ? { scale: 1.02 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
        type="submit" 
        disabled={loading}
        className="relative flex items-center justify-center w-full h-12 mt-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all overflow-hidden group"
      >
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <Loader2 size={18} className="animate-spin" />
            <span>Đang xử lý...</span>
          </motion.div>
        ) : (
          <span className="relative z-10">Đăng Nhập</span>
        )}
        
        {/* Subtle highlight effect on hover */}
        {!loading && (
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        )}
      </motion.button>
    </form>
  );
};