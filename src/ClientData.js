import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ClientData() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  // تحميل الثيم المحفوظ
  useEffect(() => {
    const savedTheme = localStorage.getItem('clientDataTheme') || 'dark';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('clientDataTheme', newTheme);
  };

  const fetchAllEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/client-data/employees`);
      const data = Array.isArray(res.data) ? res.data : [];
      setAllEmployees(data);
      setFilteredEmployees(data);
    } catch (err) {
      console.error(err);
      setError('فشل في جلب بيانات الموظفين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setSuccess('');
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, {
          type: 'binary',
          codepage: 65001
        });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          blankrows: false,
          defval: "",
          raw: false
        });

        console.log("📊 البيانات الخام من Excel:", jsonData);

        const processed = [];
        let headers = [];

        if (jsonData.length > 0) {
          headers = jsonData[0].map(cell => String(cell || '').trim());
        }

        console.log("📌 عناوين الأعمدة:", headers);

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const cleaned = row.map(cell => {
            if (cell === null || cell === undefined) return '';
            return String(cell).trim();
          });

          if (cleaned.every(cell => cell === '')) continue;

          let employeeCode = cleaned[1] || '';
          let employeeName = cleaned[2] || '';

          // محاولة استخراج الكود والاسم إذا لم يكن في الأعمدة المتوقعة
          if (!employeeCode && !employeeName) {
            for (let cell of cleaned) {
              if (/^\d+$/.test(cell) && cell.length >= 1 && cell.length <= 15) {
                if (!employeeCode) employeeCode = cell;
              } else if (cell.length > 2 && /[\u0600-\u06FF]/.test(cell)) {
                if (!employeeName) employeeName = cell;
              }
            }
          }

          if (employeeCode && employeeName) {
            let finalCode = employeeCode;
            if (/^\d+$/.test(employeeCode)) {
              finalCode = String(parseInt(employeeCode, 10));
            }

            processed.push({
              employeeCode: finalCode,
              employeeName: employeeName
            });
          }
        }

        console.log("✅ البيانات المعالجة:", processed);

        if (processed.length === 0) {
          setError(`لم يتم العثور على بيانات صالحة.\n\nالملف الذي رفعته يحتوي على ${jsonData.length} صف.\nتأكد من أن الملف يحتوي على الهيكل التالي:\n• العمود الأول: المسلسل (سيتم تجاهله)\n• العمود الثاني: كود الموظف\n• العمود الثالث: اسم الموظف الكامل\n• العمود الرابع: الرقم التأميني (اختياري)`);
        } else {
          setPreviewData(processed);
          setSuccess(`✅ تم قراءة ${processed.length} موظف بنجاح`);
        }
      } catch (err) {
        console.error(err);
        setError('فشل في قراءة الملف. تأكد أنه ملف Excel حقيقي (.xlsx أو .xls)');
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleSubmit = async () => {
    if (previewData.length === 0) {
      setError('لا توجد بيانات للحفظ');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(`${API_URL}/api/client-data/bulk`, {
        employees: previewData
      });

      setSuccess(res.data.message || `✅ تم حفظ ${previewData.length} موظف بنجاح`);
      setPreviewData([]);
      setFile(null);
      await fetchAllEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في حفظ البيانات');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف جميع بيانات الموظفين؟\nهذا الإجراء لا يمكن التراجع عنه!')) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await axios.delete(`${API_URL}/api/client-data/employees`);
      setSuccess('✅ تم حذف جميع البيانات بنجاح');
      setAllEmployees([]);
      setFilteredEmployees([]);
    } catch (err) {
      setError('فشل في حذف البيانات');
    } finally {
      setDeleting(false);
    }
  };

  // فلترة البحث
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(allEmployees);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = allEmployees.filter(emp =>
      (emp.employeeCode || '').toLowerCase().includes(term) ||
      (emp.employeeName || '').toLowerCase().includes(term)
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, allEmployees]);

  // ألوان الثيم
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
    tableHeaderBg: '#1e3a8a',
    tableHeaderText: '#ffffff',
    tableRowHover: '#f1f5f9',
    tableBorder: '#e2e8f0',
    errorBg: '#fef2f2',
    errorText: '#dc2626',
    successBg: '#ecfdf5',
    successText: '#10b981',
    uploadBtnBg: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
    uploadBtnHover: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    deleteBtnBg: '#ef4444',
    deleteBtnHover: '#dc2626',
    backBtnBg: '#64748b',
    backBtnHover: '#475569',
    helpBg: '#f8fafc',
    helpBorder: '#e2e8f0',
    helpText: '#64748b',
    fileBorder: '#4f6ef7',
    fileHoverBg: '#f8fafc',
    shadow: 'rgba(0, 0, 0, 0.08)',
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
    tableRowHover: 'rgba(99, 102, 241, 0.1)',
    tableBorder: '#334155',
    errorBg: 'rgba(239, 68, 68, 0.15)',
    errorText: '#f87171',
    successBg: 'rgba(16, 185, 129, 0.15)',
    successText: '#34d399',
    uploadBtnBg: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
    uploadBtnHover: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    deleteBtnBg: '#dc2626',
    deleteBtnHover: '#ef4444',
    backBtnBg: '#475569',
    backBtnHover: '#64748b',
    helpBg: '#0f172a',
    helpBorder: '#334155',
    helpText: '#94a3b8',
    fileBorder: '#6366f1',
    fileHoverBg: 'rgba(99, 102, 241, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
       
        * { margin: 0; padding: 0; box-sizing: border-box; }
       
        body {
          background: ${themeStyles.bg};
          font-family: 'Cairo', sans-serif;
          transition: background 0.3s ease;
        }
       
        .client-root {
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
        }
       
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
       
        .back-btn {
          background: ${themeStyles.backBtnBg};
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
          background: ${themeStyles.backBtnHover};
          transform: scale(1.05);
        }
       
        .title {
          font-size: 1.8rem;
          font-weight: 900;
          color: ${themeStyles.titleColor};
        }
       
        .subtitle {
          color: ${themeStyles.subtitleColor};
          font-size: 0.9rem;
          margin-top: 4px;
        }
       
        .theme-toggle {
          background: ${themeStyles.helpBg};
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
       
        .error-message {
          background: ${themeStyles.errorBg};
          color: ${themeStyles.errorText};
          padding: 14px 20px;
          border-radius: 14px;
          margin-bottom: 20px;
          border-right: 4px solid ${themeStyles.errorText};
          white-space: pre-line;
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
       
        .data-card {
          background: ${themeStyles.cardBg};
          border: 1px solid ${themeStyles.cardBorder};
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 28px;
          transition: all 0.3s ease;
        }
       
        .data-card:hover {
          border-color: ${themeStyles.cardHoverBorder};
          box-shadow: 0 10px 25px -8px ${themeStyles.shadow};
        }
       
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
        }
       
        .card-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: ${themeStyles.text};
          display: flex;
          align-items: center;
          gap: 10px;
        }
       
        .file-input {
          width: 100%;
          padding: 14px;
          border: 2px dashed ${themeStyles.fileBorder};
          border-radius: 16px;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
        }
       
        .file-input:hover {
          background: ${themeStyles.fileHoverBg};
          border-color: ${theme === 'light' ? '#2563eb' : '#818cf8'};
        }
       
        .help-text {
          margin-top: 16px;
          color: ${themeStyles.helpText};
          font-size: 0.8rem;
          line-height: 1.7;
          background: ${themeStyles.helpBg};
          padding: 16px;
          border-radius: 14px;
          border: 1px solid ${themeStyles.helpBorder};
        }
       
        .help-text strong {
          color: ${themeStyles.text2};
        }
       
        .upload-btn {
          background: ${themeStyles.uploadBtnBg};
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
        }
       
        .upload-btn:hover:not(:disabled) {
          background: ${themeStyles.uploadBtnHover};
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(79, 110, 247, 0.3);
        }
       
        .upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
       
        .delete-btn {
          background: ${themeStyles.deleteBtnBg};
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
          white-space: nowrap;
        }
       
        .delete-btn:hover:not(:disabled) {
          background: ${themeStyles.deleteBtnHover};
          transform: translateY(-2px);
        }
       
        .delete-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
       
        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }
       
        .search-input {
          width: 100%;
          padding: 12px 16px 12px 45px;
          border: 1.5px solid ${themeStyles.inputBorder};
          border-radius: 14px;
          font-size: 13px;
          outline: none;
          transition: all 0.25s ease;
          font-family: 'Cairo', sans-serif;
          background: ${themeStyles.inputBg};
          color: ${themeStyles.text};
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
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: ${themeStyles.text3};
          font-size: 16px;
        }
       
        .table-container {
          max-height: 500px;
          overflow-y: auto;
          border-radius: 16px;
          border: 1px solid ${themeStyles.tableBorder};
        }
       
        table {
          width: 100%;
          border-collapse: collapse;
        }
       
        th {
          background: ${themeStyles.tableHeaderBg};
          color: ${themeStyles.tableHeaderText};
          padding: 14px;
          text-align: center;
          font-weight: 800;
          font-size: 0.85rem;
          position: sticky;
          top: 0;
        }
       
        td {
          padding: 12px;
          text-align: center;
          border-bottom: 1px solid ${themeStyles.tableBorder};
          font-size: 0.85rem;
          color: ${themeStyles.text2};
        }
       
        tr:hover td {
          background: ${themeStyles.tableRowHover};
        }
       
        .code-cell {
          font-weight: 800;
          color: ${theme === 'light' ? '#1e40af' : '#a5b4fc'};
          font-family: monospace;
          font-size: 0.9rem;
        }
       
        .empty-state {
          padding: 60px;
          text-align: center;
          color: ${themeStyles.text3};
        }
       
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
       
        .flex-start {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
       
        .data-card {
          animation: fadeInUp 0.4s ease both;
        }
       
        @media (max-width: 768px) {
          .client-root { padding: 20px; }
          .content-card { padding: 20px; }
          .title { font-size: 1.3rem; }
          .search-wrapper { max-width: 100%; }
          .card-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="client-root">
        <div className="content-card">
          <div className="header">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
              <div>
                <div className="title">📋 بيانات الموظفين</div>
                <div className="subtitle">رفع • بحث • إدارة بيانات الموظفين</div>
              </div>
            </div>
            <div className="theme-toggle" onClick={toggleTheme}>
              <span>{theme === 'light' ? '🌙' : '☀️'}</span>
              <span>{theme === 'light' ? 'وضع ليلي' : 'وضع نهاري'}</span>
            </div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}
          {success && <div className="success-message">✓ {success}</div>}

          {/* رفع ملف Excel */}
          <div className="data-card">
            <div className="card-title">
              <span>📂</span> رفع ملف Excel
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="file-input"
            />
            <div className="help-text">
              <strong>📌 هيكل الملف المطلوب:</strong><br />
              • العمود الأول: المسلسل (سيتم تجاهله تلقائياً)<br />
              • العمود الثاني: <strong>كود الموظف</strong> (مثال: 1, 2, 3, 8, 9, 10, 17)<br />
              • العمود الثالث: <strong>اسم الموظف</strong> الكامل<br />
              • العمود الرابع: الرقم التأميني (اختياري)<br />
              <br />
              <strong>✅ مثال لصف صحيح:</strong><br />
              1 | 1 | هانى محمد حسن محمد على العدل | 42150432
            </div>
          </div>

          {/* معاينة البيانات */}
          {previewData.length > 0 && (
            <div className="data-card">
              <div className="card-header">
                <div className="card-title">
                  <span>🔍</span> معاينة البيانات ({previewData.length})
                </div>
                <button 
                  onClick={handleSubmit} 
                  disabled={uploading} 
                  className="upload-btn"
                >
                  {uploading ? '⏳ جاري الحفظ...' : '💾 حفظ البيانات في قاعدة البيانات'}
                </button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>كود الموظف</th>
                      <th>اسم الموظف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="code-cell">{item.employeeCode}</td>
                        <td style={{ textAlign: 'right' }}>{item.employeeName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* قائمة الموظفين المسجلين */}
          <div className="data-card">
            <div className="card-header">
              <div className="card-title">
                <span>👥</span> قائمة الموظفين المسجلين ({filteredEmployees.length})
              </div>
              <div className="flex-start">
                <div className="search-wrapper">
                  <input
                    type="text"
                    placeholder="ابحث بالكود أو بالاسم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleting || allEmployees.length === 0}
                  className="delete-btn"
                >
                  {deleting ? '⏳ جاري الحذف...' : '🗑️ حذف الكل'}
                </button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>كود الموظف</th>
                    <th>اسم الموظف</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp, idx) => (
                      <tr key={emp._id || idx}>
                        <td>{idx + 1}</td>
                        <td className="code-cell">{emp.employeeCode}</td>
                        <td style={{ textAlign: 'right' }}>{emp.employeeName}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">
                        <div className="empty-state">
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                          <div>لا توجد بيانات حالياً</div>
                          <div style={{ fontSize: '12px', marginTop: '8px' }}>
                            قم برفع ملف Excel لإضافة الموظفين
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
