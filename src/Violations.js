// src/Violations.js
// ==================== صفحة المخالفات - NileMix ====================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const formatDateForPDF = (dateString) => {
  if (!dateString) return '—';
  try {
    const clean = dateString.split('T')[0].trim();
    const [y, m, d] = clean.split('-').map(Number);
    return `${d}-${m}-${y}`;
  } catch (e) {
    return '—';
  }
};

async function exportViolationsToPDF(filteredViolations) {
  const doc = new jsPDF('l', 'pt', 'a4');
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  try {
    const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf';
    const fontResp = await fetch(fontUrl);
    const fontBuffer = await fontResp.arrayBuffer();
    const fontBase64 = btoa(
      new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  } catch (e) {
    console.warn('تعذر تحميل خط Amiri');
  }

  const setAr = () => { try { doc.setFont('Amiri', 'normal'); } catch(e) { doc.setFont('helvetica', 'normal'); } };
  const setEn = (w = 'normal') => doc.setFont('helvetica', w);

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageW, pageH, 'F');
  doc.setFillColor(31, 41, 55);
  doc.rect(0, 0, pageW, 108, 'F');
  doc.setFillColor(79, 110, 247);
  doc.rect(0, 105, pageW, 3, 'F');
  doc.setFillColor(79, 110, 247);
  doc.rect(pageW - 4, 0, 4, 108, 'F');

  setEn('bold');
  doc.setFontSize(30);
  doc.setTextColor(79, 110, 247);
  doc.text('NileMix', pageW - 28, 48, { align: 'right' });

  setAr();
  doc.setFontSize(15);
  doc.setTextColor(209, 213, 219);
  doc.text('تقرير المخالفات', pageW - 28, 80, { align: 'right' });

  setAr();
  doc.setFontSize(9.5);
  doc.setTextColor(107, 114, 128);
  const todayStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
  doc.text(`التاريخ: ${todayStr}`, 28, 46);
  doc.text(`إجمالي السجلات: ${filteredViolations.length}`, 28, 64);

  const cols = [
    { ar: 'قيمة المخالفة', en: 'Amount', key: 'amount', w: 90 },
    { ar: 'نوع المخالفة', en: 'Violation Type', key: 'violationType', w: 140 },
    { ar: 'تاريخ المخالفة', en: 'Date', key: 'violationDate', w: 95 },
    { ar: 'كود العربية', en: 'Car Code', key: 'carCode', w: 110 },
    { ar: 'اسم الموظف', en: 'Employee Name', key: 'employeeName', w: 130 },
    { ar: 'كود الموظف', en: 'Employee Code', key: 'employeeCode', w: 100 },
  ];

  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const tableX = (pageW - tableW) / 2;
  const headerH = 38;
  const rowH = 27;
  const firstPageRows = Math.floor((pageH - 125 - headerH - 44) / rowH);

  const drawTableHeader = (startY) => {
    doc.setFillColor(31, 41, 55);
    doc.rect(tableX, startY, tableW, headerH, 'F');
    doc.setFillColor(79, 110, 247);
    doc.rect(tableX, startY + headerH - 2.5, tableW, 2.5, 'F');
    let cx = tableX;
    cols.forEach((col) => {
      const mid = cx + col.w / 2;
      setAr();
      doc.setFontSize(10);
      doc.setTextColor(79, 110, 247);
      doc.text(col.ar, mid, startY + 17, { align: 'center' });
      setEn();
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(col.en, mid, startY + 30, { align: 'center' });
      if (cx > tableX) {
        doc.setDrawColor(55, 65, 81);
        doc.setLineWidth(0.4);
        doc.line(cx, startY, cx, startY + headerH);
      }
      cx += col.w;
    });
  };

  const drawFooter = (pNum) => {
    doc.setFillColor(31, 41, 55);
    doc.rect(0, pageH - 34, pageW, 34, 'F');
    doc.setFillColor(79, 110, 247);
    doc.rect(0, pageH - 34, pageW, 2, 'F');
    setEn('bold');
    doc.setFontSize(9);
    doc.setTextColor(79, 110, 247);
    doc.text('NileMix', 28, pageH - 11);
    setEn();
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text('© 2026 All rights reserved', 95, pageH - 11);
    doc.text(`Page ${pNum}`, pageW - 28, pageH - 11, { align: 'right' });
  };

  const drawRow = (item, rowIdx, y) => {
    doc.setFillColor(rowIdx % 2 === 0 ? 255 : 248, rowIdx % 2 === 0 ? 255 : 250, rowIdx % 2 === 0 ? 255 : 252);
    doc.rect(tableX, y, tableW, rowH, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.25);
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH);

    const dateFormatted = formatDateForPDF(item.violationDate);
    const values = [
      item.amount || '—',
      item.violationType || '—',
      dateFormatted,
      item.carCode || '—',
      item.employeeName || '—',
      item.employeeCode || '—',
    ];

    let vx = tableX;
    values.forEach((val, i) => {
      const mid = vx + cols[i].w / 2;
      const maxC = Math.floor(cols[i].w / 5.2);
      const txt = String(val).length > maxC ? String(val).slice(0, maxC - 1) + '…' : String(val);
      setAr();
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      doc.text(txt, mid, y + rowH / 2 + 3.5, { align: 'center' });
      if (vx > tableX) {
        doc.setDrawColor(243, 244, 246);
        doc.setLineWidth(0.25);
        doc.line(vx, y, vx, y + rowH);
      }
      vx += cols[i].w;
    });
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.rect(tableX, y, tableW, rowH, 'S');
  };

  let firstY = 125;
  drawTableHeader(firstY);
  let bodyY = firstY + headerH;
  let pageNum = 1;
  let rowsOnPage = 0;

  filteredViolations.forEach((item, idx) => {
    if (rowsOnPage >= firstPageRows) {
      drawFooter(pageNum);
      doc.addPage();
      pageNum++;
      rowsOnPage = 0;
      bodyY = 0;
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, pageW, 42, 'F');
      doc.setFillColor(79, 110, 247);
      doc.rect(0, 39, pageW, 2.5, 'F');
      setEn('bold');
      doc.setFontSize(13);
      doc.setTextColor(79, 110, 247);
      doc.text('NileMix', pageW - 28, 26, { align: 'right' });
      setAr();
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text('تقرير المخالفات — تابع', pageW - 28, 38, { align: 'right' });
      const newHeaderY = 50;
      drawTableHeader(newHeaderY);
      bodyY = newHeaderY + headerH;
    }
    const y = bodyY + rowsOnPage * rowH;
    drawRow(item, idx, y);
    rowsOnPage++;
  });

  drawFooter(pageNum);
  doc.save(`NileMix_تقرير_المخالفات_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function Violations() {
  const [violations, setViolations] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [deductionForm, setDeductionForm] = useState({
    employeeCode: '',
    employeeName: '',
    deductionDate: '',
    amount: '',
    notes: ''
  });
  const [statementOpen, setStatementOpen] = useState(false);
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('violationsTheme') || 'dark';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('violationsTheme', newTheme);
  };

  const [formData, setFormData] = useState({
    employeeCode: '',
    employeeName: '',
    carCode: '',
    violationDate: '',
    violationType: '',
    amount: '',
    images: [],
  });
  const [previewImages, setPreviewImages] = useState([]);

  const fetchAllViolations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/violations`);
      setViolations(res.data);
    } catch (err) {
      setError('فشل في جلب بيانات المخالفات');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDeductions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/violations/deductions`);
      setDeductions(res.data);
    } catch (err) {
      console.error('فشل في جلب الخصومات:', err);
    }
  };

  useEffect(() => {
    fetchAllViolations();
    fetchAllDeductions();
  }, []);

  useEffect(() => {
    let result = violations;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item =>
        (item.employeeCode || '').toLowerCase().includes(term) ||
        (item.employeeName || '').toLowerCase().includes(term) ||
        (item.carCode || '').toLowerCase().includes(term) ||
        (item.violationType || '').toLowerCase().includes(term)
      );
    }
    if (startDate || endDate) {
      result = result.filter(item => {
        if (!item.violationDate) return false;
        const itemDate = item.violationDate.split('T')[0];
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }
    setFilteredViolations(result);
  }, [searchTerm, startDate, endDate, violations]);

  const calculateGlobalSummary = () => {
    const totalViolationsAmount = violations.reduce((sum, v) => sum + Number(v.amount || 0), 0);
    const totalDeductionsAmount = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const remainingBalance = totalViolationsAmount - totalDeductionsAmount;
    return { totalViolationsAmount, totalDeductionsAmount, remainingBalance };
  };

  const globalSummary = calculateGlobalSummary();

  const calculateSummary = () => {
    const fawryViolations = filteredViolations.filter(v => v.violationType && v.violationType.includes('فوري'));
    const modafaViolations = filteredViolations.filter(v => v.violationType && v.violationType.includes('مضاعفة'));
    const companyViolations = filteredViolations.filter(v => v.violationType === 'على الشركة');
    const totalAmount = filteredViolations.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const fawryAmount = fawryViolations.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const modafaAmount = modafaViolations.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const companyAmount = companyViolations.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    return { totalCount: filteredViolations.length, totalAmount, fawryCount: fawryViolations.length, fawryAmount, modafaCount: modafaViolations.length, modafaAmount, companyCount: companyViolations.length, companyAmount };
  };

  const summary = calculateSummary();

  const handleEmployeeCodeChange = async (e) => {
    const code = e.target.value.trim();
    setFormData(prev => ({ ...prev, employeeCode: code, employeeName: '' }));
    if (code.length < 2) return;
    try {
      const res = await axios.get(`${API_URL}/api/client-data/employees?employeeCode=${code}`);
      if (res.data && res.data.length > 0) {
        setFormData(prev => ({ ...prev, employeeName: res.data[0].employeeName }));
      }
    } catch (err) {}
  };

  const handleDeductionEmployeeCodeChange = async (e) => {
    const code = e.target.value.trim();
    setDeductionForm(prev => ({ ...prev, employeeCode: code, employeeName: '' }));
    if (code.length < 2) return;
    try {
      const res = await axios.get(`${API_URL}/api/client-data/employees?employeeCode=${code}`);
      if (res.data && res.data.length > 0) {
        setDeductionForm(prev => ({ ...prev, employeeName: res.data[0].employeeName }));
      }
    } catch (err) {}
  };

  const openModal = (item = null) => {
    setError('');
    setSuccess('');
    setPreviewImages([]);
    if (item) {
      setEditingItem(item);
      setFormData({
        employeeCode: item.employeeCode || '',
        employeeName: item.employeeName || '',
        carCode: item.carCode || '',
        violationDate: item.violationDate ? item.violationDate.split('T')[0] : '',
        violationType: item.violationType || '',
        amount: item.amount || '',
        images: [],
      });
    } else {
      setEditingItem(null);
      setFormData({ employeeCode: '', employeeName: '', carCode: '', violationDate: '', violationType: '', amount: '', images: [] });
    }
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // الإصلاح الجوهري لـ Electron:
  // استبدال form onSubmit بـ onClick مباشر على الزرار
  // لأن Electron يعترض أحياناً حدث submit في الـ form
  // ============================================================
  const handleSave = async () => {
    setError('');
    setSuccess('');

    // التحقق من الحقول المطلوبة يدوياً
    if (!formData.employeeCode || !formData.carCode || !formData.violationDate || !formData.violationType || !formData.amount) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const data = new FormData();
    data.append('employeeCode', formData.employeeCode);
    data.append('employeeName', formData.employeeName);
    data.append('carCode', formData.carCode);
    data.append('violationDate', formData.violationDate);
    data.append('violationType', formData.violationType);
    data.append('amount', formData.amount);
    formData.images.forEach((img) => data.append('images', img));

    try {
      if (editingItem) {
        await axios.put(`${API_URL}/api/violations/${editingItem._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('تم تعديل المخالفة بنجاح');
      } else {
        await axios.post(`${API_URL}/api/violations`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('تم إضافة المخالفة بنجاح');
      }
      setModalOpen(false);
      await fetchAllViolations();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleSaveDeduction = async () => {
    setError('');
    setSuccess('');

    if (!deductionForm.employeeCode || !deductionForm.deductionDate || !deductionForm.amount) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/violations/deductions`, deductionForm);
      setSuccess('تم إضافة الخصم بنجاح');
      setDeductionModalOpen(false);
      await fetchAllDeductions();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ الخصم');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/violations/${id}`);
      setSuccess('تم الحذف بنجاح');
      setDeleteConfirm(null);
      await fetchAllViolations();
    } catch (err) {
      setError('فشل في الحذف');
      setDeleteConfirm(null);
    }
  };

  const openDeductionModal = () => {
    setDeductionForm({ employeeCode: '', employeeName: '', deductionDate: '', amount: '', notes: '' });
    setDeductionModalOpen(true);
  };

  const openStatement = (item) => {
    setSelectedEmployeeCode(item.employeeCode);
    setSelectedEmployeeName(item.employeeName || '');
    setStatementStartDate('');
    setStatementEndDate('');
    setStatementOpen(true);
  };

  const employeeViolations = violations.filter(v =>
    v.employeeCode === selectedEmployeeCode &&
    (!statementStartDate || v.violationDate.split('T')[0] >= statementStartDate) &&
    (!statementEndDate || v.violationDate.split('T')[0] <= statementEndDate)
  );

  const employeeDeductions = deductions.filter(d =>
    d.employeeCode === selectedEmployeeCode &&
    (!statementStartDate || d.deductionDate.split('T')[0] >= statementStartDate) &&
    (!statementEndDate || d.deductionDate.split('T')[0] <= statementEndDate)
  );

  const totalViolationsAmount = employeeViolations.reduce((sum, v) => sum + Number(v.amount || 0), 0);
  const totalDeductionsAmount = employeeDeductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const balance = totalViolationsAmount - totalDeductionsAmount;

  const openImageViewer = (images) => {
    if (!images || images.length === 0) return;
    setCurrentImages(images);
    setCurrentImageIndex(0);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setCurrentImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    let path = imagePath.toString().trim().replace(/\\/g, '/');
    if (path.startsWith('/uploads/violations/')) return `${API_URL}${path}`;
    if (path.startsWith('uploads/violations/')) return `${API_URL}/${path}`;
    if (path.startsWith('/uploads')) return `${API_URL}${path}`;
    if (path.startsWith('uploads')) return `${API_URL}/${path}`;
    return `${API_URL}/uploads/violations/${path.replace(/^\/+/, '')}`;
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await exportViolationsToPDF(filteredViolations);
    } finally {
      setPdfLoading(false);
    }
  };

  const violationTypes = [
    'سرعة فوري', 'حزام فوري', 'تلفون فوري',
    'سرعة مضاعفة', 'حزام مضاعفة', 'تلفون مضاعفة',
    'على الشركة'
  ];

  // ==================== Theme ====================
  const isDark = theme === 'dark';
  const T = isDark ? {
    pageBg: '#070d1a',
    sideAccent: '#0f1629',
    cardBg: '#0d1526',
    cardBorder: '#1a2744',
    cardBorderHover: '#2d4a8a',
    panelBg: '#111e35',
    panelBorder: '#1e3055',
    text: '#e8edf8',
    text2: '#9aaac8',
    text3: '#5a6d8a',
    titleGradStart: '#7eb8ff',
    titleGradEnd: '#a78bfa',
    inputBg: '#0d1a30',
    inputBorder: '#1e3055',
    inputText: '#d0daf0',
    inputPlaceholder: '#3a4f6e',
    tableHeadBg: '#0a1220',
    tableHeadText: '#6b85b0',
    tableRowEven: 'transparent',
    tableRowOdd: 'rgba(255,255,255,0.018)',
    tableRowHover: 'rgba(79,110,247,0.08)',
    tableBorder: '#141f36',
    btnPrimary: 'linear-gradient(135deg, #2855e0 0%, #6c3de8 100%)',
    btnPrimaryHover: 'linear-gradient(135deg, #3366f5 0%, #7c4ef8 100%)',
    btnPrimaryText: '#fff',
    btnOutlineBorder: '#1e3055',
    btnOutlineText: '#7a95c0',
    btnOutlineHover: '#1a2f50',
    modalBg: '#0d1526',
    modalBorder: '#1e3260',
    modalOverlay: 'rgba(0,5,20,0.88)',
    statBg: '#0d1526',
    statBorder: '#1a2744',
    globalCardBg: '#0d1526',
    globalCardBorder: '#1a2744',
    badgeBg: 'rgba(79,110,247,0.15)',
    badgeText: '#7eb8ff',
    amountColor: '#60a5fa',
    successGreen: '#34d399',
    dangerRed: '#f87171',
    warningOrange: '#fb923c',
    scrollbarThumb: '#1e3055',
    shadow: '0 4px 24px rgba(0,0,0,0.5)',
    shadowHover: '0 8px 32px rgba(0,0,0,0.7)',
    readonlyBg: '#060d1c',
    readonlyText: '#3a4f6e',
    statementBg: '#060d1c',
  } : {
    pageBg: '#f0f4ff',
    sideAccent: '#e8eeff',
    cardBg: '#ffffff',
    cardBorder: '#dde5f8',
    cardBorderHover: '#7097e8',
    panelBg: '#f7f9ff',
    panelBorder: '#dde5f8',
    text: '#0f1f45',
    text2: '#3a5080',
    text3: '#8095b8',
    titleGradStart: '#1a40c0',
    titleGradEnd: '#6d28d9',
    inputBg: '#ffffff',
    inputBorder: '#c8d5ef',
    inputText: '#0f1f45',
    inputPlaceholder: '#94a3b8',
    tableHeadBg: '#f0f4ff',
    tableHeadText: '#5570a0',
    tableRowEven: '#ffffff',
    tableRowOdd: '#f7f9ff',
    tableRowHover: '#eef3ff',
    tableBorder: '#dde5f8',
    btnPrimary: 'linear-gradient(135deg, #2855e0 0%, #6c3de8 100%)',
    btnPrimaryHover: 'linear-gradient(135deg, #1a40c0 0%, #5b30c8 100%)',
    btnPrimaryText: '#fff',
    btnOutlineBorder: '#c8d5ef',
    btnOutlineText: '#3a5080',
    btnOutlineHover: '#eef3ff',
    modalBg: '#ffffff',
    modalBorder: '#dde5f8',
    modalOverlay: 'rgba(5,15,50,0.55)',
    statBg: '#ffffff',
    statBorder: '#dde5f8',
    globalCardBg: '#ffffff',
    globalCardBorder: '#dde5f8',
    badgeBg: '#eef3ff',
    badgeText: '#2855e0',
    amountColor: '#2855e0',
    successGreen: '#059669',
    dangerRed: '#dc2626',
    warningOrange: '#d97706',
    scrollbarThumb: '#c8d5ef',
    shadow: '0 4px 16px rgba(30,60,180,0.07)',
    shadowHover: '0 8px 28px rgba(30,60,180,0.12)',
    readonlyBg: '#f0f4ff',
    readonlyText: '#8095b8',
    statementBg: '#f7f9ff',
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${T.scrollbarThumb}; border-radius: 3px; }

    .vp { min-height: 100vh; background: ${T.pageBg}; font-family: 'Tajawal', sans-serif; direction: rtl; color: ${T.text}; transition: background 0.3s, color 0.3s; }

    .vc { max-width: 1500px; margin: 0 auto; padding: 28px 20px; }

    /* ---- Header ---- */
    .vh { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 14px; }
    .vb { display: flex; align-items: center; gap: 14px; }
    .vi { width: 50px; height: 50px; background: ${T.btnPrimary}; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 14px rgba(79,110,247,0.3); flex-shrink: 0; }
    .vb h1 { font-size: 1.7rem; font-weight: 800; background: linear-gradient(135deg, ${T.titleGradStart}, ${T.titleGradEnd}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.1; }
    .vb p { font-size: 0.75rem; color: ${T.text3}; margin-top: 2px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; }
    .vaa { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

    /* ---- Buttons ---- */
    .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: all 0.18s ease; border: none; font-family: 'Tajawal', sans-serif; white-space: nowrap; }
    .btn-p { background: ${T.btnPrimary}; color: #fff; box-shadow: 0 2px 8px rgba(79,110,247,0.2); }
    .btn-p:hover:not(:disabled) { background: ${T.btnPrimaryHover}; box-shadow: 0 4px 14px rgba(79,110,247,0.35); transform: translateY(-1px); }
    .btn-o { background: transparent; color: ${T.btnOutlineText}; border: 1px solid ${T.btnOutlineBorder}; }
    .btn-o:hover { background: ${T.btnOutlineHover}; border-color: ${T.cardBorderHover}; color: ${T.text}; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-sm { padding: 6px 12px; font-size: 0.78rem; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }

    /* ---- Theme toggle ---- */
    .ttg { background: ${T.cardBg}; border: 1px solid ${T.cardBorder}; border-radius: 24px; padding: 7px 16px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: 'Tajawal', sans-serif; font-size: 0.82rem; font-weight: 600; color: ${T.text2}; transition: all 0.2s; }
    .ttg:hover { border-color: ${T.cardBorderHover}; }

    /* ---- Messages ---- */
    .msg { padding: 11px 16px; border-radius: 10px; margin-bottom: 18px; font-weight: 600; font-size: 0.88rem; }
    .msg-e { background: rgba(220,38,38,0.1); color: ${T.dangerRed}; border: 1px solid rgba(220,38,38,0.2); }
    .msg-s { background: rgba(16,185,129,0.1); color: ${T.successGreen}; border: 1px solid rgba(16,185,129,0.2); }

    /* ---- Global summary ---- */
    .gs { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .gc { background: ${T.globalCardBg}; border: 1px solid ${T.globalCardBorder}; border-radius: 16px; padding: 22px 24px; display: flex; align-items: center; gap: 16px; box-shadow: ${T.shadow}; transition: box-shadow 0.2s; }
    .gc:hover { box-shadow: ${T.shadowHover}; }
    .gc-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .gc-icon-b { background: rgba(79,110,247,0.15); }
    .gc-icon-g { background: rgba(16,185,129,0.15); }
    .gc-icon-r { background: rgba(220,38,38,0.15); }
    .gc-info { flex: 1; }
    .gc-label { font-size: 0.78rem; color: ${T.text3}; font-weight: 500; margin-bottom: 4px; }
    .gc-val { font-size: 1.5rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: ${T.text}; }

    /* ---- Stats ---- */
    .sg { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 22px; }
    .sc { background: ${T.statBg}; border: 1px solid ${T.statBorder}; border-radius: 14px; padding: 18px; text-align: center; }
    .si { font-size: 26px; margin-bottom: 6px; }
    .sn { font-size: 1.9rem; font-weight: 800; color: ${T.amountColor}; font-family: 'JetBrains Mono', monospace; }
    .sl { font-size: 0.78rem; color: ${T.text3}; margin-top: 4px; font-weight: 500; }

    /* ---- Search bar ---- */
    .sb { background: ${T.cardBg}; border: 1px solid ${T.cardBorder}; border-radius: 14px; padding: 16px 18px; margin-bottom: 20px; }
    .sr { position: relative; }
    .si2 { width: 100%; padding: 10px 14px 10px 40px; border: 1px solid ${T.inputBorder}; border-radius: 10px; font-family: 'Tajawal', sans-serif; font-size: 0.88rem; direction: rtl; background: ${T.inputBg}; color: ${T.inputText}; transition: border-color 0.2s; }
    .si2:focus { outline: none; border-color: #4f6ef7; box-shadow: 0 0 0 3px rgba(79,110,247,0.12); }
    .si2::placeholder { color: ${T.inputPlaceholder}; }
    .sico { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: ${T.text3}; font-size: 15px; pointer-events: none; }
    .dr { display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; align-items: flex-end; }
    .drg { flex: 1; min-width: 150px; }
    .drl { display: block; font-size: 0.72rem; font-weight: 700; color: ${T.text3}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .di { width: 100%; padding: 9px 12px; border: 1px solid ${T.inputBorder}; border-radius: 10px; font-family: 'Tajawal', sans-serif; background: ${T.inputBg}; color: ${T.inputText}; font-size: 0.85rem; }
    .di:focus { outline: none; border-color: #4f6ef7; }

    /* ---- Summary table ---- */
    .stc { background: ${T.cardBg}; border: 1px solid ${T.cardBorder}; border-radius: 14px; overflow: hidden; margin-bottom: 20px; }
    .sth { padding: 14px 18px; background: ${T.panelBg}; border-bottom: 1px solid ${T.panelBorder}; }
    .sth h3 { color: ${T.text2}; font-size: 0.95rem; font-weight: 700; }
    .st { width: 100%; border-collapse: collapse; }
    .st th { padding: 11px 14px; text-align: center; background: ${T.tableHeadBg}; color: ${T.tableHeadText}; font-weight: 700; font-size: 0.77rem; border-bottom: 1px solid ${T.tableBorder}; }
    .st td { padding: 10px 14px; text-align: center; border-bottom: 1px solid ${T.tableBorder}; color: ${T.text2}; font-size: 0.85rem; }
    .st tr:last-child td { border-bottom: none; }
    .at { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${T.amountColor}; }

    /* ---- Main table ---- */
    .mtc { background: ${T.cardBg}; border: 1px solid ${T.cardBorder}; border-radius: 14px; overflow: hidden; }
    .th { padding: 14px 18px; background: ${T.panelBg}; border-bottom: 1px solid ${T.panelBorder}; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
    .ttl { font-weight: 700; color: ${T.text2}; font-size: 0.92rem; }
    .tbdg { background: ${T.badgeBg}; color: ${T.badgeText}; padding: 3px 11px; border-radius: 20px; font-size: 0.73rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .dt { width: 100%; border-collapse: collapse; }
    .dt th { padding: 12px 10px; text-align: right; font-size: 0.73rem; font-weight: 700; color: ${T.tableHeadText}; background: ${T.tableHeadBg}; border-bottom: 1px solid ${T.tableBorder}; white-space: nowrap; }
    .dt td { padding: 11px 10px; font-size: 0.83rem; color: ${T.text2}; border-bottom: 1px solid ${T.tableBorder}; }
    .dt tbody tr:nth-child(even) td { background: ${T.tableRowOdd}; }
    .dt tbody tr:hover td { background: ${T.tableRowHover}; }
    .mn { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; }
    .ab { display: flex; gap: 5px; justify-content: center; }
    .axb { width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; border: none; font-size: 0.88rem; }
    .axb:hover { transform: scale(1.1); }
    .axe { background: #fef3c7; color: #b45309; }
    .axv { background: #dbeafe; color: #1d4ed8; }
    .axd { background: #fee2e2; color: #b91c1c; }
    .ibdg { background: ${T.badgeBg}; color: ${T.badgeText}; padding: 3px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; cursor: pointer; }
    .ibdg:hover { opacity: 0.8; }
    .es { text-align: center; padding: 50px; }
    .ei { font-size: 2.5rem; margin-bottom: 10px; }
    .et { color: ${T.text3}; font-size: 0.88rem; }

    /* ---- Modal ---- */
    .mo { position: fixed; inset: 0; background: ${T.modalOverlay}; backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .mc { background: ${T.modalBg}; border: 1px solid ${T.modalBorder}; border-radius: 20px; width: 100%; max-width: 720px; max-height: 92vh; overflow-y: auto; padding: 26px; box-shadow: ${T.shadowHover}; }
    .mc-sm { max-width: 420px; }
    .mc-lg { max-width: 1200px; width: 95vw; }
    .mti { font-size: 1.2rem; font-weight: 800; color: ${T.text}; text-align: center; margin-bottom: 22px; }
    .fg { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .ff { grid-column: 1 / -1; }
    .fl { display: block; font-size: 0.72rem; font-weight: 700; color: ${T.text3}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .fi, .fsel, .fta { width: 100%; padding: 9px 12px; border: 1px solid ${T.inputBorder}; border-radius: 10px; font-family: 'Tajawal', sans-serif; font-size: 0.85rem; background: ${T.inputBg}; color: ${T.inputText}; transition: border-color 0.2s; }
    .fi:focus, .fsel:focus, .fta:focus { outline: none; border-color: #4f6ef7; box-shadow: 0 0 0 3px rgba(79,110,247,0.1); }
    .fi::placeholder { color: ${T.inputPlaceholder}; }
    .ro { background: ${T.readonlyBg} !important; color: ${T.readonlyText} !important; cursor: default; }
    .fta { resize: vertical; min-height: 70px; }
    .ipg { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .pi { position: relative; width: 90px; height: 90px; border-radius: 10px; overflow: hidden; border: 2px solid ${T.cardBorder}; }
    .pi img { width: 100%; height: 100%; object-fit: cover; }
    .rib { position: absolute; top: 3px; right: 3px; background: #dc2626; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; cursor: pointer; border: none; }
    .ma { display: flex; gap: 10px; margin-top: 22px; }

    /* Delete modal */
    .dm { text-align: center; }
    .dm-i { font-size: 2.8rem; margin-bottom: 10px; }
    .dm-t { font-size: 1.1rem; font-weight: 800; color: ${T.text}; margin-bottom: 7px; }
    .dm-m { color: ${T.text3}; margin-bottom: 20px; font-size: 0.9rem; line-height: 1.5; }

    /* Statement */
    .ss { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .ssc { background: ${T.statementBg}; border: 1px solid ${T.panelBorder}; border-radius: 12px; padding: 18px; }
    .ssc h4 { color: ${T.text2}; margin-bottom: 14px; font-size: 0.95rem; font-weight: 700; }
    .sst { width: 100%; border-collapse: collapse; }
    .sst th, .sst td { padding: 9px 10px; text-align: right; border-bottom: 1px solid ${T.tableBorder}; font-size: 0.82rem; color: ${T.text}; }
    .sst th { color: ${T.text3}; font-weight: 600; }
    .bb { background: ${T.panelBg}; border: 1px solid ${T.panelBorder}; padding: 18px; border-radius: 12px; text-align: center; margin-top: 16px; }
    .bl { font-size: 0.85rem; color: ${T.text3}; margin-bottom: 6px; }
    .bv { font-size: 1.7rem; font-weight: 900; font-family: 'JetBrains Mono', monospace; }
    .bv-p { color: ${T.dangerRed}; }
    .bv-n { color: ${T.successGreen}; }

    /* Image viewer */
    .ivo { position: fixed; inset: 0; background: rgba(0,0,0,0.96); display: flex; align-items: center; justify-content: center; z-index: 1100; }
    .ivc { position: relative; max-width: 90%; max-height: 90vh; }
    .ivi { max-width: 100%; max-height: 80vh; border-radius: 12px; }
    .ivcl { position: absolute; top: -18px; right: -18px; background: #dc2626; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; font-size: 1.1rem; }
    .ivn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(79,110,247,0.8); color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; font-size: 1.3rem; }
    .ivn:hover { background: #4f6ef7; }
    .ivp { left: -22px; }
    .ivnx { right: -22px; }
    .ivco { text-align: center; margin-top: 12px; color: #6b7280; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }

    /* Loading bar */
    .lb { position: fixed; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #4f6ef7, #7c3aed, #4f6ef7, transparent); background-size: 250% 100%; animation: ls 1s linear infinite; z-index: 2000; }
    @keyframes ls { to { background-position: 250% 0; } }

    .sp { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spp 0.6s linear infinite; }
    @keyframes spp { to { transform: rotate(360deg); } }

    @media (max-width: 700px) {
      .fg { grid-template-columns: 1fr; }
      .ss { grid-template-columns: 1fr; }
      .gs { grid-template-columns: 1fr; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      {pdfLoading && <div className="lb" />}

      <div className="vp">
        <div className="vc">

          {/* ---- Header ---- */}
          <div className="vh">
            <div className="vb">
              <div className="vi">⚠️</div>
              <div>
                <h1>المخالفات</h1>
                <p>NileMix · Violations Management</p>
              </div>
            </div>
            <div className="vaa">
              <div className="ttg" onClick={toggleTheme}>
                <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                <span>{theme === 'light' ? 'ليلي' : 'نهاري'}</span>
              </div>
              <button className="btn btn-p btn-sm" onClick={handleExportPDF} disabled={pdfLoading}>
                {pdfLoading ? <><span className="sp" /> جاري...</> : '📄 PDF'}
              </button>
              <button className="btn btn-p btn-sm" onClick={openDeductionModal}>➖ خصم</button>
              <button className="btn btn-p btn-sm" onClick={() => openModal()}>➕ مخالفة</button>
              <button className="btn btn-o btn-sm" onClick={() => navigate('/dashboard')}>← لوحة التحكم</button>
            </div>
          </div>

          {error && <div className="msg msg-e">⚠️ {error}</div>}
          {success && <div className="msg msg-s">✓ {success}</div>}

          {/* ---- Global Summary ---- */}
          <div className="gs">
            <div className="gc">
              <div className="gc-icon gc-icon-b">📊</div>
              <div className="gc-info">
                <div className="gc-label">إجمالي المخالفات</div>
                <div className="gc-val">{globalSummary.totalViolationsAmount.toLocaleString()} <span style={{fontSize:'0.75rem',color:T.text3}}>جنيه</span></div>
              </div>
            </div>
            <div className="gc">
              <div className="gc-icon gc-icon-g">💳</div>
              <div className="gc-info">
                <div className="gc-label">إجمالي التسديدات</div>
                <div className="gc-val" style={{color:T.successGreen}}>{globalSummary.totalDeductionsAmount.toLocaleString()} <span style={{fontSize:'0.75rem',color:T.text3}}>جنيه</span></div>
              </div>
            </div>
            <div className="gc">
              <div className="gc-icon gc-icon-r">⚖️</div>
              <div className="gc-info">
                <div className="gc-label">المتبقي</div>
                <div className="gc-val" style={{color: globalSummary.remainingBalance > 0 ? T.dangerRed : T.successGreen}}>
                  {globalSummary.remainingBalance.toLocaleString()} <span style={{fontSize:'0.75rem',color:T.text3}}>جنيه</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Stats ---- */}
          <div className="sg">
            <div className="sc">
              <div className="si">⚠️</div>
              <div className="sn">{violations.length}</div>
              <div className="sl">إجمالي المخالفات</div>
            </div>
            <div className="sc">
              <div className="si">👥</div>
              <div className="sn">{new Set(violations.map(v => v.employeeCode)).size}</div>
              <div className="sl">موظفين مخالفين</div>
            </div>
          </div>

          {/* ---- Search ---- */}
          <div className="sb">
            <div className="sr">
              <input className="si2" type="text" placeholder="ابحث بكود الموظف، الاسم، كود العربية، أو نوع المخالفة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <span className="sico">🔎</span>
            </div>
            <div className="dr">
              <div className="drg">
                <label className="drl">من تاريخ</label>
                <input type="date" className="di" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="drg">
                <label className="drl">إلى تاريخ</label>
                <input type="date" className="di" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <button className="btn btn-o btn-sm" style={{alignSelf:'flex-end'}} onClick={() => { setStartDate(''); setEndDate(''); }}>مسح</button>
            </div>
          </div>

          {/* ---- Summary Table ---- */}
          <div className="stc">
            <div className="sth"><h3>📊 ملخص المخالفات حسب النوع</h3></div>
            <table className="st">
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>عدد المخالفات</th>
                  <th>إجمالي القيمة</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'الإجمالي', count: summary.totalCount, amount: summary.totalAmount, bold: true },
                  { label: 'المخالفات الفورية', count: summary.fawryCount, amount: summary.fawryAmount },
                  { label: 'المخالفات المضاعفة', count: summary.modafaCount, amount: summary.modafaAmount },
                  { label: 'على الشركة', count: summary.companyCount, amount: summary.companyAmount },
                ].map((row) => (
                  <tr key={row.label}>
                    <td style={{fontWeight: row.bold ? 700 : 400, color: row.bold ? T.text : T.text2}}>{row.label}</td>
                    <td className="mn" style={{fontWeight: 700}}>{row.count}</td>
                    <td className="at">{row.amount.toLocaleString()} جنيه</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---- Main Table ---- */}
          <div className="mtc">
            <div className="th">
              <span className="ttl">
                جميع المخالفات
                {loading && <span style={{marginRight:8}}><span className="sp" style={{borderColor:'#4f6ef7',borderTopColor:'transparent'}} /></span>}
              </span>
              <span className="tbdg">{filteredViolations.length}</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className="dt">
                <thead>
                  <tr>
                    <th style={{width:36}}>#</th>
                    <th>كود الموظف</th>
                    <th>اسم الموظف</th>
                    <th>كود العربية</th>
                    <th>التاريخ</th>
                    <th>نوع المخالفة</th>
                    <th>القيمة</th>
                    <th style={{textAlign:'center',width:60}}>صور</th>
                    <th style={{textAlign:'center',width:110}}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredViolations.length > 0 ? (
                    filteredViolations.map((item, idx) => (
                      <tr key={item._id}>
                        <td className="mn">{idx + 1}</td>
                        <td className="mn">{item.employeeCode}</td>
                        <td style={{fontWeight:600}}>{item.employeeName}</td>
                        <td className="mn">{item.carCode}</td>
                        <td className="mn">{formatDateForPDF(item.violationDate)}</td>
                        <td style={{fontSize:'0.82rem'}}>{item.violationType}</td>
                        <td className="mn at" style={{fontWeight:700}}>{Number(item.amount).toLocaleString()} جنيه</td>
                        <td style={{textAlign:'center'}}>
                          {item.images && item.images.length > 0 && (
                            <span className="ibdg" onClick={() => openImageViewer(item.images)}>🖼 {item.images.length}</span>
                          )}
                        </td>
                        <td>
                          <div className="ab">
                            <button className="axb axe" onClick={() => openModal(item)} title="تعديل">✏️</button>
                            <button className="axb axv" onClick={() => openStatement(item)} title="بيان الموظف">📋</button>
                            <button className="axb axd" onClick={() => setDeleteConfirm(item)} title="حذف">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">
                        <div className="es">
                          <div className="ei">📭</div>
                          <div className="et">{searchTerm || startDate || endDate ? 'لا توجد نتائج تطابق البحث' : 'لا توجد مخالفات حالياً'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>{/* vc */}

        {/* ============ نافذة إضافة خصم ============ */}
        {deductionModalOpen && (
          <div className="mo" onClick={() => setDeductionModalOpen(false)}>
            <div className="mc" onClick={e => e.stopPropagation()}>
              <div className="mti">➖ إضافة خصم / تسديد</div>
              {/* لا form tag - استخدام div مع onClick على الزرار */}
              <div className="fg">
                <div>
                  <label className="fl">كود الموظف *</label>
                  <input className="fi" type="text" placeholder="مثال: 1" value={deductionForm.employeeCode} onChange={handleDeductionEmployeeCodeChange} />
                </div>
                <div>
                  <label className="fl">اسم الموظف</label>
                  <input className="fi ro" type="text" value={deductionForm.employeeName} readOnly />
                </div>
                <div>
                  <label className="fl">تاريخ الخصم *</label>
                  <input className="fi" type="date" value={deductionForm.deductionDate} onChange={(e) => setDeductionForm({ ...deductionForm, deductionDate: e.target.value })} />
                </div>
                <div>
                  <label className="fl">قيمة الخصم (جنيه) *</label>
                  <input className="fi" type="number" placeholder="مثال: 200" value={deductionForm.amount} onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })} />
                </div>
                <div className="ff">
                  <label className="fl">ملاحظات</label>
                  <textarea className="fta" value={deductionForm.notes} onChange={(e) => setDeductionForm({ ...deductionForm, notes: e.target.value })} placeholder="مثال: تسديد جزئي لمخالفات السرعة" />
                </div>
              </div>
              <div className="ma">
                <button className="btn btn-o" style={{flex:1}} onClick={() => setDeductionModalOpen(false)}>إلغاء</button>
                <button className="btn btn-p" style={{flex:1}} onClick={handleSaveDeduction}>💰 حفظ الخصم</button>
              </div>
            </div>
          </div>
        )}

        {/* ============ بيان الموظف ============ */}
        {statementOpen && selectedEmployeeCode && (
          <div className="mo" onClick={() => setStatementOpen(false)}>
            <div className="mc mc-lg" onClick={e => e.stopPropagation()}>
              <div className="mti">📋 بيان حساب: <span style={{color:T.amountColor}}>{selectedEmployeeName}</span> ({selectedEmployeeCode})</div>
              <div className="dr" style={{marginBottom:18}}>
                <div className="drg"><label className="drl">من تاريخ</label><input type="date" className="di" value={statementStartDate} onChange={(e) => setStatementStartDate(e.target.value)} /></div>
                <div className="drg"><label className="drl">إلى تاريخ</label><input type="date" className="di" value={statementEndDate} onChange={(e) => setStatementEndDate(e.target.value)} /></div>
              </div>
              <div className="ss">
                <div className="ssc">
                  <h4>المخالفات ({employeeViolations.length})</h4>
                  <table className="sst">
                    <thead><tr><th>التاريخ</th><th>النوع</th><th>القيمة</th></tr></thead>
                    <tbody>
                      {employeeViolations.map((v, i) => (
                        <tr key={i}><td>{formatDateForPDF(v.violationDate)}</td><td>{v.violationType}</td><td className="mn" style={{fontWeight:700,color:T.amountColor}}>{v.amount} جنيه</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{marginTop:10,fontWeight:700,fontSize:'0.85rem',color:T.text2}}>الإجمالي: <span className="at">{totalViolationsAmount.toLocaleString()} جنيه</span></div>
                </div>
                <div className="ssc">
                  <h4>الخصومات ({employeeDeductions.length})</h4>
                  <table className="sst">
                    <thead><tr><th>التاريخ</th><th>القيمة</th><th>ملاحظات</th></tr></thead>
                    <tbody>
                      {employeeDeductions.map((d, i) => (
                        <tr key={i}><td>{formatDateForPDF(d.deductionDate)}</td><td className="mn" style={{fontWeight:700,color:T.successGreen}}>{d.amount} جنيه</td><td>{d.notes || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{marginTop:10,fontWeight:700,fontSize:'0.85rem',color:T.text2}}>الإجمالي: <span style={{color:T.successGreen,fontFamily:'JetBrains Mono',fontWeight:700}}>{totalDeductionsAmount.toLocaleString()} جنيه</span></div>
                </div>
              </div>
              <div className="bb">
                <div className="bl">الرصيد الباقي</div>
                <div className={`bv ${balance > 0 ? 'bv-p' : 'bv-n'}`}>{balance.toLocaleString()} جنيه</div>
              </div>
              <div className="ma" style={{marginTop:18}}>
                <button className="btn btn-o" style={{flex:1}} onClick={() => setStatementOpen(false)}>إغلاق</button>
              </div>
            </div>
          </div>
        )}

        {/* ============ نافذة إضافة / تعديل مخالفة ============ */}
        {modalOpen && (
          <div className="mo" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
            <div className="mc" onClick={e => e.stopPropagation()}>
              <div className="mti">{editingItem ? '✏️ تعديل مخالفة' : '⚠️ إضافة مخالفة جديدة'}</div>
              {/* div بدلاً من form - الإصلاح الأساسي لـ Electron */}
              <div className="fg">
                <div>
                  <label className="fl">كود الموظف *</label>
                  <input className="fi" type="text" placeholder="مثال: 1" value={formData.employeeCode} onChange={handleEmployeeCodeChange} />
                </div>
                <div>
                  <label className="fl">اسم الموظف</label>
                  <input className="fi ro" type="text" value={formData.employeeName} readOnly />
                </div>
                <div>
                  <label className="fl">كود العربية *</label>
                  <input className="fi" type="text" placeholder="مثال: ABC-4567" value={formData.carCode} onChange={(e) => setFormData({ ...formData, carCode: e.target.value })} />
                </div>
                <div>
                  <label className="fl">تاريخ المخالفة *</label>
                  <input className="fi" type="date" value={formData.violationDate} onChange={(e) => setFormData({ ...formData, violationDate: e.target.value })} />
                </div>
                <div className="ff">
                  <label className="fl">نوع المخالفة *</label>
                  <select className="fsel" value={formData.violationType} onChange={(e) => setFormData({ ...formData, violationType: e.target.value })}>
                    <option value="">اختر نوع المخالفة</option>
                    {violationTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="fl">قيمة المخالفة (جنيه) *</label>
                  <input className="fi" type="number" placeholder="مثال: 500" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <div className="ff">
                  <label className="fl">صور المخالفة</label>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="fi" />
                  <div className="ipg">
                    {previewImages.map((src, index) => (
                      <div key={index} className="pi">
                        <img src={src} alt="preview" />
                        <button className="rib" onClick={() => removeImage(index)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ma">
                <button className="btn btn-o" style={{flex:1}} onClick={() => setModalOpen(false)}>إلغاء</button>
                {/* onClick مباشر - بدون form submit */}
                <button className="btn btn-p" style={{flex:1}} onClick={handleSave}>
                  {editingItem ? '💾 حفظ التعديلات' : '➕ إضافة المخالفة'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ تأكيد الحذف ============ */}
        {deleteConfirm && (
          <div className="mo" onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
            <div className="mc mc-sm">
              <div className="dm">
                <div className="dm-i">🗑️</div>
                <div className="dm-t">تأكيد الحذف</div>
                <div className="dm-m">هل أنت متأكد من حذف مخالفة<br /><strong style={{color:'#4f6ef7'}}>{deleteConfirm.employeeName}</strong>؟</div>
                <div className="ma">
                  <button className="btn btn-o" style={{flex:1}} onClick={() => setDeleteConfirm(null)}>إلغاء</button>
                  <button className="btn btn-danger" style={{flex:1}} onClick={() => handleDelete(deleteConfirm._id)}>تأكيد الحذف</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ عرض الصور ============ */}
        {imageViewerOpen && currentImages.length > 0 && (
          <div className="ivo" onClick={closeImageViewer}>
            <div className="ivc" onClick={(e) => e.stopPropagation()}>
              <button className="ivcl" onClick={closeImageViewer}>×</button>
              <img className="ivi" src={getImageUrl(currentImages[currentImageIndex])} alt={`صورة ${currentImageIndex + 1}`}
                onError={(e) => { e.target.src = "https://via.placeholder.com/800x500?text=خطأ+في+تحميل+الصورة"; }} />
              {currentImages.length > 1 && (
                <>
                  <button className="ivn ivp" onClick={prevImage}>‹</button>
                  <button className="ivn ivnx" onClick={nextImage}>›</button>
                </>
              )}
              <div className="ivco">{currentImageIndex + 1} / {currentImages.length}</div>
            </div>
          </div>
        )}

      </div>{/* vp */}
    </>
  );
}