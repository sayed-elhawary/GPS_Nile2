// src/pages/CompanyEquipment.js

import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import axios from 'axios';

import jsPDF from 'jspdf';

import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const vehicleTypes = [

  'خلاط خرسانة',

  'ونش',

  'لودر',

  'حفار',

  'أوناش',

  'نصف نقل',

  'كلارك',

  'تريلا',

  'مقطورة',

  'ميني باص',

  'غير ذلك'

];

const permitOptions = ['رخصه', 'تصريح', 'لا يوجد', ''];

const CompanyEquipment = () => {

  const navigate = useNavigate();

  const [theme, setTheme] = useState('dark');

  

  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);

  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const [selectedFile, setSelectedFile] = useState(null);

  const [tabValue, setTabValue] = useState(0);

  const [exportingPdf, setExportingPdf] = useState(false);

  

  const [formData, setFormData] = useState({

    vehicleType: 'خلاط خرسانة',

    carCode: '',

    carNumber: '',

    engineNumber: '',

    chassisNumber: '',

    licenseExpiryDate: '',

    purchaseDate: '',

    taxExpiryDate: '',

    insuranceExpiryDate: '',

    insuranceCompany: '',

    permitLicense: '',

    notes: ''

  });

  const token = localStorage.getItem('token');

  // تحميل الثيم

  useEffect(() => {

    const savedTheme = localStorage.getItem('companyEquipmentTheme');

    if (savedTheme === 'light' || savedTheme === 'dark') {

      setTheme(savedTheme);

    }

  }, []);

  const toggleTheme = () => {

    const newTheme = theme === 'light' ? 'dark' : 'light';

    setTheme(newTheme);

    localStorage.setItem('companyEquipmentTheme', newTheme);

  };

  const fetchEquipment = async () => {

    setLoading(true);

    try {

      const response = await axios.get(`${API_URL}/api/company-equipment`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      setEquipment(response.data.data);

    } catch (error) {

      showAlert('error', 'خطأ في جلب البيانات');

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchEquipment();

  }, []);

  const showAlert = (type, message) => {

    setAlert({ show: true, type, message });

    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);

  };

  const handleOpenDialog = (item = null) => {

    if (item) {

      setEditingItem(item);

      setFormData({

        vehicleType: item.vehicleType,

        carCode: item.carCode,

        carNumber: item.carNumber || '',

        engineNumber: item.engineNumber || '',

        chassisNumber: item.chassisNumber || '',

        licenseExpiryDate: item.licenseExpiryDate ? item.licenseExpiryDate.split('T')[0] : '',

        purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',

        taxExpiryDate: item.taxExpiryDate ? item.taxExpiryDate.split('T')[0] : '',

        insuranceExpiryDate: item.insuranceExpiryDate ? item.insuranceExpiryDate.split('T')[0] : '',

        insuranceCompany: item.insuranceCompany || '',

        permitLicense: item.permitLicense || '',

        notes: item.notes || ''

      });

    } else {

      setEditingItem(null);

      setFormData({

        vehicleType: 'خلاط خرسانة',

        carCode: '',

        carNumber: '',

        engineNumber: '',

        chassisNumber: '',

        licenseExpiryDate: '',

        purchaseDate: '',

        taxExpiryDate: '',

        insuranceExpiryDate: '',

        insuranceCompany: '',

        permitLicense: '',

        notes: ''

      });

    }

    setOpenDialog(true);

  };

  const handleSave = async () => {

    try {

      if (editingItem) {

        await axios.put(`${API_URL}/api/company-equipment/${editingItem._id}`, formData, {

          headers: { Authorization: `Bearer ${token}` }

        });

        showAlert('success', 'تم التعديل بنجاح');

      } else {

        await axios.post(`${API_URL}/api/company-equipment`, formData, {

          headers: { Authorization: `Bearer ${token}` }

        });

        showAlert('success', 'تم الإضافة بنجاح');

      }

      setOpenDialog(false);

      fetchEquipment();

    } catch (error) {

      showAlert('error', error.response?.data?.message || 'حدث خطأ');

    }

  };

  const handleDelete = async (id) => {

    if (window.confirm('هل أنت متأكد من حذف هذه المعدة؟')) {

      try {

        await axios.delete(`${API_URL}/api/company-equipment/${id}`, {

          headers: { Authorization: `Bearer ${token}` }

        });

        showAlert('success', 'تم الحذف بنجاح');

        fetchEquipment();

      } catch (error) {

        showAlert('error', 'خطأ في الحذف');

      }

    }

  };

  const handleDeleteAll = async () => {

    if (window.confirm('⚠️ تحذير: سيتم حذف جميع المعدات! هل أنت متأكد؟')) {

      try {

        await axios.delete(`${API_URL}/api/company-equipment/delete-all`, {

          headers: { Authorization: `Bearer ${token}` }

        });

        showAlert('success', 'تم حذف جميع المعدات');

        fetchEquipment();

      } catch (error) {

        showAlert('error', error.response?.data?.message || 'خطأ في حذف البيانات');

      }

    }

  };

  const handleUpload = async () => {

    if (!selectedFile) {

      showAlert('warning', 'الرجاء اختيار ملف');

      return;

    }

    const formDataUpload = new FormData();

    formDataUpload.append('file', selectedFile);

    try {

      const response = await axios.post(`${API_URL}/api/company-equipment/upload-excel`, formDataUpload, {

        headers: {

          Authorization: `Bearer ${token}`,

          'Content-Type': 'multipart/form-data'

        }

      });

      showAlert('success', response.data.message);

      setOpenUploadDialog(false);

      setSelectedFile(null);

      fetchEquipment();

    } catch (error) {

      showAlert('error', error.response?.data?.message || 'خطأ في رفع الملف');

    }

  };

  const isExpiring = (date) => {

    if (!date) return false;

    const today = new Date();

    const expiryDate = new Date(date);

    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    return diffDays <= 30 && diffDays > 0;

  };

  const isExpired = (date) => {

    if (!date) return false;

    return new Date(date) < new Date();

  };

  const getStatusColor = (date) => {

    if (!date) return '#94a3b8';

    if (isExpired(date)) return '#ef4444';

    if (isExpiring(date)) return '#f59e0b';

    return '#10b981';

  };

  const getFilteredEquipment = () => {

    let filtered = [...equipment];

    

    if (searchTerm) {

      filtered = filtered.filter(item =>

        item.carCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||

        item.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||

        item.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||

        item.engineNumber?.toLowerCase().includes(searchTerm.toLowerCase())

      );

    }

    if (tabValue === 1) {

      filtered = filtered.filter(item => 

        isExpired(item.licenseExpiryDate) || 

        isExpired(item.insuranceExpiryDate) ||

        isExpired(item.taxExpiryDate)

      );

    } else if (tabValue === 2) {

      filtered = filtered.filter(item =>

        isExpiring(item.licenseExpiryDate) ||

        isExpiring(item.insuranceExpiryDate) ||

        isExpiring(item.taxExpiryDate)

      );

    }

    return filtered;

  };

  const filteredEquipment = getFilteredEquipment();

  const paginatedEquipment = filteredEquipment.slice(

    page * rowsPerPage,

    page * rowsPerPage + rowsPerPage

  );

  // ============================================================
  // دالة تصدير PDF - مُصلحة: هيدر الجدول يظهر في أعلى كل صفحة
  // الحل: نلتقط الهيدر والـ body منفصلين ونركّبهم في كل صفحة
  // ============================================================

  const exportToPDF = async () => {

    if (filteredEquipment.length === 0) {

      showAlert('warning', 'لا توجد بيانات لتصديرها');

      return;

    }

    setExportingPdf(true);

    try {

      const currentDate = new Date().toLocaleDateString('ar-EG');

      const SCALE = 2.5;

      // ─── 1. بناء الـ container الكامل ───────────────────────────────

      const container = document.createElement('div');

      container.style.cssText = `

        position: fixed;

        top: -99999px;

        left: -99999px;

        width: 1300px;

        background: #ffffff;

        padding: 40px;

        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;

        direction: rtl;

        z-index: -9999;

        color: #000000;

      `;

      // الهيدر العلوي للصفحة الأولى فقط

      const pageHeaderDiv = document.createElement('div');

      pageHeaderDiv.style.cssText = `

        background: #1e3a8a;

        margin: -40px -40px 30px -40px;

        padding: 35px 40px;

        text-align: center;

        border-bottom: 6px solid #f59e0b;

      `;

      pageHeaderDiv.innerHTML = `

        <div style="color: #ffffff; font-size: 34px; font-weight: 900; line-height: 1.3;">معدات الشركة</div>

        <div style="color: #bfdbfe; margin-top: 10px; font-size: 16px; font-weight: 700;">شركة النيل للخرسانة الجاهزة - NileMix</div>

        <div style="color: #93c5fd; font-size: 13px; margin-top: 6px;">تاريخ التقرير: ${currentDate}</div>

      `;

      container.appendChild(pageHeaderDiv);

      // ─── 2. صف هيدر الجدول (thead) - سنلتقطه منفرداً ───────────────

      const theadTable = document.createElement('table');

      theadTable.style.cssText = `

        width: 100%;

        border-collapse: collapse;

        font-size: 11px;

        border: 2px solid #1e3a8a;

        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;

      `;

      const theadEl = document.createElement('thead');

      const headerRow = document.createElement('tr');

      headerRow.style.background = '#1e3a8a';

      const headers = [

        '#', 'نوع السيارة', 'كود السيارة', 'رقم السيارة', 'رقم الموتور', 'رقم الشاسيه',

        'انتهاء الترخيص', 'تاريخ الشراء', 'انتهاء الضريبة', 'انتهاء التأمين', 'جهة التأمين', 'رخصة/تصريح'

      ];

      headers.forEach(text => {

        const th = document.createElement('th');

        th.textContent = text;

        th.style.cssText = `

          padding: 14px 8px;

          border: 1px solid #2d4fa0;

          color: #ffffff;

          font-weight: 900;

          font-size: 12px;

          text-align: center;

        `;

        headerRow.appendChild(th);

      });

      theadEl.appendChild(headerRow);

      theadTable.appendChild(theadEl);

      container.appendChild(theadTable);

      // ─── 3. tbody - جسم البيانات ─────────────────────────────────────

      const bodyTable = document.createElement('table');

      bodyTable.style.cssText = `

        width: 100%;

        border-collapse: collapse;

        font-size: 11px;

        border: 2px solid #1e3a8a;

        border-top: none;

        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;

      `;

      const tbodyEl = document.createElement('tbody');

      filteredEquipment.forEach((item, index) => {

        const row = document.createElement('tr');

        row.style.background = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        const licenseColor = item.licenseExpiryDate ? (isExpired(item.licenseExpiryDate) ? '#dc2626' : isExpiring(item.licenseExpiryDate) ? '#b45309' : '#065f46') : '#111111';

        const taxColor = item.taxExpiryDate ? (isExpired(item.taxExpiryDate) ? '#dc2626' : isExpiring(item.taxExpiryDate) ? '#b45309' : '#065f46') : '#111111';

        const insuranceColor = item.insuranceExpiryDate ? (isExpired(item.insuranceExpiryDate) ? '#dc2626' : isExpiring(item.insuranceExpiryDate) ? '#b45309' : '#065f46') : '#111111';

        const rowData = [

          (index + 1).toString(),

          item.vehicleType || '-',

          item.carCode || '-',

          item.carNumber || '-',

          item.engineNumber || '-',

          item.chassisNumber || '-',

          item.licenseExpiryDate ? new Date(item.licenseExpiryDate).toLocaleDateString('ar-EG') : '-',

          item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('ar-EG') : '-',

          item.taxExpiryDate ? new Date(item.taxExpiryDate).toLocaleDateString('ar-EG') : '-',

          item.insuranceExpiryDate ? new Date(item.insuranceExpiryDate).toLocaleDateString('ar-EG') : '-',

          item.insuranceCompany || '-',

          item.permitLicense || '-'

        ];

        rowData.forEach((data, colIndex) => {

          const td = document.createElement('td');

          td.textContent = data;

          let color = '#111111';

          if (colIndex === 6) color = licenseColor;

          if (colIndex === 8) color = taxColor;

          if (colIndex === 9) color = insuranceColor;

          td.style.cssText = `

            padding: 10px;

            text-align: center;

            border: 1px solid #cbd5e1;

            color: ${color};

            font-weight: ${(colIndex === 6 || colIndex === 8 || colIndex === 9) ? '700' : '600'};

          `;

          row.appendChild(td);

        });

        tbodyEl.appendChild(row);

      });

      bodyTable.appendChild(tbodyEl);

      container.appendChild(bodyTable);

      // التذييل

      const footerDiv = document.createElement('div');

      footerDiv.style.cssText = `

        margin-top: 30px;

        padding-top: 15px;

        border-top: 2px solid #1e3a8a;

        text-align: center;

        color: #334155;

        font-size: 11px;

        font-weight: 600;

      `;

      footerDiv.innerHTML = `

        <p>نظام إدارة معدات الشركة - شركة النيل للخرسانة الجاهزة</p>

        <p style="margin-top: 4px; color: #64748b;">تم الإنشاء بواسطة NileMix Management System</p>

      `;

      container.appendChild(footerDiv);

      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 500));

      // ─── 4. التقاط canvas للهيدر العلوي للصفحة (العنوان الأزرق) ──────

      const pageHeaderCanvas = await html2canvas(pageHeaderDiv, {

        scale: SCALE,

        useCORS: true,

        backgroundColor: '#1e3a8a',

        logging: false,

      });

      // ─── 5. التقاط canvas لصف عناوين الجدول (thead) ─────────────────

      const theadCanvas = await html2canvas(theadTable, {

        scale: SCALE,

        useCORS: true,

        backgroundColor: '#1e3a8a',

        logging: false,

      });

      // ─── 6. التقاط canvas لجسم البيانات كاملاً ───────────────────────

      const bodyCanvas = await html2canvas(bodyTable, {

        scale: SCALE,

        useCORS: true,

        backgroundColor: '#ffffff',

        logging: false,

        windowWidth: container.scrollWidth,

        windowHeight: bodyTable.scrollHeight

      });

      // ─── 7. التقاط canvas للتذييل ─────────────────────────────────────

      const footerCanvas = await html2canvas(footerDiv, {

        scale: SCALE,

        useCORS: true,

        backgroundColor: '#ffffff',

        logging: false,

      });

      if (document.body.contains(container)) {

        document.body.removeChild(container);

      }

      // ─── 8. إنشاء PDF وتقسيم البيانات مع هيدر في أول كل صفحة ────────

      const pdf = new jsPDF({

        orientation: 'landscape',

        unit: 'mm',

        format: 'a4',

      });

      const pdfWidth  = pdf.internal.pageSize.getWidth();   // 297mm

      const pdfHeight = pdf.internal.pageSize.getHeight();  // 210mm

      const MARGIN    = 10; // mm هامش من الأعلى والأسفل

      const availableHeight = pdfHeight - MARGIN * 2; // المساحة المتاحة لكل صفحة

      // حساب أبعاد كل عنصر بالـ mm بناءً على عرض الـ canvas

      const pxPerMm = pageHeaderCanvas.width / pdfWidth;

      const pageHeaderHeightMm = pageHeaderCanvas.height / pxPerMm;

      const theadHeightMm      = theadCanvas.height / pxPerMm;

      const footerHeightMm     = footerCanvas.height / pxPerMm;

      // ارتفاع صف الهيدر (thead) الذي سيُضاف في كل صفحة جديدة بالـ px

      const theadHeightPx = theadCanvas.height;

      // ارتفاع صفحة PDF بالـ pixel للـ body canvas

      // في الصفحة الأولى: نطرح هيدر الصفحة + thead + footer
      // في الصفحات التالية: نطرح thead فقط + footer

      let yOffset    = 0; // موضعنا الحالي في bodyCanvas بالـ px

      let pageNum    = 0;

      let isFirstPage = true;

      while (yOffset < bodyCanvas.height) {

        if (pageNum > 0) pdf.addPage();

        let currentY = MARGIN; // موضع الرسم الحالي في الصفحة بالـ mm

        // الصفحة الأولى: ارسم هيدر الصفحة (العنوان الأزرق)

        if (isFirstPage) {

          pdf.addImage(

            pageHeaderCanvas.toDataURL('image/png'),

            'PNG',

            0, currentY,

            pdfWidth, pageHeaderHeightMm,

            undefined, 'FAST'

          );

          currentY += pageHeaderHeightMm;

        }

        // كل الصفحات: ارسم thead (هيدر الجدول) في الأعلى

        pdf.addImage(

          theadCanvas.toDataURL('image/png'),

          'PNG',

          0, currentY,

          pdfWidth, theadHeightMm,

          undefined, 'FAST'

        );

        currentY += theadHeightMm;

        // حساب المساحة المتبقية لبيانات الـ body في هذه الصفحة

        const isLastPage  = false; // سنتحقق لاحقاً

        const reservedForFooter = 0; // سنضيف الـ footer في صفحة منفصلة إذا احتجنا

        const bodyAreaMm = availableHeight - currentY + MARGIN; // المساحة المتبقية

        const bodyAreaPx = Math.floor(bodyAreaMm * pxPerMm);

        const sliceHeight = Math.min(bodyAreaPx, bodyCanvas.height - yOffset);

        // رسم شريحة الـ body

        const sliceCanvas = document.createElement('canvas');

        sliceCanvas.width  = bodyCanvas.width;

        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext('2d');

        ctx.drawImage(

          bodyCanvas,

          0, yOffset,

          bodyCanvas.width, sliceHeight,

          0, 0,

          bodyCanvas.width, sliceHeight

        );

        const sliceHeightMm = sliceHeight / pxPerMm;

        pdf.addImage(

          sliceCanvas.toDataURL('image/png'),

          'PNG',

          0, currentY,

          pdfWidth, sliceHeightMm,

          undefined, 'FAST'

        );

        currentY += sliceHeightMm;

        yOffset += sliceHeight;

        // إذا انتهت البيانات، أضف التذييل في نفس الصفحة إن كان في مكان

        if (yOffset >= bodyCanvas.height) {

          const remainingMm = availableHeight - currentY + MARGIN;

          if (remainingMm >= footerHeightMm) {

            pdf.addImage(

              footerCanvas.toDataURL('image/png'),

              'PNG',

              0, currentY,

              pdfWidth, footerHeightMm,

              undefined, 'FAST'

            );

          } else {

            // أضف صفحة جديدة للتذييل

            pdf.addPage();

            pdf.addImage(

              footerCanvas.toDataURL('image/png'),

              'PNG',

              0, MARGIN,

              pdfWidth, footerHeightMm,

              undefined, 'FAST'

            );

            pageNum++;

          }

        }

        isFirstPage = false;

        pageNum++;

      }

      pdf.save(`معدات_الشركة_${new Date().toISOString().split('T')[0]}.pdf`);

      showAlert('success', `✅ تم تصدير PDF بنجاح (${pageNum} صفحة)`);

    } catch (err) {

      console.error('PDF export error:', err);

      showAlert('error', '❌ حدث خطأ أثناء تصدير PDF');

    } finally {

      setExportingPdf(false);

    }

  };

  const getStats = () => ({

    total: equipment.length,

    expired: equipment.filter(item => isExpired(item.licenseExpiryDate) || isExpired(item.insuranceExpiryDate) || isExpired(item.taxExpiryDate)).length,

    expiring: equipment.filter(item => isExpiring(item.licenseExpiryDate) || isExpiring(item.insuranceExpiryDate) || isExpiring(item.taxExpiryDate)).length,

    valid: equipment.filter(item => 

      !isExpired(item.licenseExpiryDate) && 

      !isExpired(item.insuranceExpiryDate) &&

      !isExpired(item.taxExpiryDate)

    ).length

  });

  const stats = getStats();

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

    headerBg: '#1e40af'

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

    headerBg: '#0f172a'

  };

  const goBack = () => {

    navigate(-1);

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

        .equipment-root {

          min-height: 100vh;

          background: ${themeStyles.bg};

          font-family: 'Cairo', sans-serif;

          direction: rtl;

          transition: background 0.3s ease;

        }

        .equipment-header {

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

          font-size: 1.5rem;

          font-weight: 800;

          margin: 0;

        }

        .header-title p {

          font-size: 0.8rem;

          opacity: 0.85;

          margin-top: 3px;

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

        .equipment-container {

          max-width: 1400px;

          margin: 0 auto;

          padding: 30px;

        }

        .stats-grid {

          display: grid;

          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

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

          transform: translateY(-4px);

          box-shadow: 0 15px 30px -12px ${themeStyles.shadow};

        }

        .stat-card.total { border-right: 4px solid #64748b; }

        .stat-card.expiring { border-right: 4px solid #f59e0b; }

        .stat-card.expired { border-right: 4px solid #ef4444; }

        .stat-card.valid { border-right: 4px solid #10b981; }

        .stat-icon {

          width: 50px;

          height: 50px;

          border-radius: 15px;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 1.6rem;

          margin-bottom: 15px;

        }

        .stat-card.total .stat-icon { background: rgba(100, 116, 139, 0.1); color: #64748b; }

        .stat-card.expiring .stat-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .stat-card.expired .stat-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .stat-card.valid .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }

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

        .action-buttons {

          display: flex;

          gap: 10px;

          flex-wrap: wrap;

        }

        .btn-primary {

          background: ${themeStyles.primaryBtn};

          color: white;

          border: none;

          padding: 10px 20px;

          border-radius: 12px;

          font-weight: 700;

          cursor: pointer;

          display: flex;

          align-items: center;

          gap: 8px;

          transition: all 0.25s ease;

          font-family: 'Cairo', sans-serif;

        }

        .btn-primary:hover {

          background: ${themeStyles.primaryBtnHover};

          transform: translateY(-2px);

        }

        .btn-secondary {

          background: ${themeStyles.secondaryBtn};

          color: white;

          border: none;

          padding: 10px 20px;

          border-radius: 12px;

          font-weight: 700;

          cursor: pointer;

          display: flex;

          align-items: center;

          gap: 8px;

          transition: all 0.25s ease;

          font-family: 'Cairo', sans-serif;

        }

        .btn-secondary:hover {

          background: ${themeStyles.secondaryBtnHover};

          transform: translateY(-2px);

        }

        .btn-danger {

          background: #dc2626;

          color: white;

          border: none;

          padding: 10px 20px;

          border-radius: 12px;

          font-weight: 700;

          cursor: pointer;

          display: flex;

          align-items: center;

          gap: 8px;

          transition: all 0.25s ease;

        }

        .btn-danger:hover {

          background: #b91c1c;

          transform: translateY(-2px);

        }

        .search-card {

          background: ${themeStyles.cardBg};

          border: 1px solid ${themeStyles.cardBorder};

          border-radius: 20px;

          padding: 25px;

          margin-bottom: 30px;

        }

        .search-input {

          width: 100%;

          padding: 14px 20px;

          border: 1.5px solid ${themeStyles.inputBorder};

          border-radius: 14px;

          background: ${themeStyles.inputBg};

          color: ${themeStyles.text};

          font-family: 'Cairo', sans-serif;

          font-size: 0.9rem;

          transition: all 0.25s ease;

        }

        .search-input:focus {

          outline: none;

          border-color: ${themeStyles.inputFocusBorder};

          box-shadow: 0 0 0 3px ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};

        }

        .tabs-container {

          background: ${themeStyles.cardBg};

          border: 1px solid ${themeStyles.cardBorder};

          border-radius: 20px;

          overflow: hidden;

        }

        .tabs-header {

          display: flex;

          border-bottom: 1px solid ${themeStyles.cardBorder};

          background: ${themeStyles.inputBg};

          padding: 0 20px;

        }

        .tab-btn {

          padding: 15px 25px;

          background: none;

          border: none;

          font-family: 'Cairo', sans-serif;

          font-weight: 700;

          font-size: 0.9rem;

          cursor: pointer;

          color: ${themeStyles.text3};

          transition: all 0.2s ease;

          display: flex;

          align-items: center;

          gap: 8px;

        }

        .tab-btn.active {

          color: ${themeStyles.statValue};

          border-bottom: 3px solid ${themeStyles.statValue};

        }

        .table-wrapper {

          overflow-x: auto;

          background: ${themeStyles.cardBg};

        }

        table {

          width: 100%;

          border-collapse: collapse;

          min-width: 1200px;

        }

        th {

          background: ${themeStyles.tableHeaderBg};

          color: ${themeStyles.tableHeaderText};

          padding: 14px 10px;

          text-align: center;

          font-weight: 800;

          font-size: 0.8rem;

          border: 1px solid ${themeStyles.tableBorder};

          position: sticky;

          top: 0;

        }

        td {

          padding: 12px 8px;

          text-align: center;

          border: 1px solid ${themeStyles.tableBorder};

          font-size: 0.8rem;

          color: ${themeStyles.text2};

        }

        tr:hover td {

          background: ${themeStyles.tableRowHover};

        }

        .status-badge {

          display: inline-block;

          padding: 4px 12px;

          border-radius: 20px;

          font-size: 0.7rem;

          font-weight: 700;

        }

        .action-icon {

          background: none;

          border: none;

          font-size: 1.1rem;

          cursor: pointer;

          padding: 5px 8px;

          border-radius: 8px;

          transition: all 0.2s ease;

        }

        .edit-icon { color: #f59e0b; }

        .edit-icon:hover { background: rgba(245, 158, 11, 0.1); transform: scale(1.1); }

        .delete-icon { color: #ef4444; }

        .delete-icon:hover { background: rgba(239, 68, 68, 0.1); transform: scale(1.1); }

        .pagination {

          display: flex;

          justify-content: space-between;

          align-items: center;

          padding: 15px 20px;

          border-top: 1px solid ${themeStyles.cardBorder};

          background: ${themeStyles.cardBg};

        }

        .pagination select, .pagination button {

          padding: 8px 12px;

          border-radius: 8px;

          border: 1px solid ${themeStyles.inputBorder};

          background: ${themeStyles.inputBg};

          color: ${themeStyles.text};

          font-family: 'Cairo', sans-serif;

          cursor: pointer;

        }

        .alert-success {

          background: ${themeStyles.successBg};

          color: ${themeStyles.successText};

          padding: 12px 20px;

          border-radius: 12px;

          margin-bottom: 20px;

          text-align: center;

          font-weight: 600;

        }

        .alert-error {

          background: ${themeStyles.errorBg};

          color: ${themeStyles.errorText};

          padding: 12px 20px;

          border-radius: 12px;

          margin-bottom: 20px;

          text-align: center;

          font-weight: 600;

        }

        .alert-warning {

          background: rgba(245, 158, 11, 0.15);

          color: #f59e0b;

          padding: 12px 20px;

          border-radius: 12px;

          margin-bottom: 20px;

          text-align: center;

          font-weight: 600;

        }

        .modal-overlay {

          position: fixed;

          inset: 0;

          background: rgba(0, 0, 0, 0.7);

          backdrop-filter: blur(8px);

          display: flex;

          align-items: center;

          justify-content: center;

          z-index: 1000;

        }

        .modal-content {

          background: ${themeStyles.modalBg};

          border: 1px solid ${themeStyles.modalBorder};

          border-radius: 24px;

          width: 95%;

          max-width: 700px;

          max-height: 90vh;

          overflow-y: auto;

          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);

        }

        .modal-header {

          padding: 20px 25px;

          background: ${themeStyles.tableHeaderBg};

          color: ${themeStyles.tableHeaderText};

          font-weight: 800;

          font-size: 1.2rem;

          position: sticky;

          top: 0;

        }

        .modal-body {

          padding: 25px;

        }

        .modal-footer {

          padding: 20px 25px;

          background: ${themeStyles.inputBg};

          border-top: 1px solid ${themeStyles.cardBorder};

          display: flex;

          gap: 15px;

          justify-content: flex-end;

        }

        .form-grid {

          display: grid;

          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

          gap: 20px;

        }

        .form-group {

          display: flex;

          flex-direction: column;

        }

        .form-group label {

          font-size: 0.8rem;

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

        .upload-area {

          border: 2px dashed ${themeStyles.inputBorder};

          border-radius: 16px;

          padding: 30px;

          text-align: center;

          background: ${themeStyles.inputBg};

          cursor: pointer;

          margin-bottom: 20px;

        }

        .upload-area:hover {

          border-color: ${themeStyles.inputFocusBorder};

          background: ${theme === 'light' ? '#f8fafc' : 'rgba(99, 102, 241, 0.05)'};

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

      `}</style>

      <div className="equipment-root">

        {/* الهيدر */}

        <div className="equipment-header">

          <div className="header-container">

            <button onClick={goBack} className="back-button">

              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">

                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />

              </svg>

              <span>رجوع</span>

            </button>

            <div className="header-title">

              <h1>🚛 معدات الشركة</h1>

              <p>إدارة أسطول المعدات والمركبات</p>

            </div>

            <div className="theme-toggle" onClick={toggleTheme}>

              <span>{theme === 'light' ? '🌙' : '☀️'}</span>

              <span>{theme === 'light' ? 'وضع ليلي' : 'وضع نهاري'}</span>

            </div>

          </div>

        </div>

        <div className="equipment-container">

          {/* رسائل التنبيه */}

          {alert.show && (

            <div className={`alert-${alert.type}`}>

              {alert.type === 'success' ? '✅' : alert.type === 'error' ? '❌' : '⚠️'} {alert.message}

            </div>

          )}

          {/* بطاقات الإحصائيات */}

          <div className="stats-grid">

            <div className="stat-card total">

              <div className="stat-icon">🚛</div>

              <div className="stat-label">إجمالي المعدات</div>

              <div className="stat-value">{stats.total}</div>

            </div>

            <div className="stat-card expiring">

              <div className="stat-icon">⏰</div>

              <div className="stat-label">وشيكة الانتهاء</div>

              <div className="stat-value">{stats.expiring}</div>

            </div>

            <div className="stat-card expired">

              <div className="stat-icon">⚠️</div>

              <div className="stat-label">منتهية الصلاحية</div>

              <div className="stat-value">{stats.expired}</div>

            </div>

            <div className="stat-card valid">

              <div className="stat-icon">✅</div>

              <div className="stat-label">سارية</div>

              <div className="stat-value">{stats.valid}</div>

            </div>

          </div>

          {/* أزرار الإجراءات */}

          <div className="search-card">

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>

              <button className="btn-primary" onClick={() => handleOpenDialog()}>➕ إضافة معدة</button>

              <button className="btn-secondary" onClick={() => setOpenUploadDialog(true)}>📂 رفع Excel</button>

              <button className="btn-secondary" onClick={fetchEquipment}>🔄 تحديث</button>

              <button className="btn-primary" onClick={exportToPDF} disabled={exportingPdf || filteredEquipment.length === 0}>

                {exportingPdf ? '⏳ جاري...' : '📄 تصدير PDF'}

              </button>

              {equipment.length > 0 && (

                <button className="btn-danger" onClick={handleDeleteAll}>🗑️ حذف الكل</button>

              )}

            </div>

            {/* بحث */}

            <input

              type="text"

              className="search-input"

              placeholder="🔍 بحث بكود السيارة، رقم السيارة، نوع المعدة، رقم الموتور..."

              value={searchTerm}

              onChange={(e) => setSearchTerm(e.target.value)}

            />

          </div>

          {/* تبويبات وجدول */}

          <div className="tabs-container">

            <div className="tabs-header">

              <button className={`tab-btn ${tabValue === 0 ? 'active' : ''}`} onClick={() => setTabValue(0)}>

                🚛 الكل ({filteredEquipment.length})

              </button>

              <button className={`tab-btn ${tabValue === 1 ? 'active' : ''}`} onClick={() => setTabValue(1)}>

                ❌ منتهية ({stats.expired})

              </button>

              <button className={`tab-btn ${tabValue === 2 ? 'active' : ''}`} onClick={() => setTabValue(2)}>

                ⏰ وشيكة ({stats.expiring})

              </button>

            </div>

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>#</th>

                    <th>نوع السيارة</th>

                    <th>كود السيارة</th>

                    <th>رقم السيارة</th>

                    <th>رقم الموتور</th>

                    <th>رقم الشاسيه</th>

                    <th>انتهاء الترخيص</th>

                    <th>تاريخ الشراء</th>

                    <th>انتهاء الضريبة</th>

                    <th>انتهاء التأمين</th>

                    <th>جهة التأمين</th>

                    <th>رخصة/تصريح</th>

                    <th>إجراءات</th>

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>

                      <td colSpan="13">

                        <div className="empty-state">

                          <div className="empty-icon">⏳</div>

                          <div>جاري التحميل...</div>

                        </div>

                      </td>

                    </tr>

                  ) : paginatedEquipment.length === 0 ? (

                    <tr>

                      <td colSpan="13">

                        <div className="empty-state">

                          <div className="empty-icon">📭</div>

                          <div>لا توجد بيانات</div>

                        </div>

                      </td>

                    </tr>

                  ) : (

                    paginatedEquipment.map((item, index) => (

                      <tr key={item._id}>

                        <td>{page * rowsPerPage + index + 1}</td>

                        <td>{item.vehicleType || '-'}</td>

                        <td><strong>{item.carCode || '-'}</strong></td>

                        <td>{item.carNumber || '-'}</td>

                        <td>{item.engineNumber || '-'}</td>

                        <td>{item.chassisNumber || '-'}</td>

                        <td>

                          {item.licenseExpiryDate && (

                            <span className="status-badge" style={{ background: getStatusColor(item.licenseExpiryDate) + '20', color: getStatusColor(item.licenseExpiryDate) }}>

                              {new Date(item.licenseExpiryDate).toLocaleDateString('ar-EG')}

                            </span>

                          )}

                        </td>

                        <td>{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('ar-EG') : '-'}</td>

                        <td>

                          {item.taxExpiryDate && (

                            <span className="status-badge" style={{ background: getStatusColor(item.taxExpiryDate) + '20', color: getStatusColor(item.taxExpiryDate) }}>

                              {new Date(item.taxExpiryDate).toLocaleDateString('ar-EG')}

                            </span>

                          )}

                        </td>

                        <td>

                          {item.insuranceExpiryDate && (

                            <span className="status-badge" style={{ background: getStatusColor(item.insuranceExpiryDate) + '20', color: getStatusColor(item.insuranceExpiryDate) }}>

                              {new Date(item.insuranceExpiryDate).toLocaleDateString('ar-EG')}

                            </span>

                          )}

                        </td>

                        <td>{item.insuranceCompany || '-'}</td>

                        <td>

                          {item.permitLicense && (

                            <span className="status-badge" style={{ background: item.permitLicense === 'رخصه' ? '#10b98120' : '#f59e0b20', color: item.permitLicense === 'رخصه' ? '#10b981' : '#f59e0b' }}>

                              {item.permitLicense}

                            </span>

                          )}

                        </td>

                        <td>

                          <button className="action-icon edit-icon" onClick={() => handleOpenDialog(item)} title="تعديل">✏️</button>

                          <button className="action-icon delete-icon" onClick={() => handleDelete(item._id)} title="حذف">🗑️</button>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

            {/* ترقيم الصفحات */}

            <div className="pagination">

              <div>

                <span>عرض </span>

                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}>

                  <option value={5}>5</option>

                  <option value={10}>10</option>

                  <option value={25}>25</option>

                  <option value={50}>50</option>

                  <option value={100}>100</option>

                </select>

                <span> صفوف</span>

              </div>

              <div>

                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>السابق</button>

                <span style={{ margin: '0 15px' }}>صفحة {page + 1} من {Math.ceil(filteredEquipment.length / rowsPerPage)}</span>

                <button onClick={() => setPage(Math.min(Math.ceil(filteredEquipment.length / rowsPerPage) - 1, page + 1))} disabled={page >= Math.ceil(filteredEquipment.length / rowsPerPage) - 1}>التالي</button>

              </div>

            </div>

          </div>

        </div>

        {/* مودال إضافة/تعديل */}

        {openDialog && (

          <div className="modal-overlay" onClick={() => setOpenDialog(false)}>

            <div className="modal-content" onClick={e => e.stopPropagation()}>

              <div className="modal-header">

                {editingItem ? '✏️ تعديل معدة' : '➕ إضافة معدة جديدة'}

              </div>

              <div className="modal-body">

                <div className="form-grid">

                  <div className="form-group">

                    <label>نوع السيارة *</label>

                    <select value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}>

                      {vehicleTypes.map(type => <option key={type} value={type}>{type}</option>)}

                    </select>

                  </div>

                  <div className="form-group">

                    <label>كود السيارة *</label>

                    <input type="text" value={formData.carCode} onChange={(e) => setFormData({ ...formData, carCode: e.target.value })} required />

                  </div>

                  <div className="form-group">

                    <label>رقم السيارة</label>

                    <input type="text" value={formData.carNumber} onChange={(e) => setFormData({ ...formData, carNumber: e.target.value })} />

                  </div>

                  <div className="form-group">

                    <label>رقم الموتور</label>

                    <input type="text" value={formData.engineNumber} onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })} />

                  </div>

                  <div className="form-group">

                    <label>رقم الشاسيه</label>

                    <input type="text" value={formData.chassisNumber} onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })} />

                  </div>

                  <div className="form-group">

                    <label>تاريخ انتهاء الترخيص</label>

                    <input type="date" value={formData.licenseExpiryDate} onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })} />

                  </div>

                  <div className="form-group">

                    <label>تاريخ الشراء</label>

                    <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />

                  </div>

                  <div className="form-group">

                    <label>تاريخ انتهاء الضريبة</label>

                    <input type="date" value={formData.taxExpiryDate} onChange={(e) => setFormData({ ...formData, taxExpiryDate: e.target.value })} />

                  </div>

                  <div className="form-group">

                    <label>نهاية وثيقة التأمين</label>

                    <input type="date" value={formData.insuranceExpiryDate} onChange={(e) => setFormData({ ...formData, insuranceExpiryDate: e.target.value })} />

                  </div>

                  <div className="form-group">

                    <label>جهة التأمين</label>

                    <input type="text" value={formData.insuranceCompany} onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })} />

                  </div>

                  <div className="form-group">

                    <label>رخصة / تصريح</label>

                    <select value={formData.permitLicense} onChange={(e) => setFormData({ ...formData, permitLicense: e.target.value })}>

                      {permitOptions.map(opt => <option key={opt} value={opt}>{opt || '---'}</option>)}

                    </select>

                  </div>

                  <div className="form-group">

                    <label>ملاحظات</label>

                    <textarea rows="3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

                  </div>

                </div>

              </div>

              <div className="modal-footer">

                <button className="btn-secondary" onClick={() => setOpenDialog(false)}>إلغاء</button>

                <button className="btn-primary" onClick={handleSave}>حفظ</button>

              </div>

            </div>

          </div>

        )}

        {/* مودال رفع Excel */}

        {openUploadDialog && (

          <div className="modal-overlay" onClick={() => setOpenUploadDialog(false)}>

            <div className="modal-content" onClick={e => e.stopPropagation()}>

              <div className="modal-header">📂 رفع ملف Excel</div>

              <div className="modal-body">

                <div style={{ marginBottom: '20px', padding: '15px', background: theme === 'light' ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>

                  <strong>📌 هيكل الملف المطلوب:</strong>

                  <ul style={{ marginTop: '10px', marginRight: '20px', fontSize: '12px' }}>

                    <li>نوع السيارة</li>

                    <li>كود السياره</li>

                    <li>رقم سيارة</li>

                    <li>رقم الموتور</li>

                    <li>رقم الشاسيه</li>

                    <li>تاريخ انتهاء الترخيص</li>

                    <li>تاريخ الشراء</li>

                    <li>تاريخ انتهاء الضريبة</li>

                    <li>نهاية وثيقة التامين</li>

                    <li>جهة التامين</li>

                    <li>رخصة تصريح</li>

                    <li>ملاحظات</li>

                  </ul>

                </div>

                <div className="upload-area" onClick={() => document.getElementById('file-input').click()}>

                  📄 اضغط لرفع ملف Excel

                  <input id="file-input" type="file" accept=".xlsx,.xls" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />

                </div>

                {selectedFile && <p style={{ marginTop: '10px', color: themeStyles.statValue }}>✅ {selectedFile.name}</p>}

              </div>

              <div className="modal-footer">

                <button className="btn-secondary" onClick={() => setOpenUploadDialog(false)}>إلغاء</button>

                <button className="btn-primary" onClick={handleUpload} disabled={!selectedFile}>رفع</button>

              </div>

            </div>

          </div>

        )}

      </div>

    </>

  );

};

export default CompanyEquipment;