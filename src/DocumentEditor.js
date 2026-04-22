// src/DocumentEditor.js
import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// ─── حوار إدراج جدول ───────────────────────────────────────────────────────
function TableDialog({ onInsert, onClose }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hov, setHov] = useState({ r: 2, c: 2 });
  return (
    <div className="tbl-overlay" onClick={onClose}>
      <div className="tbl-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="tbl-title">إدراج جدول</h3>
        <div className="tbl-hint">{hov.r + 1} × {hov.c + 1}</div>
        <div className="tbl-grid">
          {Array.from({ length: 10 }).map((_, r) => Array.from({ length: 10 }).map((_, c) => (
            <div
              key={`${r}-${c}`}
              className={`tbl-cell ${r <= hov.r && c <= hov.c ? 'on' : ''}`}
              onMouseEnter={() => setHov({ r, c })}
              onClick={() => onInsert(r + 1, c + 1)}
            />
          )))}
        </div>
        <div className="tbl-manual">
          <div className="tbl-field">
            <label>الصفوف</label>
            <input type="number" min="1" max="50" value={rows} onChange={e => setRows(+e.target.value)} />
          </div>
          <div className="tbl-field">
            <label>الأعمدة</label>
            <input type="number" min="1" max="20" value={cols} onChange={e => setCols(+e.target.value)} />
          </div>
        </div>
        <div className="tbl-actions">
          <button className="tbl-insert" onClick={() => onInsert(rows, cols)}>إدراج</button>
          <button className="tbl-cancel" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
// ─── حوار تقسيم الخلية (جديد) ──────────────────────────────────────────────
function SplitCellDialog({ onSplit, onClose }) {
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(1);
 
  return (
    <div className="tbl-overlay" onClick={onClose}>
      <div className="tbl-dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 320 }}>
        <h3 className="tbl-title">✂️ تقسيم الخلية</h3>
        <div style={{ marginBottom: 20, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
          حدد كم قسم تريد تقسيم الخلية إليه
        </div>
       
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 20 }}>
          <div className="tbl-field" style={{ flex: 1 }}>
            <label>عدد الأعمدة</label>
            <input
              type="number"
              min="1"
              max="10"
              value={cols}
              onChange={e => setCols(Math.max(1, Math.min(10, +e.target.value)))}
            />
          </div>
          <div className="tbl-field" style={{ flex: 1 }}>
            <label>عدد الصفوف</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rows}
              onChange={e => setRows(Math.max(1, Math.min(10, +e.target.value)))}
            />
          </div>
        </div>
        <div style={{
          border: '2px dashed #d1fae5',
          borderRadius: 8,
          padding: 15,
          marginBottom: 20,
          background: '#f0fdf4'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 30px)`,
            gap: 4,
            maxWidth: 200,
            margin: '0 auto'
          }}>
            {Array.from({ length: rows * cols }).map((_, i) => (
              <div key={i} style={{
                background: '#10b981',
                borderRadius: 3,
                opacity: 0.7 + (i % 3) * 0.1
              }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#059669' }}>
            {cols} أعمدة × {rows} صفوف
          </div>
        </div>
        <div className="tbl-actions">
          <button className="tbl-insert" onClick={() => { onSplit(cols, rows); onClose(); }}>
            تقسيم
          </button>
          <button className="tbl-cancel" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
// ─── قائمة السياق ─────────────────────────────────────────────────────────
function ContextMenu({ pos, onAction, onClose }) {
  useEffect(() => {
    const h = (e) => { if (!e.target.closest('.ctx-menu')) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const items = [
    { icon: '↑', label: 'صف فوق', act: 'rowAbove' },
    { icon: '↓', label: 'صف تحت', act: 'rowBelow' },
    { icon: '→', label: 'عمود يمين', act: 'colRight' },
    { icon: '←', label: 'عمود يسار', act: 'colLeft' },
    null,
    { icon: '✂️', label: 'تقسيم الخلية', act: 'splitCell' },
    null,
    { icon: '✕', label: 'حذف الصف', act: 'delRow', danger: true },
    { icon: '✕', label: 'حذف العمود', act: 'delCol', danger: true },
    { icon: '✕', label: 'حذف الجدول', act: 'delTable', danger: true },
  ];
  return (
    <ul className="ctx-menu" style={{ top: pos.y, left: pos.x }}>
      {items.map((it, i) =>
        it === null ? <li key={i} className="ctx-sep" /> : (
          <li key={i} className={it.danger ? 'danger' : ''} onClick={() => { onAction(it.act); onClose(); }}>
            <span className="ctx-icon">{it.icon}</span>{it.label}
          </li>
        )
      )}
    </ul>
  );
}
// ─── حوار حجم الخط المخصص ────────────────────────────────────────────────
function FontSizeDialog({ onApply, onClose }) {
  const [size, setSize] = useState(16);
  const [unit, setUnit] = useState('px');
  return (
    <div className="tbl-overlay" onClick={onClose}>
      <div className="tbl-dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 280 }}>
        <h3 className="tbl-title">حجم الخط المخصص</h3>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="number" min="6" max="200" value={size} onChange={e => setSize(+e.target.value)}
              style={{ width: 80, padding: '8px', border: '1.5px solid #d1fae5', borderRadius: 8, fontSize: 16, textAlign: 'center', fontFamily: 'Cairo,sans-serif', outline: 'none' }} />
            <select value={unit} onChange={e => setUnit(e.target.value)}
              style={{ padding: '8px', border: '1.5px solid #d1fae5', borderRadius: 8, fontFamily: 'Cairo,sans-serif', outline: 'none' }}>
              <option value="px">px</option><option value="pt">pt</option><option value="em">em</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {[8,9,10,11,12,14,16,18,20,22,24,28,32,36,48,72].map(s => (
              <button key={s} onClick={() => { setSize(s); setUnit('px'); }}
                style={{ padding: '4px 10px', border: '1px solid #d1fae5', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                  background: size === s && unit === 'px' ? '#10b981' : '#f0fdf4',
                  color: size === s && unit === 'px' ? '#fff' : '#059669', fontFamily: 'Cairo,sans-serif', fontWeight: 700 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="tbl-actions" style={{ marginTop: 16 }}>
          <button className="tbl-insert" onClick={() => onApply(`${size}${unit}`)}>تطبيق</button>
          <button className="tbl-cancel" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
// ─── حوار تغيير حجم الجدول ───────────────────────────────────────────────
function TableResizeDialog({ table, onClose }) {
  const initW = table ? (parseInt(table.style.width) || 100) : 100;
  const initU = table?.style.width?.includes('px') ? 'px' : '%';
  const [width, setWidth] = useState(initW);
  const [wUnit, setWUnit] = useState(initU);
  const [cellPad, setCellPad] = useState(() => {
    if (!table) return 9;
    const fc = table.querySelector('th, td'); if (!fc) return 9;
    const v = parseInt(fc.style.paddingTop) || parseInt(fc.style.padding) || 9;
    return isNaN(v) ? 9 : v;
  });
  const [cellFont, setCellFont] = useState(() => {
    if (!table) return 14;
    const fc = table.querySelector('th, td'); if (!fc) return 14;
    const v = parseInt(fc.style.fontSize) || 14;
    return isNaN(v) ? 14 : v;
  });
  const [rowH, setRowH] = useState(() => {
    if (!table) return 42;
    const fc = table.querySelector('th, td'); if (!fc) return 42;
    const v = parseInt(fc.style.minHeight) || table.querySelector('tr')?.offsetHeight || 42;
    return isNaN(v) ? 42 : v;
  });
  const apply = () => {
    if (!table) return;
    table.style.width = `${width}${wUnit}`;
    table.style.minWidth = wUnit === 'px' ? `${width}px` : 'auto';
    table.dataset.userWidth = `${width}${wUnit}`;
    table.dataset.userCellPad = String(cellPad);
    table.dataset.userCellFont = String(cellFont);
    table.dataset.userRowH = String(rowH);
    table.querySelectorAll('th, td').forEach(cell => {
      cell.style.padding = `${cellPad}px 13px`;
      cell.style.fontSize = `${cellFont}px`;
      cell.style.height = '';
      cell.style.minHeight = `${rowH}px`;
    });
    const wrapper = table.closest('.movable-table-wrapper');
    if (wrapper && wUnit === 'px') wrapper.style.minWidth = `${width}px`;
    onClose();
  };
  const sl = { width: '100%', accentColor: '#10b981' };
  const lb = { fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4, display: 'block' };
  const vl = { color: '#059669', fontWeight: 800, marginRight: 6 };
  return (
    <div className="tbl-overlay" onClick={onClose}>
      <div className="tbl-dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 340 }}>
        <h3 className="tbl-title">تغيير حجم الجدول</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={lb}>عرض الجدول <span style={vl}>{width}{wUnit}</span></label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="range" min={wUnit === '%' ? 10 : 100} max={wUnit === '%' ? 100 : 2000} value={width} onChange={e => setWidth(+e.target.value)} style={sl} />
            <input type="number" value={width} onChange={e => setWidth(+e.target.value)} style={{ width: 64, padding: '4px 6px', border: '1.5px solid #d1fae5', borderRadius: 6, fontFamily: 'Cairo,sans-serif', outline: 'none', textAlign: 'center' }} />
            <select value={wUnit} onChange={e => setWUnit(e.target.value)} style={{ padding: '4px 6px', border: '1.5px solid #d1fae5', borderRadius: 6, fontFamily: 'Cairo,sans-serif', outline: 'none' }}>
              <option value="%">%</option><option value="px">px</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lb}>حجم خط الخلايا <span style={vl}>{cellFont}px</span></label>
          <input type="range" min={8} max={36} value={cellFont} onChange={e => setCellFont(+e.target.value)} style={sl} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lb}>الحشو الداخلي <span style={vl}>{cellPad}px</span></label>
          <input type="range" min={2} max={30} value={cellPad} onChange={e => setCellPad(+e.target.value)} style={sl} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lb}>ارتفاع الصف (على الأقل) <span style={vl}>{rowH}px</span></label>
          <input type="range" min={20} max={120} value={rowH} onChange={e => setRowH(+e.target.value)} style={sl} />
        </div>
        <div className="tbl-actions">
          <button className="tbl-insert" onClick={apply}>تطبيق</button>
          <button className="tbl-cancel" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
// ─── حوار قائمة المستندات المحفوظة ──────────────────────────────────────
function SavedDocsDialog({ onLoad, onClose }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  useEffect(() => { fetchDocs(); }, []);
  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/documents`);
      if (!res.ok) throw new Error('فشل تحميل المستندات');
      setDocs(await res.json());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('هل تريد حذف هذا المستند نهائياً؟')) return;
    try {
      setDeleting(id);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل الحذف');
      setDocs(prev => prev.filter(d => d._id !== id));
    } catch (e) { alert('حدث خطأ أثناء الحذف'); } finally { setDeleting(null); }
  };
  const fmt = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return (
    <div className="tbl-overlay" onClick={onClose}>
      <div className="tbl-dialog" onClick={e => e.stopPropagation()} style={{ minWidth: 520, maxWidth: 620, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 className="tbl-title">📂 المستندات المحفوظة</h3>
        {loading && <div style={{ textAlign: 'center', padding: '30px', color: '#059669', fontSize: 15 }}>جاري التحميل...</div>}
        {error && <div style={{ textAlign: 'center', padding: '20px', color: '#dc2626', fontSize: 13 }}>⚠️ {error}</div>}
        {!loading && !error && docs.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: 14 }}>لا توجد مستندات محفوظة بعد</div>}
        {!loading && docs.map(doc => (
          <div key={doc._id} onClick={() => onLoad(doc)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', margin: '6px 0', border: '1.5px solid #d1fae5', borderRadius: 10, cursor: 'pointer', transition: 'background .15s', background: '#f0fdf4' }}
            onMouseEnter={e => e.currentTarget.style.background = '#d1fae5'}
            onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📄 {doc.title || 'بدون عنوان'}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>آخر تعديل: {fmt(doc.updatedAt)}</div>
            </div>
            <button onClick={e => handleDelete(doc._id, e)} disabled={deleting === doc._id}
              style={{ marginRight: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'Cairo,sans-serif', fontWeight: 700, flexShrink: 0 }}>
              {deleting === doc._id ? '...' : '🗑 حذف'}
            </button>
          </div>
        ))}
        <div className="tbl-actions" style={{ marginTop: 16 }}><button className="tbl-cancel" onClick={onClose}>إغلاق</button></div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// المكوّن الرئيسي
// ═══════════════════════════════════════════════════════════════════════════
export default function DocumentEditor() {
  const [title, setTitle] = useState('');
  const [showTblDlg, setShowTblDlg] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pageWidth, setPageWidth] = useState(960);
  const [showFontDlg, setShowFontDlg] = useState(false);
  const [tblResizeTarget, setTblResizeTarget] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [showSavedDocs, setShowSavedDocs] = useState(false);
  const [showSplitDlg, setShowSplitDlg] = useState(false);
  const [splitTarget, setSplitTarget] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const autoSaveTimer = useRef(null);
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const navigate = useNavigate();
  const updateCounts = useCallback(() => {
    const txt = editorRef.current?.innerText || '';
    setCharCount(txt.length);
    setWordCount(txt.trim() ? txt.trim().split(/\s+/).filter(Boolean).length : 0);
  }, []);
  const getCleanHTMLForSave = () => {
    const ed = editorRef.current; if (!ed) return '';
    const clone = ed.cloneNode(true);
    ['.resize-handle', '.resize-row-handle', '.row-move-handle', '.tbl-corner-handle', '.table-move-handle', '.table-resize-btn']
      .forEach(s => clone.querySelectorAll(s).forEach(el => el.remove()));
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('[tabindex]').forEach(el => el.removeAttribute('tabindex'));
    return clone.innerHTML;
  };
  const saveDocument = useCallback(async (silent = false) => {
    const content = getCleanHTMLForSave();
    const docTitle = title.trim() || 'بدون عنوان';
    if (!content || content === '<br>' || content.trim() === '') {
      if (!silent) alert('المستند فارغ، لا يمكن الحفظ'); return;
    }
    try {
      setSaveStatus('saving');
      const body = { title: docTitle, content };
      if (currentDocId) body.id = currentDocId;
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/documents/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('فشل الحفظ');
      const data = await res.json();
      if (data.success && data.document?._id) setCurrentDocId(data.document._id);
      setSaveStatus('saved'); setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      setSaveStatus('error');
      if (!silent) alert('حدث خطأ أثناء الحفظ: ' + e.message);
      setTimeout(() => setSaveStatus(''), 4000);
    }
  }, [title, currentDocId]);
  const newDocument = () => {
    if (editorRef.current?.innerText.trim() && !window.confirm('هل تريد بدء مستند جديد؟ سيتم فقدان التغييرات غير المحفوظة.')) return;
    setTitle(''); setCurrentDocId(null);
    if (editorRef.current) editorRef.current.innerHTML = '';
    updateCounts(); setSaveStatus('');
  };
  const loadDocument = (doc) => {
    setTitle(doc.title || ''); setCurrentDocId(doc._id);
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content || '';
      editorRef.current.querySelectorAll('table').forEach(table => {
        addResizeHandles(table);
        const w = table.closest('.movable-table-wrapper');
        if (w) addTableCornerHandle(w, table);
      });
    }
    updateCounts(); setShowSavedDocs(false); setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  };
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      const c = editorRef.current?.innerText?.trim();
      if (c && c.length > 5) saveDocument(true);
    }, 30000);
    return () => clearInterval(autoSaveTimer.current);
  }, [saveDocument]);
  useEffect(() => {
    const hk = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveDocument(false); } };
    document.addEventListener('keydown', hk);
    return () => document.removeEventListener('keydown', hk);
  }, [saveDocument]);
  const placeCursorEnd = (el) => { try { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { } };
  const placeCursorStart = (el) => { try { const r = document.createRange(); r.selectNodeContents(el); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { } };
  const makeEditorCell = useCallback((tag, colW = 100) => {
    const el = document.createElement(tag);
    el.contentEditable = true; el.spellcheck = false; el.innerHTML = '<br>'; el.tabIndex = 0;
    el.style.cssText = `border:1.5px solid #666666;padding:9px 13px;text-align:center;min-width:${colW}px;width:${colW}px;font-family:'Cairo',sans-serif;font-size:14px;vertical-align:middle;position:relative;outline:none;user-select:text;pointer-events:auto;cursor:text;transition:background .1s;${tag === 'th' ? 'background:#f0f0f0;color:#000000;font-weight:700;' : 'background:#ffffff;color:#000000;'}`;
    el.addEventListener('focus', () => {
      if (el.innerHTML === '<br>' || el.innerHTML.trim() === '') el.innerHTML = '';
      el.style.outline = '2px solid #10b981'; el.style.outlineOffset = '-2px';
      el.style.background = tag === 'th' ? '#e6faf3' : '#f0fdf4';
    });
    el.addEventListener('blur', () => {
      if (el.innerHTML.trim() === '') el.innerHTML = '<br>';
      el.style.outline = 'none'; el.style.background = tag === 'th' ? '#f0f0f0' : '#ffffff';
    });
    if (tag === 'th') {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', Array.from(el.parentElement.children).indexOf(el)); el.style.opacity = '0.5'; });
      el.addEventListener('dragend', () => { el.style.opacity = '1'; });
      el.addEventListener('dragover', e => e.preventDefault());
      el.addEventListener('drop', e => {
        e.preventDefault();
        const fi = parseInt(e.dataTransfer.getData('text/plain'));
        const ti = Array.from(el.parentElement.children).indexOf(el);
        if (fi === ti) return;
        const tbl = el.closest('table'); if (!tbl) return;
        tbl.querySelectorAll('tr').forEach(row => {
          const cells = Array.from(row.children); const mv = cells[fi]; const tg = cells[ti];
          if (mv && tg) row.insertBefore(mv, fi < ti ? tg.nextSibling : tg);
        });
        addResizeHandles(tbl);
      });
    }
    return el;
  }, []);
  const makeCell = makeEditorCell;

  // ─── دوال التراجع والإعادة (لجعل الجداول ترجع بشكل كامل) ───────────────
  const saveUndoState = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const html = ed.innerHTML;
    setUndoStack(prev => [...prev.slice(-19), html]);
  }, []);

  const undoAction = useCallback(() => {
    if (undoStack.length === 0) {
      execCmd('undo');
      return;
    }
    const ed = editorRef.current;
    if (!ed) return;
    const current = ed.innerHTML;
    setRedoStack(prev => [...prev.slice(-19), current]);
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(prevStack => prevStack.slice(0, -1));
    ed.innerHTML = prev;
    ed.querySelectorAll('table').forEach(table => {
      addResizeHandles(table);
      const wr = table.closest('.movable-table-wrapper');
      if (wr) addTableCornerHandle(wr, table);
    });
    updateCounts();
  }, [undoStack, updateCounts]);

  const redoAction = useCallback(() => {
    if (redoStack.length === 0) {
      execCmd('redo');
      return;
    }
    const ed = editorRef.current;
    if (!ed) return;
    const current = ed.innerHTML;
    setUndoStack(prev => [...prev.slice(-19), current]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    ed.innerHTML = next;
    ed.querySelectorAll('table').forEach(table => {
      addResizeHandles(table);
      const wr = table.closest('.movable-table-wrapper');
      if (wr) addTableCornerHandle(wr, table);
    });
    updateCounts();
  }, [redoStack, updateCounts]);

  useEffect(() => {
    const ed = editorRef.current; if (!ed) return;
    const onCtx = e => {
      const cell = e.target.closest('td,th'); if (!cell) return;
      e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, cell });
    };
    const onKeyDown = e => {
      const cell = e.target.closest('td,th'); if (!cell) return;
      const table = cell.closest('table'); if (!table) return;
      const allCells = Array.from(table.querySelectorAll('td,th'));
      const idx = allCells.indexOf(cell);
      const allRows = Array.from(table.querySelectorAll('tr'));
      const rowEl = cell.parentElement;
      const rowIdx = allRows.indexOf(rowEl);
      const colIdx = Array.from(rowEl.children).indexOf(cell);
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!e.shiftKey) {
          const next = allCells[idx + 1];
          if (next) { next.focus(); placeCursorEnd(next); }
          else {
            const cc = table.querySelector('tr')?.children.length || 1;
            const cw = allCells[0]?.offsetWidth || 100;
            const nr = document.createElement('tr');
            for (let c = 0; c < cc; c++) nr.appendChild(makeEditorCell('td', cw));
            table.querySelector('tbody')?.appendChild(nr);
            addResizeHandles(table);
            const wr = table.closest('.movable-table-wrapper');
            if (wr) addTableCornerHandle(wr, table);
            const fn = nr.querySelector('td');
            if (fn) { fn.focus(); placeCursorStart(fn); }
          }
        } else { const prev = allCells[idx - 1]; if (prev) { prev.focus(); placeCursorEnd(prev); } }
        return;
      }
      if (e.key === 'ArrowRight') { const pc = Array.from(rowEl.children)[colIdx - 1]; if (pc) { e.preventDefault(); pc.focus(); placeCursorEnd(pc); } }
      else if (e.key === 'ArrowLeft') { const nc = Array.from(rowEl.children)[colIdx + 1]; if (nc) { e.preventDefault(); nc.focus(); placeCursorStart(nc); } }
      else if (e.key === 'ArrowUp' && rowIdx > 0) { e.preventDefault(); const tr = allRows[rowIdx - 1]; const tc = Array.from(tr.children)[Math.min(colIdx, tr.children.length - 1)]; if (tc) { tc.focus(); placeCursorEnd(tc); } }
      else if (e.key === 'ArrowDown' && rowIdx < allRows.length - 1) { e.preventDefault(); const tr = allRows[rowIdx + 1]; const tc = Array.from(tr.children)[Math.min(colIdx, tr.children.length - 1)]; if (tc) { tc.focus(); placeCursorStart(tc); } }
    };
    ed.addEventListener('contextmenu', onCtx);
    ed.addEventListener('input', updateCounts);
    ed.addEventListener('keydown', onKeyDown);
    return () => { ed.removeEventListener('contextmenu', onCtx); ed.removeEventListener('input', updateCounts); ed.removeEventListener('keydown', onKeyDown); };
  }, [updateCounts, makeEditorCell]);
  const saveSelection = () => { const s = window.getSelection(); if (s && s.rangeCount > 0) savedRange.current = s.getRangeAt(0).cloneRange(); };
  const restoreSelection = () => { const s = window.getSelection(); if (savedRange.current && s) { s.removeAllRanges(); s.addRange(savedRange.current); } };
  const openTableDialog = () => { saveSelection(); setShowTblDlg(true); };
  // دالة تقسيم الخلية (تم تعديلها لتقسيم الخلية كاملة في هيكل الجدول بدون جدول داخلي)
  const splitCell = (subCols, subRows) => {
    if (!splitTarget) return;
    const cell = splitTarget;
    const row = cell.parentElement;
    const table = cell.closest('table');
    if (!table || !row) return;
    const allRows = Array.from(table.querySelectorAll('tr'));
    const rowIdx = allRows.indexOf(row);
    const colIdx = Array.from(row.children).indexOf(cell);
    if (rowIdx < 0 || colIdx < 0) return;
    const originalContent = cell.innerHTML === '<br>' ? '' : cell.innerHTML;
    const colW = cell.offsetWidth || 100;
    const newColW = Math.max(30, Math.floor(colW / subCols));
    // حفظ حالة التراجع
    saveUndoState();
    // إضافة أعمدة جديدة (subCols - 1) بعد العمود الحالي
    for (let addedC = 0; addedC < subCols - 1; addedC++) {
      allRows.forEach((r) => {
        const cells = Array.from(r.children);
        let refIndex = colIdx + addedC;
        if (refIndex >= cells.length) refIndex = cells.length - 1;
        const refCell = cells[refIndex];
        if (!refCell) return;
        const tag = r.closest('thead') ? 'th' : 'td';
        const newCell = makeEditorCell(tag, newColW);
        refCell.after(newCell);
      });
    }
    // تحديث قائمة الصفوف بعد إضافة الأعمدة
    const updatedRows = Array.from(table.querySelectorAll('tr'));
    // إضافة صفوف جديدة (subRows - 1) بعد الصف الحالي
    for (let addedR = 0; addedR < subRows - 1; addedR++) {
      const newRow = document.createElement('tr');
      const numCols = updatedRows[0].children.length;
      for (let c = 0; c < numCols; c++) {
        const tag = 'td';
        const newCell = makeEditorCell(tag, 100);
        newRow.appendChild(newCell);
      }
      const insertAfter = updatedRows[rowIdx + addedR];
      if (insertAfter) {
        insertAfter.after(newRow);
      } else {
        table.querySelector('tbody')?.appendChild(newRow);
      }
    }
    // تحديث قائمة الصفوف النهائية
    const finalRows = Array.from(table.querySelectorAll('tr'));
    // الخلية الأصلية تصبح الخلية العلوية اليسرى في التقسيم
    cell.innerHTML = originalContent || '<br>';
    cell.style.width = `${newColW}px`;
    cell.style.minWidth = `${newColW}px`;
    // ملء باقي الخلايا في المنطقة المقسمة
    for (let sr = 0; sr < subRows; sr++) {
      const targetRow = finalRows[rowIdx + sr];
      if (!targetRow) continue;
      for (let sc = 0; sc < subCols; sc++) {
        if (sr === 0 && sc === 0) continue;
        const targetColIdx = colIdx + sc;
        const targetCell = Array.from(targetRow.children)[targetColIdx];
        if (targetCell) {
          targetCell.innerHTML = '<br>';
          targetCell.style.width = `${newColW}px`;
          targetCell.style.minWidth = `${newColW}px`;
        }
      }
    }
    // إعادة إضافة المقابض والتحكم في الجدول
    addResizeHandles(table);
    const wr = table.closest('.movable-table-wrapper');
    if (wr) addTableCornerHandle(wr, table);
    updateCounts();
    // التركيز على الخلية الأولى بعد التقسيم
    const firstSub = cell;
    if (firstSub) setTimeout(() => { firstSub.focus(); placeCursorStart(firstSub); }, 50);
  };
  const addResizeHandles = (table) => {
    table.querySelectorAll('th').forEach((th, index) => {
      let h = th.querySelector('.resize-handle'); if (h) h.remove();
      h = document.createElement('div'); h.className = 'resize-handle';
      h.style.cssText = 'position:absolute;right:-4px;top:0;width:8px;height:100%;cursor:col-resize;z-index:30;background:transparent;';
      th.style.position = 'relative'; th.appendChild(h);
      h.addEventListener('mousedown', e => {
        e.stopImmediatePropagation(); e.preventDefault();
        isResizing.current = true; startX.current = e.pageX; startWidth.current = th.offsetWidth;
        document.documentElement.style.cursor = 'col-resize';
        const onMove = me => {
          if (!isResizing.current) return;
          const nw = Math.max(30, startWidth.current + (me.pageX - startX.current));
          table.querySelectorAll('tr').forEach(row => { const c = row.children[index]; if (c) { c.style.width = `${nw}px`; c.style.minWidth = `${nw}px`; } });
        };
        const onUp = () => { isResizing.current = false; document.documentElement.style.cursor = 'default'; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
      });
    });
    table.querySelectorAll('tr').forEach(row => {
      row.querySelectorAll('.resize-row-handle').forEach(el => el.remove());
      const lc = row.lastElementChild; if (!lc) return;
      const rh = document.createElement('div'); rh.className = 'resize-row-handle';
      rh.style.cssText = ['position:absolute', 'bottom:0', 'left:0', 'right:0', 'height:6px', 'cursor:row-resize', 'z-index:30', 'background:transparent', `width:${table.offsetWidth || 9999}px`].join(';');
      lc.style.position = 'relative'; lc.appendChild(rh);
      rh.addEventListener('mousedown', e => {
        e.stopImmediatePropagation(); e.preventDefault();
        const sy = e.pageY; const sh = row.offsetHeight; document.documentElement.style.cursor = 'row-resize';
        const onMove = me => { const nh = Math.max(20, sh + (me.pageY - sy)); Array.from(row.children).forEach(c => { c.style.height = ''; c.style.minHeight = `${nh}px`; }); };
        const onUp = () => { document.documentElement.style.cursor = 'default'; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
      });
    });
    table.querySelectorAll('tr').forEach(row => {
      row.querySelectorAll('.row-move-handle').forEach(el => el.remove());
      if (!!row.closest('thead')) return;
      const mh = document.createElement('div'); mh.className = 'row-move-handle';
      mh.style.cssText = 'position:absolute;left:-32px;top:0;width:26px;height:100%;cursor:grab;display:flex;align-items:center;justify-content:center;font-size:18px;color:#10b981;z-index:25;opacity:0.6;user-select:none;';
      mh.innerHTML = '☰'; row.style.position = 'relative'; row.appendChild(mh); mh.draggable = true;
      mh.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', Array.from(table.querySelectorAll('tr')).indexOf(row)); row.style.opacity = '0.5'; });
      mh.addEventListener('dragend', () => { row.style.opacity = '1'; });
      mh.addEventListener('dragover', e => e.preventDefault());
      mh.addEventListener('drop', e => {
        e.preventDefault();
        const fi = parseInt(e.dataTransfer.getData('text/plain'));
        const ar = Array.from(table.querySelectorAll('tr')); const ti = ar.indexOf(row);
        if (fi === ti) return;
        const mr = ar[fi]; const tr = ar[ti];
        if (mr && tr) { if (fi < ti) tr.after(mr); else tr.before(mr); }
        addResizeHandles(table);
        const wr = table.closest('.movable-table-wrapper'); if (wr) addTableCornerHandle(wr, table);
      });
    });
  };
  const addTableCornerHandle = (wrapper, table) => {
    let corner = wrapper.querySelector('.tbl-corner-handle'); if (corner) corner.remove();
    corner = document.createElement('div'); corner.className = 'tbl-corner-handle'; corner.title = 'اسحب لتغيير حجم الجدول';
    corner.style.cssText = 'position:absolute;bottom:-6px;left:-6px;width:14px;height:14px;background:#10b981;border:2px solid #fff;border-radius:3px;cursor:nwse-resize;z-index:50;box-shadow:0 2px 6px rgba(0,0,0,.3);';
    wrapper.appendChild(corner);
    corner.addEventListener('mousedown', e => {
      e.stopImmediatePropagation(); e.preventDefault();
      const sx = e.pageX; const sw = table.offsetWidth; document.documentElement.style.cursor = 'nwse-resize';
      const onMove = me => { const nw = Math.max(120, sw - (me.pageX - sx)); table.style.width = `${nw}px`; table.style.minWidth = `${nw}px`; wrapper.style.minWidth = `${nw}px`; table.dataset.userWidth = `${nw}px`; };
      const onUp = () => { document.documentElement.style.cursor = 'default'; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    });
  };
  const insertTable = (rows, cols) => {
    setShowTblDlg(false);
    const ed = editorRef.current; if (!ed) return;
    // حفظ حالة التراجع قبل إدراج الجدول
    saveUndoState();
    const colW = Math.max(60, Math.floor(640 / cols));
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;margin:16px 0;direction:rtl;table-layout:fixed;width:100%;';
    table.dataset.userWidth = '100%'; table.dataset.userCellPad = '9'; table.dataset.userCellFont = '14'; table.dataset.userRowH = '42';
    const thead = document.createElement('thead'); const headRow = document.createElement('tr');
    for (let c = 0; c < cols; c++) headRow.appendChild(makeCell('th', colW));
    thead.appendChild(headRow); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) { const td = makeCell('td', colW); if (r % 2 === 1) td.style.background = '#f9f9f9'; tr.appendChild(td); }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    const wrapper = document.createElement('div'); wrapper.className = 'movable-table-wrapper'; wrapper.style.cssText = 'position:relative;margin:20px 0;display:block;width:100%;';
    const mh = document.createElement('div'); mh.className = 'table-move-handle'; mh.innerHTML = '⇄';
    mh.style.cssText = 'position:absolute;top:-32px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;width:32px;height:26px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:grab;box-shadow:0 3px 10px rgba(0,0,0,.2);z-index:20;';
    mh.draggable = true;
    mh.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', 'move-table'); wrapper.style.opacity = '0.5'; });
    mh.addEventListener('dragend', () => { wrapper.style.opacity = '1'; });
    const rb = document.createElement('div'); rb.className = 'table-resize-btn'; rb.innerHTML = '⇔'; rb.title = 'تغيير حجم الجدول';
    rb.style.cssText = 'position:absolute;top:-32px;left:calc(50% + 38px);transform:translateX(-50%);background:#0f766e;color:#fff;width:28px;height:26px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.2);z-index:20;user-select:none;';
    rb.addEventListener('click', e => { e.stopPropagation(); setTblResizeTarget(table); });
    wrapper.appendChild(mh); wrapper.appendChild(rb); wrapper.appendChild(table);
    const after = document.createElement('p'); after.innerHTML = '<br>';
    ed.focus(); restoreSelection();
    const sel = window.getSelection(); let inserted = false;
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0); let container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) container = container.parentNode;
      const block = container.closest?.('p,h1,h2,h3,li,blockquote');
      if (block && block !== ed && block.parentNode === ed) { block.after(wrapper); wrapper.after(after); inserted = true; }
    }
    if (!inserted) { ed.appendChild(wrapper); ed.appendChild(after); }
    addResizeHandles(table); addTableCornerHandle(wrapper, table);
    const fc = table.querySelector('th,td');
    if (fc) setTimeout(() => { fc.focus(); placeCursorStart(fc); }, 60);
    updateCounts();
  };
  const handleTableAction = (act) => {
    if (!ctxMenu?.cell) return;
    const cell = ctxMenu.cell; const row = cell.parentElement;
    const table = cell.closest('table'); if (!table) return;
    const allRows = Array.from(table.querySelectorAll('tr'));
    const colCount = allRows[0]?.children.length || 0;
    const colIdx = Array.from(row.children).indexOf(cell);
    const colW = cell.offsetWidth || 100;
   
    if (act === 'splitCell') {
      setSplitTarget(cell);
      setShowSplitDlg(true);
      return;
    }
   
    // حفظ حالة التراجع قبل أي تعديل على الجدول
    saveUndoState();
   
    switch (act) {
      case 'rowAbove':
      case 'rowBelow': {
        const nr = document.createElement('tr');
        for (let c = 0; c < colCount; c++) nr.appendChild(makeCell('td', colW));
        act === 'rowAbove' ? row.before(nr) : row.after(nr);
        break;
      }
      case 'colRight':
      case 'colLeft': {
        allRows.forEach(r => {
          const ref = Array.from(r.children)[colIdx];
          if (!ref) return;
          const isH = !!r.closest('thead');
          const nc = makeCell(isH ? 'th' : 'td', colW);
          act === 'colRight' ? ref.after(nc) : ref.before(nc);
        });
        break;
      }
      case 'delRow':
        if (allRows.length > 1) row.remove();
        break;
      case 'delCol':
        if (colCount > 1) allRows.forEach(r => Array.from(r.children)[colIdx]?.remove());
        break;
      case 'delTable':
        table.closest('.movable-table-wrapper')?.remove();
        break;
      default:
        break;
    }
    if (table.isConnected) { addResizeHandles(table); const wr = table.closest('.movable-table-wrapper'); if (wr) addTableCornerHandle(wr, table); }
    updateCounts();
  };
  const execCmd = (cmd, val = null) => { editorRef.current?.focus(); document.execCommand(cmd, false, val); };
  const applyFont = font => { editorRef.current?.focus(); document.execCommand('fontName', false, font); };
  const applySize = size => {
    editorRef.current?.focus();
    const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0); const span = document.createElement('span'); span.style.fontSize = size;
    try { range.surroundContents(span); } catch { const frag = range.extractContents(); span.appendChild(frag); range.insertNode(span); }
  };
  const changePageWidth = delta => {
    const nw = Math.max(600, Math.min(1400, pageWidth + delta)); setPageWidth(nw);
    const wrap = document.querySelector('.de-wrap'); const ed = editorRef.current;
    if (wrap) wrap.style.maxWidth = `${nw}px`;
    if (ed) ed.style.padding = `52px ${Math.max(40, nw / 15)}px`;
  };
  const resetPageWidth = () => {
    setPageWidth(960);
    const wrap = document.querySelector('.de-wrap'); const ed = editorRef.current;
    if (wrap) wrap.style.maxWidth = '960px';
    if (ed) ed.style.padding = '52px 64px';
  };
  const getCleanHTML = () => {
    const ed = editorRef.current; if (!ed) return '';
    const clone = ed.cloneNode(true);
    const rmSel = ['.resize-handle', '.resize-row-handle', '.row-move-handle', '.tbl-corner-handle', '.table-move-handle', '.table-resize-btn'];
    rmSel.forEach(s => clone.querySelectorAll(s).forEach(el => el.remove()));
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('[tabindex]').forEach(el => el.removeAttribute('tabindex'));
    clone.querySelectorAll('.movable-table-wrapper').forEach(wrapper => {
      const table = wrapper.querySelector('table');
      if (!table) { wrapper.remove(); return; }
      const userRowH = parseInt(table.dataset.userRowH) || 42;
      const userCellFont = parseInt(table.dataset.userCellFont) || 14;
      const userCellPad = parseInt(table.dataset.userCellPad) || 9;
     
      let tableWidth = table.dataset.userWidth || table.style.width || '100%';
     
      const tc = table.cloneNode(true);
      rmSel.forEach(s => tc.querySelectorAll(s).forEach(el => el.remove()));
     
      tc.style.cssText = `border-collapse:collapse;width:${tableWidth};direction:rtl;table-layout:fixed;margin:0;`;
     
      const originalCells = table.querySelectorAll('th, td');
      const printCells = tc.querySelectorAll('th, td');
     
      printCells.forEach((cell, idx) => {
        const origCell = originalCells[idx];
        let cellWidth = origCell?.style.width || '';
        let minHeight = origCell?.style.minHeight || '';
       
        cell.style.border = '1.6px solid #000';
        cell.style.position = 'static';
        cell.style.fontFamily = "'Cairo',sans-serif";
        cell.style.fontSize = `${userCellFont}px`;
        cell.style.padding = `${userCellPad}px 8px`;
        cell.style.textAlign = 'center';
        cell.style.verticalAlign = 'middle';
        cell.style.wordBreak = 'break-word';
        cell.style.overflowWrap = 'break-word';
        cell.style.direction = 'rtl';
       
        if (minHeight) cell.style.minHeight = minHeight;
        else cell.style.minHeight = `${userRowH}px`;
       
        if (cellWidth) cell.style.width = cellWidth;
       
        if (cell.tagName === 'TH') { cell.style.background = '#f0f0f0'; cell.style.fontWeight = '700'; cell.style.color = '#000'; }
        else { cell.style.background = '#fff'; cell.style.color = '#000'; }
      });
     
      tc.querySelectorAll('tr').forEach((r, i) => {
        r.style.position = 'static';
        if (i > 0 && i % 2 === 0) r.querySelectorAll('td').forEach(c => { c.style.background = '#f9f9f9'; });
      });
      tc.querySelectorAll('thead tr').forEach(r => { r.style.position = 'static'; });
      const div = document.createElement('div');
      div.className = 'print-tbl-wrap';
      div.appendChild(tc);
      wrapper.replaceWith(div);
    });
    return clone.innerHTML;
  };
  const handlePrint = () => {
    const edHTML = getCleanHTML();
    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) { alert('يرجى السماح بالنوافذ المنبثقة'); return; }
    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${title || 'مستند'}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
