// src/pages/GPSDevices.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GPSDevices = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  
  const [stock, setStock] = useState({ total: 0, used: 0, remaining: 0 });
  const [damaged, setDamaged] = useState(0);
  const [maintenance, setMaintenance] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const [mode, setMode] = useState('add');

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [deviceCode, setDeviceCode] = useState('');
  const [serial, setSerial] = useState('');
  const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('شغال');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  // فلاتر
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // تحميل الثيم
  useEffect(() => {
    const savedTheme = localStorage.getItem('gpsDevicesTheme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('gpsDevicesTheme', newTheme);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = transactions;
    if (statusFilter !== 'الكل') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        (t.notes && t.notes.toLowerCase().includes(term)) ||
        (t.serial && t.serial.toLowerCase().includes(term)) ||
        (t.deviceCode && t.deviceCode.toLowerCase().includes(term))
      );
    }
    setFilteredTransactions(result);
  }, [transactions, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/gps-stock`);
      setStock(res.data.stock || { total: 0, used: 0, remaining: 0 });
      setTransactions(res.data.transactions || []);
      const allTrans = res.data.transactions || [];
      const damagedCount = allTrans.filter(t => t.status === 'تالف').length;
      const maintenanceCount = allTrans.filter(t => t.status === 'صيانة').length;
      setDamaged(damagedCount);
      setMaintenance(maintenanceCount);
    } catch (err) {
      console.error('Error fetching GPS stock data:', err);
      setMessage('فشل في تحميل البيانات من السيرفر');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity <= 0) {
      setMessage('الكمية يجب أن تكون رقم أكبر من صفر');
      return;
    }
    setLoading(true);
    setMessage('');
    const payload = {
      quantity: parseInt(quantity),
      notes: notes.trim(),
      deviceCode: deviceCode.trim(),
      serial: serial.trim(),
      installDate: installDate,
      status: status
    };
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/gps-stock/transaction/${editingId}`, payload);
        setMessage('تم تعديل العملية بنجاح');
        setEditingId(null);
      } else if (mode === 'add') {
        await axios.post(`${API_URL}/api/gps-stock/add`, payload);
        setMessage(`تم إضافة ${quantity} جهاز إلى الرصيد بنجاح`);
      } else {
        if (stock.remaining < quantity) {
          setMessage(`❌ الرصيد غير كافي! الرصيد المتبقي حالياً: ${stock.remaining} جهاز`);
          setLoading(false);
          return;
        }
        await axios.post(`${API_URL}/api/gps-stock/use`, payload);
        setMessage(`تم صرف ${quantity} جهاز بنجاح`);
      }
      setQuantity(1);
      setNotes('');
      setDeviceCode('');
      setSerial('');
      setInstallDate(new Date().toISOString().split('T')[0]);
      setStatus('شغال');
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trans) => {
    setEditingId(trans._id);
    setMode(trans.type);
    setQuantity(trans.quantity);
    setNotes(trans.notes || '');
    setDeviceCode(trans.deviceCode || '');
    setSerial(trans.serial || '');
    if (trans.installDate) {
      setInstallDate(new Date(trans.installDate).toISOString().split('T')[0]);
    } else {
      setInstallDate(new Date().toISOString().split('T')[0]);
    }
    setStatus(trans.status || 'شغال');
  };

  const handleDelete = async (id) => {
    if (!id) {
      setMessage('خطأ: معرف العملية غير موجود');
      return;
    }
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذه العملية؟\nسيؤثر ذلك على الرصيد الحالي.');
    if (!confirmDelete) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/gps-stock/transaction/${id}`);
      setMessage('تم حذف العملية بنجاح');
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      setMessage(err.response?.data?.message || 'فشل في حذف العملية');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  // أنماط الثيم
  const themeStyles = theme === 'light' ? {
    bg: '#f0f4ff',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    text: '#0f172a',
    text2: '#475569',
    text3: '#94a3b8',
    titleColor: '#1e3a8a',
    subtitleColor: '#64748b',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    inputFocusBorder: '#4f6ef7',
    tableHeaderBg: '#1e3a8a',
    tableHeaderText: '#ffffff',
    tableBorder: '#cbd5e1',
    tableRowHover: '#f8fafc',
    primaryBtn: 'linear-gradient(135deg, #1e3a8a, #4f6ef7)',
    primaryBtnHover: 'linear-gradient(135deg, #2563eb, #6366f1)',
    secondaryBtn: '#64748b',
    secondaryBtnHover: '#475569',
    errorBg: '#fef2f2',
    errorText: '#dc2626',
    successBg: '#ecfdf5',
    successText: '#10b981',
    statBg: '#ffffff',
    statBorder: '#4f6ef7',
    statValue: '#1e3a8a',
    modalBg: '#ffffff',
    modalBorder: '#4f6ef7',
    shadow: 'rgba(0, 0, 0, 0.08)',
    headerBg: '#1e40af',
    addBtn: '#22c55e',
    addBtnHover: '#16a34a',
    useBtn: '#f97316',
    useBtnHover: '#ea580c',
    deleteBtn: '#ef4444',
    deleteBtnHover: '#dc2626',
    editBtn: '#3b82f6',
    editBtnHover: '#2563eb'
  } : {
    bg: '#0f172a',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    text: '#f1f5f9',
    text2: '#cbd5e1',
    text3: '#94a3b8',
    titleColor: '#e2e8f0',
    subtitleColor: '#94a3b8',
    inputBg: '#334155',
    inputBorder: '#475569',
    inputFocusBorder: '#6366f1',
    tableHeaderBg: '#0f172a',
    tableHeaderText: '#e2e8f0',
    tableBorder: '#334155',
    tableRowHover: 'rgba(99, 102, 241, 0.1)',
    primaryBtn: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
    primaryBtnHover: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    secondaryBtn: '#475569',
    secondaryBtnHover: '#64748b',
    errorBg: 'rgba(239, 68, 68, 0.15)',
    errorText: '#f87171',
    successBg: 'rgba(16, 185, 129, 0.15)',
    successText: '#34d399',
    statBg: '#1e293b',
    statBorder: '#6366f1',
    statValue: '#a5b4fc',
    modalBg: '#1e293b',
    modalBorder: '#6366f1',
    shadow: 'rgba(0, 0, 0, 0.3)',
    headerBg: '#0f172a',
    addBtn: '#22c55e',
    addBtnHover: '#16a34a',
    useBtn: '#f97316',
    useBtnHover: '#ea580c',
    deleteBtn: '#ef4444',
    deleteBtnHover: '#dc2626',
    editBtn: '#3b82f6',
    editBtnHover: '#2563eb'
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
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          transition: background 0.3s ease;
        }

        .gps-root {
          min-height: 100vh;
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          transition: background 0.3s ease;
        }

        /* الهيدر */
        .gps-header {
          background: ${themeStyles.headerBg};
          border-bottom: 1px solid ${themeStyles.cardBorder};
          color: white;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(4px);
        }

        .header-title {
          text-align: center;
        }

        .header-title h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0;
        }

        .header-title p {
          font-size: 0.85rem;
          opacity: 0.85;
          margin-top: 5px;
        }

        .theme-toggle {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 40px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          color: white;
          transition: all 0.25s ease;
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.02);
        }

        /* المحتوى الرئيسي */
        .gps-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px;
        }

        /* بطاقات الرصيد */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px -12px ${themeStyles.shadow};
        }

        .stat-card.total {
          border-top: 4px solid #3b82f6;
        }
        .stat-card.used {
          border-top: 4px solid #f97316;
        }
        .stat-card.remaining {
          border-top: 4px solid #22c55e;
        }
        .stat-card.damaged {
          border-top: 4px solid #ef4444;
        }
        .stat-card.maintenance {
          border-top: 4px solid #eab308;
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin-bottom: 15px;
        }

        .stat-card.total .stat-icon {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        .stat-card.used .stat-icon {
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
        }
        .stat-card.remaining .stat-icon {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        .stat-card.damaged .stat-icon {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .stat-card.maintenance .stat-icon {
          background: rgba(234, 179, 8, 0.1);
          color: #eab308;
        }

        .stat-label {
          font-size: 0.85rem;
          color: ${themeStyles.text3};
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 900;
          color: ${themeStyles.titleColor};
          line-height: 1;
        }

        .stat-unit {
          font-size: 0.75rem;
          color: ${themeStyles.text3};
          margin-top: 5px;
        }

        /* بطاقة الفلاتر */
        .filter-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .filter-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .filter-group {
          flex: 1;
          min-width: 200px;
        }

        .filter-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: ${themeStyles.text2};
          margin-bottom: 8px;
        }

        .filter-input, .filter-select {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid ${themeStyles.inputBorder};
          border-radius: 12px;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          transition: all 0.25s ease;
        }

        .filter-input:focus, .filter-select:focus {
          outline: none;
          border-color: ${themeStyles.inputFocusBorder};
          box-shadow: 0 0 0 3px ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};
        }

        .refresh-btn {
          background: ${themeStyles.secondaryBtn};
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
        }

        .refresh-btn:hover {
          background: ${themeStyles.secondaryBtnHover};
          transform: translateY(-2px);
        }

        /* نموذج الإضافة والصرف */
        .form-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          margin-bottom: 30px;
          overflow: hidden;
        }

        .form-tabs {
          display: flex;
          border-bottom: 1px solid ${themeStyles.cardBorder};
        }

        .form-tab {
          flex: 1;
          padding: 16px;
          text-align: center;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.25s ease;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text2};
          border: none;
          font-family: 'Cairo', sans-serif;
        }

        .form-tab.active {
          background: ${theme === 'light' ? '#22c55e' : '#22c55e'};
          color: white;
        }

        .form-tab.use.active {
          background: ${theme === 'light' ? '#f97316' : '#f97316'};
          color: white;
        }

        .form-body {
          padding: 30px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 700;
          color: ${themeStyles.text2};
          margin-bottom: 8px;
        }

        .form-group input, .form-group select, .form-group textarea {
          padding: 12px 16px;
          border: 1.5px solid ${themeStyles.inputBorder};
          border-radius: 12px;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          transition: all 0.25s ease;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: ${themeStyles.inputFocusBorder};
          box-shadow: 0 0 0 3px ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
        }

        .submit-btn.add {
          background: ${themeStyles.addBtn};
        }
        .submit-btn.add:hover {
          background: ${themeStyles.addBtnHover};
          transform: translateY(-2px);
        }
        .submit-btn.use {
          background: ${themeStyles.useBtn};
        }
        .submit-btn.use:hover {
          background: ${themeStyles.useBtnHover};
          transform: translateY(-2px);
        }
        .submit-btn.edit {
          background: ${themeStyles.editBtn};
        }
        .submit-btn.edit:hover {
          background: ${themeStyles.editBtnHover};
          transform: translateY(-2px);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .message {
          margin: 0 30px 30px 30px;
          padding: 15px;
          border-radius: 12px;
          text-align: center;
          font-weight: 600;
        }

        .message.success {
          background: ${themeStyles.successBg};
          color: ${themeStyles.successText};
        }

        .message.error {
          background: ${themeStyles.errorBg};
          color: ${themeStyles.errorText};
        }

        /* جدول العمليات */
        .table-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          overflow: hidden;
        }

        .table-header {
          padding: 20px 25px;
          border-bottom: 1px solid ${themeStyles.cardBorder};
          background: ${themeStyles.inputBg};
        }

        .table-header h3 {
          font-size: 1.2rem;
          font-weight: 800;
          color: ${themeStyles.titleColor};
          margin-bottom: 5px;
        }

        .table-header p {
          font-size: 0.8rem;
          color: ${themeStyles.text3};
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        th {
          background: ${themeStyles.tableHeaderBg};
          color: ${themeStyles.tableHeaderText};
          padding: 15px 12px;
          text-align: center;
          font-weight: 800;
          font-size: 0.8rem;
          border: 1px solid ${themeStyles.tableBorder};
          position: sticky;
          top: 0;
        }

        td {
          padding: 12px 10px;
          text-align: center;
          border: 1px solid ${themeStyles.tableBorder};
          font-size: 0.8rem;
          color: ${themeStyles.text2};
        }

        tr:hover td {
          background: ${themeStyles.tableRowHover};
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .status-badge.working {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }
        .status-badge.damaged {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .status-badge.maintenance {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }

        .type-badge.add {
          color: #22c55e;
          font-weight: 700;
        }
        .type-badge.use {
          color: #f97316;
          font-weight: 700;
        }

        .action-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 5px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .edit-btn {
          color: ${themeStyles.editBtn};
        }
        .edit-btn:hover {
          background: ${theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'};
          transform: scale(1.1);
        }

        .delete-btn {
          color: ${themeStyles.deleteBtn};
        }
        .delete-btn:hover {
          background: ${theme === 'light' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)'};
          transform: scale(1.1);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: ${themeStyles.text3};
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }

        ::-webkit-scrollbar-track {
          background: ${theme === 'light' ? '#f1f5f9' : '#1e293b'};
        }

        ::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 10px;
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

        .stat-card, .filter-card, .form-card, .table-card {
          animation: fadeInUp 0.4s ease both;
        }
      `}</style>

      <div className="gps-root">
        {/* الهيدر */}
        <div className="gps-header">
          <div className="header-container">
            <button onClick={goBack} className="back-button">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>رجوع</span>
            </button>
            <div className="header-title">
              <h1>📍 إدارة رصيد أجهزة GPS</h1>
              <p>صرف وإدارة أجهزة التتبع</p>
            </div>
            <div className="theme-toggle" onClick={toggleTheme}>
              <span>{theme === 'light' ? '🌙' : '☀️'}</span>
              <span>{theme === 'light' ? 'وضع ليلي' : 'وضع نهاري'}</span>
            </div>
          </div>
        </div>

        <div className="gps-container">
          {/* بطاقات الرصيد */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📦</div>
              <div className="stat-label">إجمالي المضاف</div>
              <div className="stat-value">{stock.total}</div>
              <div className="stat-unit">جهاز</div>
            </div>
            <div className="stat-card used">
              <div className="stat-icon">📤</div>
              <div className="stat-label">المستخدم / المصروف</div>
              <div className="stat-value">{stock.used}</div>
              <div className="stat-unit">جهاز</div>
            </div>
            <div className="stat-card remaining">
              <div className="stat-icon">✅</div>
              <div className="stat-label">الرصيد المتبقي</div>
              <div className="stat-value">{stock.remaining}</div>
              <div className="stat-unit">جهاز</div>
            </div>
            <div className="stat-card damaged">
              <div className="stat-icon">🔴</div>
              <div className="stat-label">الأجهزة التالفة</div>
              <div className="stat-value">{damaged}</div>
              <div className="stat-unit">جهاز</div>
            </div>
            <div className="stat-card maintenance">
              <div className="stat-icon">🟡</div>
              <div className="stat-label">في الصيانة</div>
              <div className="stat-value">{maintenance}</div>
              <div className="stat-unit">جهاز</div>
            </div>
          </div>

          {/* فلاتر البحث */}
          <div className="filter-card">
            <div className="filter-grid">
              <div className="filter-group">
                <label className="filter-label">🔍 بحث</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في الملاحظات أو السيريال أو كود المعدة..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">📊 الحالة</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="الكل">جميع الحالات</option>
                  <option value="شغال">🟢 شغال فقط</option>
                  <option value="تالف">🔴 تالف فقط</option>
                  <option value="صيانة">🟡 في الصيانة فقط</option>
                </select>
              </div>
              <div className="filter-group" style={{ flex: '0 0 auto' }}>
                <label className="filter-label" style={{ opacity: 0 }}>تحديث</label>
                <button onClick={fetchData} className="refresh-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  تحديث
                </button>
              </div>
            </div>
          </div>

          {/* نموذج الإضافة والصرف */}
          <div className="form-card">
            <div className="form-tabs">
              <button
                onClick={() => { setMode('add'); setEditingId(null); }}
                className={`form-tab ${mode === 'add' && !editingId ? 'active' : ''}`}
              >
                ➕ إضافة رصيد (مشتريات)
              </button>
              <button
                onClick={() => { setMode('use'); setEditingId(null); }}
                className={`form-tab use ${mode === 'use' && !editingId ? 'active' : ''}`}
              >
                📤 صرف / استخدام جهاز
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>الكمية *</label>
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>الحالة</label>
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="شغال">🟢 شغال (افتراضي)</option>
                      <option value="تالف">🔴 تالف</option>
                      <option value="صيانة">🟡 في الصيانة</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>كود المعدة (اختياري)</label>
                    <input 
                      type="text" 
                      value={deviceCode} 
                      onChange={(e) => setDeviceCode(e.target.value)}
                      placeholder="مثال: EQ-2026-001" 
                    />
                  </div>
                  <div className="form-group">
                    <label>سيريال الجهاز (اختياري)</label>
                    <input 
                      type="text" 
                      value={serial} 
                      onChange={(e) => setSerial(e.target.value)}
                      placeholder="GPS-123456" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {mode === 'add' ? 'ملاحظات عن الإضافة (اختياري)' : 'أين تم استخدام / تركيب الجهاز؟'}
                  </label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={mode === 'add' ? "شراء جديد من المورد ..." : "تركيب على سيارة عميل محمد - لوحة 1234 - مشروع المهندسين"} 
                  />
                </div>

                <div className="form-group">
                  <label>تاريخ التركيب (للصرف فقط)</label>
                  <input 
                    type="date" 
                    value={installDate} 
                    onChange={(e) => setInstallDate(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={`submit-btn ${editingId ? 'edit' : (mode === 'add' ? 'add' : 'use')}`}
                >
                  {loading ? '⏳ جاري الحفظ...' : editingId ? '💾 حفظ التعديل' : mode === 'add' ? '➕ إضافة إلى الرصيد' : '✅ تأكيد الصرف'}
                </button>
              </div>
            </form>

            {message && (
              <div className={`message ${message.includes('تم') || message.includes('نجاح') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
          </div>

          {/* جدول العمليات */}
          <div className="table-card">
            <div className="table-header">
              <h3>سجل العمليات والصرف</h3>
              <p>إجمالي العمليات: {filteredTransactions.length}</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>الكمية</th>
                    <th>كود المعدة</th>
                    <th>سيريال</th>
                    <th>الحالة</th>
                    <th>الملاحظات / المكان</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        <div className="empty-state">
                          <div className="empty-icon">📭</div>
                          <div>لا توجد عمليات مطابقة للفلاتر المختارة</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t._id}>
                        <td>{new Date(t.createdAt || t.date).toLocaleDateString('ar-EG')}</td>
                        <td>
                          <span className={t.type === 'add' ? 'type-badge add' : 'type-badge use'}>
                            {t.type === 'add' ? '➕ إضافة رصيد' : '📤 صرف'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{t.quantity}</td>
                        <td style={{ fontFamily: 'monospace' }}>{t.deviceCode || '-'}</td>
                        <td style={{ fontFamily: 'monospace' }}>{t.serial || '-'}</td>
                        <td>
                          <span className={`status-badge ${t.status === 'شغال' ? 'working' : t.status === 'تالف' ? 'damaged' : 'maintenance'}`}>
                            {t.status === 'شغال' && '🟢'}
                            {t.status === 'تالف' && '🔴'}
                            {t.status === 'صيانة' && '🟡'}
                            {t.status}
                          </span>
                        </td>
                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.notes}>
                          {t.notes || '-'}
                        </td>
                        <td>
                          <button onClick={() => handleEdit(t)} className="action-btn edit-btn" title="تعديل">
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(t._id)} className="action-btn delete-btn" title="حذف">
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GPSDevices;