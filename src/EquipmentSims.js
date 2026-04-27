import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const formatDateSafe = (dateString) => {
  if (!dateString) return '—';
  try {
    const cleanDate = dateString.split('T')[0].trim();
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (year && month && day) return `${day}-${month}-${year}`;
  } catch (e) {}
  return '—';
};

const formatDateForPDF = (dateString) => {
  if (!dateString) return '-';
  try {
    const cleanDate = dateString.split('T')[0].trim();
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (year && month && day) return `${day}-${month}-${year}`;
  } catch (e) {}
  return '-';
};

async function exportEquipmentToPDF(filteredEquipment) {
  if (filteredEquipment.length === 0) {
    alert('لا توجد بيانات لتصديرها');
    return;
  }

  try {
    const currentDate = new Date().toLocaleDateString('ar-EG');

    const printDiv = document.createElement('div');
    printDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 1400px;
      background: #ffffff;
      font-family: Arial, sans-serif;
      direction: rtl;
      padding: 30px;
      box-sizing: border-box;
    `;

    const tableRows = filteredEquipment.map((item, index) => `
      <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${index + 1}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px; font-weight: bold;">${item.equipmentName || '-'}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${item.location || '-'}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${item.deviceType || '-'}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${item.simType || '-'}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${item.simNumber || '-'}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${item.simSerial || '-'}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${item.deviceSerial || '-'}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${formatDateForPDF(item.packageRenewalDate)}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${formatDateForPDF(item.subscriptionRenewalDate)}</td>
        <td style="padding: 8px 6px; text-align: center; border: 1px solid #1e293b; color: #000000; font-size: 9px;">${item.notes || '-'}</td>
      </tr>
    `).join('');

    printDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid #4f6ef7; display: block; width: 100%;">
        <h1 style="color: #1e3a8a; margin: 0 0 8px 0; font-size: 26px; font-weight: bold;">&#128225; تقرير شرايح المعدات</h1>
        <p style="color: #475569; margin: 0 0 4px 0; font-size: 14px;">شركة النيل للخرسانة الجاهزة - NileMix</p>
        <p style="color: #64748b; margin: 0; font-size: 12px;">تاريخ التقرير: ${currentDate}</p>
      </div>
      <div style="display: block; width: 100%;">
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
          <colgroup>
            <col style="width: 3%">
            <col style="width: 12%">
            <col style="width: 10%">
            <col style="width: 9%">
            <col style="width: 8%">
            <col style="width: 10%">
            <col style="width: 11%">
            <col style="width: 10%">
            <col style="width: 8%">
            <col style="width: 9%">
            <col style="width: 10%">
          </colgroup>
          <thead>
            <tr style="background: #1e3a8a;">
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">#</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">اسم المعدة</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">الموقع</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">نوع الجهاز</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">نوع الشريحة</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">رقم الشريحة</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">سيريال الشريحة</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">سيريال الجهاز</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">تجديد الباقة</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">تجديد الاشتراك</th>
              <th style="padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; color: #ffffff; font-size: 9px; font-weight: bold;">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 10px; display: block; width: 100%;">
        <p style="margin: 0 0 4px 0;">نظام إدارة شرايح المعدات - شركة النيل للخرسانة الجاهزة</p>
        <p style="margin: 0;">تم الإنشاء بواسطة NileMix Management System</p>
      </div>
    `;

    document.body.appendChild(printDiv);

    await new Promise(resolve => setTimeout(resolve, 600));

    const canvas = await html2canvas(printDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      foreignObjectRendering: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1400,
    });

    if (document.body.contains(printDiv)) {
      document.body.removeChild(printDiv);
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeightMM = (canvas.height / canvas.width) * pdfWidth;

    let heightLeft = imgHeightMM;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMM);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeightMM;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMM);
      heightLeft -= pdfHeight;
    }

    pdf.save(`NileMix_شرايح_المعدات_${new Date().toISOString().slice(0, 10)}.pdf`);
    alert('✅ تم تصدير PDF بنجاح');
  } catch (err) {
    console.error('PDF export error:', err);
    alert('❌ حدث خطأ أثناء تصدير PDF: ' + err.message);
  }
}

