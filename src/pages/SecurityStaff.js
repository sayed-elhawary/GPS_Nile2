// src/pages/SecurityStaff.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// دالة تنسيق التاريخ
const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  } catch {
    return '—';
  }
};

// دالة تصدير PDF
const exportToPDF = async (staff) => {
  if (!staff || staff.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }

  try {
    const container = document.createElement('div');
    const currentDate = new Date();
    const today = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
    const uniqueLocations = [...new Set(staff.map(s => s.location).filter(l => l))];

    container.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 1200px;
      background: white;
      padding: 30px;
      direction: rtl;
      font-family: 'Cairo', 'Segoe UI', 'Arial', sans-serif;
      z-index: -1;
    `;

    let tableRows = '';
    staff.forEach((item, index) => {
      tableRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; border: 1px solid #cbd5e1; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #1e3a8a;">${item.employeeCode || '-'}</td>
          <td style="padding: 12px 8px; border: 1px solid #cbd5e1; text-align: center;">${item.employeeName || '-'}</td>
          <td style="padding: 12px 8px; border: 1px solid #cbd5e1; text-align: center;">${formatDate(item.appointmentDate)}</td>
          <td style="padding: 12px 8px; border: 1px solid #cbd5e1; text-align: center;">${item.location || '-'}</td>
          <td style="padding: 12px 8px; border: 1px solid #cbd5e1; text-align: center; direction: ltr;">${item.phoneNumber || '-'}</td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #1e3a8a;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800;">تقرير بيانات موظفي الأمن</h1>
        <p style="color: #475569; margin-top: 8px; font-size: 14px;">شركة النيل للخرسانة الجاهزة - NileMix</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 5px;">تاريخ التقرير: ${today}</p>
        <p style="color: #64748b; font-size: 11px;">إجمالي الموظفين: ${staff.length} موظف</p>
      </div>

      <div style="margin-bottom: 20px; padding: 12px; background: #f0f4ff; border-radius: 12px; border-right: 4px solid #1e3a8a;">
        <p style="margin: 0; color: #1e3a8a; font-weight: bold;">📊 ملخص سريع:</p>
        <p style="margin: 5px 0 0 0; color: #475569; font-size: 12px;">عدد المواقع: ${uniqueLocations.length} موقع</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background: #1e3a8a; color: white;">
            <th style="padding: 12px 8px; border: 1px solid #2563eb; text-align: center;">#</th>
            <th style="padding: 12px 8px; border: 1px solid #2563eb; text-align: center;">كود الموظف</th>
            <th style="padding: 12px 8px; border: 1px solid #2563eb; text-align: center;">اسم الموظف</th>
            <th style="padding: 12px 8px; border: 1px solid #2563eb; text-align: center;">تاريخ التعيين</th>
            <th style="padding: 12px 8px; border: 1px solid #2563eb; text-align: center;">الموقع</th>
            <th style="padding: 12px 8px; border: 1px solid #2563eb; text-align: center;">رقم التليفون</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div style="margin-top: 25px; padding-top: 10px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 9px;">
        <p>نظام إدارة موظفي الأمن - NileMix Management System</p>
        <p>تم الإنشاء بواسطة NileMix © ${currentDate.getFullYear()}</p>
      </div>
    `;

    document.body.appendChild(container);
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, {
      scale: 2.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);

    let remainingHeight = imgHeight - pdf.internal.pageSize.getHeight();
    position = -pdf.internal.pageSize.getHeight();

    while (remainingHeight > 0) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      remainingHeight -= pdf.internal.pageSize.getHeight();
      position -= pdf.internal.pageSize.getHeight();
    }

    const fileName = `NileMix_تقرير_موظفي_الأمن_${currentDate.toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
    alert(`✅ تم تصدير PDF بنجاح\nعدد الموظفين: ${staff.length}`);

  } catch (error) {
    console.error('خطأ في تصدير PDF:', error);
    alert('❌ حدث خطأ أثناء تصدير PDF: ' + error.message);
  }
};

export default function SecurityStaff() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [fetchingEmployee, setFetchingEmployee] = useState(false); // حالة جلب بيانات الموظف

  const [formData, setFormData] = useState({
    employeeCode: '',
    employeeName: '',
    appointmentDate: '',
    location: '',
    phoneNumber: ''
  });

  // تحميل الثيم
  useEffect(() => {
    const savedTheme = localStorage.getItem('securityStaffTheme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('securityStaffTheme', newTheme);
  };

  // جلب جميع أفراد الأمن
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/security-staff`);
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('خطأ في جلب البيانات:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // ====================== الوظيفة الجديدة: جلب اسم الموظف تلقائياً ======================
  const fetchEmployeeByName = async (employeeCode) => {
    if (!employeeCode || employeeCode.trim() === '') return;
    
    setFetchingEmployee(true);
    try {
      const res = await fetch(`${API_URL}/api/employees/by-code/${employeeCode.trim()}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        // تم العثور على الموظف - تعبئة الاسم تلقائياً
        setFormData(prev => ({
          ...prev,
          employeeName: data.data.employeeName
        }));
        setError(''); // مسح أي خطأ سابق
      } else {
        // لم يتم العثور على الموظف
        setFormData(prev => ({
          ...prev,
          employeeName: ''
        }));
        setError(`❌ لم يتم العثور على موظف بالكود: ${employeeCode}`);
      }
    } catch (err) {
      console.error('خطأ في جلب بيانات الموظف:', err);
      setFormData(prev => ({
        ...prev,
        employeeName: ''
      }));
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setFetchingEmployee(false);
    }
  };

  // عند تغيير كود الموظف - جلب الاسم تلقائياً
  const handleEmployeeCodeChange = (e) => {
    const code = e.target.value;
    setFormData(prev => ({ ...prev, employeeCode: code }));
    
    // إذا كان الكود ليس فارغاً، جلب الاسم
    if (code && code.trim() !== '') {
      fetchEmployeeByName(code);
    } else {
      // إذا كان الكود فارغاً، امسح الاسم
      setFormData(prev => ({ ...prev, employeeName: '' }));
      setError('');
    }
  };

  const handleSave = async () => {
    if (!formData.employeeCode || !formData.employeeName || !formData.phoneNumber) {
      alert('يرجى ملء الحقول المطلوبة: الكود، الاسم، ورقم التليفون');
      return;
    }

    try {
      setLoading(true);
      const method = editingStaff ? 'PUT' : 'POST';
      const url = editingStaff
        ? `${API_URL}/api/security-staff/${editingStaff._id}`
        : `${API_URL}/api/security-staff`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'فشل في الحفظ');
      }

      await fetchStaff();
      setShowModal(false);
      setSuccess(editingStaff ? '✅ تم تعديل البيانات بنجاح' : '✅ تم إضافة الموظف بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      
      // إعادة تعيين الفورم
      setFormData({
        employeeCode: '',
        employeeName: '',
        appointmentDate: '',
        location: '',
        phoneNumber: ''
      });
      setEditingStaff(null);
    } catch (err) {
      alert('❌ حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/security-staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في الحذف');
      await fetchStaff();
      setDeleteConfirm(null);
      setSuccess('✅ تم حذف الموظف بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('❌ حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (staff.length === 0) {
      alert('⚠️ لا توجد بيانات للتصدير');
      return;
    }
    setPdfLoading(true);
    try {
      await exportToPDF(staff);
    } catch (err) {
      console.error('خطأ في PDF:', err);
      alert('❌ حدث خطأ أثناء تصدير PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const openModal = (staffMember = null) => {
    setError('');
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        employeeCode: staffMember.employeeCode || '',
        employeeName: staffMember.employeeName || '',
        appointmentDate: staffMember.appointmentDate ? staffMember.appointmentDate.split('T')[0] : '',
        location: staffMember.location || '',
        phoneNumber: staffMember.phoneNumber || ''
      });
    } else {
      setEditingStaff(null);
      setFormData({
        employeeCode: '',
        employeeName: '',
        appointmentDate: '',
        location: '',
        phoneNumber: ''
      });
    }
    setShowModal(true);
  };

  const uniqueLocations = [...new Set(staff.map(s => s.location).filter(l => l))].length;

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
    shadow: 'rgba(0, 0, 0, 0.08)'
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
    shadow: 'rgba(0, 0, 0, 0.3)'
  };

  return (
    <div style={{ background: themeStyles.bg, minHeight: '100vh', direction: 'rtl', padding: '35px', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ background: themeStyles.cardBg, borderRadius: '24px', padding: '35px', boxShadow: `0 20px 40px -12px ${themeStyles.shadow}` }}>

        {/* الهيدر */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: themeStyles.secondaryBtn, color: 'white', border: 'none', width: '48px', height: '48px', borderRadius: '50%', fontSize: '22px', cursor: 'pointer' }}>←</button>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: themeStyles.titleColor }}>👮 بيانات موظفي الأمن</div>
              <div style={{ color: themeStyles.text2 }}>إدارة بيانات قسم الأمن والحراسة</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={toggleTheme} style={{ background: themeStyles.inputBg, border: `1px solid ${themeStyles.inputBorder}`, borderRadius: '40px', padding: '8px 18px', cursor: 'pointer', color: themeStyles.text2 }}>
              {theme === 'light' ? '🌙 ليلي' : '☀️ نهاري'}
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading || staff.length === 0} style={{ background: themeStyles.primaryBtn, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '14px', fontWeight: '800', cursor: pdfLoading || staff.length === 0 ? 'not-allowed' : 'pointer', opacity: pdfLoading || staff.length === 0 ? 0.6 : 1 }}>
              {pdfLoading ? '⏳ جاري...' : '📄 PDF'}
            </button>
            <button onClick={() => openModal()} style={{ background: themeStyles.primaryBtn, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}>
              ➕ إضافة
            </button>
          </div>
        </div>

        {error && <div style={{ background: themeStyles.errorBg, color: themeStyles.errorText, padding: '14px', borderRadius: '14px', marginBottom: '20px' }}>⚠️ {error}</div>}
        {success && <div style={{ background: themeStyles.successBg, color: themeStyles.successText, padding: '14px', borderRadius: '14px', marginBottom: '20px' }}>✓ {success}</div>}

        {/* الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px', marginBottom: '30px' }}>
          <div style={{ background: themeStyles.statBg, border: `1px solid ${themeStyles.statBorder}`, borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>👥</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: themeStyles.statValue }}>{staff.length}</div>
            <div style={{ fontSize: '0.8rem', color: themeStyles.text3 }}>إجمالي الموظفين</div>
          </div>
          <div style={{ background: themeStyles.statBg, border: `1px solid ${themeStyles.statBorder}`, borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>📍</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: themeStyles.statValue }}>{uniqueLocations}</div>
            <div style={{ fontSize: '0.8rem', color: themeStyles.text3 }}>عدد المواقع</div>
          </div>
        </div>

        {/* الجدول */}
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: `1px solid ${themeStyles.tableBorder}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: themeStyles.tableHeaderBg }}>
                <th style={{ padding: '14px', color: themeStyles.tableHeaderText, border: `1px solid ${theme === 'light' ? '#2563eb' : '#4f6ef7'}`, textAlign: 'center' }}>#</th>
                <th style={{ padding: '14px', color: themeStyles.tableHeaderText, border: `1px solid ${theme === 'light' ? '#2563eb' : '#4f6ef7'}`, textAlign: 'center' }}>كود الموظف</th>
                <th style={{ padding: '14px', color: themeStyles.tableHeaderText, border: `1px solid ${theme === 'light' ? '#2563eb' : '#4f6ef7'}`, textAlign: 'center' }}>اسم الموظف</th>
                <th style={{ padding: '14px', color: themeStyles.tableHeaderText, border: `1px solid ${theme === 'light' ? '#2563eb' : '#4f6ef7'}`, textAlign: 'center' }}>تاريخ التعيين</th>
                <th style={{ padding: '14px', color: themeStyles.tableHeaderText, border: `1px solid ${theme === 'light' ? '#2563eb' : '#4f6ef7'}`, textAlign: 'center' }}>الموقع</th>
                <th style={{ padding: '14px', color: themeStyles.tableHeaderText, border: `1px solid ${theme === 'light' ? '#2563eb' : '#4f6ef7'}`, textAlign: 'center' }}>رقم التليفون</th>
                <th style={{ padding: '14px', color: themeStyles.tableHeaderText, border: `1px solid ${theme === 'light' ? '#2563eb' : '#4f6ef7'}`, textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: themeStyles.text3 }}>⏳ جاري التحميل...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: themeStyles.text3 }}>📭 لا توجد بيانات</td></tr>
              ) : (
                staff.map((person, idx) => (
                  <tr key={person._id}>
                    <td style={{ padding: '12px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2 }}>{idx + 1}</td>
                    <td style={{ padding: '12px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', fontWeight: 'bold', color: themeStyles.statValue }}>{person.employeeCode}</td>
                    <td style={{ padding: '12px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2 }}>{person.employeeName}</td>
                    <td style={{ padding: '12px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2 }}>{formatDate(person.appointmentDate)}</td>
                    <td style={{ padding: '12px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2 }}>{person.location || '-'}</td>
                    <td style={{ padding: '12px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', direction: 'ltr', color: themeStyles.text2 }}>{person.phoneNumber}</td>
                    <td style={{ padding: '12px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center' }}>
                      <button onClick={() => openModal(person)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', margin: '0 5px', color: themeStyles.statValue }}>✏️</button>
                      <button onClick={() => setDeleteConfirm(person)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', margin: '0 5px', color: '#ef4444' }}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && staff.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center', color: themeStyles.text3, fontSize: '0.8rem' }}>
            إجمالي {staff.length} موظف مسجل
          </div>
        )}
      </div>

      {/* مودال الإضافة/التعديل */}
      {showModal && (
        <div onClick={() => !loading && setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: themeStyles.modalBg, borderRadius: '24px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${themeStyles.cardBorder}`, fontSize: '1.3rem', fontWeight: '800', color: themeStyles.statValue }}>
              {editingStaff ? '✏️ تعديل الموظف' : '👮 إضافة موظف أمن'}
            </div>
            <div style={{ padding: '28px' }}>
              {/* حقل كود الموظف - عند الكتابة يجلب الاسم تلقائياً */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>كود الموظف *</label>
                <input
                  type="text"
                  placeholder="مثال: 3343"
                  value={formData.employeeCode}
                  onChange={handleEmployeeCodeChange}
                  style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${themeStyles.inputBorder}`, borderRadius: '12px', background: themeStyles.inputBg, color: themeStyles.text, outline: 'none', fontFamily: 'Cairo, sans-serif' }}
                />
                {fetchingEmployee && <small style={{ color: themeStyles.text3 }}>⏳ جاري جلب البيانات...</small>}
              </div>

              {/* حقل اسم الموظف - يتم تعبئته تلقائياً */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>اسم الموظف *</label>
                <input
                  type="text"
                  placeholder="سيتم جلب الاسم تلقائياً"
                  value={formData.employeeName}
                  readOnly
                  style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${themeStyles.inputBorder}`, borderRadius: '12px', background: themeStyles.inputBg, color: themeStyles.text, outline: 'none', fontFamily: 'Cairo, sans-serif', opacity: 0.8 }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>تاريخ التعيين *</label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${themeStyles.inputBorder}`, borderRadius: '12px', background: themeStyles.inputBg, color: themeStyles.text, outline: 'none', fontFamily: 'Cairo, sans-serif' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>الموقع *</label>
                <input
                  type="text"
                  placeholder="مثال: المشير"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${themeStyles.inputBorder}`, borderRadius: '12px', background: themeStyles.inputBg, color: themeStyles.text, outline: 'none', fontFamily: 'Cairo, sans-serif' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>رقم التليفون *</label>
                <input
                  type="tel"
                  placeholder="مثال: 01023189757"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${themeStyles.inputBorder}`, borderRadius: '12px', background: themeStyles.inputBg, color: themeStyles.text, outline: 'none', fontFamily: 'Cairo, sans-serif', direction: 'ltr' }}
                />
              </div>
            </div>
            <div style={{ padding: '20px 28px', background: themeStyles.tableHeaderBg, borderTop: `1px solid ${themeStyles.cardBorder}`, display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: themeStyles.secondaryBtn, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '14px', cursor: 'pointer' }}>إلغاء</button>
              <button onClick={handleSave} disabled={loading || fetchingEmployee} style={{ background: themeStyles.primaryBtn, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '14px', cursor: loading || fetchingEmployee ? 'not-allowed' : 'pointer', opacity: loading || fetchingEmployee ? 0.6 : 1 }}>
                {loading ? '⏳ جاري...' : (editingStaff ? 'حفظ' : 'إضافة')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: themeStyles.modalBg, borderRadius: '24px', padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🗑️</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px', color: '#ef4444' }}>تأكيد الحذف</div>
            <div style={{ marginBottom: '24px', color: themeStyles.text2 }}>هل أنت متأكد من حذف <strong style={{ color: '#ef4444' }}>{deleteConfirm.employeeName}</strong>؟</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, background: themeStyles.secondaryBtn, color: 'white', border: 'none', padding: '10px', borderRadius: '14px', cursor: 'pointer' }}>إلغاء</button>
              <button onClick={() => handleDelete(deleteConfirm._id)} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '14px', cursor: 'pointer' }}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}