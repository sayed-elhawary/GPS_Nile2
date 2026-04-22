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
    roles: ['admin', 'gps', 'user']  // متاحة للجميع
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

  // ألوان الثيم المحسنة للديسك توب
  const themeStyles = theme === 'light' ? {
    bg: '#f5f7fb',
    sidebarBg: '#ffffff',
    sidebarBorder: 'rgba(0, 0, 0, 0.06)',
    text: '#1e293b',
    text2: '#475569',
    text3: '#64748b',
    cardBg: '#ffffff',
    cardBorder: '#e9edf2',
    cardHoverBorder: '#4f6ef7',
    cardShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    cardHoverShadow: '0 20px 35px -12px rgba(79, 110, 247, 0.2)',
    logoBg: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
    logoTitle: '#1e3a8a',
    logoSub: '#64748b',
    userInfoBg: '#f8fafc',
    userInfoBorder: '#e2e8f0',
    navHoverBg: '#eff6ff',
    navHoverColor: '#4f6ef7',
    navActiveBg: 'linear-gradient(135deg, rgba(79, 110, 247, 0.08), rgba(124, 58, 237, 0.08))',
    navActiveBorder: '#4f6ef7',
    logoutBg: '#fef2f2',
    logoutColor: '#dc2626',
    logoutBorder: '#fee2e2',
    logoutHoverBg: '#fee2e2',
    greetingColor: '#1e293b',
    dateColor: '#64748b',
    statCardBg: '#f8fafc',
    statCardBorder: '#e2e8f0'
  } : {
    bg: '#0a0e27',
    sidebarBg: '#0f1535',
    sidebarBorder: 'rgba(255, 255, 255, 0.05)',
    text: '#f1f5f9',
    text2: '#cbd5e1',
    text3: '#94a3b8',
    cardBg: '#131b3e',
    cardBorder: '#1e274a',
    cardHoverBorder: '#6366f1',
    cardShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    cardHoverShadow: '0 20px 35px -12px rgba(99, 102, 241, 0.3)',
    logoBg: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
    logoTitle: '#e2e8f0',
    logoSub: '#94a3b8',
    userInfoBg: '#0a0f2a',
    userInfoBorder: '#1e274a',
    navHoverBg: 'rgba(99, 102, 241, 0.12)',
    navHoverColor: '#818cf8',
    navActiveBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
    navActiveBorder: '#6366f1',
    logoutBg: 'rgba(239, 68, 68, 0.12)',
    logoutColor: '#f87171',
    logoutBorder: 'rgba(239, 68, 68, 0.2)',
    logoutHoverBg: 'rgba(239, 68, 68, 0.2)',
    greetingColor: '#ffffff',
    dateColor: '#94a3b8',
    statCardBg: '#0f1535',
    statCardBorder: '#1e274a'
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
          transition: background 0.3s ease;
          overflow: hidden;
        }
        
        .dashboard-root {
          height: 100vh;
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          display: flex;
          transition: background 0.3s ease;
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
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        /* تخصيص شريط التمرير في السايدبار */
        .dashboard-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        
        .dashboard-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .dashboard-sidebar::-webkit-scrollbar-thumb {
          background: ${theme === 'light' ? '#cbd5e1' : '#334155'};
          border-radius: 10px;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 32px 24px;
          border-bottom: 1px solid ${themeStyles.sidebarBorder};
        }
        
        .logo {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          overflow: hidden;
          background: ${themeStyles.logoBg};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(79, 110, 247, 0.3);
        }
        
        .logo svg {
          width: 30px;
          height: 30px;
        }
        
        .logo-text {
          line-height: 1.3;
        }
        
        .logo-title {
          font-size: 1.3rem;
          font-weight: 900;
          color: ${themeStyles.logoTitle};
          transition: color 0.3s ease;
        }
        
        .logo-sub {
          font-size: 0.7rem;
          color: ${themeStyles.logoSub};
          transition: color 0.3s ease;
        }
        
        /* معلومات المستخدم المحسنة */
        .user-info {
          margin: 24px 20px;
          padding: 20px;
          background: ${themeStyles.userInfoBg};
          border-radius: 20px;
          border: 1px solid ${themeStyles.userInfoBorder};
          transition: all 0.3s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .user-info::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #4f6ef7, #7c3aed);
        }
        
        .user-avatar {
          width: 70px;
          height: 70px;
          margin: 0 auto 12px;
          background: linear-gradient(135deg, #4f6ef7, #7c3aed);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          box-shadow: 0 4px 15px rgba(79, 110, 247, 0.3);
        }
        
        .user-name {
          font-size: 1rem;
          font-weight: 800;
          color: ${themeStyles.text};
          margin-bottom: 6px;
        }
        
        .user-email {
          font-size: 0.7rem;
          color: ${themeStyles.text3};
          margin-bottom: 10px;
          word-break: break-all;
        }
        
        .user-role {
          display: inline-block;
          font-size: 0.7rem;
          padding: 5px 14px;
          border-radius: 30px;
          background: ${theme === 'light' ? '#eff6ff' : 'rgba(99, 102, 241, 0.2)'};
          color: ${theme === 'light' ? '#4f6ef7' : '#a5b4fc'};
          font-weight: 700;
        }
        
        /* قائمة التنقل */
        .nav-menu {
          flex: 1;
          padding: 0 16px;
        }
        
        .nav-section {
          margin-bottom: 24px;
        }
        
        .nav-section-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: ${themeStyles.text3};
          padding: 0 16px;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: 14px;
          margin-bottom: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          color: ${themeStyles.text2};
          transition: all 0.25s ease;
          position: relative;
        }
        
        .nav-item.active {
          background: ${themeStyles.navActiveBg};
          color: ${themeStyles.navHoverColor};
          border-right: 3px solid ${themeStyles.navActiveBorder};
        }
        
        .nav-item:hover:not(.active) {
          background: ${themeStyles.navHoverBg};
          color: ${themeStyles.navHoverColor};
          transform: translateX(-4px);
        }
        
        .nav-icon {
          font-size: 1.2rem;
          width: 28px;
        }
        
        .nav-badge {
          margin-right: auto;
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 20px;
        }
        
        /* زر الخروج */
        .logout-section {
          padding: 20px;
          margin-top: auto;
          border-top: 1px solid ${themeStyles.sidebarBorder};
        }
        
        .logout-btn {
          padding: 14px;
          background: ${themeStyles.logoutBg};
          color: ${themeStyles.logoutColor};
          border: 1px solid ${themeStyles.logoutBorder};
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          width: 100%;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
          font-size: 0.9rem;
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
          padding: 32px 40px;
        }
        
        /* Header area */
        .header-area {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .greeting-section {
          flex: 1;
        }
        
        .greeting {
          font-size: 1.8rem;
          font-weight: 900;
          color: ${themeStyles.greetingColor};
          margin-bottom: 8px;
          transition: color 0.3s ease;
        }
        
        .date-time {
          display: flex;
          gap: 12px;
          color: ${themeStyles.dateColor};
          font-size: 0.85rem;
        }
        
        .theme-toggle {
          background: ${themeStyles.userInfoBg};
          border: 1px solid ${themeStyles.sidebarBorder};
          border-radius: 40px;
          padding: 10px 22px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: ${themeStyles.text2};
          transition: all 0.25s ease;
        }
        
        .theme-toggle:hover {
          transform: scale(1.02);
          border-color: ${theme === 'light' ? '#4f6ef7' : '#6366f1'};
        }
        
        /* Quick Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .stat-card {
          background: ${themeStyles.statCardBg};
          border: 1px solid ${themeStyles.statCardBorder};
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-3px);
          border-color: ${themeStyles.cardHoverBorder};
        }
        
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .stat-change {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }
        
        .stat-change.positive {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .stat-change.negative {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: ${themeStyles.text};
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: ${themeStyles.text3};
        }
        
        /* Section header */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .section-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: ${themeStyles.text2};
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .section-title span {
          font-size: 1.3rem;
        }
        
        /* كروت الخدمات المحسنة */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .service-card {
          background: ${themeStyles.cardBg};
          border: 1.5px solid ${themeStyles.cardBorder};
          border-radius: 24px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        
        .service-card:hover::before {
          transform: scaleX(1);
        }
        
        .service-card:hover {
          transform: translateY(-6px);
          border-color: ${themeStyles.cardHoverBorder};
          box-shadow: ${themeStyles.cardHoverShadow};
        }
        
        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--icon-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 18px;
          transition: transform 0.3s ease;
        }
        
        .service-card:hover .card-icon {
          transform: scale(1.05);
        }
        
        .card-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: ${themeStyles.text};
          margin-bottom: 8px;
        }
        
        .card-sub {
          font-size: 0.75rem;
          color: ${themeStyles.text3};
          line-height: 1.5;
          margin-bottom: 16px;
        }
        
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid ${themeStyles.cardBorder};
        }
        
        .card-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 30px;
          background: var(--icon-bg);
          color: var(--accent);
        }
        
        .card-arrow {
          font-size: 1.2rem;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }
        
        .service-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(0);
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: ${themeStyles.text3};
        }
        
        /* Scrollbar */
        .dashboard-main::-webkit-scrollbar {
          width: 6px;
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
          .dashboard-sidebar {
            width: 260px;
          }
          .dashboard-main {
            margin-right: 260px;
          }
          .main-content {
            padding: 24px;
          }
          .services-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-sidebar {
            transform: translateX(100%);
            position: fixed;
            z-index: 1000;
          }
          .dashboard-main {
            margin-right: 0;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .greeting {
            font-size: 1.4rem;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .service-card {
          animation: fadeInUp 0.4s ease both;
        }
        
        .stat-card {
          animation: fadeInUp 0.4s ease both;
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
              <div className="logo-title">NileMix ERP</div>
              <div className="logo-sub">نظام إدارة متكامل</div>
            </div>
          </div>

          {/* معلومات المستخدم المحسنة */}
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
            {/* Header with greeting and time */}
            <div className="header-area">
              <div className="greeting-section">
                <div className="greeting">
                  {greeting()} {user?.fullName?.split(' ')[0] || 'عزيزي'} 👋
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

            {/* Quick Stats Section */}
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
              <div className="section-title" style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                {filteredMenuItems.length} خدمة
              </div>
            </div>

            {filteredMenuItems.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
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
                      animationDelay: `${idx * 0.05}s`
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
                        ✨ دخول سريع
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