export default function EquipmentSims() {
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [duplicates, setDuplicates] = useState({ simNumber: new Set(), simSerial: new Set() });
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('equipmentSimsTheme') || 'dark';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('equipmentSimsTheme', newTheme);
  };

  const [formData, setFormData] = useState({
    equipmentName: '',
    location: '',
    deviceType: '',
    simType: '',
    deviceSerial: '',
    simNumber: '',
    simSerial: '',
    packageRenewalDate: '',
    subscriptionRenewalDate: '',
    notes: '',
  });

  const fetchAllEquipment = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/equipment-sims`);
      const data = Array.isArray(res.data) ? res.data : [];
      setEquipment(data);
      setFilteredEquipment(data);

      const simNumSet = new Set();
      const simSerSet = new Set();
      const duplicateSimNum = new Set();
      const duplicateSimSer = new Set();

      data.forEach(item => {
        if (item.simNumber) {
          if (simNumSet.has(item.simNumber)) duplicateSimNum.add(item.simNumber);
          else simNumSet.add(item.simNumber);
        }
        if (item.simSerial) {
          if (simSerSet.has(item.simSerial)) duplicateSimSer.add(item.simSerial);
          else simSerSet.add(item.simSerial);
        }
      });
      setDuplicates({ simNumber: duplicateSimNum, simSerial: duplicateSimSer });
    } catch (err) {
      setError('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEquipment();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEquipment(equipment);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    setFilteredEquipment(equipment.filter((item) =>
      (item.equipmentName || '').toLowerCase().includes(term) ||
      (item.location || '').toLowerCase().includes(term) ||
      (item.deviceSerial || '').toLowerCase().includes(term) ||
      (item.simNumber || '').toLowerCase().includes(term) ||
      (item.deviceType || '').toLowerCase().includes(term) ||
      (item.simType || '').toLowerCase().includes(term)
    ));
  }, [searchTerm, equipment]);

  const parseExcelDate = (value) => {
    if (!value || value === '') return null;
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'number') {
      try {
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    }
    let str = String(value).trim();
    if (!str) return null;
    if (str.includes(' ')) {
      str = str.split(' ')[0];
    }
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const first = parseInt(parts[0]);
        const second = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        if (year < 100) year += 2000;
        let date1 = new Date(year, first - 1, second);
        if (!isNaN(date1.getTime()) && date1.getMonth() === first - 1) {
          return date1.toISOString().split('T')[0];
        }
        let date2 = new Date(year, second - 1, first);
        if (!isNaN(date2.getTime()) && date2.getMonth() === second - 1) {
          return date2.toISOString().split('T')[0];
        }
      }
    }
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
    }
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
    console.warn(`⚠️ Unable to parse date: "${value}"`);
    return null;
  };

  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false, header: 1 });
        
        let headerRowIndex = -1;
        let headers = [];
        
        for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          const rowStr = row.join(' ').toLowerCase();
          if (rowStr.includes('اسم المعدة') || rowStr.includes('اسم المعده') || 
              rowStr.includes('سيريل') || rowStr.includes('رقم الشريحة')) {
            headerRowIndex = i;
            headers = row.map(cell => String(cell || '').trim());
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          throw new Error('لم يتم العثور على صف العناوين في الملف');
        }
        
        const columnMapping = {};
        headers.forEach((header, idx) => {
          const headerLower = header.toLowerCase();
          if (headerLower.includes('اسم المعدة') || headerLower.includes('اسم المعده')) {
            columnMapping.equipmentName = idx;
          } else if (headerLower.includes('الموقع')) {
            columnMapping.location = idx;
          } else if (headerLower.includes('نوع الجهاز')) {
            columnMapping.deviceType = idx;
          } else if (headerLower.includes('نوع الشريحة') || headerLower.includes('نوع الشبكة')) {
            columnMapping.simType = idx;
          } else if (headerLower.includes('سيريل الجهاز') || headerLower.includes('سيريال الجهاز')) {
            columnMapping.deviceSerial = idx;
          } else if (headerLower.includes('رقم الشريحة')) {
            columnMapping.simNumber = idx;
          } else if (headerLower.includes('سيريل الشريحة') || headerLower.includes('سيريال الشريحة')) {
            columnMapping.simSerial = idx;
          } else if (headerLower.includes('تجديد الباقة')) {
            columnMapping.packageRenewalDate = idx;
          } else if (headerLower.includes('تجديد الاشتراك')) {
            columnMapping.subscriptionRenewalDate = idx;
          } else if (headerLower.includes('ملاحظات')) {
            columnMapping.notes = idx;
          }
        });
        
        console.log('📋 Column mapping:', columnMapping);
        
        let successCount = 0;
        let failedCount = 0;
        const failedItems = [];
        
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) continue;
          
          try {
            const newItem = {
              equipmentName: columnMapping.equipmentName !== undefined ? 
                String(row[columnMapping.equipmentName] || '').trim() : '',
              location: columnMapping.location !== undefined ? 
                String(row[columnMapping.location] || '').trim() : '',
              deviceType: columnMapping.deviceType !== undefined ? 
                String(row[columnMapping.deviceType] || '').trim() : '',
              simType: columnMapping.simType !== undefined ? 
                String(row[columnMapping.simType] || '').trim() : '',
              deviceSerial: columnMapping.deviceSerial !== undefined ? 
                String(row[columnMapping.deviceSerial] || '').trim() : '',
              simNumber: columnMapping.simNumber !== undefined ? 
                String(row[columnMapping.simNumber] || '').trim() : '',
              simSerial: columnMapping.simSerial !== undefined ? 
                String(row[columnMapping.simSerial] || '').trim() : '',
              packageRenewalDate: null,
              subscriptionRenewalDate: null,
              notes: columnMapping.notes !== undefined ? 
                String(row[columnMapping.notes] || '').trim() : '',
            };
            
            if (columnMapping.subscriptionRenewalDate !== undefined) {
              const rawDate = row[columnMapping.subscriptionRenewalDate];
              const parsedDate = parseExcelDate(rawDate);
              console.log(`📅 Row ${i+1}: Raw="${rawDate}", Parsed="${parsedDate}"`);
              newItem.subscriptionRenewalDate = parsedDate;
            }
            
            if (columnMapping.packageRenewalDate !== undefined) {
              newItem.packageRenewalDate = parseExcelDate(row[columnMapping.packageRenewalDate]);
            }
            
            if (!newItem.equipmentName || newItem.equipmentName === '') {
              failedCount++;
              failedItems.push({ row: i + 1, error: 'اسم المعدة مطلوب', data: row });
              continue;
            }
            
            await axios.post(`${API_URL}/api/equipment-sims`, newItem);
            successCount++;
            
          } catch (err) {
            console.error(`Error saving row ${i + 1}:`, err?.response?.data || err.message);
            failedCount++;
            failedItems.push({ row: i + 1, error: err?.response?.data?.message || err.message });
          }
        }
        
        let message = `✅ تم استيراد ${successCount} سجل بنجاح`;
        if (failedCount > 0) {
          message += `، ❌ فشل ${failedCount} سجل`;
          console.error('Failed items:', failedItems);
        }
        
        if (successCount > 0) {
          setSuccess(message);
        } else {
          setError(`❌ لم يتم استيراد أي سجل. ${failedItems.length > 0 ? 'تفاصيل: ' + failedItems[0]?.error : 'تأكد من تنسيق الملف'}`);
        }
        
        await fetchAllEquipment();
        
      } catch (err) {
        console.error('Import error:', err);
        setError(`❌ حدث خطأ: ${err.message}`);
      } finally {
        setImportLoading(false);
        e.target.value = '';
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        equipmentName: item.equipmentName || '',
        location: item.location || '',
        deviceType: item.deviceType || '',
        simType: item.simType || '',
        deviceSerial: item.deviceSerial || '',
        simNumber: item.simNumber || '',
        simSerial: item.simSerial || '',
        packageRenewalDate: item.packageRenewalDate ? item.packageRenewalDate.split('T')[0] : '',
        subscriptionRenewalDate: item.subscriptionRenewalDate ? item.subscriptionRenewalDate.split('T')[0] : '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        equipmentName: '', location: '', deviceType: '', simType: '',
        deviceSerial: '', simNumber: '', simSerial: '',
        packageRenewalDate: '', subscriptionRenewalDate: '', notes: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API_URL}/api/equipment-sims/${editingItem._id}`, formData);
        setSuccess('تم تعديل البيانات بنجاح');
      } else {
        await axios.post(`${API_URL}/api/equipment-sims`, formData);
        setSuccess('تم إضافة الشريحة بنجاح');
      }
      setModalOpen(false);
      await fetchAllEquipment();
    } catch (err) {
      setError('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/equipment-sims/${id}`);
      setSuccess('تم الحذف بنجاح');
      setDeleteConfirm(null);
      await fetchAllEquipment();
    } catch (err) {
      setError('فشل في الحذف');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف جميع السجلات؟\nهذا الإجراء لا يمكن التراجع عنه!')) return;
    try {
      setDeleteAllConfirm(false);
      const res = await axios.delete(`${API_URL}/api/equipment-sims/all`);
      if (res.status === 200 || res.status === 204) {
        setSuccess('✅ تم حذف جميع السجلات بنجاح');
        setEquipment([]);
        setFilteredEquipment([]);
        setDuplicates({ simNumber: new Set(), simSerial: new Set() });
      } else {
        setError('حدث خطأ أثناء حذف السجلات');
      }
    } catch (err) {
      console.error(err);
      setError('فشل في حذف جميع السجلات.');
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await exportEquipmentToPDF(filteredEquipment);
    } catch (err) {
      setError('حدث خطأ أثناء تصدير PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const uniqueLocations = new Set(equipment.map(item => item.location)).size;
  const uniqueEquipment = new Set(equipment.map(item => item.equipmentName)).size;

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
    dangerBtn: '#ef4444',
    dangerBtnHover: '#dc2626',
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
    duplicateBg: '#fee2e2'
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
    dangerBtn: '#dc2626',
    dangerBtnHover: '#ef4444',
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
    duplicateBg: 'rgba(239, 68, 68, 0.2)'
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
        
        .btn-danger {
          background: ${themeStyles.dangerBtn};
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
        
        .btn-danger:hover {
          background: ${themeStyles.dangerBtnHover};
          transform: translateY(-2px);
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
        
        .warning-message {
          background: ${themeStyles.errorBg};
          color: ${themeStyles.errorText};
          padding: 14px 20px;
          border-radius: 14px;
          margin-bottom: 20px;
          border-right: 4px solid #f59e0b;
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
          min-width: 1200px;
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
        
        .equipment-name {
          font-weight: 800;
          color: ${themeStyles.statValue};
        }
        
        .duplicate-cell {
          background: ${themeStyles.duplicateBg};
          color: ${themeStyles.errorText};
          font-weight: 700;
          position: relative;
        }
        
        .duplicate-cell::before {
          content: '⚠️';
          margin-left: 5px;
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
          max-width: 800px;
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
          .equipment-root {
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

      <div className="equipment-root">
        <div className="content-card">
          <div className="header">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
              <div>
                <div className="title">📡 شرايح المعدات</div>
                <div className="subtitle">إدارة شرايح الأجهزة والمعدات</div>
              </div>
            </div>
            <div className="header-actions">
              <div className="theme-toggle" onClick={toggleTheme}>
                <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                <span>{theme === 'light' ? 'وضع ليلي' : 'وضع نهاري'}</span>
              </div>
              <button className="btn-primary" onClick={handleExportPDF} disabled={pdfLoading}>
                {pdfLoading ? '⏳ جاري التصدير...' : '📄 تصدير PDF'}
              </button>
              <label className="btn-primary" style={{ cursor: 'pointer' }}>
                {importLoading ? '⏳ جاري الاستيراد...' : '📊 رفع إكسيل'}
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelImport} style={{ display: 'none' }} />
              </label>
              <button className="btn-primary" onClick={() => openModal()}>➕ إضافة شريحة</button>
              <button className="btn-danger" onClick={() => setDeleteAllConfirm(true)}>🗑️ حذف الكل</button>
            </div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}
          {success && <div className="success-message">✓ {success}</div>}
          
          {(duplicates.simNumber.size > 0 || duplicates.simSerial.size > 0) && (
            <div className="warning-message">
              ⚠️ تم اكتشاف تكرار في البيانات! (رقم الشريحة أو سيريال الشريحة)
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-value">{uniqueLocations}</div>
              <div className="stat-label">إجمالي المواقع</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔧</div>
              <div className="stat-value">{uniqueEquipment}</div>
              <div className="stat-label">أنواع المعدات</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-value">{equipment.length}</div>
              <div className="stat-label">إجمالي السجلات</div>
            </div>
          </div>

          <div className="search-wrapper">
            <input
              className="search-input"
              type="text"
              placeholder="ابحث باسم المعدة أو الموقع أو رقم الشريحة..."
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
                  <th>اسم المعدة</th>
                  <th>الموقع</th>
                  <th>نوع الجهاز</th>
                  <th>نوع الشريحة</th>
                  <th>رقم الشريحة</th>
                  <th>سيريال الشريحة</th>
                  <th>سيريال الجهاز</th>
                  <th>تجديد الباقة</th>
                  <th>تجديد الاشتراك</th>
                  <th>الملاحظات</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.length > 0 ? (
                  filteredEquipment.map((item, idx) => (
                    <tr key={item._id}>
                      <td>{idx + 1}</td>
                      <td className="equipment-name">{item.equipmentName}</td>
                      <td>{item.location || '—'}</td>
                      <td>{item.deviceType || '—'}</td>
                      <td>{item.simType || '—'}</td>
                      <td className={duplicates.simNumber.has(item.simNumber) ? 'duplicate-cell' : ''}>
                        {item.simNumber || '—'}
                      </td>
                      <td className={duplicates.simSerial.has(item.simSerial) ? 'duplicate-cell' : ''}>
                        {item.simSerial || '—'}
                      </td>
                      <td>{item.deviceSerial || '—'}</td>
                      <td>{formatDateSafe(item.packageRenewalDate)}</td>
                      <td>{formatDateSafe(item.subscriptionRenewalDate)}</td>
                      <td>{item.notes || '—'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => openModal(item)} title="تعديل">✏️</button>
                          <button className="delete-btn" onClick={() => setDeleteConfirm(item)} title="حذف">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12">
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

      {/* Modal for Add/Edit */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              {editingItem ? '✏️ تعديل بيانات الشريحة' : '📡 إضافة شريحة جديدة'}
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-full">
                    <label className="form-label">اسم المعدة *</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      required 
                      placeholder="مثال: خلاطة خرسانة - موديل 2024"
                      value={formData.equipmentName} 
                      onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">الموقع</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="مثال: مصنع القاهرة - خط الإنتاج 1"
                      value={formData.location} 
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">نوع الجهاز</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="مثال: Huawei, ZTE, TP-Link"
                      value={formData.deviceType} 
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">نوع الشريحة</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="مثال: 4G, 5G, IoT"
                      value={formData.simType} 
                      onChange={(e) => setFormData({ ...formData, simType: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">رقم الشريحة</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="مثال: 010XXXXXXXX"
                      value={formData.simNumber} 
                      onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">سيريال الجهاز</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="مثال: SN123456789"
                      value={formData.deviceSerial} 
                      onChange={(e) => setFormData({ ...formData, deviceSerial: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">سيريال الشريحة</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="مثال: 8920XXXXXXXXXX"
                      value={formData.simSerial} 
                      onChange={(e) => setFormData({ ...formData, simSerial: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">تجديد الباقة</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      value={formData.packageRenewalDate}
                      onChange={(e) => setFormData({ ...formData, packageRenewalDate: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">تجديد الاشتراك</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      value={formData.subscriptionRenewalDate}
                      onChange={(e) => setFormData({ ...formData, subscriptionRenewalDate: e.target.value })} 
                    />
                  </div>
                  <div className="form-full">
                    <label className="form-label">الملاحظات</label>
                    <textarea 
                      className="form-textarea" 
                      placeholder="أي ملاحظات إضافية..."
                      value={formData.notes} 
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn-primary">
                  {editingItem ? '💾 حفظ التعديلات' : '➕ إضافة الشريحة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Confirmation */}
      {deleteAllConfirm && (
        <div className="delete-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteAllConfirm(false); }}>
          <div className="delete-modal">
            <div className="delete-icon">⚠️</div>
            <div className="delete-title">تحذير هام</div>
            <div className="delete-message">
              هل أنت متأكد من حذف <strong>جميع</strong> السجلات؟<br />
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>هذا الإجراء لا يمكن التراجع عنه!</span>
            </div>
            <div className="delete-actions">
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteAllConfirm(false)}>إلغاء</button>
              <button className="btn-primary" style={{ flex: 1, background: '#ef4444' }} onClick={handleDeleteAll}>نعم، حذف الكل</button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation */}
      {deleteConfirm && (
        <div className="delete-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
          <div className="delete-modal">
            <div className="delete-icon">🗑️</div>
            <div className="delete-title">تأكيد الحذف</div>
            <div className="delete-message">
              هل أنت متأكد من حذف شريحة<br />
              <span className="delete-location">{deleteConfirm.equipmentName}</span>؟
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
