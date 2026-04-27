// src/Dashboard.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const allMenuItems = [
  {
    icon: '📋',
    title: 'بيانات الموظفين',
    sub: 'رفع أكسيل • بحث • حذف',
    route: '/client-data',
    accent: '#4f6ef7',
    light: 'rgba(79, 110, 247, 0.12)',
    roles: ['admin', 'gps']
  },
  {
    icon: '📹',
    title: 'بيانات الكاميرات',
    sub: 'المواقع • الشرايح • الروترات',
    route: '/camera-data',
    accent: '#0ea5e9',
    light: 'rgba(14, 165, 233, 0.12)',
    roles: ['admin', 'gps']
  },
  {
    icon: '📡',
    title: 'شرايح المعدات',
    sub: 'الأجهزة • التجديد • الملاحظات',
    route: '/equipment-sims',
    accent: '#10b981',
    light: 'rgba(16, 185, 129, 0.12)',
    roles: ['admin', 'gps']
  },
  {
    icon: '🚨',
    title: 'المخالفات',
    sub: 'تسجيل • صور • خصومات • بيانات',
    route: '/violations',
    accent: '#ef4444',
    light: 'rgba(239, 68, 68, 0.12)',
    roles: ['admin', 'gps']
  },
  {
    icon: '📝',
    title: 'محرر المستندات',
    sub: 'تقارير • جداول • طباعة رسمية',
    route: '/document-editor',
    accent: '#f59e0b',
    light: 'rgba(245, 158, 11, 0.12)',
    roles: ['admin', 'gps']
  },
  {
    icon: '👮',
    title: 'بيانات موظفي الأمن',
    sub: 'كود • اسم • تاريخ التعيين • موقع • تليفون',
    route: '/security-staff',
    accent: '#7c3aed',
    light: 'rgba(124, 58, 237, 0.12)',
    roles: ['admin', 'gps']
  },
  {
    icon: '🏠',
    title: 'سكن الموظفين',
    sub: 'صاحب العقار • عقود • صور • تاريخ الانتهاء',
    route: '/employee-housing',
    accent: '#14b8a6',
    light: 'rgba(20, 184, 166, 0.12)',
    roles: ['admin', 'gps', 'user']
  },
  {
    icon: '📍',
    title: 'أجهزة GPS',
    sub: 'إضافة أجهزة • رصيد • استخدام • محاسبة تلقائية',
    route: '/gps-devices',
    accent: '#f97316',
    light: 'rgba(249, 115, 22, 0.12)',
    roles: ['admin', 'gps']
  },
  {
    icon: '💰',
    title: 'حسابات العلاقات العامة والأمن',
    sub: 'إضافة فواتير • تسجيل صرف • متبقي تلقائي • تقارير',
    route: '/pr-accounts',
    accent: '#ec4899',
    light: 'rgba(236, 72, 153, 0.12)',
    roles: ['admin', 'gps']
  },
  {
    icon: '🚛',
    title: 'معدات الشركة',
    sub: 'إدارة الأسطول • رفع Excel • تواريخ الصلاحية • تقارير',
    route: '/company-equipment',
    accent: '#8b5cf6',
    light: 'rgba(139, 92, 246, 0.12)',
    roles: ['admin', 'gps']
  },
  // ====================== صفحة تقرير الصيانة ======================
  {
    icon: '🔧',
    title: 'تقرير الصيانة',
    sub: 'متابعة معدات الصيانة • تقارير PDF • إدارة',
    route: '/maintenance-report',
    accent: '#f97316',
    light: 'rgba(249, 115, 22, 0.12)',
    roles: ['admin', 'gps']
  },
  // ====================== صفحة متابعة سائقين الإدارة (جديدة) ======================
  {
    icon: '🚗',
    title: 'متابعة سائقين الإدارة',
    sub: 'أسماء وأرقام المستلمين • تقارير PDF',
    route: '/driver-followup',
    accent: '#10b981',
    light: 'rgba(16, 185, 129, 0.12)',
    roles: ['admin', 'gps', 'user']
  },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [time, setTime] = useState(new Date());
  const [theme, setTheme] = useState('dark');
  const [activeNav, setActiveNav] = useState('');
  const navigate = useNavigate();
  const { logout: contextLogout, user: authUser } = useAuth();

  // تحميل الثيم المحفوظ
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboardTheme') || 'dark';
    setTheme(savedTheme);
  }, []);

  // تحديث بيانات المستخدم من الـ Context
  useEffect(() => {
    console.log('Dashboard - authUser:', authUser);
   
    if (authUser) {
      setUser(authUser);
    } else {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          console.log('Dashboard - user restored from localStorage:', parsedUser);
        } catch (err) {
          console.error('Error parsing saved user:', err);
          setUser({ email: 'test@test.com', role: 'user', fullName: 'مستخدم تجريبي' });
        }
      } else {
        setUser({ email: 'test@test.com', role: 'user', fullName: 'مستخدم تجريبي' });
      }
    }

    const tick = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(tick);
  }, [authUser]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('dashboardTheme', newTheme);
  };

  const handleNavigation = (route, title) => {
    console.log('=== NAVIGATION ===');
    console.log('Navigating to:', route);
    console.log('Page title:', title);
    console.log('Current user role:', user?.role);
    setActiveNav(route);
   
    try {
      navigate(route);
      console.log('Navigation called successfully');
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    contextLogout();
    navigate('/', { replace: true });
  };

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  const dateStr = time.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = time.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const filteredMenuItems = allMenuItems.filter(item =>
    item.roles.includes(user?.role || 'user')
  );

  // ألوان الثيم المحسنة للديسك توب (تصميم احترافي أكثر أناقة وحداثة)
  const themeStyles = theme === 'light' ? {
    bg: '#f8fafc',
    sidebarBg: '#ffffff',
    sidebarBorder: 'rgba(0, 0, 0, 0.08)',
    text: '#0f172a',
    text2: '#475569',
    text3: '#64748b',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    cardHoverBorder: '#4f6ef7',
    cardShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
    cardHoverShadow: '0 25px 50px -12px rgba(79, 110, 247, 0.25)',
    logoBg: 'linear-gradient(135deg, #4f6ef7, #6366f1)',
    logoTitle: '#1e2937',
    logoSub: '#64748b',
    userInfoBg: '#f8fafc',
    userInfoBorder: '#e2e8f0',
    navHoverBg: '#f1f5f9',
    navHoverColor: '#4f6ef7',
    navActiveBg: 'linear-gradient(135deg, rgba(79, 110, 247, 0.1), rgba(99, 102, 241, 0.1))',
    navActiveBorder: '#4f6ef7',
    logoutBg: '#fef2f2',
    logoutColor: '#ef4444',
    logoutBorder: '#fee2e2',
    logoutHoverBg: '#fee2e2',
    greetingColor: '#0f172a',
    dateColor: '#64748b',
    statCardBg: '#ffffff',
    statCardBorder: '#e2e8f0'
  } : {
    bg: '#0a0f2a',
    sidebarBg: '#0f172f',
    sidebarBorder: 'rgba(255, 255, 255, 0.06)',
    text: '#f8fafc',
    text2: '#cbd5e1',
    text3: '#94a3b8',
    cardBg: '#131b38',
    cardBorder: '#1e293f',
    cardHoverBorder: '#6366f1',
    cardShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    cardHoverShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.35)',
    logoBg: 'linear-gradient(135deg, #4f6ef7, #6366f1)',
    logoTitle: '#f8fafc',
    logoSub: '#94a3b8',
    userInfoBg: '#0a0f2a',
    userInfoBorder: '#1e293f',
    navHoverBg: 'rgba(99, 102, 241, 0.15)',
    navHoverColor: '#c4d0ff',
    navActiveBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.2))',
    navActiveBorder: '#6366f1',
    logoutBg: 'rgba(239, 68, 68, 0.15)',
    logoutColor: '#fca5a5',
    logoutBorder: 'rgba(239, 68, 68, 0.25)',
    logoutHoverBg: 'rgba(239, 68, 68, 0.25)',
    greetingColor: '#f8fafc',
    dateColor: '#94a3b8',
    statCardBg: '#131b38',
    statCardBorder: '#1e293f'
  };

  // إحصائيات سريعة
  const quickStats = [
    { label: 'إجمالي الموظفين', value: '1,284', change: '+12%', icon: '👥', color: '#4f6ef7' },
    { label: 'الأجهزة النشطة', value: '342', change: '+5%', icon: '📡', color: '#10b981' },
    { label: 'المخالفات الشهرية', value: '23', change: '-8%', icon: '🚨', color: '#ef4444' },
    { label: 'المشاريع الحالية', value: '47', change: '+18%', icon: '🏗️', color: '#f59e0b' },
  ];

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
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          transition: background 0.4s ease;
          overflow: hidden;
        }
       
        .dashboard-root {
          height: 100vh;
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          display: flex;
          transition: background 0.4s ease;
          overflow: hidden;
        }
       
        /* ============ SIDEBAR ============ */
        .dashboard-sidebar {
          width: 300px;
          background: ${themeStyles.sidebarBg};
          border-left: 1px solid ${themeStyles.sidebarBorder};
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          right: 0;
          top: 0;
          z-index: 100;
          overflow-y: auto;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(16px);
        }
       
        .dashboard-sidebar::-webkit-scrollbar {
          width: 5px;
        }
       
        .dashboard-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
       
        .dashboard-sidebar::-webkit-scrollbar-thumb {
          background: ${theme === 'light' ? '#cbd5e1' : '#475569'};
          border-radius: 10px;
        }
       
        .logo-container {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 32px 28px 28px;
          border-bottom: 1px solid ${themeStyles.sidebarBorder};
        }
       
        .logo {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          overflow: hidden;
          background: ${themeStyles.logoBg};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(79, 110, 247, 0.35);
          flex-shrink: 0;
        }
       
        .logo svg {
          width: 32px;
          height: 32px;
        }
       
        .logo-text {
          line-height: 1.25;
        }
       
        .logo-title {
          font-size: 1.45rem;
          font-weight: 900;
          color: ${themeStyles.logoTitle};
          letter-spacing: -0.5px;
        }
       
        .logo-sub {
          font-size: 0.72rem;
          color: ${themeStyles.logoSub};
          font-weight: 500;
        }
       
        /* معلومات المستخدم */
        .user-info {
          margin: 24px 20px;
          padding: 24px 20px;
          background: ${themeStyles.userInfoBg};
          border-radius: 22px;
          border: 1px solid ${themeStyles.userInfoBorder};
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
       
        .user-info::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #4f6ef7, #6366f1, #7c3aed);
        }
       
        .user-avatar {
          width: 78px;
          height: 78px;
          margin: 0 auto 14px;
          background: linear-gradient(135deg, #4f6ef7, #6366f1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          color: white;
          box-shadow: 0 8px 25px rgba(79, 110, 247, 0.4);
          font-weight: 700;
        }
       
        .user-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: ${themeStyles.text};
          margin-bottom: 6px;
        }
       
        .user-email {
          font-size: 0.78rem;
          color: ${themeStyles.text3};
          margin-bottom: 12px;
          word-break: break-all;
        }
       
        .user-role {
          display: inline-block;
          font-size: 0.73rem;
          padding: 6px 16px;
          border-radius: 30px;
          background: ${theme === 'light' ? '#f0f9ff' : 'rgba(99, 102, 241, 0.25)'};
          color: ${theme === 'light' ? '#4f6ef7' : '#c4d0ff'};
          font-weight: 700;
          letter-spacing: 0.5px;
        }
       
        /* قائمة التنقل */
        .nav-menu {
          flex: 1;
          padding: 0 16px 20px;
        }
       
        .nav-section-title {
          font-size: 0.73rem;
          font-weight: 700;
          color: ${themeStyles.text3};
          padding: 0 18px 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }
       
        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          border-radius: 16px;
          margin-bottom: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          color: ${themeStyles.text2};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
       
        .nav-item.active {
          background: ${themeStyles.navActiveBg};
          color: ${themeStyles.navHoverColor};
          border-right: 4px solid ${themeStyles.navActiveBorder};
          font-weight: 700;
        }
       
        .nav-item:hover:not(.active) {
          background: ${themeStyles.navHoverBg};
          color: ${themeStyles.navHoverColor};
          transform: translateX(-6px);
        }
       
        .nav-icon {
          font-size: 1.35rem;
          width: 32px;
          text-align: center;
        }
       
        /* زر الخروج */
        .logout-section {
          padding: 20px 24px;
          margin-top: auto;
          border-top: 1px solid ${themeStyles.sidebarBorder};
        }
       
        .logout-btn {
          padding: 15px;
          background: ${themeStyles.logoutBg};
          color: ${themeStyles.logoutColor};
          border: 1px solid ${themeStyles.logoutBorder};
          border-radius: 16px;
          font-weight: 800;
          cursor: pointer;
          width: 100%;
          transition: all 0.3s ease;
          font-family: 'Cairo', sans-serif;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
       
        .logout-btn:hover {
          background: ${themeStyles.logoutHoverBg};
          transform: translateY(-2px);
        }
       
        /* ============ MAIN CONTENT ============ */
        .dashboard-main {
          flex: 1;
          margin-right: 300px;
          overflow-y: auto;
          height: 100vh;
        }
       
        .main-content {
          padding: 40px 48px;
        }
       
        .header-area {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 24px;
        }
       
        .greeting {
          font-size: 2.1rem;
          font-weight: 900;
          color: ${themeStyles.greetingColor};
          margin-bottom: 8px;
          letter-spacing: -0.6px;
        }
       
        .date-time {
          display: flex;
          gap: 16px;
          color: ${themeStyles.dateColor};
          font-size: 0.9rem;
          font-weight: 500;
        }
       
        .theme-toggle {
          background: ${themeStyles.userInfoBg};
          border: 1px solid ${themeStyles.sidebarBorder};
          border-radius: 50px;
          padding: 12px 26px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: ${themeStyles.text2};
          transition: all 0.3s ease;
        }
       
        .theme-toggle:hover {
          transform: scale(1.03);
          border-color: ${theme === 'light' ? '#4f6ef7' : '#6366f1'};
        }
       
        /* Quick Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
       
        .stat-card {
          background: ${themeStyles.statCardBg};
          border: 1px solid ${themeStyles.statCardBorder};
          border-radius: 22px;
          padding: 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
       
        .stat-card:hover {
          transform: translateY(-6px);
          border-color: ${themeStyles.cardHoverBorder};
          box-shadow: ${themeStyles.cardHoverShadow};
        }
       
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
       
        .stat-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
        }
       
        .stat-change {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 9999px;
        }
       
        .stat-value {
          font-size: 2.1rem;
          font-weight: 900;
          color: ${themeStyles.text};
          margin-bottom: 6px;
          letter-spacing: -1px;
        }
       
        .stat-label {
          font-size: 0.85rem;
          color: ${themeStyles.text3};
          font-weight: 500;
        }
       
        /* Services Section */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
       
        .section-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: ${themeStyles.text2};
          display: flex;
          align-items: center;
          gap: 12px;
        }
       
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 28px;
        }
       
        .service-card {
          background: ${themeStyles.cardBg};
          border: 1.5px solid ${themeStyles.cardBorder};
          border-radius: 26px;
          padding: 28px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
       
        .service-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 4px;
          background: var(--accent);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }
       
        .service-card:hover::before {
          transform: scaleX(1);
        }
       
        .service-card:hover {
          transform: translateY(-10px);
          border-color: ${themeStyles.cardHoverBorder};
          box-shadow: ${themeStyles.cardHoverShadow};
        }
       
        .card-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: var(--icon-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 20px;
          transition: transform 0.4s ease;
        }
       
        .service-card:hover .card-icon {
          transform: scale(1.08) rotate(8deg);
        }
       
        .card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: ${themeStyles.text};
          margin-bottom: 10px;
        }
       
        .card-sub {
          font-size: 0.82rem;
          color: ${themeStyles.text3};
          line-height: 1.6;
          margin-bottom: 20px;
        }
       
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid ${themeStyles.cardBorder};
        }
       
        .card-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 30px;
          background: var(--icon-bg);
          color: var(--accent);
        }
       
        .card-arrow {
          font-size: 1.4rem;
          opacity: 0;
          transform: translateX(-12px);
          transition: all 0.4s ease;
        }
       
        .service-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(0);
        }
       
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: ${themeStyles.text3};
        }
       
        /* Scrollbar */
        .dashboard-main::-webkit-scrollbar {
          width: 7px;
        }
       
        .dashboard-main::-webkit-scrollbar-track {
          background: ${theme === 'light' ? '#f1f5f9' : '#1e293b'};
        }
       
        .dashboard-main::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 10px;
        }
       
        .dashboard-main::-webkit-scrollbar-thumb:hover {
          background: #4f46e5;
        }
       
        /* Responsive */
        @media (max-width: 1024px) {
          .dashboard-sidebar { width: 280px; }
          .dashboard-main { margin-right: 280px; }
          .main-content { padding: 32px 32px; }
        }
       
        @media (max-width: 768px) {
          .dashboard-sidebar {
            transform: translateX(100%);
            position: fixed;
            z-index: 1000;
          }
          .dashboard-main { margin-right: 0; }
          .stats-grid { grid-template-columns: 1fr; }
          .greeting { font-size: 1.7rem; }
          .main-content { padding: 24px 20px; }
        }
       
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
       
        .service-card, .stat-card {
          animation: fadeInUp 0.5s ease both;
        }
      `}</style>

      <div className="dashboard-root">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="logo-container">
            <div className="logo">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
                <path d="M19 8H17V6H15V8H13V10H15V12H17V10H19V8Z" fill="white" opacity="0.8"/>
              </svg>
            </div>
            <div className="logo-text">
              <div className="logo-title">NileMix</div>
              <div className="logo-sub">نظام إدارة متكامل</div>
            </div>
          </div>

          {/* معلومات المستخدم */}
          <div className="user-info">
            <div className="user-avatar">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0) || '👤'}
            </div>
            <div className="user-name">{user?.fullName || user?.email?.split('@')[0] || 'مستخدم'}</div>
            <div className="user-email">{user?.email || 'user@example.com'}</div>
            <span className="user-role">
              {user?.role === 'admin' ? 'مدير النظام' :
               user?.role === 'gps' ? 'مراقب GPS' : 'مستخدم'}
            </span>
          </div>

          {/* قائمة التنقل */}
          <div className="nav-menu">
            <div className="nav-section">
              <div className="nav-section-title">القائمة الرئيسية</div>
              {filteredMenuItems.map((item) => (
                <div
                  key={item.route}
                  className={`nav-item ${activeNav === item.route ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.route, item.title)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* زر الخروج */}
          <div className="logout-section">
            <button className="logout-btn" onClick={handleLogout}>
              <span>↩</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="main-content">
            {/* Header */}
            <div className="header-area">
              <div>
                <div className="greeting">
                  {greeting()} {user?.fullName?.split(' ')[0] || ''} 👋
                </div>
                <div className="date-time">
                  <span>📅 {dateStr}</span>
                  <span>⏰ {timeStr}</span>
                </div>
              </div>
              <div className="theme-toggle" onClick={toggleTheme}>
                <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                <span>{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
              {quickStats.map((stat, idx) => (
                <div className="stat-card" key={idx} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="stat-header">
                    <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Services Section */}
            <div className="section-header">
              <div className="section-title">
                <span>✨</span>
                <span>الخدمات المتاحة</span>
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7, fontWeight: 500 }}>
                {filteredMenuItems.length} خدمة
              </div>
            </div>

            {filteredMenuItems.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '52px', marginBottom: '20px' }}>📭</div>
                <div>لا توجد صلاحيات متاحة</div>
              </div>
            ) : (
              <div className="services-grid">
                {filteredMenuItems.map((item, idx) => (
                  <div
                    key={item.route}
                    className="service-card"
                    style={{
                      '--icon-bg': item.light,
                      '--accent': item.accent,
                      animationDelay: `${idx * 0.06}s`
                    }}
                    onClick={() => handleNavigation(item.route, item.title)}
                  >
                    <div className="card-icon" style={{ background: item.light, color: item.accent }}>
                      {item.icon}
                    </div>
                    <div className="card-title">{item.title}</div>
                    <div className="card-sub">{item.sub}</div>
                    <div className="card-footer">
                      <div className="card-badge" style={{ background: item.light, color: item.accent }}>
                        دخول سريع
                      </div>
                      <div className="card-arrow">←</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
