// src/Login.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import logoImage from './logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');

  const navigate = useNavigate();
  const { login: contextLogin, isAuthenticated } = useAuth();

  // الحصول على API_URL بطريقة آمنة
  const getApiUrl = () => {
    // محاولة الحصول من متغير البيئة
    const envUrl = process.env.REACT_APP_API_URL;
    console.log('REACT_APP_API_URL from env:', envUrl);
    
    if (envUrl && envUrl !== 'undefined' && envUrl !== '') {
      return envUrl;
    }
    
    // استخدام localhost كقيمة افتراضية
    return 'http://localhost:5000';
  };

  const API_URL = getApiUrl();
  console.log('Final API_URL:', API_URL);

  // التحقق من المصادقة عند تحميل الصفحة
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && isAuthenticated) {
      console.log('Already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // تحميل الإيميل المحفوظ والثيم
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const savedTheme = localStorage.getItem('loginTheme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('loginTheme', newTheme);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('=== STARTING LOGIN PROCESS ===');
    console.log('Email:', email);
    console.log('API_URL:', API_URL);

    // التأكد من أن API_URL صالح
    if (!API_URL || API_URL === 'undefined' || API_URL === '') {
      console.error('API_URL is invalid:', API_URL);
      setError('حدث خطأ في تكوين الاتصال بالسيرفر');
      setLoading(false);
      return;
    }

    const loginUrl = `${API_URL}/api/auth/login`;
    console.log('Full URL:', loginUrl);

    try {
      const response = await axios.post(loginUrl, {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      const token = response.data.token;
      const userData = response.data.user;

      if (!token) {
        throw new Error('لم يتم استلام التوكن');
      }

      console.log('Token received, length:', token.length);

      // حفظ التوكن في localStorage
      localStorage.setItem('token', token);

      // استدعاء دالة login من context
      contextLogin(token, userData);

      // حفظ الإيميل إذا طلب التذكر
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      console.log('Login successful, redirecting to dashboard...');

      // التوجيه الصحيح مع HashRouter
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300);

    } catch (err) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error config:', err.config);

      if (err.code === 'ECONNABORTED') {
        setError('انتهت مهلة الاتصال. تأكد من تشغيل السيرفر');
      } else if (err.response) {
        console.error('Server response:', err.response.data);
        setError(err.response.data?.message || 'خطأ في البريد الإلكتروني أو كلمة المرور');
      } else if (err.request) {
        console.error('No response from server');
        console.error('Request URL:', err.request.responseURL || loginUrl);
        setError(`لا يمكن الاتصال بالسيرفر (${API_URL}). تأكد من تشغيل السيرفر`);
      } else {
        console.error('Request error:', err.message);
        setError(err.message || 'حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  // متغيرات الألوان حسب الثيم
  const themeStyles = theme === 'light' ? {
    bg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    titleColor: '#0f172a',
    subtitleColor: '#64748b',
    labelColor: '#334155',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    inputText: '#1e293b',
    checkboxColor: '#475569',
    forgotColor: '#4f6ef7',
    btnBg: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
    btnHover: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    errorBg: '#fee2e2',
    errorText: '#ef4444',
    adminLinkColor: '#64748b',
    adminLinkColor2: '#4f6ef7',
    shadow: 'rgba(0, 0, 0, 0.08)',
    toggleBg: '#ffffff',
    toggleBorder: '#e2e8f0',
    toggleText: '#334155',
    inputFocusBorder: '#4f6ef7',
    inputFocusShadow: 'rgba(79, 110, 247, 0.15)',
    linkHover: '#6366f1',
    placeholderColor: '#94a3b8'
  } : {
    bg: '#060818',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    titleColor: '#f1f5f9',
    subtitleColor: '#94a3b8',
    labelColor: '#cbd5e1',
    inputBg: '#334155',
    inputBorder: '#475569',
    inputText: '#f1f5f9',
    checkboxColor: '#94a3b8',
    forgotColor: '#818cf8',
    btnBg: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
    btnHover: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    errorBg: '#7f1d1d',
    errorText: '#fca5a5',
    adminLinkColor: '#94a3b8',
    adminLinkColor2: '#818cf8',
    shadow: 'rgba(0, 0, 0, 0.3)',
    toggleBg: '#1e293b',
    toggleBorder: '#334155',
    toggleText: '#e2e8f0',
    inputFocusBorder: '#6366f1',
    inputFocusShadow: 'rgba(99, 102, 241, 0.15)',
    linkHover: '#a5b4fc',
    placeholderColor: '#64748b'
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
       
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
       
        body {
          font-family: 'Cairo', sans-serif;
          background: ${themeStyles.bg};
          transition: background 0.3s ease;
        }
       
        .login-root {
          min-height: 100vh;
          background: ${themeStyles.bg};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          transition: background 0.3s ease;
          position: relative;
        }
       
        .login-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          width: 100%;
          max-width: 420px;
          min-height: 560px;
          border-radius: 28px;
          box-shadow: 0 20px 35px -10px ${themeStyles.shadow};
          padding: 36px 32px 32px;
          margin: 20px;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          flex-direction: column;
        }
       
        @media (max-width: 480px) {
          .login-card {
            max-width: 92%;
            min-height: 520px;
            padding: 28px 24px 24px;
          }
        }
       
        @media (min-width: 1400px) {
          .login-card {
            max-width: 440px;
            min-height: 580px;
          }
        }
       
        .login-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 40px -12px ${theme === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.4)'};
        }
       
        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
       
        .logo {
          width: 100px;
          height: 100px;
          border-radius: 24px;
          overflow: hidden;
          background: ${theme === 'light' ? '#f8fafc' : '#0f172a'};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px -5px rgba(79, 110, 247, 0.2);
          padding: 12px;
        }
       
        .logo:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 35px -8px rgba(79, 110, 247, 0.3);
        }
       
        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
       
        .logo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #4f6ef7, #7c3aed);
          border-radius: 20px;
        }
       
        .logo-fallback svg {
          width: 52px;
          height: 52px;
        }
       
        .title {
          text-align: center;
          font-size: 26px;
          font-weight: 900;
          color: ${themeStyles.titleColor};
          margin-bottom: 6px;
          transition: color 0.3s ease;
        }
       
        .subtitle {
          text-align: center;
          color: ${themeStyles.subtitleColor};
          font-size: 13px;
          margin-bottom: 28px;
          transition: color 0.3s ease;
        }
       
        .form-content {
          flex: 1;
        }
       
        .input-group {
          margin-bottom: 18px;
        }
       
        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 700;
          color: ${themeStyles.labelColor};
          transition: color 0.3s ease;
        }
       
        .input {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid ${themeStyles.inputBorder};
          border-radius: 14px;
          font-size: 14px;
          outline: none;
          transition: all 0.25s ease;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.inputText};
          font-family: 'Cairo', sans-serif;
          text-align: right;
        }
       
        .input::placeholder {
          color: ${themeStyles.placeholderColor};
        }
       
        .input:focus {
          border-color: ${themeStyles.inputFocusBorder};
          box-shadow: 0 0 0 4px ${themeStyles.inputFocusShadow};
        }
       
        .options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 14px 0 22px;
          font-size: 13px;
        }
       
        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${themeStyles.checkboxColor};
          cursor: pointer;
          transition: color 0.3s ease;
          font-weight: 500;
        }
       
        .checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #6366f1;
        }
       
        .forgot {
          color: ${themeStyles.forgotColor};
          text-decoration: none;
          font-weight: 700;
          transition: all 0.2s;
        }
       
        .forgot:hover {
          color: ${themeStyles.linkHover};
          text-decoration: underline;
        }
       
        .login-btn {
          width: 100%;
          background: ${themeStyles.btnBg};
          color: white;
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
        }
       
        .login-btn:hover:not(:disabled) {
          background: ${themeStyles.btnHover};
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(79, 110, 247, 0.4);
        }
       
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
       
        .error {
          background: ${themeStyles.errorBg};
          color: ${themeStyles.errorText};
          padding: 10px 14px;
          border-radius: 14px;
          text-align: center;
          margin-bottom: 18px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
       
        .admin-link {
          text-align: center;
          font-size: 12px;
          color: ${themeStyles.adminLinkColor};
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid ${themeStyles.cardBorder};
          transition: color 0.3s ease;
        }
       
        .admin-link a {
          color: ${themeStyles.adminLinkColor2};
          font-weight: 800;
          text-decoration: none;
          transition: all 0.2s;
        }
       
        .admin-link a:hover {
          color: ${themeStyles.linkHover};
          text-decoration: underline;
        }
       
        .theme-toggle {
          position: fixed;
          top: 20px;
          left: 20px;
          background: ${themeStyles.toggleBg};
          border: 1px solid ${themeStyles.toggleBorder};
          border-radius: 60px;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: ${themeStyles.toggleText};
          transition: all 0.3s ease;
          z-index: 1000;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
       
        .theme-toggle:hover {
          transform: translateY(-2px);
          border-color: ${theme === 'light' ? '#6366f1' : '#818cf8'};
        }
      `}</style>

      <div className="login-root">
        <div className="theme-toggle" onClick={toggleTheme}>
          <span>{theme === 'light' ? '🌙' : '☀️'}</span>
          <span>{theme === 'light' ? 'داكن' : 'فاتح'}</span>
        </div>

        <div className="login-card">
          <div className="logo-container">
            <div className="logo">
              <img
                src={logoImage}
                alt="Logo"
                className="logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="logo-fallback">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
                        <path d="M19 8H17V6H15V8H13V10H15V12H17V10H19V8Z" fill="white" opacity="0.8"/>
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
          </div>

          <h1 className="title">مرحباً بك</h1>
          <p className="subtitle">منصة المبادرات الحكومية للشباب</p>

          {error && <div className="error">{error}</div>}

          <div className="form-content">
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  className="input"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>كلمة المرور</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="options">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  تذكرني
                </label>
                <a href="#!" className="forgot" onClick={(e) => e.preventDefault()}>نسيت كلمة المرور؟</a>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
          </div>

          <div className="admin-link">
            ليس لديك حساب؟ <a href="#!" onClick={(e) => e.preventDefault()}>تواصل مع المسؤول</a>
          </div>
        </div>
      </div>
    </>
  );
}