@page {
  size: A4 landscape;
  margin: 0.5cm;
}
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Cairo', sans-serif;
  line-height: 1.8;
  color: #111;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.print-page {
  width: 100%;
  margin: 0;
  padding: 0;
  max-width: none;
}
.print-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 4px solid #10b981;
  padding-bottom: 10px;
  margin-bottom: 14px;
}
.print-hdr-brand { color:#10b981; font-size:22px; font-weight:900; }
.print-hdr-sub { color:#0f766e; font-weight:600; font-size:10px; margin-top:1px; }
.print-hdr-logo {
  width:40px; height:40px;
  background:linear-gradient(135deg,#10b981,#0f766e);
  border-radius:8px;
  display:flex; align-items:center; justify-content:center;
  font-size:18px; color:white; font-weight:900; flex-shrink:0;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
.doc-title {
  text-align:center; color:#065f46; font-size:16px; font-weight:900;
  margin:12px 0 14px; padding-bottom:6px; border-bottom:2px dashed #a7f3d0;
}
.content-body p { margin:8px 0; word-break:break-word; }
.content-body h1 { font-size:16px; font-weight:900; color:#065f46; margin:12px 0 6px; }
.content-body h2 { font-size:14px; font-weight:800; color:#0f766e; margin:10px 0 5px; }
.content-body h3 { font-size:12px; font-weight:700; color:#047857; margin:8px 0 4px; }
table {
  border-collapse: collapse !important;
  direction: rtl !important;
  table-layout: fixed !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  page-break-inside: auto;
  margin: 8px 0 !important;
  width: auto !important;
}
th, td {
  border: 1.6px solid #000 !important;
  text-align: center !important;
  vertical-align: middle !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  direction: rtl !important;
  position: static !important;
  font-family: 'Cairo', sans-serif !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
th { font-weight:700 !important; background:#f0f0f0 !important; color:#000 !important; }
thead { display: table-header-group !important; }
tbody { display: table-row-group !important; }
tr { page-break-inside: avoid !important; page-break-after: auto; }
td { page-break-inside: avoid !important; }
/* للجداول الداخلية من التقسيم */
td table {
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  margin: 0 !important;
}
td table td {
  border: 1px dashed #059669 !important;
  font-size: 12px !important;
  padding: 2px 4px !important;
}
.print-tbl-wrap {
  display: block;
  margin: 8px 0;
  transform: none !important;
  overflow: visible !important;
  page-break-inside: avoid;
  overflow-x: visible;
}
.print-footer {
  margin-top: 20px; padding-top: 8px;
  border-top: 2px solid #d1fae5;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 9px; color: #555;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.print-footer-brand { color:#10b981; font-weight:800; }
.no-print { display:block; }
@media print {
  .no-print { display:none !important; }
  body { margin: 0; padding: 0; }
  html { margin: 0; padding: 0; }
}
</style>
</head>
<body>
<div class="print-page">
  <div class="print-hdr">
    <div>
      <div class="print-hdr-brand">NileMix</div>
      <div class="print-hdr-sub">شركة النيل للخرسانة الجاهزة — إدارة العلاقات العامة والأمن</div>
    </div>
    <div class="print-hdr-logo">N</div>
  </div>
  ${title ? `<div class="doc-title">${title}</div>` : ''}
  <div class="content-body">${edHTML}</div>
  <div class="print-footer">
    <span>${dateStr}</span>
    <span class="print-footer-brand">NileMix Document Editor ✦</span>
  </div>
</div>
<div class="no-print" style="position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#0f172a,#1e293b);padding:12px 32px;display:flex;align-items:center;justify-content:center;gap:16px;box-shadow:0 -4px 20px rgba(0,0,0,.4);z-index:9999;">
  <span id="info" style="color:#94a3b8;font-family:Cairo,sans-serif;font-size:12px;">ملاحظة: قد تحتاج عدة صفحات للجداول الكبيرة</span>
  <button onclick="window.print()" style="background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:10px 28px;border-radius:10px;cursor:pointer;font-size:14px;font-family:Cairo,sans-serif;font-weight:700;box-shadow:0 4px 14px rgba(16,185,129,.4);">
    🖨️ طباعة / حفظ PDF
  </button>
  <button onclick="window.close()" style="background:#374151;color:white;border:none;padding:10px 20px;border-radius:10px;cursor:pointer;font-size:13px;font-family:Cairo,sans-serif;font-weight:700;">
    إغلاق
  </button>
</div>
</body>
</html>`);
    win.document.close();
  };
  const renderSaveStatus = () => {
    if (!saveStatus) return null;
    const cfg = { saving: { bg: '#fef9c3', color: '#854d0e', icon: '⏳', text: 'جاري الحفظ...' }, saved: { bg: '#d1fae5', color: '#065f46', icon: '✓', text: 'تم الحفظ' }, error: { bg: '#fee2e2', color: '#991b1b', icon: '✕', text: 'خطأ في الحفظ' } };
    const c = cfg[saveStatus]; if (!c) return null;
    return <span style={{ background: c.bg, color: c.color, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{c.icon} {c.text}</span>;
  };
  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&family=Tajawal:wght@400;500;700&family=Amiri:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --brand:#10b981;--brand-d:#059669;--brand-dd:#065f46;
  --dark:#0f172a;--mid:#1e293b;--muted:#64748b;
  --border:#e2e8f0;--bg:#f1f5f9;--surface:#ffffff;--surface2:#f8fafc;
  --shadow-sm:0 1px 3px rgba(0,0,0,.08);--shadow-md:0 4px 16px rgba(0,0,0,.1);
  --radius:10px;--radius-lg:14px;
}
body{margin:0;background:var(--bg)}
.de-page{min-height:100vh;background:var(--bg);font-family:'Cairo',sans-serif;direction:rtl;padding-bottom:50px}
.de-header{position:sticky;top:0;z-index:300;background:var(--dark);border-bottom:1px solid rgba(255,255,255,.06);box-shadow:0 2px 16px rgba(0,0,0,.3);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.de-brand{display:flex;align-items:center;gap:10px;flex-shrink:0}
.de-brand-icon{width:38px;height:38px;background:linear-gradient(135deg,var(--brand),var(--brand-d));border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;box-shadow:0 4px 12px rgba(16,185,129,.3);}
.de-brand-name{font-size:.95rem;font-weight:900;color:#fff;line-height:1.2}
.de-brand-sub{font-size:.65rem;color:#64748b;margin-top:1px}
.de-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.de-title{padding:8px 12px;border:1.5px solid rgba(255,255,255,.1);border-radius:8px;width:260px;font-size:13px;font-family:'Cairo',sans-serif;color:#f1f5f9;background:rgba(255,255,255,.07);outline:none;direction:rtl;transition:border-color .2s,background .2s;}
.de-title::placeholder{color:#64748b}
.de-title:focus{border-color:var(--brand);background:rgba(16,185,129,.08);box-shadow:0 0 0 3px rgba(16,185,129,.15);}
.de-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;font-size:12px;font-family:'Cairo',sans-serif;font-weight:700;border:none;cursor:pointer;white-space:nowrap;transition:all .15s;letter-spacing:.2px;}
.de-btn:active{transform:scale(.96)}
.btn-green{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 3px 10px rgba(16,185,129,.25)}
.btn-green:hover{box-shadow:0 5px 16px rgba(16,185,129,.35);transform:translateY(-1px)}
.btn-save{background:linear-gradient(135deg,#0f766e,#065f46);color:#fff;box-shadow:0 3px 10px rgba(15,118,110,.25)}
.btn-save:hover{box-shadow:0 5px 16px rgba(15,118,110,.35);transform:translateY(-1px)}
.btn-load{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;box-shadow:0 3px 10px rgba(37,99,235,.25)}
.btn-load:hover{box-shadow:0 5px 16px rgba(37,99,235,.35);transform:translateY(-1px)}
.btn-new{background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;box-shadow:0 3px 10px rgba(124,58,237,.25)}
.btn-new:hover{box-shadow:0 5px 16px rgba(124,58,237,.35);transform:translateY(-1px)}
.btn-dark{background:rgba(255,255,255,.08);color:#cbd5e1;border:1px solid rgba(255,255,255,.1);}
.btn-dark:hover{background:rgba(255,255,255,.14);color:#fff}
.hdr-sep{width:1px;height:28px;background:rgba(255,255,255,.1);margin:0 2px;flex-shrink:0}
.de-toolbar{margin:16px auto 0;background:var(--surface);border:1px solid var(--border);border-bottom:2px solid var(--brand);border-radius:var(--radius-lg) var(--radius-lg) 0 0;padding:6px 10px;display:flex;flex-wrap:wrap;gap:2px;align-items:center;direction:ltr;box-shadow:var(--shadow-sm);}
.tb-sep{width:1px;height:20px;background:var(--border);margin:0 4px;flex-shrink:0}
.tb-btn{width:28px;height:28px;border:none;background:transparent;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#374151;font-size:12px;padding:0;font-family:'Cairo',sans-serif;font-weight:700;flex-shrink:0;transition:background .12s,color .12s,transform .1s;}
.tb-btn:hover{background:#d1fae5;color:#059669;transform:scale(1.1)}
.tb-btn:active{transform:scale(.92)}
.tb-select{height:28px;border:1px solid var(--border);border-radius:6px;padding:0 6px;font-family:'Cairo',sans-serif;font-size:12px;color:#374151;background:var(--surface2);cursor:pointer;outline:none;transition:border-color .15s;}
.tb-select:focus{border-color:var(--brand);box-shadow:0 0 0 2px rgba(16,185,129,.15)}
.tb-color{width:26px;height:26px;border:1.5px solid var(--border);border-radius:6px;padding:2px;cursor:pointer;background:none;transition:border-color .15s;}
.tb-color:hover{border-color:var(--brand)}
.de-wrap{margin:0 auto 60px;background:var(--surface);border:1px solid var(--border);border-top:none;border-radius:0 0 var(--radius-lg) var(--radius-lg);box-shadow:var(--shadow-md);min-height:700px;transition:max-width .3s ease;overflow-x:auto;}
.de-editor{min-height:700px;padding:52px 64px;outline:none;font-family:'Cairo',sans-serif;font-size:16px;line-height:2;color:#111;direction:rtl;text-align:right;word-break:break-word;overflow-wrap:break-word;}
.de-editor:empty::before{content:'ابدأ الكتابة هنا...';color:#cbd5e1;pointer-events:none;font-style:italic;}
.de-editor table{border-collapse:collapse;margin:16px 0;direction:rtl;table-layout:fixed}
.de-editor th,.de-editor td{border:1.5px solid #666;padding:9px 13px;text-align:center;vertical-align:middle;font-size:14px;font-family:'Cairo',sans-serif;min-width:30px;cursor:cell;user-select:text;pointer-events:auto;transition:background .1s;}
.de-editor th{background:#f0f0f0;font-weight:700;color:#000}
.de-editor tr:nth-child(even) td{background:#f9f9f9}
.de-editor td:focus,.de-editor th:focus{outline:2.5px solid #10b981!important;outline-offset:-1px;}
.resize-handle{position:absolute;right:-4px;top:0;width:8px;height:100%;cursor:col-resize;z-index:30;background:transparent;transition:background .15s;}
.resize-handle:hover,th:hover .resize-handle{background:rgba(16,185,129,.5)}
.resize-row-handle{position:absolute;bottom:0;left:0;right:0;height:6px;cursor:row-resize;z-index:30;background:transparent;transition:background .15s;width:9999px;}
.resize-row-handle:hover{background:rgba(16,185,129,.4)}
.row-move-handle{position:absolute;left:-32px;top:0;width:26px;height:100%;cursor:grab;display:flex;align-items:center;justify-content:center;font-size:18px;color:#10b981;z-index:25;opacity:0.5;user-select:none;transition:opacity .15s;}
.row-move-handle:hover{opacity:1;background:#f0fdf4;border-radius:4px}
.tbl-corner-handle{position:absolute;bottom:-6px;left:-6px;width:14px;height:14px;background:var(--brand);border:2px solid #fff;border-radius:3px;cursor:nwse-resize;z-index:50;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:transform .15s,box-shadow .15s;}
.tbl-corner-handle:hover{transform:scale(1.3);box-shadow:0 4px 10px rgba(16,185,129,.4)}
th[draggable="true"]{cursor:grab}
th[draggable="true"]:active{cursor:grabbing}
.movable-table-wrapper{position:relative;display:block;width:auto;margin:20px 0;}
.table-move-handle{position:absolute;top:-32px;left:50%;transform:translateX(-50%);background:var(--brand);color:#fff;width:32px;height:26px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:grab;box-shadow:0 3px 10px rgba(0,0,0,.2);z-index:20;transition:background .15s;}
.table-move-handle:hover{background:var(--brand-d)}
.table-resize-btn{position:absolute;top:-32px;left:calc(50% + 38px);transform:translateX(-50%);background:#0f766e;color:#fff;width:28px;height:26px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.2);z-index:20;transition:background .15s;}
.table-resize-btn:hover{background:var(--brand)}
.tbl-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;direction:rtl;animation:fadeIn .15s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.tbl-dialog{background:#fff;border-radius:18px;padding:28px;box-shadow:0 24px 64px rgba(0,0,0,.22);min-width:300px;max-height:90vh;overflow-y:auto;animation:slideUp .18s ease;}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.tbl-title{font-size:16px;font-weight:800;color:#059669;margin-bottom:14px;text-align:center}
.tbl-hint{font-size:14px;font-weight:700;color:#0f766e;text-align:center;margin-bottom:10px}
.tbl-grid{display:grid;grid-template-columns:repeat(10,22px);gap:3px;margin-bottom:16px;justify-content:center}
.tbl-cell{width:22px;height:22px;border:1.5px solid #d1fae5;border-radius:3px;cursor:pointer;transition:all .1s}
.tbl-cell.on{background:#10b981;border-color:#059669}
.tbl-cell:hover{border-color:#059669}
.tbl-manual{display:flex;gap:14px;justify-content:center;margin-bottom:16px}
.tbl-field{display:flex;flex-direction:column;align-items:center;gap:4px}
.tbl-field label{font-size:11px;color:#6b7280;font-weight:600}
.tbl-field input{width:72px;padding:6px;border:1.5px solid #d1fae5;border-radius:8px;font-size:14px;text-align:center;font-family:'Cairo',sans-serif;outline:none;transition:border-color .15s}
.tbl-field input:focus{border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.1)}
.tbl-actions{display:flex;gap:10px;justify-content:center}
.tbl-insert{background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;padding:10px 26px;border-radius:9px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;box-shadow:0 3px 10px rgba(16,185,129,.2)}
.tbl-insert:hover{box-shadow:0 5px 16px rgba(16,185,129,.3);transform:translateY(-1px)}
.tbl-cancel{background:#f3f4f6;color:#374151;border:none;padding:10px 20px;border-radius:9px;font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer;transition:background .15s}
.tbl-cancel:hover{background:#e5e7eb}
.ctx-menu{position:fixed;background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.16);padding:6px;z-index:9999;list-style:none;min-width:180px;font-family:'Cairo',sans-serif;direction:rtl;animation:fadeIn .12s ease;}
.ctx-menu li{padding:8px 12px;border-radius:7px;cursor:pointer;font-size:13px;color:#1f2937;display:flex;align-items:center;gap:8px;transition:background .1s}
.ctx-menu li:hover{background:#f0fdf4;color:#059669}
.ctx-menu li.danger{color:#dc2626}
.ctx-menu li.danger:hover{background:#fef2f2}
.ctx-icon{font-size:13px;width:18px;text-align:center;font-weight:700}
.ctx-sep{height:1px;background:var(--border);margin:4px 0;pointer-events:none}
.de-status{position:fixed;bottom:0;left:0;right:0;height:30px;background:var(--dark);color:#475569;font-family:'Cairo',sans-serif;font-size:11px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;z-index:200;border-top:1px solid rgba(255,255,255,.06);}
.de-status-brand{color:var(--brand);font-weight:700;display:flex;align-items:center;gap:5px;}
.de-status-brand::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--brand);box-shadow:0 0 6px var(--brand);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:#f1f5f9}
::-webkit-scrollbar-thumb{background:#a7f3d0;border-radius:99px}
::-webkit-scrollbar-thumb:hover{background:#10b981}
`}</style>
      <div className="de-page">
        <div className="de-header">
          <div className="de-brand">
            <div className="de-brand-icon">N</div>
            <div>
              <div className="de-brand-name">NileMix — محرر المستندات</div>
              <div className="de-brand-sub">شركة النيل للخرسانة الجاهزة</div>
            </div>
          </div>
          <div className="de-actions">
            <input className="de-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان المستند..." />
            <div className="hdr-sep" />
            <button className="de-btn btn-new" onClick={newDocument} title="مستند جديد">✦ جديد</button>
            <button className="de-btn btn-save" onClick={() => saveDocument(false)} title="حفظ (Ctrl+S)">💾 حفظ</button>
            <button className="de-btn btn-load" onClick={() => setShowSavedDocs(true)} title="فتح">📂 فتح</button>
            {renderSaveStatus()}
            <div className="hdr-sep" />
            <button className="de-btn btn-dark" onClick={() => changePageWidth(-50)} title="تصغير الصفحة">📄−</button>
            <span style={{ fontSize: 12, color: '#64748b', padding: '0 4px' }}>{pageWidth}px</span>
            <button className="de-btn btn-dark" onClick={() => changePageWidth(50)} title="تكبير الصفحة">📄+</button>
            <button className="de-btn btn-dark" onClick={resetPageWidth} title="إعادة تعيين">↺</button>
            <div className="hdr-sep" />
            <button className="de-btn btn-dark" onClick={() => setZoomLevel(v => Math.max(30, v - 10))} title="تصغير">🔍−</button>
            <span style={{ fontSize: 12, color: '#64748b', padding: '0 4px' }}>{zoomLevel}%</span>
            <button className="de-btn btn-dark" onClick={() => setZoomLevel(v => Math.min(300, v + 10))} title="تكبير">🔍+</button>
            <button className="de-btn btn-dark" onClick={() => setZoomLevel(100)} title="100%">100%</button>
            <div className="hdr-sep" />
            <button className="de-btn btn-green" onClick={handlePrint}>🖨️ طباعة / PDF</button>
            <button className="de-btn btn-dark" onClick={() => navigate('/dashboard')}>← رجوع</button>
          </div>
        </div>
        <div className="de-toolbar" style={{ maxWidth: `${pageWidth}px` }}>
          <select className="tb-select" style={{ width: 96 }} onChange={e => applyFont(e.target.value)}>
            <option value="Cairo,sans-serif">Cairo</option>
            <option value="Tajawal,sans-serif">Tajawal</option>
            <option value="Amiri,serif">Amiri</option>
            <option value="Arial,sans-serif">Arial</option>
            <option value="'Times New Roman',serif">Times</option>
          </select>
          <select className="tb-select" style={{ width: 60 }} onChange={e => {
            if (e.target.value === 'custom') { saveSelection(); setShowFontDlg(true); }
            else applySize(e.target.value);
          }}>
            {['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '48px', '72px'].map(s => (
              <option key={s} value={s}>{s.replace('px', '')}</option>
            ))}
            <option value="custom">مخصص…</option>
          </select>
          <div className="tb-sep" />
          <select className="tb-select" style={{ width: 80 }} onChange={e => execCmd('formatBlock', e.target.value)}>
            <option value="p">عادي</option><option value="h1">عنوان 1</option>
            <option value="h2">عنوان 2</option><option value="h3">عنوان 3</option>
          </select>
          <div className="tb-sep" />
          <button className="tb-btn" title="غامق" onMouseDown={e => { e.preventDefault(); execCmd('bold'); }}><b>B</b></button>
          <button className="tb-btn" title="مائل" onMouseDown={e => { e.preventDefault(); execCmd('italic'); }}><i>I</i></button>
          <button className="tb-btn" title="تسطير" onMouseDown={e => { e.preventDefault(); execCmd('underline'); }} style={{ textDecoration: 'underline' }}>U</button>
          <button className="tb-btn" title="يتوسطه" onMouseDown={e => { e.preventDefault(); execCmd('strikeThrough'); }} style={{ textDecoration: 'line-through' }}>S</button>
          <div className="tb-sep" />
          <input type="color" className="tb-color" defaultValue="#111111" title="لون النص" onInput={e => { editorRef.current?.focus(); execCmd('foreColor', e.target.value); }} />
          <input type="color" className="tb-color" defaultValue="#ffffff" title="تمييز النص" onInput={e => { editorRef.current?.focus(); execCmd('hiliteColor', e.target.value); }} />
          <div className="tb-sep" />
          <button className="tb-btn" title="يمين" onMouseDown={e => { e.preventDefault(); execCmd('justifyRight'); }}>⇒</button>
          <button className="tb-btn" title="توسيط" onMouseDown={e => { e.preventDefault(); execCmd('justifyCenter'); }}>≡</button>
          <button className="tb-btn" title="يسار" onMouseDown={e => { e.preventDefault(); execCmd('justifyLeft'); }}>⇐</button>
          <button className="tb-btn" title="ضبط" onMouseDown={e => { e.preventDefault(); execCmd('justifyFull'); }}>☰</button>
          <div className="tb-sep" />
          <button className="tb-btn" title="نقطية" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}>•≡</button>
          <button className="tb-btn" title="مرقمة" onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }}>1≡</button>
          <div className="tb-sep" />
          <button className="tb-btn" title="إدراج جدول" onMouseDown={e => { e.preventDefault(); openTableDialog(); }}>
            <svg viewBox="0 0 18 18" fill="none" width="15" height="15">
              <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="1" y1="6.5" x2="17" y2="6.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="1" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.2" />
              <line x1="7" y1="1" x2="7" y2="17" stroke="currentColor" strokeWidth="1.2" />
              <line x1="13" y1="1" x2="13" y2="17" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
          <div className="tb-sep" />
          <button className="tb-btn" title="مسح التنسيق" onMouseDown={e => { e.preventDefault(); execCmd('removeFormat'); }}>✕</button>
          <button className="tb-btn" title="تراجع" onMouseDown={e => { e.preventDefault(); undoAction(); }}>↩</button>
          <button className="tb-btn" title="إعادة" onMouseDown={e => { e.preventDefault(); redoAction(); }}>↪</button>
          <div className="tb-sep" />
          <span style={{ fontSize: 11, color: '#94a3b8', padding: '0 4px', whiteSpace: 'nowrap', direction: 'rtl' }}>
            Tab ← خلية التالية &nbsp;|&nbsp; ↑↓←→ ← تنقل &nbsp;|&nbsp; Ctrl+S ← حفظ
          </span>
        </div>
        <div className="de-wrap" style={{ maxWidth: `${pageWidth}px` }}>
          <div ref={editorRef} className="de-editor" contentEditable suppressContentEditableWarning
            onInput={updateCounts} dir="rtl" spellCheck={false} style={{ zoom: `${zoomLevel}%` }} />
        </div>
        {showTblDlg && <TableDialog onInsert={insertTable} onClose={() => setShowTblDlg(false)} />}
        {ctxMenu && <ContextMenu pos={{ x: ctxMenu.x, y: ctxMenu.y }} onAction={handleTableAction} onClose={() => setCtxMenu(null)} />}
        {showFontDlg && <FontSizeDialog onApply={size => { restoreSelection(); applySize(size); setShowFontDlg(false); }} onClose={() => setShowFontDlg(false)} />}
        {tblResizeTarget && <TableResizeDialog table={tblResizeTarget} onClose={() => setTblResizeTarget(null)} />}
        {showSavedDocs && <SavedDocsDialog onLoad={loadDocument} onClose={() => setShowSavedDocs(false)} />}
        {showSplitDlg && <SplitCellDialog onSplit={(cols, rows) => splitCell(cols, rows)} onClose={() => setShowSplitDlg(false)} />}
        <div className="de-status">
          <span>
            كلمات: <strong style={{ color: '#94a3b8' }}>{wordCount}</strong>
            &nbsp;·&nbsp;
            أحرف: <strong style={{ color: '#94a3b8' }}>{charCount}</strong>
            {currentDocId && <span style={{ color: '#34d399', marginRight: 10 }}>· محفوظ ✓</span>}
          </span>
          <span className="de-status-brand">NileMix Document Editor</span>
        </div>
      </div>
    </>
  );
}