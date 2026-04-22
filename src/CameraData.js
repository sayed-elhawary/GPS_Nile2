// src/CameraData.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const switchPortsOptions = ['8', '16', '24'];

const formatDateForPDF = (dateString) => {
  if (!dateString) return '—';
  try {
    const cleanDate = dateString.split('T')[0].trim();
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (year && month && day) {
      return `${day}-${month}-${year}`;
    }
  } catch (e) {
    console.warn('خطأ في تنسيق التاريخ:', dateString);
  }
  return '—';
};

async function exportCamerasToPDF(filteredCameras) {
  if (filteredCameras.length === 0) {
    alert('لا توجد بيانات لتصديرها');
    return;
  }
  try {
    const currentDate = new Date().toLocaleDateString('ar-EG');

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: -99999px;
      width: 1500px;
      background: white;
      direction: rtl;
      overflow: visible;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      width: 1500px;
      background: white;
      padding: 40px;
      direction: rtl;
    `;

    let tableHTML = `
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4f6ef7;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 28px;">📹 تقرير بيانات الكاميرات</h1>
        <p style="color: #64748b; margin-top: 8px;">شركة النيل للخرسانة الجاهزة - NileMix</p>
        <p style="color: #94a3b8; font-size: 12px;">تاريخ التقرير: ${currentDate}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
        <thead>
          <tr style="background: #4f6ef7; color: white;">
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">#</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">الموقع</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">إجمالي الكاميرات</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">mm</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">4m</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">5m</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">6m</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">استبريزر</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">USB</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">انفرتر</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">نوع الروتر</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">نوع الشاشة</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">السويتش فولت</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">السويتش مخرج</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">رقم الشريحة</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">سيريال الشريحة</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">تاريخ التجديد</th>
            <th style="padding: 10px; border: 1px solid #6366f1; color: white; font-weight: bold;">الملاحظات</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredCameras.forEach((cam, index) => {
      tableHTML += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${index + 1}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: bold;">${cam.location || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.numCameras || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.cameraType_mm || '0'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.cameraType_4m || '0'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.cameraType_5m || '0'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.cameraType_6m || '0'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.stabilizer || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.usb || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.inverter || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.routerType || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.screenType || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.switchVoltage || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.switchPorts || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.simNumber || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.simSerial || '-'}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${formatDateForPDF(cam.renewalDate)}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1a202c; font-weight: normal;">${cam.notes || '-'}</td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
      <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px;">
        <p>نظام إدارة الكاميرات - شركة النيل للخرسانة الجاهزة</p>
        <p>تم الإنشاء بواسطة NileMix Management System</p>
      </div>
    `;

    container.innerHTML = tableHTML;
    wrapper.appendChild(container);
    document.body.appendChild(wrapper);

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight
    });

    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeightMM = (canvas.height / canvas.width) * pdfWidth;
    const pageHeightMM = pdf.internal.pageSize.getHeight();

    let heightLeft = imgHeightMM;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMM);
    heightLeft -= pageHeightMM;

    while (heightLeft > 0) {
      position = heightLeft - imgHeightMM;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMM);
      heightLeft -= pageHeightMM;
    }

    pdf.save(`NileMix_تقرير_الكاميرات_${new Date().toISOString().slice(0, 10)}.pdf`);
    alert('✅ تم تصدير PDF بنجاح');
  } catch (err) {
    console.error('PDF export error:', err);
    alert('❌ حدث خطأ أثناء تصدير PDF: ' + err.message);
  }
}

export default function CameraData() {
  const [cameras, setCameras] = useState([]);
  const [filteredCameras, setFilteredCameras] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('cameraDataTheme') || 'dark';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('cameraDataTheme', newTheme);
  };

  const [formData, setFormData] = useState({
    location: '',
    numCameras: '',
    cameraType_mm: '',
    cameraType_4m: '',
    cameraType_5m: '',
    cameraType_6m: '',
    stabilizer: '',
    usb: '',
    inverter: '',
    routerType: '',
    screenType: '',
    switchVoltage: '',
    switchPorts: '',
    simNumber: '',
    simSerial: '',
    renewalDate: '',
    notes: '',
  });

  // ✅ دالة محسنة لحساب إجمالي الكاميرات من القيم الحالية
  const calculateTotalFromValues = (mm, m4, m5, m6) => {
    const numMm = parseInt(mm) || 0;
    const num4m = parseInt(m4) || 0;
    const num5m = parseInt(m5) || 0;
    const num6m = parseInt(m6) || 0;
    return numMm + num4m + num5m + num6m;
  };

  // ✅ دالة محدثة للتعامل مع تغيير أنواع الكاميرات - الحل الأساسي للمشكلة
  const handleCameraTypeChange = (field, value) => {
    // أولاً: تحديث الحقل الذي تغير
    setFormData(prev => {
      // الحصول على القيم الجديدة بعد التحديث
      const newMm = field === 'cameraType_mm' ? value : prev.cameraType_mm;
      const new4m = field === 'cameraType_4m' ? value : prev.cameraType_4m;
      const new5m = field === 'cameraType_5m' ? value : prev.cameraType_5m;
      const new6m = field === 'cameraType_6m' ? value : prev.cameraType_6m;
      
      // حساب الإجمالي الجديد
      const total = calculateTotalFromValues(newMm, new4m, new5m, new6m);
      
      // إرجاع الكائن المحدث مع إضافة numCameras المحسوب
      return {
        ...prev,
        [field]: value,
        numCameras: total.toString()
      };
    });
  };

  // ✅ دالة مساعدة لحساب الإجمالي من formData الحالي (للعرض في الحقل المحظور)
  const getCurrentTotal = () => {
    const mm = parseInt(formData.cameraType_mm) || 0;
    const m4 = parseInt(formData.cameraType_4m) || 0;
    const m5 = parseInt(formData.cameraType_5m) || 0;
    const m6 = parseInt(formData.cameraType_6m) || 0;
    return mm + m4 + m5 + m6;
  };

  const fetchAllCameras = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/cameras`);
      const data = Array.isArray(res.data) ? res.data : [];
      setCameras(data);
      setFilteredCameras(data);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setError('فشل في جلب بيانات الكاميرات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCameras();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCameras(cameras);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    setFilteredCameras(cameras.filter((cam) =>
      (cam.location || '').toLowerCase().includes(term) ||
      (cam.simNumber || '').toLowerCase().includes(term) ||
      (cam.routerType || '').toLowerCase().includes(term) ||
      (cam.notes || '').toLowerCase().includes(term)
    ));
  }, [searchTerm, cameras]);

  const openModal = (camera = null) => {
    setError('');
    setSuccess('');
    if (camera) {
      setEditingCamera(camera);
      setFormData({
        location: camera.location || '',
        numCameras: camera.numCameras || '',
        cameraType_mm: camera.cameraType_mm || '',
        cameraType_4m: camera.cameraType_4m || '',
        cameraType_5m: camera.cameraType_5m || '',
        cameraType_6m: camera.cameraType_6m || '',
        stabilizer: camera.stabilizer || '',
        usb: camera.usb || '',
        inverter: camera.inverter || '',
        routerType: camera.routerType || '',
        screenType: camera.screenType || '',
        switchVoltage: camera.switchVoltage || '',
        switchPorts: camera.switchPorts || '',
        simNumber: camera.simNumber || '',
        simSerial: camera.simSerial || '',
        renewalDate: camera.renewalDate ? camera.renewalDate.split('T')[0] : '',
        notes: camera.notes || '',
      });
    } else {
      setEditingCamera(null);
      setFormData({
        location: '', numCameras: '', cameraType_mm: '', cameraType_4m: '', cameraType_5m: '', cameraType_6m: '',
        stabilizer: '', usb: '', inverter: '',
        routerType: '', screenType: '', switchVoltage: '', switchPorts: '',
        simNumber: '', simSerial: '', renewalDate: '', notes: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // ✅ التأكد من حساب الإجمالي بشكل صحيح قبل الحفظ
    const totalCameras = getCurrentTotal();
    const dataToSave = {
      ...formData,
      numCameras: totalCameras.toString()
    };
    
    try {
      if (editingCamera) {
        await axios.put(`${API_URL}/api/cameras/${editingCamera._id}`, dataToSave);
        setSuccess('تم تعديل البيانات بنجاح');
      } else {
        await axios.post(`${API_URL}/api/cameras`, dataToSave);
        setSuccess('تم إضافة بيانات الكاميرا بنجاح');
      }
      setModalOpen(false);
      await fetchAllCameras();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/cameras/${id}`);
      setSuccess('تم الحذف بنجاح');
      setDeleteConfirm(null);
      await fetchAllCameras();
    } catch (err) {
      setError('فشل في الحذف');
      setDeleteConfirm(null);
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await exportCamerasToPDF(filteredCameras);
    } catch (err) {
      console.error('PDF error:', err);
      setError('حدث خطأ أثناء تصدير PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const totalCameras = cameras.reduce((s, c) => s + (parseInt(c.numCameras) || 0), 0);
  const uniqueLocations = new Set(cameras.map(c => c.location)).size;

  const themeStyles = theme === 'light' ? {
    bg: '#f0f4ff',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    cardHoverBorder: '#4f6ef7',
    text: '#0f172a',
    text2: '#475569',
    text3: '#94a3b8',
    titleColor: '#1e3a8a',
    subtitleColor: '#64748b',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    inputFocusBorder: '#4f6ef7',
    tableHeaderBg: '#4f6ef7',
    tableHeaderText: '#ffffff',
    tableBorder: '#cbd5e1',
    tableRowHover: '#f8fafc',
    primaryBtn: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
    primaryBtnHover: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    secondaryBtn: '#64748b',
    secondaryBtnHover: '#475569',
    errorBg: '#fef2f2',
    errorText: '#dc2626',
    successBg: '#ecfdf5',
    successText: '#10b981',
    statBg: '#ffffff',
    statBorder: '#4f6ef7',
    statValue: '#4f6ef7',
    modalBg: '#ffffff',
    modalBorder: '#4f6ef7',
    shadow: 'rgba(0, 0, 0, 0.08)',
    locationCell: '#1e3a8a',
    routerBadge: 'rgba(79, 110, 247, 0.12)'
  } : {
    bg: '#060818',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    cardHoverBorder: '#6366f1',
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
    locationCell: '#a5b4fc',
    routerBadge: 'rgba(99, 102, 241, 0.2)'
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

        .camera-root {
          min-height: 100vh;
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          padding: 35px 45px;
          transition: background 0.3s ease;
        }

        .content-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 24px;
          box-shadow: 0 20px 40px -12px ${themeStyles.shadow};
          padding: 35px;
          min-height: 85vh;
          transition: all 0.3s ease;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${themeStyles.cardBorder};
          flex-wrap: wrap;
          gap: 15px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .back-btn {
          background: ${themeStyles.secondaryBtn};
          color: white;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          font-size: 22px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .back-btn:hover {
          background: ${themeStyles.secondaryBtnHover};
          transform: scale(1.05);
        }

        .title {
          font-size: 1.8rem;
          font-weight: 900;
          color: ${themeStyles.titleColor};
          transition: color 0.3s ease;
        }

        .subtitle {
          color: ${themeStyles.subtitleColor};
          font-size: 0.9rem;
          margin-top: 4px;
          transition: color 0.3s ease;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .theme-toggle {
          background: ${themeStyles.inputBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 40px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          color: ${themeStyles.text2};
          transition: all 0.25s ease;
        }

        .theme-toggle:hover {
          transform: scale(1.02);
          border-color: ${theme === 'light' ? '#4f6ef7' : '#6366f1'};
        }

        .btn-primary {
          background: ${themeStyles.primaryBtn};
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary:hover:not(:disabled) {
          background: ${themeStyles.primaryBtnHover};
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(79, 110, 247, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: ${themeStyles.secondaryBtn};
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
        }

        .btn-secondary:hover {
          background: ${themeStyles.secondaryBtnHover};
          transform: translateY(-2px);
        }

        .error-message {
          background: ${themeStyles.errorBg};
          color: ${themeStyles.errorText};
          padding: 14px 20px;
          border-radius: 14px;
          margin-bottom: 20px;
          border-right: 4px solid ${themeStyles.errorText};
          font-size: 0.85rem;
          font-weight: 600;
        }

        .success-message {
          background: ${themeStyles.successBg};
          color: ${themeStyles.successText};
          padding: 14px 20px;
          border-radius: 14px;
          margin-bottom: 20px;
          border-right: 4px solid ${themeStyles.successText};
          font-size: 0.85rem;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 18px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: ${themeStyles.statBg};
          border: 1px solid ${themeStyles.statBorder};
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          transition: all 0.25s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -8px ${themeStyles.shadow};
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 10px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 900;
          color: ${themeStyles.statValue};
          line-height: 1;
        }

        .stat-label {
          font-size: 0.8rem;
          color: ${themeStyles.text3};
          margin-top: 6px;
        }

        .search-wrapper {
          position: relative;
          margin-bottom: 24px;
        }

        .search-input {
          width: 100%;
          padding: 14px 20px 14px 50px;
          border: 1.5px solid ${themeStyles.inputBorder};
          border-radius: 16px;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.25s ease;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
          font-family: 'Cairo', sans-serif;
          text-align: right;
        }

        .search-input:focus {
          border-color: ${themeStyles.inputFocusBorder};
          box-shadow: 0 0 0 4px ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};
        }

        .search-input::placeholder {
          color: ${themeStyles.text3};
        }

        .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: ${themeStyles.text3};
          font-size: 1.1rem;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 16px;
          border: 1px solid ${themeStyles.tableBorder};
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1300px;
        }

        th {
          background: ${themeStyles.tableHeaderBg};
          color: ${themeStyles.tableHeaderText};
          padding: 14px 12px;
          text-align: center;
          font-weight: 800;
          font-size: 0.8rem;
          border: 1px solid ${theme === 'light' ? '#6366f1' : '#4f6ef7'};
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

        .location-cell {
          font-weight: 800;
          color: ${themeStyles.locationCell};
        }

        .cameras-count {
          font-weight: 700;
          color: ${themeStyles.statValue};
          background: ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-block;
        }

        .router-badge {
          background: ${themeStyles.routerBadge};
          color: ${themeStyles.statValue};
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-block;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .edit-btn {
          background: ${theme === 'light' ? 'rgba(79, 110, 247, 0.12)' : 'rgba(99, 102, 241, 0.2)'};
          color: ${themeStyles.statValue};
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
        }

        .edit-btn:hover {
          transform: scale(1.08);
          background: ${theme === 'light' ? 'rgba(79, 110, 247, 0.25)' : 'rgba(99, 102, 241, 0.35)'};
        }

        .delete-btn {
          background: ${theme === 'light' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.2)'};
          color: #ef4444;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
        }

        .delete-btn:hover {
          transform: scale(1.08);
          background: ${theme === 'light' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.35)'};
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: ${themeStyles.text3};
        }

        .empty-icon {
          font-size: 3.5rem;
          margin-bottom: 16px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal {
          background: ${themeStyles.modalBg};
          border: 1px solid ${themeStyles.modalBorder};
          border-radius: 24px;
          width: 100%;
          max-width: 1100px;
          max-height: 90vh;
          overflow-y: auto;
          margin: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          font-size: 1.3rem;
          font-weight: 800;
          padding: 24px 28px;
          border-bottom: 1px solid ${themeStyles.cardBorder};
          color: ${themeStyles.statValue};
          display: flex;
          align-items: center;
          gap: 10px;
          position: sticky;
          top: 0;
          background: ${themeStyles.modalBg};
          z-index: 1;
        }

        .modal-body {
          padding: 28px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .form-full {
          grid-column: 1 / -1;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 700;
          color: ${themeStyles.text2};
          font-size: 0.85rem;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid ${themeStyles.inputBorder};
          border-radius: 12px;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.25s ease;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
          font-family: 'Cairo', sans-serif;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: ${themeStyles.inputFocusBorder};
          box-shadow: 0 0 0 4px ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};
        }

        .form-input:disabled {
          background: ${theme === 'light' ? '#f1f5f9' : '#0f172a'};
          color: ${themeStyles.text3};
        }

        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .modal-footer {
          padding: 20px 28px;
          background: ${themeStyles.tableHeaderBg};
          border-top: 1px solid ${themeStyles.cardBorder};
          display: flex;
          gap: 15px;
          justify-content: flex-end;
        }

        .delete-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-modal {
          background: ${themeStyles.modalBg};
          border: 1px solid #ef4444;
          border-radius: 24px;
          padding: 32px 28px;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
        }

        .delete-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .delete-title {
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 12px;
          color: #ef4444;
        }

        .delete-message {
          margin-bottom: 24px;
          line-height: 1.6;
          color: ${themeStyles.text2};
        }

        .delete-location {
          color: #ef4444;
          font-weight: 800;
        }

        .delete-actions {
          display: flex;
          gap: 12px;
        }

        ::-webkit-scrollbar {
          width: 5px;
        }

        ::-webkit-scrollbar-track {
          background: ${theme === 'light' ? '#f1f5f9' : '#1e293b'};
        }

        ::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #4f46e5;
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

        .stat-card, .content-card {
          animation: fadeInUp 0.4s ease both;
        }

        @media (max-width: 768px) {
          .camera-root {
            padding: 20px;
          }
          .content-card {
            padding: 20px;
          }
          .title {
            font-size: 1.3rem;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {pdfLoading && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #4f6ef7, #7c3aed)', zIndex: 9999 }} />}

      <div className="camera-root">
        <div className="content-card">
          <div className="header">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
              <div>
                <div className="title">📹 بيانات الكاميرات</div>
                <div className="subtitle">إدارة • بحث • تصدير بيانات الكاميرات</div>
              </div>
            </div>
            <div className="header-actions">
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : '☀️'}
                {theme === 'light' ? 'وضع ليلي' : 'وضع نهاري'}
              </button>
              <button className="btn-primary" onClick={handleExportPDF} disabled={pdfLoading}>
                {pdfLoading ? '⏳ جاري التصدير...' : '📄 تصدير PDF'}
              </button>
              <button className="btn-primary" onClick={() => openModal()}>➕ إضافة كاميرا</button>
            </div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}
          {success && <div className="success-message">✓ {success}</div>}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-value">{uniqueLocations}</div>
              <div className="stat-label">إجمالي المواقع</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📹</div>
              <div className="stat-value">{totalCameras}</div>
              <div className="stat-label">إجمالي الكاميرات</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔢</div>
              <div className="stat-value">{cameras.length}</div>
              <div className="stat-label">إجمالي السجلات</div>
            </div>
          </div>

          <div className="search-wrapper">
            <input
              className="search-input"
              type="text"
              placeholder="ابحث بالموقع أو رقم الشريحة أو نوع الروتر أو الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔎</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الموقع</th>
                  <th>إجمالي الكاميرات</th>
                  <th>mm</th>
                  <th>4m</th>
                  <th>5m</th>
                  <th>6m</th>
                  <th>استبريزر</th>
                  <th>USB</th>
                  <th>انفرتر</th>
                  <th>نوع الروتر</th>
                  <th>نوع الشاشة</th>
                  <th>السويتش فولت</th>
                  <th>السويتش مخرج</th>
                  <th>رقم الشريحة</th>
                  <th>سيريال الشريحة</th>
                  <th>تاريخ التجديد</th>
                  <th>الملاحظات</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCameras.length > 0 ? (
                  filteredCameras.map((cam, idx) => (
                    <tr key={cam._id}>
                      <td>{idx + 1}</td>
                      <td className="location-cell">{cam.location}</td>
                      <td><span className="cameras-count">{cam.numCameras}</span></td>
                      <td>{cam.cameraType_mm || '0'}</td>
                      <td>{cam.cameraType_4m || '0'}</td>
                      <td>{cam.cameraType_5m || '0'}</td>
                      <td>{cam.cameraType_6m || '0'}</td>
                      <td>{cam.stabilizer || '—'}</td>
                      <td>{cam.usb || '—'}</td>
                      <td>{cam.inverter || '—'}</td>
                      <td>{cam.routerType ? <span className="router-badge">{cam.routerType}</span> : '—'}</td>
                      <td>{cam.screenType || '—'}</td>
                      <td>{cam.switchVoltage || '—'}</td>
                      <td>{cam.switchPorts || '—'}</td>
                      <td>{cam.simNumber || '—'}</td>
                      <td>{cam.simSerial || '—'}</td>
                      <td>{formatDateForPDF(cam.renewalDate)}</td>
                      <td>{cam.notes || '—'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => openModal(cam)} title="تعديل">✏️</button>
                          <button className="delete-btn" onClick={() => setDeleteConfirm(cam)} title="حذف">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="19">
                      <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <div>{searchTerm ? 'لا توجد نتائج تطابق البحث' : 'لا توجد بيانات حالياً'}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              {editingCamera ? '✏️ تعديل بيانات الكاميرا' : '📹 إضافة كاميرا جديدة'}
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div>
                    <label className="form-label">الموقع *</label>
                    <input className="form-input" type="text" required placeholder="مثال: مبنى A - الطابق 3"
                      value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">كاميرات نوع mm</label>
                    <input className="form-input" type="number" min="0" placeholder="عدد كاميرات mm"
                      value={formData.cameraType_mm} onChange={(e) => handleCameraTypeChange('cameraType_mm', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">كاميرات نوع 4m</label>
                    <input className="form-input" type="number" min="0" placeholder="عدد كاميرات 4m"
                      value={formData.cameraType_4m} onChange={(e) => handleCameraTypeChange('cameraType_4m', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">كاميرات نوع 5m</label>
                    <input className="form-input" type="number" min="0" placeholder="عدد كاميرات 5m"
                      value={formData.cameraType_5m} onChange={(e) => handleCameraTypeChange('cameraType_5m', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">كاميرات نوع 6m</label>
                    <input className="form-input" type="number" min="0" placeholder="عدد كاميرات 6m"
                      value={formData.cameraType_6m} onChange={(e) => handleCameraTypeChange('cameraType_6m', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">إجمالي الكاميرات</label>
                    <input className="form-input" type="number" disabled value={getCurrentTotal()} />
                  </div>
                  <div>
                    <label className="form-label">استبريزر</label>
                    <input className="form-input" type="text" placeholder="مثال: 1000VA"
                      value={formData.stabilizer} onChange={(e) => setFormData({ ...formData, stabilizer: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">USB</label>
                    <input className="form-input" type="text" placeholder="مثال: 4 منافذ"
                      value={formData.usb} onChange={(e) => setFormData({ ...formData, usb: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">انفرتر</label>
                    <input className="form-input" type="text" placeholder="مثال: 2000W"
                      value={formData.inverter} onChange={(e) => setFormData({ ...formData, inverter: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">نوع الروتر</label>
                    <input className="form-input" type="text" placeholder="مثال: Huawei B315"
                      value={formData.routerType} onChange={(e) => setFormData({ ...formData, routerType: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">نوع الشاشة</label>
                    <input className="form-input" type="text" placeholder="مثال: 32 بوصة"
                      value={formData.screenType} onChange={(e) => setFormData({ ...formData, screenType: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">السويتش كام فولت</label>
                    <input className="form-input" type="text" placeholder="مثال: 12V"
                      value={formData.switchVoltage} onChange={(e) => setFormData({ ...formData, switchVoltage: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">السويتش كام مخرج</label>
                    <select className="form-select" value={formData.switchPorts} onChange={(e) => setFormData({ ...formData, switchPorts: e.target.value })}>
                      <option value="">-- اختر --</option>
                      {switchPortsOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">رقم الشريحة *</label>
                    <input className="form-input" type="text" required placeholder="مثال: 010XXXXXXXX"
                      value={formData.simNumber} onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">سيريال الشريحة</label>
                    <input className="form-input" type="text" placeholder="مثال: 8920..."
                      value={formData.simSerial} onChange={(e) => setFormData({ ...formData, simSerial: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">تاريخ تجديد الباقة</label>
                    <input className="form-input" type="date" value={formData.renewalDate}
                      onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })} />
                  </div>
                  <div className="form-full">
                    <label className="form-label">الملاحظات</label>
                    <textarea className="form-textarea" placeholder="أي ملاحظات إضافية..."
                      value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn-primary">{editingCamera ? '💾 حفظ التعديلات' : '➕ إضافة الكاميرا'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="delete-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
          <div className="delete-modal">
            <div className="delete-icon">🗑️</div>
            <div className="delete-title">تأكيد الحذف</div>
            <div className="delete-message">
              هل أنت متأكد من حذف بيانات كاميرا
              <span className="delete-location"> {deleteConfirm.location}</span>؟
            </div>
            <div className="delete-actions">
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>إلغاء</button>
              <button className="btn-primary" style={{ flex: 1, background: '#ef4444' }} onClick={() => handleDelete(deleteConfirm._id)}>تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}