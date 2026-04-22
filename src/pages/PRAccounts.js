// src/pages/PRAccounts.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PRAccounts = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // نموذج إضافة فاتورة
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');

  // نموذج إضافة صرف جانبي
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState(null);
  const [expenseReceiptPreview, setExpenseReceiptPreview] = useState('');

  // نموذج إضافة صرف داخل الـ Modal
  const [modalExpenseAmount, setModalExpenseAmount] = useState('');
  const [modalExpenseDate, setModalExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalExpenseNotes, setModalExpenseNotes] = useState('');
  const [modalExpenseReceipt, setModalExpenseReceipt] = useState(null);
  const [modalExpenseReceiptPreview, setModalExpenseReceiptPreview] = useState('');

  // متغيرات البحث
  const [searchDescription, setSearchDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // متغيرات التعديل والحذف والصلاحيات
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('');
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // تحميل الثيم
  useEffect(() => {
    const savedTheme = localStorage.getItem('prAccountsTheme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('prAccountsTheme', newTheme);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setUserRole(payload.role || 'user');
        setUserName(payload.name || '');
      } catch (error) {
        console.error('Error parsing token:', error);
        setUserRole('user');
      }
    }
    fetchAllData();
  }, []);

  const canView = () => true;
  const canAdd = () => userRole === 'admin' || userRole === 'gps';
  const canEdit = () => userRole === 'admin';
  const canDelete = () => userRole === 'admin';

  const fetchAllData = async () => {
    try {
      const [invRes, expRes] = await Promise.all([
        axios.get(`${API_URL}/api/pr-accounts/invoices`),
        axios.get(`${API_URL}/api/pr-accounts/expenses`)
      ]);
      setInvoices(invRes.data.invoices || []);
      setExpenses(expRes.data.expenses || []);

      // ====================== DEBUG: طباعة المصروفات للتحقق من receipt field ======================
      console.log('📊 Expenses loaded:', expRes.data.expenses?.length);
      if (expRes.data.expenses?.length > 0) {
        expRes.data.expenses.forEach((exp, i) => {
          console.log(`  Expense ${i + 1}: amount=${exp.amount}, receipt=${exp.receipt}`);
        });
      }
    } catch (err) {
      console.error(err);
      setMessage('فشل في تحميل البيانات');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesDescription = searchDescription === '' || 
      inv.description.toLowerCase().includes(searchDescription.toLowerCase());
    
    let matchesDate = true;
    if (startDate && endDate) {
      const invDate = new Date(inv.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      matchesDate = invDate >= start && invDate <= end;
    } else if (startDate) {
      const invDate = new Date(inv.date);
      const start = new Date(startDate);
      matchesDate = invDate >= start;
    } else if (endDate) {
      const invDate = new Date(inv.date);
      const end = new Date(endDate);
      matchesDate = invDate <= end;
    }
    return matchesDescription && matchesDate;
  });

  const handleDeleteInvoice = async (invoiceId) => {
    if (!canDelete()) {
      setMessage('❌ هذا الإجراء متاح للمسؤول فقط');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم حذف جميع المصروفات المرتبطة بها')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/api/pr-accounts/invoices/${invoiceId}`);
        setMessage('✅ تم حذف الفاتورة بنجاح');
        fetchAllData();
      } catch (err) {
        setMessage('❌ حدث خطأ أثناء حذف الفاتورة');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!canDelete()) {
      setMessage('❌ هذا الإجراء متاح للمسؤول فقط');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/api/pr-accounts/expenses/${expenseId}`);
        setMessage('✅ تم حذف المصروف بنجاح');
        fetchAllData();
      } catch (err) {
        setMessage('❌ حدث خطأ أثناء حذف المصروف');
      } finally {
        setLoading(false);
      }
    }
  };

  const openEditInvoice = (invoice) => {
    if (!canEdit()) {
      setMessage('❌ هذا الإجراء متاح للمسؤول فقط');
      return;
    }
    setEditingInvoice(invoice);
    setShowEditModal(true);
  };

  const openEditExpense = (expense) => {
    if (!canEdit()) {
      setMessage('❌ هذا الإجراء متاح للمسؤول فقط');
      return;
    }
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/pr-accounts/invoices/${editingInvoice._id}`, {
        date: editingInvoice.date,
        description: editingInvoice.description,
        totalAmount: editingInvoice.totalAmount
      });
      setMessage('✅ تم تعديل الفاتورة بنجاح');
      setShowEditModal(false);
      setEditingInvoice(null);
      fetchAllData();
    } catch (err) {
      setMessage('❌ حدث خطأ أثناء تعديل الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/pr-accounts/expenses/${editingExpense._id}`, {
        amount: editingExpense.amount,
        date: editingExpense.date,
        notes: editingExpense.notes
      });
      setMessage('✅ تم تعديل المصروف بنجاح');
      setShowEditModal(false);
      setEditingExpense(null);
      fetchAllData();
    } catch (err) {
      setMessage('❌ حدث خطأ أثناء تعديل المصروف');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    if (!canAdd()) {
      setMessage('❌ ليس لديك صلاحية لإضافة فواتير');
      return;
    }
    if (!invoiceDescription || !invoiceTotal) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/pr-accounts/invoices`, {
        date: invoiceDate,
        description: invoiceDescription,
        totalAmount: parseFloat(invoiceTotal)
      });
      setMessage('تم إضافة الفاتورة بنجاح ✅');
      setInvoiceDescription('');
      setInvoiceTotal('');
      fetchAllData();
    } catch (err) {
      setMessage('حدث خطأ أثناء إضافة الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, isModal = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isModal) {
        setModalExpenseReceipt(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setModalExpenseReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setExpenseReceipt(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setExpenseReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadReceipt = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('receipt', file);
    try {
      const response = await axios.post(`${API_URL}/api/pr-accounts/upload/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('📸 Upload response:', response.data);
      // ====================== الإصلاح: استخدام filePath من الـ response ======================
      return response.data.filePath || null;
    } catch (err) {
      console.error('Error uploading file:', err);
      return null;
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!canAdd()) {
      setMessage('❌ ليس لديك صلاحية لإضافة مصروفات');
      return;
    }
    if (!selectedInvoiceId || !expenseAmount) return;

    setLoading(true);
    try {
      let receiptPath = null;
      if (expenseReceipt) {
        receiptPath = await uploadReceipt(expenseReceipt);
        console.log('📸 Receipt path to save:', receiptPath);
      }

      await axios.post(`${API_URL}/api/pr-accounts/expenses`, {
        invoiceId: selectedInvoiceId,
        amount: parseFloat(expenseAmount),
        date: expenseDate,
        notes: expenseNotes,
        receipt: receiptPath
      });
      setMessage('تم تسجيل الصرف بنجاح ✅');
      setExpenseAmount('');
      setExpenseNotes('');
      setExpenseReceipt(null);
      setExpenseReceiptPreview('');
      fetchAllData();
    } catch (err) {
      setMessage('حدث خطأ أثناء تسجيل الصرف');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpenseInModal = async (e) => {
    e.preventDefault();
    if (!canAdd()) {
      setMessage('❌ ليس لديك صلاحية لإضافة مصروفات');
      return;
    }
    if (!selectedInvoice || !modalExpenseAmount) return;

    setLoading(true);
    try {
      let receiptPath = null;
      if (modalExpenseReceipt) {
        receiptPath = await uploadReceipt(modalExpenseReceipt);
        console.log('📸 Modal receipt path to save:', receiptPath);
      }

      await axios.post(`${API_URL}/api/pr-accounts/expenses`, {
        invoiceId: selectedInvoice._id,
        amount: parseFloat(modalExpenseAmount),
        date: modalExpenseDate,
        notes: modalExpenseNotes,
        receipt: receiptPath
      });
      setMessage('تم تسجيل الصرف بنجاح ✅');
      setModalExpenseAmount('');
      setModalExpenseNotes('');
      setModalExpenseReceipt(null);
      setModalExpenseReceiptPreview('');
      fetchAllData();
      closeModal();
    } catch (err) {
      setMessage('حدث خطأ أثناء تسجيل الصرف');
    } finally {
      setLoading(false);
    }
  };

  const getRemaining = (invoice) => {
    const invoiceExpenses = expenses.filter(exp => exp.invoiceId === invoice._id);
    const totalPaid = invoiceExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return invoice.totalAmount - totalPaid;
  };

  const totalInvoices = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = expenses.filter(exp => filteredInvoices.some(inv => inv._id === exp.invoiceId)).reduce((sum, exp) => sum + exp.amount, 0);
  const totalRemaining = totalInvoices - totalPaid;

  const openInvoiceDetails = (inv) => setSelectedInvoice(inv);
  const closeModal = () => {
    setSelectedInvoice(null);
    setModalExpenseReceipt(null);
    setModalExpenseReceiptPreview('');
  };

  const resetSearch = () => {
    setSearchDescription('');
    setStartDate('');
    setEndDate('');
  };

  const getRoleText = () => {
    switch(userRole) {
      case 'admin': return 'مدير النظام';
      case 'gps': return 'مسؤول GPS';
      default: return 'مستخدم';
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  // ====================== الإصلاح الرئيسي: دالة viewReceipt المصلحة ======================
  const viewReceipt = (receiptPath) => {
    if (!receiptPath) {
      setMessage('❌ لا يوجد إيصال لهذا المصروف');
      return;
    }

    let fullUrl;

    // الحالة 1: المسار يبدأ بـ http أو https (URL كامل)
    if (receiptPath.startsWith('http://') || receiptPath.startsWith('https://')) {
      fullUrl = receiptPath;
    }
    // الحالة 2: المسار يبدأ بـ /uploads/receipts/ (الصيغة الجديدة الصحيحة)
    else if (receiptPath.startsWith('/uploads/receipts/')) {
      fullUrl = `${API_URL}${receiptPath}`;
    }
    // الحالة 3: المسار يبدأ بـ /uploads/ (أي مجلد في uploads)
    else if (receiptPath.startsWith('/uploads/')) {
      fullUrl = `${API_URL}${receiptPath}`;
    }
    // الحالة 4: المسار يبدأ بـ /receipts/ (الصيغة القديمة)
    else if (receiptPath.startsWith('/receipts/')) {
      fullUrl = `${API_URL}${receiptPath}`;
    }
    // الحالة 5: مجرد اسم ملف بدون مسار
    else if (!receiptPath.includes('/')) {
      fullUrl = `${API_URL}/uploads/receipts/${receiptPath}`;
    }
    // الحالة 6: أي مسار آخر - استخرج اسم الملف واستخدم المسار الافتراضي
    else {
      const filename = receiptPath.split('/').pop();
      fullUrl = `${API_URL}/uploads/receipts/${filename}`;
    }

    console.log('📸 Opening receipt:', {
      originalPath: receiptPath,
      fullUrl: fullUrl
    });

    setSelectedReceipt(fullUrl);
    setShowReceiptModal(true);
  };

  const exportTotalReport = async () => {
    setLoading(true);
    try {
      const currentDate = new Date().toLocaleDateString('ar-EG');
      
      const reportElement = document.createElement('div');
      reportElement.style.cssText = `
        position: fixed;
        top: -99999px;
        left: -99999px;
        width: 1200px;
        background: white;
        padding: 40px;
        direction: rtl;
        font-family: 'Cairo', 'Arial', sans-serif;
        color: #000000;
        z-index: -9999;
      `;
      
      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #000000;">
          <h1 style="color: #000000; font-size: 28px; margin: 0; font-weight: bold;">NileMix</h1>
          <p style="color: #000000; font-size: 16px; margin-top: 8px; font-weight: 500;">إدارة العلاقات العامة والأمن</p>
          <p style="color: #000000; font-size: 14px; margin-top: 12px;">📅 تاريخ التقرير: ${currentDate}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #000000; font-size: 20px; margin-bottom: 20px; font-weight: bold;">📋 قائمة الفواتير</h2>
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000;">
            <thead>
              <tr style="background-color: #e0e0e0;">
                <th style="padding: 12px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">#</th>
                <th style="padding: 12px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">التاريخ</th>
                <th style="padding: 12px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">وصف الفاتورة</th>
                <th style="padding: 12px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">القيمة (ج.م)</th>
                <th style="padding: 12px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">المدفوع (ج.م)</th>
                <th style="padding: 12px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">المتبقي (ج.م)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoices.map((inv, index) => {
                const remaining = getRemaining(inv);
                const paid = inv.totalAmount - remaining;
                return `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #000000; text-align: center; color: #000000;">${index + 1}</td>
                    <td style="padding: 10px; border: 1px solid #000000; text-align: center; color: #000000;">${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                    <td style="padding: 10px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: 500;">${inv.description}</td>
                    <td style="padding: 10px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: bold;">${inv.totalAmount.toLocaleString('ar-EG')}</td>
                    <td style="padding: 10px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: bold;">${paid.toLocaleString('ar-EG')}</td>
                    <td style="padding: 10px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: bold;">${remaining.toLocaleString('ar-EG')}</td>
                  </tr>
                `;
              }).join('')}
              ${filteredInvoices.length === 0 ? `
                <tr>
                  <td colspan="6" style="padding: 40px; border: 1px solid #000000; text-align: center; color: #000000;">لا توجد فواتير</td>
                </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr style="background-color: #e0e0e0; font-weight: bold;">
                <td colspan="3" style="padding: 12px; border: 1px solid #000000; text-align: center; color: #000000;">الإجمالي</td>
                <td style="padding: 12px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: bold;">${totalInvoices.toLocaleString('ar-EG')}</td>
                <td style="padding: 12px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: bold;">${totalPaid.toLocaleString('ar-EG')}</td>
                <td style="padding: 12px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: bold;">${totalRemaining.toLocaleString('ar-EG')}</td>
               </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #cccccc; text-align: center; color: #666666; font-size: 11px;">
          <p>تم إنشاء هذا التقرير بواسطة NileMix - إدارة العلاقات العامة والأمن</p>
        </div>
      `;
      
      document.body.appendChild(reportElement);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(reportElement, { 
        scale: 3, 
        backgroundColor: '#ffffff', 
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`NileMix_تقرير_الحسابات_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.removeChild(reportElement);
      setMessage('✅ تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('❌ حدث خطأ أثناء تصدير التقرير');
    } finally {
      setLoading(false);
    }
  };

  const exportInvoiceReport = async (invoice) => {
    setLoading(true);
    try {
      const invoiceExpenses = expenses.filter(exp => exp.invoiceId === invoice._id);
      const remaining = getRemaining(invoice);
      const paid = invoice.totalAmount - remaining;
      
      const reportElement = document.createElement('div');
      reportElement.style.cssText = `
        position: fixed;
        top: -99999px;
        left: -99999px;
        width: 1000px;
        background: white;
        padding: 35px;
        direction: rtl;
        font-family: 'Cairo', 'Arial', sans-serif;
        color: #000000;
        z-index: -9999;
      `;
      
      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000000; font-size: 26px; margin: 0; font-weight: bold;">NileMix</h1>
          <p style="color: #000000; font-size: 14px; margin-top: 5px;">إدارة العلاقات العامة والأمن</p>
          <div style="height: 2px; background: #000000; margin: 15px auto; width: 120px;"></div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000;">
            <tr>
              <td style="padding: 12px; border: 1px solid #000000; font-weight: bold; color: #000000; background-color: #f5f5f5;">تاريخ الفاتورة</td>
              <td style="padding: 12px; border: 1px solid #000000; color: #000000;">${new Date(invoice.date).toLocaleDateString('ar-EG')}</td>
              <td style="padding: 12px; border: 1px solid #000000; font-weight: bold; color: #000000; background-color: #f5f5f5;">تاريخ التقرير</td>
              <td style="padding: 12px; border: 1px solid #000000; color: #000000;">${new Date().toLocaleDateString('ar-EG')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #000000; font-weight: bold; color: #000000; background-color: #f5f5f5;">وصف الفاتورة</td>
              <td colspan="3" style="padding: 12px; border: 1px solid #000000; color: #000000; font-weight: 500;">${invoice.description}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #000000; font-weight: bold; color: #000000; background-color: #f5f5f5;">القيمة الكلية</td>
              <td style="padding: 12px; border: 1px solid #000000; color: #000000; font-weight: bold;">${invoice.totalAmount.toLocaleString('ar-EG')} ج.م</td>
              <td style="padding: 12px; border: 1px solid #000000; font-weight: bold; color: #000000; background-color: #f5f5f5;">المدفوع</td>
              <td style="padding: 12px; border: 1px solid #000000; color: #000000; font-weight: bold;">${paid.toLocaleString('ar-EG')} ج.م</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #000000; font-weight: bold; color: #000000; background-color: #f5f5f5;">المتبقي</td>
              <td colspan="3" style="padding: 12px; border: 1px solid #000000; color: #000000; font-weight: bold;">${remaining.toLocaleString('ar-EG')} ج.م</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #000000; font-size: 18px; margin-bottom: 15px; font-weight: bold;">💳 المدفوعات على هذه الفاتورة</h3>
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000;">
            <thead>
              <tr style="background-color: #e0e0e0;">
                <th style="padding: 10px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">#</th>
                <th style="padding: 10px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">تاريخ الصرف</th>
                <th style="padding: 10px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">المبلغ (ج.م)</th>
                <th style="padding: 10px; border: 1px solid #000000; text-align: center; font-weight: bold; color: #000000;">الملاحظات</th>
               </tr>
            </thead>
            <tbody>
              ${invoiceExpenses.map((exp, index) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #000000; text-align: center; color: #000000;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #000000; text-align: center; color: #000000;">${new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                  <td style="padding: 8px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: bold;">${exp.amount.toLocaleString('ar-EG')}</td>
                  <td style="padding: 8px; border: 1px solid #000000; text-align: center; color: #000000;">${exp.notes || '—'}</td>
                </tr>
              `).join('')}
              ${invoiceExpenses.length === 0 ? `
                <tr>
                  <td colspan="4" style="padding: 40px; border: 1px solid #000000; text-align: center; color: #000000;">لا توجد مدفوعات</td>
                </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr style="background-color: #e0e0e0; font-weight: bold;">
                <td colspan="2" style="padding: 10px; border: 1px solid #000000; text-align: center; color: #000000;">الإجمالي</td>
                <td colspan="2" style="padding: 10px; border: 1px solid #000000; text-align: center; color: #000000; font-weight: bold;">${paid.toLocaleString('ar-EG')} ج.م</td>
               </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="margin-top: 25px; padding-top: 12px; border-top: 1px solid #cccccc; text-align: center; color: #666666; font-size: 10px;">
          <p>NileMix - إدارة العلاقات العامة والأمن</p>
        </div>
      `;
      
      document.body.appendChild(reportElement);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(reportElement, { 
        scale: 3, 
        backgroundColor: '#ffffff', 
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`NileMix_فاتورة_${invoice.description.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.removeChild(reportElement);
      setMessage('✅ تم تصدير الفاتورة بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('❌ حدث خطأ أثناء تصدير الفاتورة');
    } finally {
      setLoading(false);
    }
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

        .pr-root {
          min-height: 100vh;
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          transition: background 0.3s ease;
        }

        .pr-header {
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

        .user-role-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
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

        .pr-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px -12px ${themeStyles.shadow};
        }

        .stat-card.total { border-right: 4px solid #3b82f6; }
        .stat-card.paid { border-right: 4px solid #f97316; }
        .stat-card.remaining { border-right: 4px solid #22c55e; }

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

        .stat-card.total .stat-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .stat-card.paid .stat-icon { background: rgba(249, 115, 22, 0.1); color: #f97316; }
        .stat-card.remaining .stat-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }

        .stat-label {
          font-size: 0.85rem;
          color: ${themeStyles.text3};
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: ${themeStyles.titleColor};
          line-height: 1;
        }

        .stat-unit {
          font-size: 0.7rem;
          color: ${themeStyles.text3};
          margin-top: 5px;
        }

        .search-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .search-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .search-group {
          display: flex;
          flex-direction: column;
        }

        .search-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: ${themeStyles.text2};
          margin-bottom: 8px;
        }

        .search-input, .search-select {
          padding: 12px 16px;
          border: 1.5px solid ${themeStyles.inputBorder};
          border-radius: 12px;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          transition: all 0.25s ease;
        }

        .search-input:focus, .search-select:focus {
          outline: none;
          border-color: ${themeStyles.inputFocusBorder};
          box-shadow: 0 0 0 3px ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};
        }

        .reset-btn, .export-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .reset-btn {
          background: ${themeStyles.secondaryBtn};
          color: white;
        }
        .reset-btn:hover { background: ${themeStyles.secondaryBtnHover}; transform: translateY(-2px); }

        .export-btn {
          background: #10b981;
          color: white;
        }
        .export-btn:hover { background: #059669; transform: translateY(-2px); }
        .export-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .forms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .form-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          overflow: hidden;
        }

        .form-header {
          padding: 15px 20px;
          text-align: center;
          font-weight: 800;
          font-size: 1rem;
        }

        .form-header.add { background: #10b981; color: white; }
        .form-header.expense { background: #f97316; color: white; }

        .form-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: ${themeStyles.text2};
          margin-bottom: 8px;
        }

        .form-group input, .form-group select, .form-group textarea {
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

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: ${themeStyles.inputFocusBorder};
          box-shadow: 0 0 0 3px ${theme === 'light' ? 'rgba(79, 110, 247, 0.1)' : 'rgba(99, 102, 241, 0.15)'};
        }

        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .file-input {
          padding: 8px !important;
          cursor: pointer;
        }

        .receipt-preview {
          margin-top: 10px;
          max-width: 100%;
          max-height: 150px;
          border-radius: 8px;
          border: 1px solid ${themeStyles.cardBorder};
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

        .submit-btn.add { background: #10b981; }
        .submit-btn.add:hover { background: #059669; transform: translateY(-2px); }
        .submit-btn.expense { background: #f97316; }
        .submit-btn.expense:hover { background: #ea580c; transform: translateY(-2px); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .table-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          overflow: hidden;
        }

        .table-header {
          padding: 18px 20px;
          background: ${themeStyles.inputBg};
          border-bottom: 1px solid ${themeStyles.cardBorder};
        }

        .table-header h3 {
          font-size: 1.1rem;
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
          min-width: 900px;
        }

        th {
          background: ${themeStyles.tableHeaderBg};
          color: ${themeStyles.tableHeaderText};
          padding: 14px 12px;
          text-align: center;
          font-weight: 800;
          font-size: 0.8rem;
          border: 1px solid ${themeStyles.tableBorder};
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

        .action-btn {
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          padding: 5px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .view-btn { color: #3b82f6; }
        .view-btn:hover { background: rgba(59, 130, 246, 0.1); transform: scale(1.1); }
        .edit-btn { color: #f59e0b; }
        .edit-btn:hover { background: rgba(245, 158, 11, 0.1); transform: scale(1.1); }
        .delete-btn { color: #ef4444; }
        .delete-btn:hover { background: rgba(239, 68, 68, 0.1); transform: scale(1.1); }
        .receipt-btn { color: #8b5cf6; }
        .receipt-btn:hover { background: rgba(139, 92, 246, 0.1); transform: scale(1.1); }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: ${themeStyles.text3};
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 15px;
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
          max-width: 1000px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          padding: 18px 25px;
          background: ${themeStyles.tableHeaderBg};
          color: ${themeStyles.tableHeaderText};
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .modal-header h3 { margin: 0; font-size: 1.2rem; }
        .modal-close { background: #ef4444; color: white; border: none; padding: 6px 18px; border-radius: 8px; cursor: pointer; font-weight: 700; }
        .modal-export { background: #10b981; color: white; border: none; padding: 6px 18px; border-radius: 8px; cursor: pointer; font-weight: 700; }

        .modal-body {
          padding: 25px;
          overflow-y: auto;
          max-height: calc(90vh - 70px);
        }

        .receipt-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
        }

        .message {
          margin-top: 20px;
          padding: 12px;
          border-radius: 12px;
          text-align: center;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .message.success {
          background: ${themeStyles.successBg};
          color: ${themeStyles.successText};
        }

        .message.error {
          background: ${themeStyles.errorBg};
          color: ${themeStyles.errorText};
        }

        /* ====================== ستايل خاص لعرض حالة الإيصال في الجدول ====================== */
        .receipt-status-yes {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .receipt-status-yes:hover {
          background: rgba(139, 92, 246, 0.3);
          transform: scale(1.05);
        }

        .receipt-status-no {
          color: ${themeStyles.text3};
          font-size: 0.75rem;
        }
      `}</style>

      <div className="pr-root">
        {/* الهيدر */}
        <div className="pr-header">
          <div className="header-container">
            <button onClick={goBack} className="back-button">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>رجوع</span>
            </button>
            <div className="header-title">
              <h1>حسابات إدارة العلاقات العامة والأمن</h1>
              <p>إدارة الفواتير والمصروفات مع إمكانية رفع الإيصالات</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="theme-toggle" onClick={toggleTheme}>
                <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                <span>{theme === 'light' ? 'وضع ليلي' : 'وضع نهاري'}</span>
              </div>
              <div className="user-role-badge">
                👤 {userName || 'مستخدم'} | 🔑 {getRoleText()}
              </div>
            </div>
          </div>
        </div>

        <div className="pr-container">
          {/* بطاقات الإجماليات */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📋</div>
              <div className="stat-label">إجمالي الفواتير</div>
              <div className="stat-value">{totalInvoices.toLocaleString('ar-EG')}</div>
              <div className="stat-unit">جنيه مصري</div>
            </div>
            <div className="stat-card paid">
              <div className="stat-icon">💸</div>
              <div className="stat-label">إجمالي المدفوع</div>
              <div className="stat-value">{totalPaid.toLocaleString('ar-EG')}</div>
              <div className="stat-unit">جنيه مصري</div>
            </div>
            <div className="stat-card remaining">
              <div className="stat-icon">⚡</div>
              <div className="stat-label">الرصيد المتبقي</div>
              <div className="stat-value" style={{ color: totalRemaining >= 0 ? '#22c55e' : '#ef4444' }}>
                {totalRemaining.toLocaleString('ar-EG')}
              </div>
              <div className="stat-unit">جنيه مصري</div>
            </div>
          </div>

          {/* شريط البحث */}
          <div className="search-card">
            <div className="search-grid">
              <div className="search-group">
                <label className="search-label">🔍 بحث بالوصف</label>
                <input
                  type="text"
                  value={searchDescription}
                  onChange={(e) => setSearchDescription(e.target.value)}
                  placeholder="ابحث عن فاتورة..."
                  className="search-input"
                />
              </div>
              <div className="search-group">
                <label className="search-label">📅 من تاريخ</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="search-input" />
              </div>
              <div className="search-group">
                <label className="search-label">📅 إلى تاريخ</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="search-input" />
              </div>
              <div className="search-group" style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-end' }}>
                <button onClick={resetSearch} className="reset-btn">
                  🔄 إعادة تعيين
                </button>
                <button onClick={exportTotalReport} disabled={loading} className="export-btn">
                  📄 {loading ? 'جاري...' : 'تصدير التقرير'}
                </button>
              </div>
            </div>
          </div>

          {/* نماذج الإضافة */}
          {canAdd() && (
            <div className="forms-grid">
              <div className="form-card">
                <div className="form-header add">➕ إضافة فاتورة جديدة</div>
                <form onSubmit={handleAddInvoice} className="form-body">
                  <div className="form-group">
                    <label>📅 تاريخ الفاتورة</label>
                    <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>📝 وصف الفاتورة</label>
                    <input type="text" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)} placeholder="شراء أجهزة..." required />
                  </div>
                  <div className="form-group">
                    <label>💰 القيمة الكلية (جنيه)</label>
                    <input type="number" value={invoiceTotal} onChange={(e) => setInvoiceTotal(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={loading} className="submit-btn add">
                    {loading ? '⏳ جاري الحفظ...' : '✅ إضافة الفاتورة'}
                  </button>
                </form>
              </div>

              <div className="form-card">
                <div className="form-header expense">💸 إضافة صرف من فاتورة</div>
                <form onSubmit={handleAddExpense} className="form-body">
                  <div className="form-group">
                    <label>📋 اختر الفاتورة</label>
                    <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)} required>
                      <option value="">-- اختر فاتورة --</option>
                      {invoices.map(inv => (
                        <option key={inv._id} value={inv._id}>
                          {inv.description} - {inv.totalAmount.toLocaleString('ar-EG')} ج.م
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>💰 المبلغ المصروف</label>
                    <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>📅 تاريخ الصرف</label>
                    <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>📝 ملاحظات</label>
                    <textarea value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} placeholder="دفعت للمورد..." />
                  </div>
                  <div className="form-group">
                    <label>🖼️ إرفاق إيصال (صورة)</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, false)} className="file-input" />
                    {expenseReceiptPreview && (
                      <img src={expenseReceiptPreview} alt="Preview" className="receipt-preview" />
                    )}
                  </div>
                  <button type="submit" disabled={loading} className="submit-btn expense">
                    {loading ? '⏳ جاري الحفظ...' : '✅ تسجيل الصرف'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* جدول الفواتير */}
          <div className="table-card">
            <div className="table-header">
              <h3>📋 الفواتير ({filteredInvoices.length})</h3>
              <p>عرض جميع الفواتير المسجلة</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>التاريخ</th>
                    <th>وصف الفاتورة</th>
                    <th>القيمة الكلية</th>
                    <th>المدفوع</th>
                    <th>المتبقي</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv, index) => {
                    const remaining = getRemaining(inv);
                    const paid = inv.totalAmount - remaining;
                    return (
                      <tr key={inv._id}>
                        <td>{index + 1}</td>
                        <td>{new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                        <td style={{ fontWeight: '600' }}>{inv.description}</td>
                        <td style={{ color: '#3b82f6', fontWeight: 'bold' }}>{inv.totalAmount.toLocaleString('ar-EG')} ج.م</td>
                        <td style={{ color: '#f97316', fontWeight: 'bold' }}>{paid.toLocaleString('ar-EG')} ج.م</td>
                        <td style={{ color: '#22c55e', fontWeight: 'bold' }}>{remaining.toLocaleString('ar-EG')} ج.م</td>
                        <td>
                          <button onClick={() => openInvoiceDetails(inv)} className="action-btn view-btn" title="عرض التفاصيل">👁️</button>
                          {canEdit() && (
                            <>
                              <button onClick={() => openEditInvoice(inv)} className="action-btn edit-btn" title="تعديل">✏️</button>
                              <button onClick={() => handleDeleteInvoice(inv._id)} className="action-btn delete-btn" title="حذف">🗑️</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-state">
                          <div className="empty-icon">📭</div>
                          <div>لا توجد فواتير مطابقة للبحث</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>

        {/* مودال التعديل */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingInvoice(null); setEditingExpense(null); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingInvoice ? '✏️ تعديل الفاتورة' : '✏️ تعديل المصروف'}</h3>
                <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingInvoice(null); setEditingExpense(null); }}>✕ إغلاق</button>
              </div>
              <div className="modal-body">
                {editingInvoice ? (
                  <form onSubmit={handleUpdateInvoice}>
                    <div className="form-group">
                      <label>📅 التاريخ</label>
                      <input type="date" value={editingInvoice.date?.split('T')[0] || ''} onChange={(e) => setEditingInvoice({...editingInvoice, date: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>📝 الوصف</label>
                      <input type="text" value={editingInvoice.description} onChange={(e) => setEditingInvoice({...editingInvoice, description: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>💰 القيمة</label>
                      <input type="number" value={editingInvoice.totalAmount} onChange={(e) => setEditingInvoice({...editingInvoice, totalAmount: parseFloat(e.target.value)})} required />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button type="submit" disabled={loading} className="submit-btn add" style={{ flex: 1 }}>💾 حفظ</button>
                      <button type="button" className="reset-btn" onClick={() => { setShowEditModal(false); setEditingInvoice(null); }} style={{ flex: 1 }}>إلغاء</button>
                    </div>
                  </form>
                ) : editingExpense ? (
                  <form onSubmit={handleUpdateExpense}>
                    <div className="form-group">
                      <label>💰 المبلغ</label>
                      <input type="number" value={editingExpense.amount} onChange={(e) => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value)})} required />
                    </div>
                    <div className="form-group">
                      <label>📅 التاريخ</label>
                      <input type="date" value={editingExpense.date?.split('T')[0] || ''} onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>📝 ملاحظات</label>
                      <input type="text" value={editingExpense.notes || ''} onChange={(e) => setEditingExpense({...editingExpense, notes: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button type="submit" disabled={loading} className="submit-btn expense" style={{ flex: 1 }}>💾 حفظ</button>
                      <button type="button" className="reset-btn" onClick={() => { setShowEditModal(false); setEditingExpense(null); }} style={{ flex: 1 }}>إلغاء</button>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* مودال تفاصيل الفاتورة */}
        {selectedInvoice && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📄 تفاصيل الفاتورة - {selectedInvoice.description}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => exportInvoiceReport(selectedInvoice)} disabled={loading} className="modal-export">
                    📄 {loading ? 'جاري...' : 'تصدير PDF'}
                  </button>
                  <button onClick={closeModal} className="modal-close">✕ إغلاق</button>
                </div>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ background: themeStyles.inputBg, padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: themeStyles.text3 }}>📅 التاريخ</p>
                    <p style={{ fontWeight: 'bold' }}>{new Date(selectedInvoice.date).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div style={{ background: themeStyles.inputBg, padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: themeStyles.text3 }}>💰 القيمة الكلية</p>
                    <p style={{ fontWeight: 'bold', color: '#3b82f6' }}>{selectedInvoice.totalAmount.toLocaleString('ar-EG')} ج.م</p>
                  </div>
                  <div style={{ background: themeStyles.inputBg, padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: themeStyles.text3 }}>⚡ المتبقي</p>
                    <p style={{ fontWeight: 'bold', color: '#22c55e' }}>{getRemaining(selectedInvoice).toLocaleString('ar-EG')} ج.م</p>
                  </div>
                </div>

                <h4 style={{ marginBottom: '15px', color: themeStyles.titleColor }}>💳 المدفوعات على هذه الفاتورة</h4>
                <div className="table-wrapper">
                  <table style={{ minWidth: 'auto' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>تاريخ الصرف</th>
                        <th>المبلغ</th>
                        <th>الملاحظات</th>
                        {/* ====================== عمود الإيصال - مع إصلاح العرض ====================== */}
                        <th>الإيصال</th>
                        {canEdit() && <th>إجراءات</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses
                        .filter(exp => {
                          // ====================== الإصلاح: مقارنة الـ IDs بشكل صحيح ======================
                          const expInvoiceId = exp.invoiceId?._id || exp.invoiceId;
                          const selectedId = selectedInvoice._id;
                          return String(expInvoiceId) === String(selectedId);
                        })
                        .map((exp, index) => (
                          <tr key={exp._id}>
                            <td>{index + 1}</td>
                            <td>{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                            <td style={{ color: '#f97316', fontWeight: 'bold' }}>{exp.amount.toLocaleString('ar-EG')} ج.م</td>
                            <td>{exp.notes || '—'}</td>
                            {/* ====================== الإصلاح الرئيسي: عرض زر الإيصال بشكل صحيح ====================== */}
                            <td>
                              {exp.receipt ? (
                                <button
                                  onClick={() => viewReceipt(exp.receipt)}
                                  className="receipt-status-yes"
                                  title={`عرض الإيصال: ${exp.receipt}`}
                                >
                                  🖼️ عرض الإيصال
                                </button>
                              ) : (
                                <span className="receipt-status-no">لا يوجد إيصال</span>
                              )}
                            </td>
                            {canEdit() && (
                              <td>
                                <button onClick={() => openEditExpense(exp)} className="action-btn edit-btn" title="تعديل المصروف">✏️</button>
                                <button onClick={() => handleDeleteExpense(exp._id)} className="action-btn delete-btn" title="حذف المصروف">🗑️</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      {expenses.filter(exp => {
                        const expInvoiceId = exp.invoiceId?._id || exp.invoiceId;
                        return String(expInvoiceId) === String(selectedInvoice._id);
                      }).length === 0 && (
                        <tr><td colSpan={canEdit() ? "6" : "5"}><div className="empty-state"><div className="empty-icon">📭</div><div>لا توجد مدفوعات على هذه الفاتورة بعد</div></div></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {canAdd() && (
                  <>
                    <h4 style={{ margin: '20px 0 15px', color: themeStyles.titleColor }}>➕ إضافة صرف جديد</h4>
                    <form onSubmit={handleAddExpenseInModal} style={{ background: themeStyles.inputBg, padding: '20px', borderRadius: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div>
                          <label className="search-label">💰 المبلغ</label>
                          <input type="number" value={modalExpenseAmount} onChange={(e) => setModalExpenseAmount(e.target.value)} className="search-input" required />
                        </div>
                        <div>
                          <label className="search-label">📅 التاريخ</label>
                          <input type="date" value={modalExpenseDate} onChange={(e) => setModalExpenseDate(e.target.value)} className="search-input" />
                        </div>
                        <div>
                          <label className="search-label">📝 ملاحظات</label>
                          <input type="text" value={modalExpenseNotes} onChange={(e) => setModalExpenseNotes(e.target.value)} className="search-input" placeholder="دفعت لـ..." />
                        </div>
                        <div>
                          <label className="search-label">🖼️ إرفاق إيصال</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, true)} className="file-input" />
                          {modalExpenseReceiptPreview && (
                            <img src={modalExpenseReceiptPreview} alt="Preview" className="receipt-preview" />
                          )}
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="submit-btn expense" style={{ marginTop: '15px' }}>
                        {loading ? '⏳ جاري الحفظ...' : '✅ تسجيل الصرف على الفاتورة'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* مودال عرض الإيصال - محسّن */}
        {showReceiptModal && selectedReceipt && (
          <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h3>🖼️ عرض الإيصال</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* زر فتح الصورة في تاب جديد */}
                  <a
                    href={selectedReceipt}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontSize: '0.85rem'
                    }}
                  >
                    🔗 فتح في تاب جديد
                  </a>
                  <button className="modal-close" onClick={() => setShowReceiptModal(false)}>✕ إغلاق</button>
                </div>
              </div>
              <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
                {/* ====================== الإصلاح: عرض الصورة مع معالجة أفضل للأخطاء ====================== */}
                <img
                  src={selectedReceipt}
                  alt="الإيصال"
                  className="receipt-image"
                  onLoad={() => console.log('✅ Receipt image loaded successfully:', selectedReceipt)}
                  onError={(e) => {
                    console.error('❌ Image failed to load:', selectedReceipt);
                    // محاولة مسار بديل إذا فشل المسار الأساسي
                    const currentSrc = e.target.src;
                    const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

                    if (currentSrc.includes('/uploads/receipts/')) {
                      // جرب المسار البديل /receipts/
                      const filename = currentSrc.split('/').pop();
                      const altUrl = `${API}/receipts/${filename}`;
                      console.log('🔄 Trying alternative URL:', altUrl);
                      e.target.src = altUrl;
                    } else {
                      // عرض رسالة خطأ
                      e.target.style.display = 'none';
                      e.target.insertAdjacentHTML('afterend', `
                        <div style="padding: 40px; text-align: center; color: #ef4444;">
                          <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                          <p style="font-weight: bold; margin-bottom: 10px;">فشل في تحميل الإيصال</p>
                          <p style="font-size: 0.8rem; word-break: break-all; color: #94a3b8;">${currentSrc}</p>
                          <a href="${currentSrc}" target="_blank" style="color: #3b82f6; margin-top: 10px; display: block;">🔗 محاولة فتح الرابط مباشرة</a>
                        </div>
                      `);
                    }
                  }}
                />
                <p style={{ marginTop: '10px', fontSize: '0.7rem', color: themeStyles.text3, wordBreak: 'break-all' }}>
                  {selectedReceipt}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PRAccounts;