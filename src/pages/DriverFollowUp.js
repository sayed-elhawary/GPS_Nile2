// frontend/src/pages/DriverFollowUp.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// تنسيق التاريخ
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
    return dateString;
  } catch {
    return '—';
  }
};

// الحصول على تاريخ اليوم
const getTodayDate = () => {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();
  return `${day} / ${month} / ${year}`;
};

// ========================================================
// دالة تصدير PDF - الحل النهائي بدون تكرار الهيدر
// الفكرة: نرسم كل قسم (هيدر، جدول ملاكي، جدول آخرى) بشكل منفصل
// ونحسب أين ينتهي كل قسم لإضافة صفحة جديدة عند الحاجة فقط
// ========================================================
const exportToPDF = async (drivers) => {
  if (!drivers || drivers.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }

  try {
    const currentDate = getTodayDate();
    const currentYear = new Date().getFullYear();

    const passengerCars = drivers.filter(d => d.carCategory === 'ملاكي');
    const otherCars = drivers.filter(d => d.carCategory !== 'ملاكي');

    // ---- بناء صفوف سيارات ملاكي ----
    let passengerRows = '';
    if (passengerCars.length > 0) {
      passengerCars.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        passengerRows += `
          <tr style="background:${rowBg};">
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${index + 1}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;font-size:12px;">${item.code || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${item.carType || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${item.management || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${item.plateNumber || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;font-size:12px;">${item.driverName || 'بدون سائق'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;direction:ltr;font-size:12px;">${item.phoneNumber || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;">
              <span style="background:${item.status === 'نشطة' ? '#dcfce7' : item.status === 'تحت الصيانة' ? '#fed7aa' : '#fee2e2'};padding:3px 9px;border-radius:20px;font-size:11px;">
                ${item.status || 'نشطة'}
              </span>
            </td>
          </tr>`;
      });
    } else {
      passengerRows = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;font-size:12px;">🚗 لا توجد سيارات ملاكي مسجلة</td></tr>`;
    }

    // ---- بناء صفوف السيارات الأخرى ----
    let otherRows = '';
    if (otherCars.length > 0) {
      otherCars.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        otherRows += `
          <tr style="background:${rowBg};">
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${index + 1}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;font-size:12px;">${item.code || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${item.carType || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${item.carCategory || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${item.management || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${item.plateNumber || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;font-size:12px;">${item.driverName || 'بدون سائق'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;direction:ltr;font-size:12px;">${item.phoneNumber || '-'}</td>
            <td style="padding:9px 7px;border:1px solid #cbd5e1;text-align:center;">
              <span style="background:${item.status === 'نشطة' ? '#dcfce7' : item.status === 'تحت الصيانة' ? '#fed7aa' : '#fee2e2'};padding:3px 9px;border-radius:20px;font-size:11px;">
                ${item.status || 'نشطة'}
              </span>
            </td>
          </tr>`;
      });
    } else {
      otherRows = `<tr><td colspan="9" style="text-align:center;padding:30px;color:#94a3b8;font-size:12px;">🚚 لا توجد سيارات أخرى مسجلة</td></tr>`;
    }

    // ========================================================
    // الحل الجوهري:
    // نبني الـ HTML بحيث كل "قسم" له id خاص به
    // ثم نلتقط كل قسم كصورة منفصلة ونضعه في الـ PDF
    // بدلاً من التقاط الصفحة كلها كصورة واحدة ثم تقطيعها
    // ========================================================

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-99999px';
    iframe.style.left = '-99999px';
    iframe.style.width = '1240px';
    iframe.style.height = '9000px'; // طويل بما يكفي
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Cairo','Segoe UI','Arial',sans-serif; background:white; direction:rtl; }
          table { width:100%; border-collapse:collapse; }
          th,td { border:1px solid #cbd5e1; }
          /* كل قسم له padding خاص */
          #section-header  { padding:40px 40px 20px 40px; background:white; }
          #section-passenger { padding:0 40px 30px 40px; background:white; }
          #section-other   { padding:0 40px 30px 40px; background:white; }
          #section-footer  { padding:10px 40px 30px 40px; background:white; }
        </style>
      </head>
      <body>

        <!-- ===== هيدر التقرير ===== -->
        <div id="section-header">
          <div style="text-align:center;padding-bottom:20px;border-bottom:3px solid #1e3a8a;">
            <h1 style="color:#1e3a8a;margin:0;font-size:26px;font-weight:800;">شركة النيل للخرسانة الجاهزة</h1>
            <h2 style="color:#475569;margin:8px 0;font-size:19px;font-weight:600;">إدارة العلاقات العامة والأمن</h2>
            <p style="color:#64748b;font-size:14px;margin-top:10px;">التاريخ : ${currentDate}</p>
            <h3 style="color:#1e3a8a;margin:14px 0 4px 0;font-size:21px;font-weight:700;">أسماء وأرقام المستلمين لسيارات الشركة</h3>
          </div>
        </div>

        <!-- ===== جدول ملاكي ===== -->
        <div id="section-passenger">
          <h3 style="color:#1e3a8a;margin:0 0 14px 0;font-size:17px;border-right:4px solid #1e3a8a;padding-right:12px;">🚗 سيارات ملاكي</h3>
          <table style="font-size:12px;">
            <thead>
              <tr style="background:#1e3a8a;color:white;">
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;width:40px;">م</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">كود</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">النوع</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">الإدارة</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">رقم اللوحة</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">اسم السائق</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">رقم الموبيل</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;width:80px;">الحالة</th>
              </tr>
            </thead>
            <tbody>${passengerRows}</tbody>
          </table>
        </div>

        <!-- ===== جدول آخرى ===== -->
        <div id="section-other">
          <h3 style="color:#1e3a8a;margin:0 0 14px 0;font-size:17px;border-right:4px solid #1e3a8a;padding-right:12px;">🚚 سيارات أخرى</h3>
          <table style="font-size:12px;">
            <thead>
              <tr style="background:#1e3a8a;color:white;">
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;width:40px;">م</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">كود</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">النوع</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">الفئة</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">الإدارة</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">رقم اللوحة</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">اسم السائق</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;">رقم الموبيل</th>
                <th style="padding:11px 6px;border:1px solid #2563eb;text-align:center;width:80px;">الحالة</th>
              </tr>
            </thead>
            <tbody>${otherRows}</tbody>
          </table>
        </div>

        <!-- ===== فوتر ===== -->
        <div id="section-footer">
          <div style="padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:10px;">
            <p>نظام متابعة سائقين الإدارة - NileMix Management System</p>
            <p>حقوق الطبع والنشر محفوظة © ${currentYear}</p>
          </div>
        </div>

      </body>
      </html>
    `);
    iframeDoc.close();

    // انتظار تحميل الخطوط والمحتوى
    await new Promise(resolve => setTimeout(resolve, 800));

    // ========================================================
    // التقاط كل قسم بشكل منفصل
    // ========================================================
    const scale = 2.5;

    const captureSection = async (sectionId) => {
      const el = iframeDoc.getElementById(sectionId);
      if (!el) return null;
      return await html2canvas(el, {
        scale,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: 1240,
      });
    };

    const canvasHeader    = await captureSection('section-header');
    const canvasPassenger = await captureSection('section-passenger');
    const canvasOther     = await captureSection('section-other');
    const canvasFooter    = await captureSection('section-footer');

    document.body.removeChild(iframe);

    // ========================================================
    // بناء الـ PDF صفحة صفحة
    // الصفحة A4 landscape: 297mm × 210mm
    // نحسب ارتفاع كل قسم بالـ mm ثم نقرر إذا احتجنا صفحة جديدة
    // ========================================================
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const PAGE_W = pdf.internal.pageSize.getWidth();   // 297mm
    const PAGE_H = pdf.internal.pageSize.getHeight();  // 210mm
    const MARGIN = 0; // نستخدم عرض كامل

    // دالة مساعدة: تحسب ارتفاع الصورة بالـ mm بناءً على العرض
    const mmHeight = (canvas) => (canvas.height * PAGE_W) / canvas.width;

    // دالة مساعدة: ترسم canvas في الـ PDF مع دعم التقطيع عبر صفحات
    // cursorY = الموضع الحالي بالـ mm على الصفحة
    // ترجع cursorY الجديدة بعد الرسم
    const drawCanvas = (canvas, cursorY) => {
      const imgData  = canvas.toDataURL('image/png');
      const imgH_mm  = mmHeight(canvas);          // الارتفاع الكلي للصورة بالـ mm
      const imgW_mm  = PAGE_W;

      let remainingImgH = imgH_mm;                // ما تبقى من الصورة للرسم
      let srcOffsetY    = 0;                      // من أين نبدأ في الصورة (بالـ px)
      const srcTotalPx  = canvas.height;          // ارتفاع الصورة كاملاً بالـ px

      while (remainingImgH > 0) {
        const availableOnPage = PAGE_H - cursorY; // المساحة المتبقية في الصفحة الحالية

        if (availableOnPage <= 2) {
          // الصفحة ممتلئة تقريباً، ابدأ صفحة جديدة
          pdf.addPage();
          cursorY = 0;
          continue;
        }

        const chunkH_mm = Math.min(remainingImgH, availableOnPage);
        // نسبة هذا الجزء من الصورة
        const chunkRatio = chunkH_mm / imgH_mm;
        const chunkSrcPx = srcTotalPx * chunkRatio;

        // نرسم الجزء المناسب من الصورة
        // جاهزة jsPDF لا تدعم cropping مباشرة، لذا نستخدم canvas مؤقتاً
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width  = canvas.width;
        tmpCanvas.height = Math.ceil(chunkSrcPx);
        const ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0, srcOffsetY,           // src x, y
          canvas.width, Math.ceil(chunkSrcPx), // src w, h
          0, 0,                    // dst x, y
          canvas.width, Math.ceil(chunkSrcPx)  // dst w, h
        );

        pdf.addImage(
          tmpCanvas.toDataURL('image/png'),
          'PNG',
          MARGIN, cursorY,
          imgW_mm, chunkH_mm
        );

        cursorY       += chunkH_mm;
        srcOffsetY    += Math.ceil(chunkSrcPx);
        remainingImgH -= chunkH_mm;

        if (remainingImgH > 1 && cursorY >= PAGE_H - 1) {
          pdf.addPage();
          cursorY = 0;
        }
      }

      return cursorY;
    };

    // ========================================================
    // ارسم الأقسام بالترتيب
    // الهيدر أولاً (يظهر مرة واحدة فقط في الصفحة الأولى)
    // ثم الجداول، وإذا امتدت تُكمَّل في صفحة جديدة بدون هيدر
    // ========================================================
    let cursorY = 0;

    cursorY = drawCanvas(canvasHeader,    cursorY);
    cursorY = drawCanvas(canvasPassenger, cursorY);
    cursorY = drawCanvas(canvasOther,     cursorY);

    // الفوتر: إذا لم تكن هناك مساحة كافية، أضف صفحة
    if (PAGE_H - cursorY < mmHeight(canvasFooter)) {
      pdf.addPage();
      cursorY = 0;
    }
    drawCanvas(canvasFooter, cursorY);

    const fileName = `NileMix_سائقين_الإدارة_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
    alert(`✅ تم تصدير PDF بنجاح\nعدد السيارات: ${drivers.length}`);

  } catch (error) {
    console.error('خطأ في تصدير PDF:', error);
    alert('❌ حدث خطأ أثناء تصدير PDF: ' + error.message);
  }
};

