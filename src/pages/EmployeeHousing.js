// src/pages/EmployeeHousing.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function EmployeeHousing() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const reportPrintRef = useRef(null);
  const [theme, setTheme] = useState('dark');

  // ===== حالات البيانات الأساسية =====
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    alternativePhone: '',
    location: '',
    contractStart: '',
    contractEnd: '',
    notes: '',
    contractImage: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [housings, setHousings] = useState([]);

  // ===== حالات إدارة المصروفات =====
  const [showExpenseForm, setShowExpenseForm] = useState(null);
  const [expenseData, setExpenseData] = useState({
    expenseName: '',
    expenseAmount: '',
  });

  // ===== حالات إدارة الموظفين =====
  const [showEmployeeForm, setShowEmployeeForm] = useState(null);
  const [employeeData, setEmployeeData] = useState({
    employeeCode: '',
    employeeName: '',
    employeeJob: '',
    employeePhone: '',
  });

  // ===== حالات إدارة تجهيزات السكن =====
  const [showEquipmentForm, setShowEquipmentForm] = useState(null);
  const [equipmentData, setEquipmentData] = useState({
    equipmentType: '',
    equipmentCount: '',
    equipmentNotes: '',
  });

  // ===== حالات عرض التفاصيل =====
  const [selectedHousing, setSelectedHousing] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');

  // ===== حالات التقارير =====
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [reportLocationFilter, setReportLocationFilter] = useState('');
  const [reportData, setReportData] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [showImageMap, setShowImageMap] = useState({});
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDetailsPdf, setExportingDetailsPdf] = useState(false);
  const [exportingExpensesPdf, setExportingExpensesPdf] = useState(false);

  // تحميل الثيم
  useEffect(() => {
    const savedTheme = localStorage.getItem('employeeHousingTheme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('employeeHousingTheme', newTheme);
  };

  // ===== تحميل بيانات السكن عند فتح الصفحة =====
  useEffect(() => {
    fetchHousings();
  }, []);

  // ===== دالة جلب بيانات السكن من الخادم =====
  const fetchHousings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/housing`);
      if (res.data.success) {
        setHousings(res.data.data);
        if (selectedHousing && showDetailsModal) {
          const updatedHousing = res.data.data.find(h => h._id === selectedHousing._id);
          if (updatedHousing) {
            setSelectedHousing(updatedHousing);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching housings:', err);
    }
  };

  // ===== معالج تغيير حقول النموذج =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ===== معالج تحميل الصور =====
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('يرجى رفع صورة فقط');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب ألا يتجاوز 5 ميجا بايت');
      return;
    }
    setFormData(prev => ({ ...prev, contractImage: file }));
    setPreviewImage(URL.createObjectURL(file));
    setError('');
  };

  // ===== معالج إرسال نموذج السكن الجديد =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const data = new FormData();
    data.append('ownerName', formData.ownerName);
    data.append('ownerPhone', formData.ownerPhone);
    data.append('alternativePhone', formData.alternativePhone || '');
    data.append('location', formData.location || '');
    data.append('contractStart', formData.contractStart);
    data.append('contractEnd', formData.contractEnd);
    data.append('notes', formData.notes || '');
    if (formData.contractImage) {
      data.append('contractImage', formData.contractImage);
    }

    try {
      const res = await axios.post(`${API_URL}/api/housing`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setSuccess(true);
        fetchHousings();
        setFormData({
          ownerName: '',
          ownerPhone: '',
          alternativePhone: '',
          location: '',
          contractStart: '',
          contractEnd: '',
          notes: '',
          contractImage: null
        });
        setPreviewImage(null);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات السكن');
    } finally {
      setLoading(false);
    }
  };

  // ===== دالة حذف السكن =====
  const handleDeleteHousing = async (housingId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السكن نهائياً؟')) return;
    try {
      const res = await axios.delete(`${API_URL}/api/housing/${housingId}`);
      if (res.data.success) {
        fetchHousings();
        alert('✅ تم حذف السكن بنجاح');
      }
    } catch (err) {
      alert('حدث خطأ أثناء حذف السكن');
    }
  };

  // ===== دالة إضافة مصروف جديد =====
  const handleAddExpense = async (housingId) => {
    if (!expenseData.expenseName || !expenseData.expenseAmount) {
      alert('يرجى إدخال اسم المصروف وقيمته');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/housing/${housingId}/expenses`, {
        expenseName: expenseData.expenseName,
        expenseAmount: parseFloat(expenseData.expenseAmount),
      });
      await fetchHousings();
      setExpenseData({ expenseName: '', expenseAmount: '' });
      setShowExpenseForm(null);
      alert('✅ تم إضافة المصروف بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء إضافة المصروف');
    }
  };

  // ===== دالة حذف مصروف =====
  const handleDeleteExpense = async (housingId, expenseId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    try {
      await axios.delete(`${API_URL}/api/housing/${housingId}/expenses/${expenseId}`);
      await fetchHousings();
      alert('✅ تم حذف المصروف بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء حذف المصروف');
    }
  };

  // ===== دالة إضافة موظف جديد =====
  const handleAddEmployee = async (housingId) => {
    if (!employeeData.employeeName || !employeeData.employeeJob) {
      alert('يرجى إدخال اسم الموظف والوظيفة');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/housing/${housingId}/employees`, employeeData);
      await fetchHousings();
      setEmployeeData({
        employeeCode: '',
        employeeName: '',
        employeeJob: '',
        employeePhone: '',
      });
      setShowEmployeeForm(null);
      alert('✅ تم إضافة الموظف بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء إضافة الموظف');
    }
  };

  // ===== دالة حذف موظف =====
  const handleDeleteEmployee = async (housingId, employeeId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    try {
      await axios.delete(`${API_URL}/api/housing/${housingId}/employees/${employeeId}`);
      await fetchHousings();
      alert('✅ تم حذف الموظف بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء حذف الموظف');
    }
  };

  // ===== دالة إضافة تجهيز جديد =====
  const handleAddEquipment = async (housingId) => {
    if (!equipmentData.equipmentType || !equipmentData.equipmentCount) {
      alert('يرجى إدخال نوع التجهيز والعدد');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/housing/${housingId}/equipment`, equipmentData);
      await fetchHousings();
      setEquipmentData({
        equipmentType: '',
        equipmentCount: '',
        equipmentNotes: '',
      });
      setShowEquipmentForm(null);
      alert('✅ تم إضافة التجهيز بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء إضافة التجهيز');
    }
  };

  // ===== دالة حذف تجهيز =====
  const handleDeleteEquipment = async (housingId, equipmentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التجهيز؟')) return;
    try {
      await axios.delete(`${API_URL}/api/housing/${housingId}/equipment/${equipmentId}`);
      await fetchHousings();
      alert('✅ تم حذف التجهيز بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء حذف التجهيز');
    }
  };

  // ===== فتح نافذة التفاصيل =====
  const openDetailsModal = (housing) => {
    setSelectedHousing(housing);
    setShowDetailsModal(true);
    setActiveTab('employees');
  };

  // ===== إغلاق نافذة التفاصيل =====
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedHousing(null);
    setShowEmployeeForm(null);
    setShowEquipmentForm(null);
    setShowExpenseForm(null);
  };

  // ===== تصدير المصروفات فقط إلى PDF =====
  const exportExpensesToPDF = async () => {
    if (!selectedHousing || !selectedHousing.expenses || selectedHousing.expenses.length === 0) {
      alert('لا توجد مصروفات لتصديرها');
      return;
    }
    
    setExportingExpensesPdf(true);
    try {
      const currentDate = new Date().toLocaleDateString('ar-EG');
      const totalExpenses = selectedHousing.expenses.reduce((sum, exp) => sum + exp.expenseAmount, 0);
      
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        top: -99999px;
        left: -99999px;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: 'Cairo', Arial, sans-serif;
        direction: rtl;
        z-index: -9999;
      `;

      const expensesRows = selectedHousing.expenses.map((exp, idx) => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${exp.expenseName}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #2563eb; font-weight: bold;">${exp.expenseAmount} جنيه</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${new Date(exp.expenseDate).toLocaleDateString('ar-EG')}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${exp.notes || '—'}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb;">
          <h1 style="color: #1e40af; margin: 0;">تقرير المصروفات</h1>
          <p style="color: #64748b;">سكن: ${selectedHousing.ownerName}</p>
          <p style="color: #64748b;">الموقع: ${selectedHousing.location || 'غير محدد'}</p>
          <p style="color: #64748b;">تاريخ التقرير: ${currentDate}</p>
        </div>

        <div style="background: #eff6ff; border: 2px solid #2563eb; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
          <div style="font-size: 15px; color: #1e40af; font-weight: 700; margin-bottom: 8px;">إجمالي المصروفات</div>
          <div style="font-size: 30px; font-weight: 900; color: #1e40af;">${totalExpenses} جنيه</div>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="padding: 10px; border: 1px solid #1e3a8a;">#</th>
              <th style="padding: 10px; border: 1px solid #1e3a8a;">نوع المصروف</th>
              <th style="padding: 10px; border: 1px solid #1e3a8a;">المبلغ</th>
              <th style="padding: 10px; border: 1px solid #1e3a8a;">التاريخ</th>
              <th style="padding: 10px; border: 1px solid #1e3a8a;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>${expensesRows}</tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
          <p>نظام سكن الموظفين - شركة النيل للخرسانة الجاهزة</p>
        </div>
      `;

      document.body.appendChild(container);
      await new Promise(resolve => setTimeout(resolve, 400));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      if (document.body.contains(container)) document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeightMM = (canvas.height / canvas.width) * pdfWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM);
      pdf.save(`مصروفات_${selectedHousing.ownerName}_${Date.now()}.pdf`);
      alert('✅ تم تصدير تقرير المصروفات بنجاح');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('حدث خطأ أثناء تصدير PDF: ' + err.message);
    } finally {
      setExportingExpensesPdf(false);
    }
  };

  // ===== تصدير تفاصيل السكن كامل إلى PDF =====
  const exportHousingDetailsToPDF = async () => {
    if (!selectedHousing) return;
    
    setExportingDetailsPdf(true);
    try {
      const currentDate = new Date().toLocaleDateString('ar-EG');
      const totalExpenses = selectedHousing.expenses ? selectedHousing.expenses.reduce((sum, exp) => sum + exp.expenseAmount, 0) : 0;
      
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        top: -99999px;
        left: -99999px;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: 'Cairo', Arial, sans-serif;
        direction: rtl;
        z-index: -9999;
      `;

      let employeesHTML = '';
      if (selectedHousing.employees && selectedHousing.employees.length > 0) {
        employeesHTML = `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead><tr style="background: #1e40af; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd;">#</th>
              <th style="padding: 10px; border: 1px solid #ddd;">كود الموظف</th>
              <th style="padding: 10px; border: 1px solid #ddd;">الاسم</th>
              <th style="padding: 10px; border: 1px solid #ddd;">الوظيفة</th>
              <th style="padding: 10px; border: 1px solid #ddd;">رقم الهاتف</th>
            </tr></thead>
            <tbody>${selectedHousing.employees.map((emp, idx) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${emp.employeeCode || '—'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${emp.employeeName}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${emp.employeeJob}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${emp.employeePhone || '—'}</td>
              </tr>`).join('')}</tbody>
          </table>`;
      } else {
        employeesHTML = `<div style="text-align: center; padding: 20px; background: #f8fafc; margin-bottom: 20px; border-radius: 10px;">لا يوجد موظفين في هذا السكن</div>`;
      }

      let equipmentHTML = '';
      if (selectedHousing.equipment && selectedHousing.equipment.length > 0) {
        equipmentHTML = `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead><tr style="background: #1e40af; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd;">#</th>
              <th style="padding: 10px; border: 1px solid #ddd;">نوع التجهيز</th>
              <th style="padding: 10px; border: 1px solid #ddd;">العدد</th>
              <th style="padding: 10px; border: 1px solid #ddd;">ملاحظات</th>
            </tr></thead>
            <tbody>${selectedHousing.equipment.map((eq, idx) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${eq.equipmentType}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${eq.equipmentCount}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${eq.equipmentNotes || '—'}</td>
              </tr>`).join('')}</tbody>
          </table>`;
      } else {
        equipmentHTML = `<div style="text-align: center; padding: 20px; background: #f8fafc; margin-bottom: 20px; border-radius: 10px;">لا توجد تجهيزات مسجلة</div>`;
      }

      let expensesHTML = '';
      if (selectedHousing.expenses && selectedHousing.expenses.length > 0) {
        expensesHTML = `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead><tr style="background: #1e40af; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd;">#</th>
              <th style="padding: 10px; border: 1px solid #ddd;">اسم المصروف</th>
              <th style="padding: 10px; border: 1px solid #ddd;">المبلغ</th>
              <th style="padding: 10px; border: 1px solid #ddd;">التاريخ</th>
              <th style="padding: 10px; border: 1px solid #ddd;">ملاحظات</th>
            <tr></thead>
            <tbody>${selectedHousing.expenses.map((exp, idx) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${exp.expenseName}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${exp.expenseAmount} جنيه</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${new Date(exp.expenseDate).toLocaleDateString('ar-EG')}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${exp.notes || '—'}</td>
              </tr>`).join('')}
              <tr style="background: #eff6ff; font-weight: bold;">
                <td colspan="2" style="padding: 10px; text-align: center;">الإجمالي</td>
                <td colspan="3" style="padding: 10px; text-align: center;">${totalExpenses} جنيه</td>
              </tr>
            </tbody>
          </table>`;
      } else {
        expensesHTML = `<div style="text-align: center; padding: 20px; background: #f8fafc; margin-bottom: 20px; border-radius: 10px;">لا توجد مصروفات مسجلة</div>`;
      }

      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb;">
          <h1 style="color: #1e40af; margin: 0;">سكن الموظفين</h1>
          <p style="color: #64748b;">شركة النيل للخرسانة الجاهزة</p>
          <p style="color: #64748b;">تاريخ التقرير: ${currentDate}</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="color: #1e40af; margin-bottom: 20px;">بيانات السكن</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>👤 صاحب العقار:</strong> ${selectedHousing.ownerName}</div>
            <div><strong>📞 رقم الهاتف:</strong> ${selectedHousing.ownerPhone}</div>
            ${selectedHousing.alternativePhone ? `<div><strong>📱 رقم بديل:</strong> ${selectedHousing.alternativePhone}</div>` : ''}
            <div><strong>📍 الموقع:</strong> ${selectedHousing.location || 'غير محدد'}</div>
            <div><strong>📅 بداية العقد:</strong> ${new Date(selectedHousing.contractStart).toLocaleDateString('ar-EG')}</div>
            <div><strong>📅 انتهاء العقد:</strong> ${new Date(selectedHousing.contractEnd).toLocaleDateString('ar-EG')}</div>
          </div>
          ${selectedHousing.notes ? `<div style="margin-top: 15px;"><strong>📝 ملاحظات:</strong> ${selectedHousing.notes}</div>` : ''}
        </div>

        <h2 style="color: #1e40af; margin-bottom: 15px;">👥 الموظفين</h2>
        ${employeesHTML}

        <h2 style="color: #1e40af; margin-bottom: 15px;">🛠️ تجهيزات السكن</h2>
        ${equipmentHTML}

        <h2 style="color: #1e40af; margin-bottom: 15px;">💰 المصروفات</h2>
        ${expensesHTML}

        <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
          <p>نظام سكن الموظفين - شركة النيل للخرسانة الجاهزة</p>
        </div>
      `;

      document.body.appendChild(container);
      await new Promise(resolve => setTimeout(resolve, 400));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      if (document.body.contains(container)) document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeightMM = (canvas.height / canvas.width) * pdfWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM);
      pdf.save(`سكن_${selectedHousing.ownerName}_${Date.now()}.pdf`);
      alert('✅ تم تصدير تقرير السكن بنجاح');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('حدث خطأ أثناء تصدير PDF: ' + err.message);
    } finally {
      setExportingDetailsPdf(false);
    }
  };

  // ===== دالة توليد التقرير =====
  const generateReport = () => {
    if (!reportFromDate || !reportToDate) {
      alert('يرجى اختيار تاريخ البداية والنهاية');
      return;
    }
    const from = new Date(reportFromDate);
    const to = new Date(reportToDate);
    to.setHours(23, 59, 59, 999);
    let filtered = [];

    housings.forEach(housing => {
      if (reportLocationFilter && housing.location !== reportLocationFilter) return;
      if (housing.expenses && housing.expenses.length > 0) {
        housing.expenses.forEach(exp => {
          const expDate = new Date(exp.expenseDate);
          if (expDate >= from && expDate <= to) {
            filtered.push({
              housingName: housing.ownerName,
              location: housing.location || 'غير محدد',
              expenseName: exp.expenseName,
              expenseAmount: exp.expenseAmount,
              expenseDate: exp.expenseDate
            });
          }
        });
      }
    });

    setReportData(filtered);
    setShowReport(true);
  };

  // ===== دالة تصدير التقرير إلى PDF =====
  const exportReportToPDF = async () => {
    if (reportData.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }

    setExportingPdf(true);
    try {
      const totalAmount = reportData.reduce((sum, item) => sum + item.expenseAmount, 0);
      const fromDateFormatted = new Date(reportFromDate).toLocaleDateString('ar-EG');
      const toDateFormatted = new Date(reportToDate).toLocaleDateString('ar-EG');
      const currentDate = new Date().toLocaleDateString('ar-EG');

      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        top: -99999px;
        left: -99999px;
        width: 794px;
        background: #ffffff;
        padding: 40px;
        font-family: 'Cairo', Arial, sans-serif;
        direction: rtl;
        z-index: -9999;
      `;

      const rowsHTML = reportData.map((item, index) => `
        <tr>
          <td style="padding: 10px; text-align: center; border: 1px solid #e2e8f0;">${index + 1}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">${item.housingName}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">${item.location}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">${item.expenseName}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-weight: 700; color: #2563eb;">${item.expenseAmount.toFixed(2)}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #e2e8f0;">${new Date(item.expenseDate).toLocaleDateString('ar-EG')}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb;">
          <div style="font-size: 24px; font-weight: 900; color: #1e40af; margin-bottom: 8px;">تقرير المصروفات - سكن الموظفين</div>
          <div style="font-size: 14px; color: #64748b; margin-bottom: 6px;">شركة النيل للخرسانة الجاهزة</div>
          <div style="font-size: 14px; color: #374151; font-weight: 600;">الفترة من ${fromDateFormatted} إلى ${toDateFormatted}${reportLocationFilter ? ' | الموقع: ' + reportLocationFilter : ''}</div>
        </div>

        <div style="background: #eff6ff; border: 2px solid #2563eb; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
          <div style="font-size: 15px; color: #1e40af; font-weight: 700; margin-bottom: 8px;">إجمالي المصروفات في الفترة المحددة</div>
          <div style="font-size: 30px; font-weight: 900; color: #1e40af;">${totalAmount.toFixed(2)} جنيه</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #1e40af; color: #ffffff;">
              <th style="padding: 12px; text-align: center; border: 1px solid #1e3a8a;">#</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #1e3a8a;">صاحب العقار</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #1e3a8a;">الموقع</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #1e3a8a;">نوع المصروف</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #1e3a8a;">المبلغ (جنيه)</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #1e3a8a;">التاريخ</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
          <span>نظام سكن الموظفين - شركة النيل للخرسانة الجاهزة</span>
          <span>تاريخ الإنشاء: ${currentDate}</span>
        </div>
      `;

      document.body.appendChild(container);
      await new Promise(resolve => setTimeout(resolve, 400));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      if (document.body.contains(container)) document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeightMM = (canvas.height / canvas.width) * pdfWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM);
      pdf.save(`تقرير_المصروفات_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('حدث خطأ أثناء تصدير PDF: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  const totalReport = reportData.reduce((sum, item) => sum + item.expenseAmount, 0);

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          transition: background 0.3s ease;
        }

        .housing-page {
          min-height: 100vh;
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          padding-bottom: 80px;
          transition: background 0.3s ease;
        }

        .housing-header {
          background: ${theme === 'light' ? '#1e40af' : '#0f172a'};
          color: white;
          padding: 20px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          border-bottom: 1px solid ${themeStyles.cardBorder};
        }

        .housing-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .housing-icon {
          width: 50px;
          height: 50px;
          background: ${theme === 'light' ? 'white' : '#1e293b'};
          color: ${theme === 'light' ? '#1e40af' : '#a5b4fc'};
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
        }

        .housing-title {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .housing-subtitle {
          font-size: 13px;
          opacity: 0.85;
          margin-top: 3px;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
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

        .housing-container {
          max-width: 1400px;
          margin: 50px auto;
          padding: 0 20px;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: ${themeStyles.titleColor};
          text-align: center;
          margin-bottom: 40px;
        }

        .housing-card, .report-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 24px;
          box-shadow: 0 20px 40px -12px ${themeStyles.shadow};
          padding: 40px;
          margin-bottom: 60px;
          transition: all 0.3s ease;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 700;
          color: ${themeStyles.titleColor};
          font-size: 14px;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 12px 14px;
          border: 2px solid ${themeStyles.inputBorder};
          border-radius: 12px;
          font-family: 'Cairo', sans-serif;
          font-size: 14px;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          border-color: ${themeStyles.inputFocusBorder};
          outline: none;
          box-shadow: 0 0 0 4px ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .image-upload-area {
          border: 2px dashed ${theme === 'light' ? '#60a5fa' : '#6366f1'};
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          background: ${themeStyles.inputBg};
          margin-bottom: 20px;
        }

        .image-upload-area:hover {
          border-color: ${themeStyles.inputFocusBorder};
          background: ${theme === 'light' ? '#eff6ff' : 'rgba(99, 102, 241, 0.1)'};
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }

        .upload-text {
          font-weight: 700;
          color: ${themeStyles.statValue};
          margin-bottom: 5px;
        }

        .upload-hint {
          font-size: 12px;
          color: ${themeStyles.text3};
        }

        .preview-image {
          max-width: 100%;
          max-height: 250px;
          border-radius: 10px;
          margin-top: 15px;
          border: 2px solid ${themeStyles.inputBorder};
        }

        .btn-submit {
          background: ${themeStyles.primaryBtn};
          color: white;
          border: none;
          padding: 14px 30px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          width: 100%;
          font-family: 'Cairo', sans-serif;
          transition: all 0.25s ease;
        }

        .btn-submit:hover:not(:disabled) {
          background: ${themeStyles.primaryBtnHover};
          transform: translateY(-2px);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .alert-success {
          background: ${themeStyles.successBg};
          color: ${themeStyles.successText};
          padding: 12px 20px;
          border-radius: 14px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .alert-error {
          background: ${themeStyles.errorBg};
          color: ${themeStyles.errorText};
          padding: 12px 20px;
          border-radius: 14px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .housings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 25px;
          margin-bottom: 60px;
        }

        @media (max-width: 768px) {
          .housings-grid {
            grid-template-columns: 1fr;
          }
        }

        .housing-item {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .housing-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -8px ${themeStyles.shadow};
        }

        .housing-item-header {
          padding: 18px 20px;
          background: ${themeStyles.tableHeaderBg};
          color: ${themeStyles.tableHeaderText};
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .header-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-delete {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
        }

        .btn-view {
          background: #22c55e;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          margin-left: 8px;
        }

        .housing-item-body {
          padding: 20px;
          flex: 1;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid ${themeStyles.cardBorder};
        }

        .info-label {
          font-weight: 700;
          color: ${themeStyles.titleColor};
          font-size: 13px;
        }

        .info-value {
          color: ${themeStyles.text2};
          font-size: 13px;
          text-align: left;
        }

        .contract-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 15px 0;
        }

        .date-box {
          background: ${themeStyles.inputBg};
          padding: 10px;
          border-radius: 12px;
          border-right: 3px solid ${themeStyles.statValue};
        }

        .date-label {
          font-weight: 700;
          color: ${themeStyles.titleColor};
          font-size: 12px;
        }

        .date-value {
          color: ${themeStyles.text2};
          font-size: 13px;
          margin-top: 5px;
        }

        .expense-section {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid ${themeStyles.cardBorder};
        }

        .expense-title {
          font-weight: 700;
          color: ${themeStyles.titleColor};
          margin-bottom: 12px;
          font-size: 14px;
        }

        .expense-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: ${themeStyles.inputBg};
          border-radius: 10px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .btn-add-new {
          width: 100%;
          padding: 10px;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.statValue};
          border: 2px solid ${themeStyles.inputBorder};
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 10px;
          font-family: 'Cairo', sans-serif;
          transition: all 0.2s ease;
        }

        .btn-add-new:hover {
          border-color: ${themeStyles.statValue};
        }

        .add-form {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .add-form input {
          padding: 10px;
          border: 2px solid ${themeStyles.inputBorder};
          border-radius: 10px;
          flex: 1;
          min-width: 100px;
          font-family: 'Cairo', sans-serif;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
        }

        .btn-add {
          background: ${themeStyles.primaryBtn};
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
        }

        .btn-cancel {
          background: ${themeStyles.secondaryBtn};
        }

        .modal-overlay-full {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content-full {
          background: ${themeStyles.modalBg};
          border: 1px solid ${themeStyles.modalBorder};
          border-radius: 24px;
          width: 95%;
          max-width: 1200px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        }

        .modal-header-full {
          background: ${themeStyles.tableHeaderBg};
          color: ${themeStyles.tableHeaderText};
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .modal-header-full h3 {
          margin: 0;
          font-size: 1.3rem;
        }

        .modal-header-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .modal-close-full {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
        }

        .modal-print {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
        }

        .modal-print-expenses {
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
        }

        .modal-tabs-full {
          display: flex;
          border-bottom: 2px solid ${themeStyles.cardBorder};
          background: ${themeStyles.inputBg};
          padding: 0 20px;
        }

        .modal-tab-full {
          padding: 15px 25px;
          text-align: center;
          cursor: pointer;
          font-weight: 700;
          color: ${themeStyles.text3};
          border: none;
          background: none;
          font-family: 'Cairo', sans-serif;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .modal-tab-full.active {
          color: ${themeStyles.statValue};
          border-bottom: 3px solid ${themeStyles.statValue};
        }

        .modal-body-full {
          padding: 25px;
          overflow-y: auto;
          flex: 1;
        }

        .employee-item-full, .equipment-item-full, .expense-item-full {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: ${themeStyles.inputBg};
          border-radius: 12px;
          margin-bottom: 12px;
          border-right: 4px solid ${themeStyles.statValue};
        }

        .employee-info-full, .equipment-info-full, .expense-info-full {
          flex: 1;
        }

        .employee-name-full, .equipment-type-full, .expense-name-full {
          font-weight: 700;
          color: ${themeStyles.statValue};
          font-size: 16px;
        }

        .employee-details-full {
          font-size: 13px;
          color: ${themeStyles.text3};
          margin-top: 5px;
        }

        .equipment-count-full {
          font-size: 14px;
          color: ${themeStyles.statValue};
          font-weight: 700;
        }

        .expense-amount-full {
          font-size: 14px;
          color: #dc2626;
          font-weight: 700;
        }

        .btn-small-delete {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .report-filters {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 25px;
        }

        .filter-group {
          flex: 1;
          min-width: 200px;
        }

        .filter-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 700;
          color: ${themeStyles.titleColor};
          font-size: 14px;
        }

        .filter-input {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 2px solid ${themeStyles.inputBorder};
          font-family: 'Cairo', sans-serif;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
        }

        .report-buttons {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .btn-generate-report, .btn-export-pdf {
          flex: 1;
          min-width: 200px;
          padding: 14px;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          transition: all 0.2s ease;
        }

        .btn-generate-report {
          background: ${themeStyles.primaryBtn};
          color: white;
        }

        .btn-export-pdf {
          background: #dc2626;
          color: white;
        }

        .btn-export-pdf:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .report-total {
          background: ${themeStyles.inputBg};
          border: 2px solid ${themeStyles.statBorder};
          padding: 20px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 25px;
        }

        .report-total-label {
          font-weight: 700;
          color: ${themeStyles.titleColor};
          margin-bottom: 10px;
        }

        .report-total-amount {
          font-size: 2rem;
          color: ${themeStyles.statValue};
          font-weight: 900;
        }

        .report-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .report-item {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          background: ${themeStyles.inputBg};
          border-radius: 12px;
          margin-bottom: 10px;
          border-right: 3px solid ${themeStyles.statValue};
        }

        .empty-report, .empty-housings {
          text-align: center;
          padding: 40px;
          color: ${themeStyles.text3};
          background: ${themeStyles.inputBg};
          border-radius: 12px;
          grid-column: 1 / -1;
        }
      `}</style>

      <div className="housing-page">
        <div className="housing-header">
          <div className="housing-brand">
            <div className="housing-icon">🏠</div>
            <div>
              <div className="housing-title">سكن الموظفين</div>
              <div className="housing-subtitle">شركة النيل للخرسانة الجاهزة</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="theme-toggle" onClick={toggleTheme}>
              <span>{theme === 'light' ? '🌙' : '☀️'}</span>
              <span>{theme === 'light' ? 'وضع ليلي' : 'وضع نهاري'}</span>
            </div>
            <button onClick={() => navigate('/dashboard')} className="back-button">
              ← العودة للوحة التحكم
            </button>
          </div>
        </div>

        <div className="housing-container">
          {/* قسم إضافة سكن جديد */}
          <div className="housing-card">
            <h2 className="section-title">📝 إضافة سكن جديد</h2>
            {success && <div className="alert-success">✅ تم حفظ بيانات السكن بنجاح</div>}
            {error && <div className="alert-error">⚠️ {error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>اسم صاحب العقار</label>
                  <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>رقم هاتف صاحب العقار</label>
                  <input type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>رقم هاتف بديل (اختياري)</label>
                  <input type="tel" name="alternativePhone" value={formData.alternativePhone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>موقع السكن</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} />
                </div>
              </div>

              <div className="contract-dates">
                <div className="form-group">
                  <label>بداية العقد</label>
                  <input type="date" name="contractStart" value={formData.contractStart} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>تاريخ انتهاء العقد</label>
                  <input type="date" name="contractEnd" value={formData.contractEnd} onChange={handleChange} required />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: themeStyles.titleColor, display: 'block', marginBottom: '10px' }}>صورة العقد (اختياري)</label>
                <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon">📄</div>
                  <div className="upload-text">اضغط لرفع صورة العقد</div>
                  <div className="upload-hint">PNG أو JPG - الحد الأقصى 5 ميجا بايت</div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden />
                </div>
                {previewImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img src={previewImage} alt="معاينة" className="preview-image" />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>ملاحظات إضافية</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="أي ملاحظات إضافية عن السكن..." />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? '⏳ جاري الحفظ...' : '💾 حفظ بيانات السكن'}
              </button>
            </form>
          </div>

          {/* قسم عرض السكن المسجل */}
          <h2 className="section-title">🏘️ السكن المسجل</h2>
          <div className="housings-grid">
            {housings.length === 0 ? (
              <div className="empty-housings">📭 لا توجد بيانات سكن مسجلة بعد</div>
            ) : (
              housings.map((housing) => (
                <div key={housing._id} className="housing-item">
                  <div className="housing-item-header">
                    <span className="header-name">{housing.ownerName}</span>
                    <div>
                      <button onClick={() => openDetailsModal(housing)} className="btn-view">
                        👥 عرض التفاصيل
                      </button>
                      <button onClick={() => handleDeleteHousing(housing._id)} className="btn-delete">
                        🗑️ حذف
                      </button>
                    </div>
                  </div>

                  <div className="housing-item-body">
                    <div className="info-row">
                      <span className="info-label">📍 الموقع:</span>
                      <span className="info-value">{housing.location || 'غير محدد'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📞 الهاتف:</span>
                      <span className="info-value">{housing.ownerPhone}</span>
                    </div>
                    {housing.alternativePhone && (
                      <div className="info-row">
                        <span className="info-label">📱 رقم بديل:</span>
                        <span className="info-value">{housing.alternativePhone}</span>
                      </div>
                    )}

                    <div className="contract-dates">
                      <div className="date-box">
                        <div className="date-label">📅 بداية العقد</div>
                        <div className="date-value">
                          {new Date(housing.contractStart).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      <div className="date-box">
                        <div className="date-label">📅 انتهاء العقد</div>
                        <div className="date-value">
                          {new Date(housing.contractEnd).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                    </div>

                    {housing.contractImage && (
                      <div>
                        <button
                          onClick={() => setShowImageMap(prev => ({ ...prev, [housing._id]: !prev[housing._id] }))}
                          className="btn-add-new"
                          style={{ marginTop: '10px' }}
                        >
                          {showImageMap[housing._id] ? '🔼 إخفاء الصورة' : '🔽 عرض صورة العقد'}
                        </button>
                        {showImageMap[housing._id] && (
                          <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <img
                              src={`${API_URL}${housing.contractImage}`}
                              alt="صورة العقد"
                              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="expense-section">
                      <div className="expense-title">💰 المصروفات الشهرية</div>
                      <div>
                        {housing.expenses && housing.expenses.length > 0 ? (
                          housing.expenses.map((exp, i) => (
                            <div key={i} className="expense-item">
                              <span>{exp.expenseName}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 700, color: themeStyles.statValue }}>{exp.expenseAmount} جنيه</span>
                                <button
                                  onClick={() => handleDeleteExpense(housing._id, exp._id)}
                                  style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '10px', color: themeStyles.text3 }}>لا توجد مصروفات</div>
                        )}
                      </div>

                      {showExpenseForm === housing._id ? (
                        <div className="add-form">
                          <input
                            type="text"
                            placeholder="اسم المصروف"
                            value={expenseData.expenseName}
                            onChange={(e) => setExpenseData({ ...expenseData, expenseName: e.target.value })}
                          />
                          <input
                            type="number"
                            placeholder="القيمة"
                            value={expenseData.expenseAmount}
                            onChange={(e) => setExpenseData({ ...expenseData, expenseAmount: e.target.value })}
                          />
                          <button className="btn-add" onClick={() => handleAddExpense(housing._id)}>إضافة</button>
                          <button className="btn-add btn-cancel" onClick={() => setShowExpenseForm(null)}>إلغاء</button>
                        </div>
                      ) : (
                        <button className="btn-add-new" onClick={() => setShowExpenseForm(housing._id)}>
                          ➕ إضافة مصروف جديد
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* مودال عرض التفاصيل */}
          {showDetailsModal && selectedHousing && (
            <div className="modal-overlay-full" onClick={closeDetailsModal}>
              <div className="modal-content-full" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-full">
                  <h3>🏠 {selectedHousing.ownerName}</h3>
                  <div className="modal-header-buttons">
                    <button className="modal-print-expenses" onClick={exportExpensesToPDF} disabled={exportingExpensesPdf}>
                      {exportingExpensesPdf ? '⏳ جاري...' : '💰 طباعة المصروفات PDF'}
                    </button>
                    <button className="modal-print" onClick={exportHousingDetailsToPDF} disabled={exportingDetailsPdf}>
                      {exportingDetailsPdf ? '⏳ جاري...' : '📄 طباعة التقرير كامل PDF'}
                    </button>
                    <button className="modal-close-full" onClick={closeDetailsModal}>✕ إغلاق</button>
                  </div>
                </div>

                <div className="modal-tabs-full">
                  <button className={`modal-tab-full ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
                    👥 الموظفين ({selectedHousing.employees?.length || 0})
                  </button>
                  <button className={`modal-tab-full ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>
                    🛠️ تجهيزات السكن ({selectedHousing.equipment?.length || 0})
                  </button>
                  <button className={`modal-tab-full ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
                    💰 المصروفات ({selectedHousing.expenses?.length || 0})
                  </button>
                </div>

                <div className="modal-body-full">
                  {activeTab === 'employees' && (
                    <>
                      <div>
                        {selectedHousing.employees && selectedHousing.employees.length > 0 ? (
                          selectedHousing.employees.map((emp, idx) => (
                            <div key={idx} className="employee-item-full">
                              <div className="employee-info-full">
                                <div className="employee-name-full">
                                  {emp.employeeCode && `[${emp.employeeCode}] `}{emp.employeeName}
                                </div>
                                <div className="employee-details-full">
                                  📋 {emp.employeeJob} • 📞 {emp.employeePhone || 'غير متوفر'}
                                </div>
                              </div>
                              <button className="btn-small-delete" onClick={() => handleDeleteEmployee(selectedHousing._id, emp._id)}>حذف</button>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px', color: themeStyles.text3 }}>📭 لا يوجد موظفين في هذا السكن</div>
                        )}
                      </div>

                      {showEmployeeForm === selectedHousing._id ? (
                        <div className="add-form">
                          <input type="text" placeholder="كود الموظف" value={employeeData.employeeCode} onChange={(e) => setEmployeeData({ ...employeeData, employeeCode: e.target.value })} />
                          <input type="text" placeholder="اسم الموظف" value={employeeData.employeeName} onChange={(e) => setEmployeeData({ ...employeeData, employeeName: e.target.value })} />
                          <input type="text" placeholder="الوظيفة" value={employeeData.employeeJob} onChange={(e) => setEmployeeData({ ...employeeData, employeeJob: e.target.value })} />
                          <input type="tel" placeholder="رقم التلفون" value={employeeData.employeePhone} onChange={(e) => setEmployeeData({ ...employeeData, employeePhone: e.target.value })} />
                          <button className="btn-add" onClick={() => handleAddEmployee(selectedHousing._id)}>إضافة</button>
                          <button className="btn-add btn-cancel" onClick={() => setShowEmployeeForm(null)}>إلغاء</button>
                        </div>
                      ) : (
                        <button className="btn-add-new" onClick={() => setShowEmployeeForm(selectedHousing._id)}>➕ إضافة موظف جديد</button>
                      )}
                    </>
                  )}

                  {activeTab === 'equipment' && (
                    <>
                      <div>
                        {selectedHousing.equipment && selectedHousing.equipment.length > 0 ? (
                          selectedHousing.equipment.map((eq, idx) => (
                            <div key={idx} className="equipment-item-full">
                              <div className="equipment-info-full">
                                <div className="equipment-type-full">{eq.equipmentType}</div>
                                <div className="equipment-count-full">العدد: {eq.equipmentCount}</div>
                                {eq.equipmentNotes && <div style={{ fontSize: '13px', color: themeStyles.text3, marginTop: '5px' }}>📝 {eq.equipmentNotes}</div>}
                              </div>
                              <button className="btn-small-delete" onClick={() => handleDeleteEquipment(selectedHousing._id, eq._id)}>حذف</button>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px', color: themeStyles.text3 }}>🛠️ لا توجد تجهيزات مسجلة</div>
                        )}
                      </div>

                      {showEquipmentForm === selectedHousing._id ? (
                        <div className="add-form">
                          <input type="text" placeholder="نوع التجهيز" value={equipmentData.equipmentType} onChange={(e) => setEquipmentData({ ...equipmentData, equipmentType: e.target.value })} />
                          <input type="number" placeholder="العدد" value={equipmentData.equipmentCount} onChange={(e) => setEquipmentData({ ...equipmentData, equipmentCount: e.target.value })} />
                          <input type="text" placeholder="ملاحظات" value={equipmentData.equipmentNotes} onChange={(e) => setEquipmentData({ ...equipmentData, equipmentNotes: e.target.value })} />
                          <button className="btn-add" onClick={() => handleAddEquipment(selectedHousing._id)}>إضافة</button>
                          <button className="btn-add btn-cancel" onClick={() => setShowEquipmentForm(null)}>إلغاء</button>
                        </div>
                      ) : (
                        <button className="btn-add-new" onClick={() => setShowEquipmentForm(selectedHousing._id)}>➕ إضافة تجهيز جديد</button>
                      )}
                    </>
                  )}

                  {activeTab === 'expenses' && (
                    <>
                      <div>
                        {selectedHousing.expenses && selectedHousing.expenses.length > 0 ? (
                          selectedHousing.expenses.map((exp, idx) => (
                            <div key={idx} className="expense-item-full">
                              <div className="expense-info-full">
                                <div className="expense-name-full">{exp.expenseName}</div>
                                <div className="expense-amount-full">{exp.expenseAmount} جنيه</div>
                                <div style={{ fontSize: '12px', color: themeStyles.text3, marginTop: '5px' }}>
                                  📅 {new Date(exp.expenseDate).toLocaleDateString('ar-EG')}
                                  {exp.notes && ` • 📝 ${exp.notes}`}
                                </div>
                              </div>
                              <button className="btn-small-delete" onClick={() => handleDeleteExpense(selectedHousing._id, exp._id)}>حذف</button>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px', color: themeStyles.text3 }}>💰 لا توجد مصروفات مسجلة</div>
                        )}
                      </div>

                      {showExpenseForm === selectedHousing._id ? (
                        <div className="add-form">
                          <input type="text" placeholder="اسم المصروف" value={expenseData.expenseName} onChange={(e) => setExpenseData({ ...expenseData, expenseName: e.target.value })} />
                          <input type="number" placeholder="القيمة" value={expenseData.expenseAmount} onChange={(e) => setExpenseData({ ...expenseData, expenseAmount: e.target.value })} />
                          <button className="btn-add" onClick={() => handleAddExpense(selectedHousing._id)}>إضافة</button>
                          <button className="btn-add btn-cancel" onClick={() => setShowExpenseForm(null)}>إلغاء</button>
                        </div>
                      ) : (
                        <button className="btn-add-new" onClick={() => setShowExpenseForm(selectedHousing._id)}>➕ إضافة مصروف جديد</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* قسم التقارير */}
          <div className="report-card">
            <h2 className="section-title">📊 تقرير المصروفات</h2>
            <div className="report-filters">
              <div className="filter-group">
                <label className="filter-label">📅 من تاريخ</label>
                <input type="date" value={reportFromDate} onChange={(e) => setReportFromDate(e.target.value)} className="filter-input" />
              </div>
              <div className="filter-group">
                <label className="filter-label">📅 إلى تاريخ</label>
                <input type="date" value={reportToDate} onChange={(e) => setReportToDate(e.target.value)} className="filter-input" />
              </div>
              <div className="filter-group">
                <label className="filter-label">📍 موقع السكن</label>
                <select value={reportLocationFilter} onChange={(e) => setReportLocationFilter(e.target.value)} className="filter-input">
                  <option value="">جميع المواقع</option>
                  {[...new Set(housings.map(h => h.location).filter(Boolean))].map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="report-buttons">
              <button onClick={generateReport} className="btn-generate-report">🔍 عرض التقرير</button>
              <button onClick={exportReportToPDF} className="btn-export-pdf" disabled={!showReport || reportData.length === 0 || exportingPdf}>
                {exportingPdf ? '⏳ جاري التصدير...' : '📥 تصدير PDF'}
              </button>
            </div>

            {showReport && (
              <>
                <div className="report-total">
                  <div className="report-total-label">إجمالي المصروفات في الفترة</div>
                  <div className="report-total-amount">{totalReport.toFixed(2)} جنيه</div>
                </div>

                {reportData.length > 0 ? (
                  <div className="report-list" ref={reportPrintRef}>
                    {reportData.map((item, i) => (
                      <div key={i} className="report-item">
                        <div>
                          <div style={{ fontWeight: 700, color: themeStyles.statValue }}>{item.housingName}</div>
                          <div style={{ fontSize: '12px', color: themeStyles.text3 }}>{item.location}</div>
                          <div style={{ fontSize: '12px', color: themeStyles.text3 }}>{item.expenseName}</div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: themeStyles.statValue }}>{item.expenseAmount} جنيه</div>
                          <div style={{ fontSize: '11px', color: themeStyles.text3 }}>{new Date(item.expenseDate).toLocaleDateString('ar-EG')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-report">📭 لا توجد مصروفات في الفترة المحددة</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}