export default function DriverFollowUp() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [theme, setTheme] = useState('dark');

  const [formData, setFormData] = useState({
    code: '',
    carType: '',
    management: '',
    plateNumber: '',
    driverName: '',
    phoneNumber: '',
    notes: '',
    carCategory: 'ملاكي',
    status: 'نشطة'
  });

  // تحميل الثيم
  useEffect(() => {
    const savedTheme = localStorage.getItem('driverFollowUpTheme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('driverFollowUpTheme', newTheme);
  };

  // جلب جميع البيانات
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/driver-followup`);
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('خطأ في جلب البيانات:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleSave = async () => {
    if (!formData.code || !formData.carType || !formData.plateNumber) {
      alert('يرجى ملء الحقول المطلوبة: الكود، نوع السيارة، ورقم اللوحة');
      return;
    }

    try {
      setLoading(true);
      const method = editingDriver ? 'PUT' : 'POST';
      const url = editingDriver
        ? `${API_URL}/api/driver-followup/${editingDriver._id}`
        : `${API_URL}/api/driver-followup`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'فشل في الحفظ');
      }

      await fetchDrivers();
      setShowModal(false);
      setSuccess(editingDriver ? '✅ تم تعديل البيانات بنجاح' : '✅ تم إضافة السائق بنجاح');
      setTimeout(() => setSuccess(''), 3000);

      setFormData({
        code: '',
        carType: '',
        management: '',
        plateNumber: '',
        driverName: '',
        phoneNumber: '',
        notes: '',
        carCategory: 'ملاكي',
        status: 'نشطة'
      });
      setEditingDriver(null);
    } catch (err) {
      alert('❌ حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/driver-followup/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في الحذف');
      await fetchDrivers();
      setDeleteConfirm(null);
      setSuccess('✅ تم الحذف بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('❌ حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (drivers.length === 0) {
      alert('⚠️ لا توجد بيانات للتصدير');
      return;
    }
    setPdfLoading(true);
    try {
      await exportToPDF(drivers);
    } catch (err) {
      console.error('خطأ في PDF:', err);
      alert('❌ حدث خطأ أثناء تصدير PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const openModal = (driver = null) => {
    setError('');
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        code: driver.code || '',
        carType: driver.carType || '',
        management: driver.management || '',
        plateNumber: driver.plateNumber || '',
        driverName: driver.driverName || '',
        phoneNumber: driver.phoneNumber || '',
        notes: driver.notes || '',
        carCategory: driver.carCategory || 'ملاكي',
        status: driver.status || 'نشطة'
      });
    } else {
      setEditingDriver(null);
      setFormData({
        code: '',
        carType: '',
        management: '',
        plateNumber: '',
        driverName: '',
        phoneNumber: '',
        notes: '',
        carCategory: 'ملاكي',
        status: 'نشطة'
      });
    }
    setShowModal(true);
  };

  // إحصائيات
  const activeCars = drivers.filter(d => d.status === 'نشطة').length;
  const maintenanceCars = drivers.filter(d => d.status === 'تحت الصيانة').length;
  const noDriverCars = drivers.filter(d => !d.driverName || d.driverName === '').length;

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
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: themeStyles.titleColor }}>🚗 متابعة سائقين الإدارة</div>
              <div style={{ color: themeStyles.text2 }}>أسماء وأرقام المستلمين لسيارات الشركة</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={toggleTheme} style={{ background: themeStyles.inputBg, border: `1px solid ${themeStyles.inputBorder}`, borderRadius: '40px', padding: '8px 18px', cursor: 'pointer', color: themeStyles.text2 }}>
              {theme === 'light' ? '🌙 ليلي' : '☀️ نهاري'}
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading || drivers.length === 0} style={{ background: themeStyles.primaryBtn, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '14px', fontWeight: '800', cursor: pdfLoading || drivers.length === 0 ? 'not-allowed' : 'pointer', opacity: pdfLoading || drivers.length === 0 ? 0.6 : 1 }}>
              {pdfLoading ? '⏳ جاري...' : '📄 تصدير PDF'}
            </button>
            <button onClick={() => openModal()} style={{ background: themeStyles.primaryBtn, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}>
              ➕ إضافة
            </button>
          </div>
        </div>

        {/* عنوان التقرير */}
        <div style={{ textAlign: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: `2px solid ${themeStyles.cardBorder}` }}>
          <h1 style={{ color: themeStyles.titleColor, margin: 0, fontSize: '20px' }}>شركة النيل للخرسانة الجاهزة</h1>
          <h2 style={{ color: themeStyles.text2, margin: '5px 0', fontSize: '16px' }}>إدارة العلاقات العامة والأمن</h2>
          <p style={{ color: themeStyles.text3, marginTop: '8px' }}>التاريخ : {getTodayDate()}</p>
          <h3 style={{ color: themeStyles.titleColor, margin: '10px 0', fontSize: '18px' }}>أسماء وأرقام المستلمين لسيارات الشركة</h3>
        </div>

        {/* إحصائيات سريعة */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <div style={{ background: themeStyles.statBg, border: `1px solid ${themeStyles.statBorder}`, borderRadius: '16px', padding: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px' }}>🚗</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: themeStyles.statValue }}>{drivers.length}</div>
            <div style={{ fontSize: '12px', color: themeStyles.text3 }}>إجمالي السيارات</div>
          </div>
          <div style={{ background: themeStyles.statBg, border: `1px solid ${themeStyles.statBorder}`, borderRadius: '16px', padding: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px' }}>✅</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>{activeCars}</div>
            <div style={{ fontSize: '12px', color: themeStyles.text3 }}>سيارات نشطة</div>
          </div>
          <div style={{ background: themeStyles.statBg, border: `1px solid ${themeStyles.statBorder}`, borderRadius: '16px', padding: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px' }}>🔧</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>{maintenanceCars}</div>
            <div style={{ fontSize: '12px', color: themeStyles.text3 }}>تحت الصيانة</div>
          </div>
          <div style={{ background: themeStyles.statBg, border: `1px solid ${themeStyles.statBorder}`, borderRadius: '16px', padding: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px' }}>👤</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{noDriverCars}</div>
            <div style={{ fontSize: '12px', color: themeStyles.text3 }}>بدون سائق</div>
          </div>
        </div>

        {error && <div style={{ background: themeStyles.errorBg, color: themeStyles.errorText, padding: '14px', borderRadius: '14px', marginBottom: '20px' }}>⚠️ {error}</div>}
        {success && <div style={{ background: themeStyles.successBg, color: themeStyles.successText, padding: '14px', borderRadius: '14px', marginBottom: '20px' }}>✓ {success}</div>}

        {/* الجدول الرئيسي */}
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: `1px solid ${themeStyles.tableBorder}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: themeStyles.tableHeaderBg }}>
                {['م','كود','النوع','الفئة','الإدارة','رقم اللوحة','اسم السائق','رقم الموبيل','الحالة','إجراءات'].map(h => (
                  <th key={h} style={{ padding: '12px', color: themeStyles.tableHeaderText, border: `1px solid ${theme === 'light' ? '#2563eb' : '#4f6ef7'}`, textAlign: 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: themeStyles.text3 }}>⏳ جاري التحميل...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: themeStyles.text3 }}>📭 لا توجد بيانات</td></tr>
              ) : (
                drivers.map((driver, idx) => (
                  <tr key={driver._id} style={{ background: driver.status === 'تحت الصيانة' ? (theme === 'light' ? '#fef3c7' : 'rgba(245, 158, 11, 0.1)') : driver.status === 'موقوفة' ? (theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)') : 'transparent' }}>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2 }}>{idx + 1}</td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', fontWeight: 'bold', color: themeStyles.statValue }}>{driver.code}</td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2 }}>{driver.carType}</td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2 }}>
                      <span style={{ background: driver.carCategory === 'ملاكي' ? '#dcfce7' : '#fed7aa', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                        {driver.carCategory}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2 }}>{driver.management || '-'}</td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', color: themeStyles.text2, direction: 'ltr' }}>{driver.plateNumber}</td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', fontWeight: driver.driverName ? 'bold' : 'normal', color: driver.driverName ? themeStyles.statValue : themeStyles.text3 }}>{driver.driverName || 'بدون سائق'}</td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center', direction: 'ltr', color: themeStyles.text2 }}>{driver.phoneNumber || '-'}</td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center' }}>
                      <span style={{
                        background: driver.status === 'نشطة' ? '#dcfce7' : driver.status === 'تحت الصيانة' ? '#fed7aa' : '#fee2e2',
                        color: driver.status === 'نشطة' ? '#166534' : driver.status === 'تحت الصيانة' ? '#9a3412' : '#991b1b',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold'
                      }}>
                        {driver.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: `1px solid ${themeStyles.tableBorder}`, textAlign: 'center' }}>
                      <button onClick={() => openModal(driver)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', margin: '0 5px', color: themeStyles.statValue }}>✏️</button>
                      <button onClick={() => setDeleteConfirm(driver)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', margin: '0 5px', color: '#ef4444' }}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && drivers.length > 0 && (
          <div style={{ marginTop: '15px', textAlign: 'center', color: themeStyles.text3, fontSize: '0.8rem' }}>
            إجمالي {drivers.length} سيارة مسجلة
          </div>
        )}
      </div>

      {/* مودال الإضافة/التعديل */}
      {showModal && (
        <div onClick={() => !loading && setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: themeStyles.modalBg, borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${themeStyles.cardBorder}`, fontSize: '1.3rem', fontWeight: '800', color: themeStyles.statValue }}>
              {editingDriver ? '✏️ تعديل بيانات السائق' : '🚗 إضافة سائق جديد'}
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {[
                  { label: 'الكود *', key: 'code', placeholder: 'مثال: A 2', type: 'text' },
                  { label: 'نوع السيارة *', key: 'carType', placeholder: 'مثال: فيرنا / إلنترا', type: 'text' },
                  { label: 'الإدارة', key: 'management', placeholder: 'مثال: مدير عام الحركة', type: 'text' },
                  { label: 'رقم اللوحة *', key: 'plateNumber', placeholder: 'مثال: ط و ط 178', type: 'text', ltr: true },
                  { label: 'اسم السائق', key: 'driverName', placeholder: 'مثال: أ / حسين موسي', type: 'text' },
                  { label: 'رقم الموبيل', key: 'phoneNumber', placeholder: 'مثال: 1202878444', type: 'tel', ltr: true },
                ].map(({ label, key, placeholder, type, ltr }) => (
                  <div key={key}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>{label}</label>
                    <input type={type} placeholder={placeholder} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: `1px solid ${themeStyles.inputBorder}`, borderRadius: '10px', background: themeStyles.inputBg, color: themeStyles.text, direction: ltr ? 'ltr' : 'rtl' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>الفئة</label>
                  <select value={formData.carCategory} onChange={e => setFormData({ ...formData, carCategory: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: `1px solid ${themeStyles.inputBorder}`, borderRadius: '10px', background: themeStyles.inputBg, color: themeStyles.text }}>
                    <option value="ملاكي">🚗 ملاكي</option>
                    <option value="نقل">🚛 نقل</option>
                    <option value="أجرة">🚕 أجرة</option>
                    <option value="ميني باص">🚐 ميني باص</option>
                    <option value="أخرى">🔧 أخرى</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>الحالة</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: `1px solid ${themeStyles.inputBorder}`, borderRadius: '10px', background: themeStyles.inputBg, color: themeStyles.text }}>
                    <option value="نشطة">✅ نشطة</option>
                    <option value="تحت الصيانة">🔧 تحت الصيانة</option>
                    <option value="موقوفة">⏸ موقوفة</option>
                    <option value="مباعة">💰 مباعة</option>
                    <option value="بدون سائق">👤 بدون سائق</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: themeStyles.text2 }}>ملاحظات</label>
                  <textarea placeholder="أي ملاحظات إضافية..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: `1px solid ${themeStyles.inputBorder}`, borderRadius: '10px', background: themeStyles.inputBg, color: themeStyles.text, minHeight: '60px', resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 28px', background: themeStyles.tableHeaderBg, borderTop: `1px solid ${themeStyles.cardBorder}`, display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: themeStyles.secondaryBtn, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '14px', cursor: 'pointer' }}>إلغاء</button>
              <button onClick={handleSave} disabled={loading} style={{ background: themeStyles.primaryBtn, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? '⏳ جاري...' : (editingDriver ? 'حفظ' : 'إضافة')}
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
            <div style={{ marginBottom: '24px', color: themeStyles.text2 }}>هل أنت متأكد من حذف <strong style={{ color: '#ef4444' }}>{deleteConfirm.code} - {deleteConfirm.carType}</strong>؟</div>
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