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

// ─── قائمة السياق ─────────────────────────────────────────────────────────
function ContextMenu({ pos, onAction, onClose }) {
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('.ctx-menu')) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const items = [
    { icon: '↑', label: 'صف فوق', act: 'rowAbove' },
    { icon: '↓', label: 'صف تحت', act: 'rowBelow' },
    { icon: '→', label: 'عمود يمين', act: 'colRight' },
    { icon: '←', label: 'عمود يسار', act: 'colLeft' },
    null,
    { icon: '✕', label: 'حذف الصف', act: 'delRow', danger: true },
    { icon: '✕', label: 'حذف العمود', act: 'delCol', danger: true },
    { icon: '✕', label: 'حذف الجدول', act: 'delTable', danger: true },
  ];
  return (
    <ul className="ctx-menu" style={{ top: pos.y, left: pos.x }}>
      {items.map((it, i) =>
        it === null ? (
          <li key={i} className="ctx-sep" />
        ) : (
          <li
            key={i}
            className={it.danger ? 'danger' : ''}
            onClick={() => { onAction(it.act); onClose(); }}
          >
            <span className="ctx-icon">{it.icon}</span>
            {it.label}
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
            <input
              type="number"
              min="6"
              max="200"
              value={size}
              onChange={e => setSize(+e.target.value)}
              style={{
                width: 80,
                padding: '8px',
                border: '1.5px solid #d1fae5',
                borderRadius: 8,
                fontSize: 16,
                textAlign: 'center',
                fontFamily: 'Cairo,sans-serif',
                outline: 'none',
              }}
            />
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              style={{
                padding: '8px',
                border: '1.5px solid #d1fae5',
                borderRadius: 8,
                fontFamily: 'Cairo,sans-serif',
                outline: 'none',
              }}
            >
              <option value="px">px</option>
              <option value="pt">pt</option>
              <option value="em">em</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {[8,9,10,11,12,14,16,18,20,22,24,28,32,36,48,72].map(s => (
              <button
                key={s}
                onClick={() => { setSize(s); setUnit('px'); }}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #d1fae5',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  background: size === s && unit === 'px' ? '#10b981' : '#f0fdf4',
                  color: size === s && unit === 'px' ? '#fff' : '#059669',
                  fontFamily: 'Cairo,sans-serif',
                  fontWeight: 700,
                }}
              >
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
    const firstCell = table.querySelector('th, td');
    if (!firstCell) return 9;
    const val = parseInt(firstCell.style.paddingTop) || parseInt(firstCell.style.padding) || 9;
    return isNaN(val) ? 9 : val;
  });
  const [cellFont, setCellFont] = useState(() => {
    if (!table) return 14;
    const firstCell = table.querySelector('th, td');
    if (!firstCell) return 14;
    const val = parseInt(firstCell.style.fontSize) || 14;
    return isNaN(val) ? 14 : val;
  });
  const [rowH, setRowH] = useState(() => {
    if (!table) return 42;
    const firstCell = table.querySelector('th, td');
    if (!firstCell) return 42;
    const val = parseInt(firstCell.style.minHeight) || table.querySelector('tr')?.offsetHeight || 42;
    return isNaN(val) ? 42 : val;
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
              <option value="%">%</option>
              <option value="px">px</option>
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

  const placeCursorEnd = (el) => {
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}
  };

  const placeCursorStart = (el) => {
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}
  };

  const makeEditorCell = useCallback((tag, colW = 100) => {
    const el = document.createElement(tag);
    el.contentEditable = true;
    el.spellcheck = false;
    el.innerHTML = '<br>';
    el.tabIndex = 0;
    el.style.cssText = `border:1.5px solid #666666; padding:9px 13px; text-align:center; min-width:${colW}px; width:${colW}px; font-family:'Cairo',sans-serif; font-size:14px; vertical-align:middle; position:relative; outline:none; user-select:text; pointer-events:auto; cursor:text; transition:background .1s; ${
      tag === 'th' ? 'background:#f0f0f0;color:#000000;font-weight:700;' : 'background:#ffffff;color:#000000;'
    }`;
    el.addEventListener('focus', () => {
      if (el.innerHTML === '<br>' || el.innerHTML.trim() === '') el.innerHTML = '';
      el.style.outline = '2px solid #10b981';
      el.style.outlineOffset = '-2px';
      if (tag === 'th') el.style.background = '#e6faf3';
      else el.style.background = '#f0fdf4';
    });
    el.addEventListener('blur', () => {
      if (el.innerHTML.trim() === '') el.innerHTML = '<br>';
      el.style.outline = 'none';
      if (tag === 'th') el.style.background = '#f0f0f0';
      else el.style.background = '#ffffff';
    });
    if (tag === 'th') {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', Array.from(el.parentElement.children).indexOf(el));
        el.style.opacity = '0.5';
      });
      el.addEventListener('dragend', () => { el.style.opacity = '1'; });
      el.addEventListener('dragover', (e) => e.preventDefault());
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
        const toIdx = Array.from(el.parentElement.children).indexOf(el);
        if (fromIdx === toIdx) return;
        const table = el.closest('table');
        if (!table) return;
        table.querySelectorAll('tr').forEach((row) => {
          const cells = Array.from(row.children);
          const moved = cells[fromIdx];
          const target = cells[toIdx];
          if (moved && target) row.insertBefore(moved, fromIdx < toIdx ? target.nextSibling : target);
        });
        addResizeHandles(table);
      });
    }
    return el;
  }, []);

  const makeCell = makeEditorCell;

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const onCtx = (e) => {
      const cell = e.target.closest('td, th');
      if (!cell) return;
      e.preventDefault();
      setCtxMenu({ x: e.clientX, y: e.clientY, cell });
    };
    const onKeyDown = (e) => {
      const cell = e.target.closest('td, th');
      if (!cell) return;
      const table = cell.closest('table');
      if (!table) return;
      const allCells = Array.from(table.querySelectorAll('td, th'));
      const idx = allCells.indexOf(cell);
      const allRows = Array.from(table.querySelectorAll('tr'));
      const rowEl = cell.parentElement;
      const rowIdx = allRows.indexOf(rowEl);
      const colIdx = Array.from(rowEl.children).indexOf(cell);
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!e.shiftKey) {
          const next = allCells[idx + 1];
          if (next) {
            next.focus();
            placeCursorEnd(next);
          } else {
            const colCount = table.querySelector('tr')?.children.length || 1;
            const colW = allCells[0]?.offsetWidth || 100;
            const newRow = document.createElement('tr');
            for (let c = 0; c < colCount; c++) newRow.appendChild(makeEditorCell('td', colW));
            table.querySelector('tbody')?.appendChild(newRow);
            addResizeHandles(table);
            const wrapper = table.closest('.movable-table-wrapper');
            if (wrapper) addTableCornerHandle(wrapper, table);
            const firstNew = newRow.querySelector('td');
            if (firstNew) {
              firstNew.focus();
              placeCursorStart(firstNew);
            }
          }
        } else {
          const prev = allCells[idx - 1];
          if (prev) {
            prev.focus();
            placeCursorEnd(prev);
          }
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        const prevCell = Array.from(rowEl.children)[colIdx - 1];
        if (prevCell) { e.preventDefault(); prevCell.focus(); placeCursorEnd(prevCell); }
      } else if (e.key === 'ArrowLeft') {
        const nextCell = Array.from(rowEl.children)[colIdx + 1];
        if (nextCell) { e.preventDefault(); nextCell.focus(); placeCursorStart(nextCell); }
      } else if (e.key === 'ArrowUp' && rowIdx > 0) {
        e.preventDefault();
        const targetRow = allRows[rowIdx - 1];
        const targetCell = Array.from(targetRow.children)[Math.min(colIdx, targetRow.children.length - 1)];
        if (targetCell) { targetCell.focus(); placeCursorEnd(targetCell); }
      } else if (e.key === 'ArrowDown' && rowIdx < allRows.length - 1) {
        e.preventDefault();
        const targetRow = allRows[rowIdx + 1];
        const targetCell = Array.from(targetRow.children)[Math.min(colIdx, targetRow.children.length - 1)];
        if (targetCell) { targetCell.focus(); placeCursorStart(targetCell); }
      }
    };
    ed.addEventListener('contextmenu', onCtx);
    ed.addEventListener('input', updateCounts);
    ed.addEventListener('keydown', onKeyDown);
    return () => {
      ed.removeEventListener('contextmenu', onCtx);
      ed.removeEventListener('input', updateCounts);
      ed.removeEventListener('keydown', onKeyDown);
    };
  }, [updateCounts, makeEditorCell]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const openTableDialog = () => {
    saveSelection();
    setShowTblDlg(true);
  };

  const addResizeHandles = (table) => {
    // ─── مقابض تغيير عرض الأعمدة ───────────────────────────────────────────
    table.querySelectorAll('th').forEach((th, index) => {
      let h = th.querySelector('.resize-handle');
      if (h) h.remove();
      h = document.createElement('div');
      h.className = 'resize-handle';
      // ✅ pointer-events:none على th حتى لا يمنع الكليك، والمقبض نفسه يعمل
      h.style.cssText = 'position:absolute;right:-4px;top:0;width:8px;height:100%;cursor:col-resize;z-index:30;background:transparent;';
      th.style.position = 'relative';
      th.appendChild(h);
      h.addEventListener('mousedown', (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        isResizing.current = true;
        startX.current = e.pageX;
        startWidth.current = th.offsetWidth;
        document.documentElement.style.cursor = 'col-resize';
        const onMove = (me) => {
          if (!isResizing.current) return;
          const newW = Math.max(30, startWidth.current + (me.pageX - startX.current));
          table.querySelectorAll('tr').forEach((row) => {
            const c = row.children[index];
            if (c) {
              c.style.width = `${newW}px`;
              c.style.minWidth = `${newW}px`;
            }
          });
        };
        const onUp = () => {
          isResizing.current = false;
          document.documentElement.style.cursor = 'default';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });

    // ─── مقابض تغيير ارتفاع الصفوف ─────────────────────────────────────────
    // ✅ الإصلاح: نضع مقبض resize-row خارج الـ tr داخل wrapper خاص بكل صف
    // لكن الحل الأبسط: نضعه داخل آخر td في الصف بدل الـ tr نفسه
    table.querySelectorAll('tr').forEach((row) => {
      // إزالة أي مقبض قديم
      row.querySelectorAll('.resize-row-handle').forEach(el => el.remove());

      // ✅ نضع مقبض الارتفاع داخل الـ td الأخير في الصف بدل الـ tr
      const lastCell = row.lastElementChild;
      if (!lastCell) return;

      const rh = document.createElement('div');
      rh.className = 'resize-row-handle';
      // ✅ يُوضع في أسفل الخلية الأخيرة، لا في الـ tr
      rh.style.cssText = [
        'position:absolute',
        'bottom:0',
        'left:0',
        'right:0',
        'height:6px',
        'cursor:row-resize',
        'z-index:30',
        'background:transparent',
        // ✅ يمتد على كامل عرض الجدول بواسطة right كبير
        `width:${table.offsetWidth || 9999}px`,
      ].join(';');

      // نضمن أن lastCell لها position:relative
      lastCell.style.position = 'relative';
      lastCell.appendChild(rh);

      rh.addEventListener('mousedown', (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        const sy = e.pageY;
        const sh = row.offsetHeight;
        document.documentElement.style.cursor = 'row-resize';
        const onMove = (me) => {
          const newH = Math.max(20, sh + (me.pageY - sy));
          Array.from(row.children).forEach((c) => {
            c.style.height = '';
            c.style.minHeight = `${newH}px`;
          });
        };
        const onUp = () => {
          document.documentElement.style.cursor = 'default';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });

    // ─── مقابض سحب الصفوف لإعادة ترتيبها ──────────────────────────────────
    table.querySelectorAll('tr').forEach((row) => {
      row.querySelectorAll('.row-move-handle').forEach(el => el.remove());
      const isHeader = !!row.closest('thead');
      if (isHeader) return;

      const moveH = document.createElement('div');
      moveH.className = 'row-move-handle';
      moveH.style.cssText = 'position:absolute;left:-32px;top:0;width:26px;height:100%;cursor:grab;display:flex;align-items:center;justify-content:center;font-size:18px;color:#10b981;z-index:25;opacity:0.6;user-select:none;';
      moveH.innerHTML = '☰';
      row.style.position = 'relative';
      row.appendChild(moveH);

      moveH.draggable = true;
      moveH.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', Array.from(table.querySelectorAll('tr')).indexOf(row));
        row.style.opacity = '0.5';
      });
      moveH.addEventListener('dragend', () => { row.style.opacity = '1'; });
      moveH.addEventListener('dragover', (e) => e.preventDefault());
      moveH.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
        const allRows = Array.from(table.querySelectorAll('tr'));
        const toIdx = allRows.indexOf(row);
        if (fromIdx === toIdx) return;
        const movedRow = allRows[fromIdx];
        const targetRow = allRows[toIdx];
        if (movedRow && targetRow) {
          if (fromIdx < toIdx) targetRow.after(movedRow);
          else targetRow.before(movedRow);
        }
        addResizeHandles(table);
        const wrapper = table.closest('.movable-table-wrapper');
        if (wrapper) addTableCornerHandle(wrapper, table);
      });
    });
  };

  const addTableCornerHandle = (wrapper, table) => {
    let corner = wrapper.querySelector('.tbl-corner-handle');
    if (corner) corner.remove();
    corner = document.createElement('div');
    corner.className = 'tbl-corner-handle';
    corner.title = 'اسحب لتغيير حجم الجدول';
    corner.style.cssText = 'position:absolute;bottom:-6px;left:-6px;width:14px;height:14px;background:#10b981;border:2px solid #fff;border-radius:3px;cursor:nwse-resize;z-index:50;box-shadow:0 2px 6px rgba(0,0,0,.3);';
    wrapper.appendChild(corner);
    corner.addEventListener('mousedown', (e) => {
      e.stopImmediatePropagation();
      e.preventDefault();
      const sx = e.pageX;
      const sw = table.offsetWidth;
      document.documentElement.style.cursor = 'nwse-resize';
      const onMove = (me) => {
        const newW = Math.max(120, sw - (me.pageX - sx));
        table.style.width = `${newW}px`;
        table.style.minWidth = `${newW}px`;
        wrapper.style.minWidth = `${newW}px`;
        table.dataset.userWidth = `${newW}px`;
      };
      const onUp = () => {
        document.documentElement.style.cursor = 'default';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  };

  const insertTable = (rows, cols) => {
    setShowTblDlg(false);
    const ed = editorRef.current;
    if (!ed) return;
    const colW = Math.max(60, Math.floor(640 / cols));
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;margin:16px 0;direction:rtl;table-layout:fixed;width:100%;';
    table.dataset.userWidth = '100%';
    table.dataset.userCellPad = '9';
    table.dataset.userCellFont = '14';
    table.dataset.userRowH = '42';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (let c = 0; c < cols; c++) headRow.appendChild(makeCell('th', colW));
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const td = makeCell('td', colW);
        if (r % 2 === 1) td.style.background = '#f9f9f9';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    const wrapper = document.createElement('div');
    wrapper.className = 'movable-table-wrapper';
    wrapper.style.cssText = 'position:relative;margin:20px 0;display:block;width:100%;';

    const moveHandle = document.createElement('div');
    moveHandle.className = 'table-move-handle';
    moveHandle.innerHTML = '⇄';
    moveHandle.style.cssText = 'position:absolute;top:-32px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;width:32px;height:26px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:grab;box-shadow:0 3px 10px rgba(0,0,0,.2);z-index:20;';
    moveHandle.draggable = true;
    moveHandle.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', 'move-table'); wrapper.style.opacity = '0.5'; });
    moveHandle.addEventListener('dragend', () => { wrapper.style.opacity = '1'; });

    const resizeBtn = document.createElement('div');
    resizeBtn.className = 'table-resize-btn';
    resizeBtn.innerHTML = '⇔';
    resizeBtn.title = 'تغيير حجم الجدول';
    resizeBtn.style.cssText = 'position:absolute;top:-32px;left:calc(50% + 38px);transform:translateX(-50%);background:#0f766e;color:#fff;width:28px;height:26px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.2);z-index:20;user-select:none;';
    resizeBtn.addEventListener('click', (e) => { e.stopPropagation(); setTblResizeTarget(table); });

    wrapper.appendChild(moveHandle);
    wrapper.appendChild(resizeBtn);
    wrapper.appendChild(table);

    const after = document.createElement('p');
    after.innerHTML = '<br>';
    ed.focus();
    restoreSelection();
    const sel = window.getSelection();
    let inserted = false;
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      let container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) container = container.parentNode;
      const block = container.closest?.('p,h1,h2,h3,li,blockquote');
      if (block && block !== ed && block.parentNode === ed) {
        block.after(wrapper);
        wrapper.after(after);
        inserted = true;
      }
    }
    if (!inserted) {
      ed.appendChild(wrapper);
      ed.appendChild(after);
    }
    addResizeHandles(table);
    addTableCornerHandle(wrapper, table);
    const firstCell = table.querySelector('th, td');
    if (firstCell) {
      setTimeout(() => {
        firstCell.focus();
        placeCursorStart(firstCell);
      }, 60);
    }
    updateCounts();
  };

  const handleTableAction = (act) => {
    if (!ctxMenu?.cell) return;
    const cell = ctxMenu.cell;
    const row = cell.parentElement;
    const table = cell.closest('table');
    if (!table) return;
    const allRows = Array.from(table.querySelectorAll('tr'));
    const colCount = allRows[0]?.children.length || 0;
    const colIdx = Array.from(row.children).indexOf(cell);
    const colW = cell.offsetWidth || 100;
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
        allRows.forEach((r) => {
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
        if (colCount > 1) allRows.forEach((r) => Array.from(r.children)[colIdx]?.remove());
        break;
      case 'delTable':
        table.closest('.movable-table-wrapper')?.remove();
        break;
      default:
        break;
    }
    if (table.isConnected) {
      addResizeHandles(table);
      const wrapper = table.closest('.movable-table-wrapper');
      if (wrapper) addTableCornerHandle(wrapper, table);
    }
    updateCounts();
  };

  const execCmd = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const applyFont = (font) => {
    editorRef.current?.focus();
    document.execCommand('fontName', false, font);
  };

  const applySize = (size) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = size;
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
  };

  const changePageWidth = (delta) => {
    const nw = Math.max(600, Math.min(1400, pageWidth + delta));
    setPageWidth(nw);
    const wrap = document.querySelector('.de-wrap');
    const ed = editorRef.current;
    if (wrap) wrap.style.maxWidth = `${nw}px`;
    if (ed) ed.style.padding = `52px ${Math.max(40, nw / 15)}px`;
  };

  const resetPageWidth = () => {
    setPageWidth(960);
    const wrap = document.querySelector('.de-wrap');
    const ed = editorRef.current;
    if (wrap) wrap.style.maxWidth = '960px';
    if (ed) ed.style.padding = '52px 64px';
  };

  // ====================== تحسين الطباعة والـ PDF ======================
  const getCleanHTML = () => {
    const ed = editorRef.current;
    if (!ed) return '';
    const clone = ed.cloneNode(true);

    const selectorsToRemove = [
      '.resize-handle',
      '.resize-row-handle',
      '.row-move-handle',
      '.tbl-corner-handle',
      '.table-move-handle',
      '.table-resize-btn',
    ];
    selectorsToRemove.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });

    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('[tabindex]').forEach(el => el.removeAttribute('tabindex'));

    clone.querySelectorAll('.movable-table-wrapper').forEach(wrapper => {
      const table = wrapper.querySelector('table');
      if (table) {
        const tableClone = table.cloneNode(true);
        selectorsToRemove.forEach(sel => {
          tableClone.querySelectorAll(sel).forEach(el => el.remove());
        });

        const userWidth = table.dataset.userWidth || table.style.width || '100%';
        const userCellPad = table.dataset.userCellPad ? parseInt(table.dataset.userCellPad) : null;
        const userCellFont = table.dataset.userCellFont ? parseInt(table.dataset.userCellFont) : null;
        const userRowH = table.dataset.userRowH ? parseInt(table.dataset.userRowH) : null;

        tableClone.style.width = userWidth;
        tableClone.style.minWidth = userWidth.includes('px') ? userWidth : 'auto';
        tableClone.style.borderCollapse = 'collapse';
        tableClone.style.direction = 'rtl';
        tableClone.style.tableLayout = 'fixed';
        tableClone.style.margin = '0';

        tableClone.querySelectorAll('th, td').forEach(cell => {
          const isTh = cell.tagName === 'TH';
          const fs = userCellFont ? `${userCellFont}px` : (cell.style.fontSize || '13.8px');
          const padVal = userCellPad ? `${userCellPad}px 13px` : (cell.style.padding || '11px 13px');
          const minH = userRowH ? `${userRowH}px` : (cell.style.minHeight || '44px');
          const bgColor = isTh
            ? '#f0f0f0'
            : (cell.style.backgroundColor || cell.style.background || '#ffffff');

          cell.style.cssText = '';
          cell.style.border = '1.6px solid #000000';
          cell.style.padding = padVal;
          cell.style.textAlign = 'center';
          cell.style.verticalAlign = 'middle';
          cell.style.fontFamily = "'Cairo', sans-serif";
          cell.style.fontSize = fs;
          cell.style.minHeight = minH;
          cell.style.wordBreak = 'break-word';
          cell.style.direction = 'rtl';
          cell.style.outline = 'none';
          cell.style.background = bgColor;
          cell.style.color = '#000000';
          cell.style.fontWeight = isTh ? '700' : '400';
          cell.style.position = 'static';
        });

        tableClone.querySelectorAll('tr').forEach(row => { row.style.position = 'static'; });
        tableClone.querySelectorAll('th').forEach(th => { th.style.position = 'static'; });

        const div = document.createElement('div');
        div.style.cssText = 'display:block;width:100%;margin:16px 0;clear:both;';
        div.appendChild(tableClone);
        wrapper.replaceWith(div);
      } else {
        wrapper.remove();
      }
    });

    return clone.innerHTML;
  };

  const handlePrint = () => {
    const edHTML = getCleanHTML();
    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const win = window.open('', '_blank', 'width=1400,height=1000');
    if (!win) {
      alert('يرجى السماح بالنوافذ المنبثقة');
      return;
    }
    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${title || 'مستند'}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 1.3cm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Cairo', sans-serif;
    line-height: 1.9;
    color: #111;
    background: #fff;
    margin: 0;
    padding: 0;
  }
  .print-page {
    max-width: 830px;
    margin: 0 auto;
    padding: 25mm 22mm;
    background: white;
  }
  .print-hdr {
    border-bottom: 6px solid #10b981;
    padding-bottom: 20px;
    margin-bottom: 35px;
  }
  .print-hdr-brand { color: #10b981; font-size: 30px; font-weight: 900; }
  .print-hdr-sub { color: #0f766e; font-weight: 600; font-size: 14.5px; }
  .doc-title {
    text-align: center;
    color: #10b981;
    font-size: 26px;
    font-weight: 900;
    margin: 30px 0 20px;
  }

  .resize-handle,
  .resize-row-handle,
  .row-move-handle,
  .tbl-corner-handle,
  .table-move-handle,
  .table-resize-btn {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    position: absolute !important;
    opacity: 0 !important;
  }

  table {
    border-collapse: collapse !important;
    margin: 18px 0 !important;
    table-layout: fixed !important;
    page-break-inside: auto !important;
    direction: rtl !important;
  }
  th, td {
    border: 1.6px solid #000 !important;
    text-align: center !important;
    vertical-align: middle !important;
    word-break: break-word !important;
    direction: rtl !important;
    position: static !important;
    outline: none !important;
    font-family: 'Cairo', sans-serif !important;
  }
  th { font-weight: 700 !important; color: #000 !important; }
  tr { page-break-inside: avoid !important; position: static !important; }
  thead { display: table-header-group !important; }

  .movable-table-wrapper {
    display: block !important;
    width: 100% !important;
    position: static !important;
    margin: 16px 0 !important;
    clear: both !important;
  }
  p, h1, h2, h3, h4, ul, ol, li, blockquote, div {
    max-width: 100% !important;
    overflow-wrap: break-word !important;
    word-wrap: break-word !important;
  }
  .content-body {
    display: block !important;
    width: 100% !important;
    overflow: hidden !important;
  }

  @media print {
    .no-print { display: none !important; }
    .resize-handle,
    .resize-row-handle,
    .row-move-handle,
    .tbl-corner-handle,
    .table-move-handle,
    .table-resize-btn { display: none !important; }
  }
</style>
</head>
<body>
<div class="print-page">
  <div class="print-hdr">
    <div class="print-hdr-brand">NileMix</div>
    <div class="print-hdr-sub">شركة النيل للخرسانة الجاهزة — إدارة العلاقات العامة والأمن</div>
  </div>
  ${title ? `<div class="doc-title">${title}</div>` : ''}
  <div class="content-body">${edHTML}</div>
  <div style="margin-top:80px;padding-top:20px;border-top:3px solid #d1fae5;text-align:center;font-size:12px;color:#555;">
    ${dateStr} — NileMix Document Editor
  </div>
</div>
<div class="no-print" style="position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#0f172a;color:white;padding:16px 50px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <button onclick="window.print()" style="background:#10b981;color:white;border:none;padding:14px 42px;margin:0 15px;border-radius:8px;cursor:pointer;font-size:17px;">🖨️ طباعة / حفظ PDF</button>
  <button onclick="window.close()" style="background:#374151;color:white;border:none;padding:14px 42px;border-radius:8px;cursor:pointer;font-size:17px;">إغلاق</button>
</div>
</body>
</html>`);
    win.document.close();
  };

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&family=Tajawal:wght@400;500;700&family=Amiri:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
--brand:#10b981;--brand-d:#059669;
--dark:#0f172a;--muted:#64748b;
--border:#e2e8f0;--bg:#f8fafc;--surface:#ffffff;
}
body{margin:0}
.de-page{min-height:100vh;background:var(--bg);font-family:'Cairo',sans-serif;direction:rtl;padding-bottom:50px}
.de-header{
position:sticky;top:0;z-index:300;
background:var(--surface);border-bottom:1px solid var(--border);
box-shadow:0 2px 8px rgba(0,0,0,.06);
padding:10px 24px;
display:flex;align-items:center;justify-content:space-between;
gap:12px;flex-wrap:wrap;
}
.de-brand-name{font-size:1.05rem;font-weight:900;color:var(--brand)}
.de-brand-sub{font-size:.7rem;color:var(--muted);margin-top:1px}
.de-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.de-title{
padding:8px 14px;border:1.5px solid var(--border);border-radius:9px;
width:300px;font-size:13px;font-family:'Cairo',sans-serif;
color:var(--dark);background:var(--bg);outline:none;direction:rtl;
}
.de-title:focus{border-color:var(--brand);background:#fff;box-shadow:0 0 0 3px rgba(16,185,129,.1)}
.de-btn{
display:inline-flex;align-items:center;gap:5px;
padding:8px 16px;border-radius:9px;
font-size:13px;font-family:'Cairo',sans-serif;
font-weight:700;border:none;cursor:pointer;white-space:nowrap;transition:background .15s;
}
.btn-green{background:#10b981;color:#fff}
.btn-green:hover{background:#059669}
.btn-dark{background:#374151;color:#fff}
.btn-dark:hover{background:#1f2937}
.de-toolbar{
margin:18px auto 0;
background:var(--surface);
border:1px solid var(--border);border-bottom:none;
border-radius:12px 12px 0 0;
padding:7px 10px;
display:flex;flex-wrap:wrap;gap:2px;align-items:center;direction:ltr;
}
.tb-sep{width:1px;height:22px;background:var(--border);margin:0 4px;flex-shrink:0}
.tb-btn{
width:28px;height:28px;border:none;background:transparent;border-radius:6px;
cursor:pointer;display:flex;align-items:center;justify-content:center;
color:#374151;font-size:13px;padding:0;
font-family:'Cairo',sans-serif;font-weight:700;flex-shrink:0;transition:background .15s,color .15s;
}
.tb-btn:hover{background:#d1fae5;color:#059669}
.tb-select{
height:28px;border:1px solid var(--border);border-radius:6px;padding:0 6px;
font-family:'Cairo',sans-serif;font-size:12px;color:#374151;
background:var(--bg);cursor:pointer;outline:none;
}
.tb-select:focus{border-color:var(--brand)}
.tb-color{width:26px;height:26px;border:1.5px solid var(--border);border-radius:6px;padding:1px;cursor:pointer;background:none}
.de-wrap{
margin:0 auto 60px;
background:var(--surface);
border:1px solid var(--border);border-radius:0 0 12px 12px;
box-shadow:0 4px 20px rgba(0,0,0,.07);
min-height:700px;transition:all .3s ease;
}
.de-editor{
min-height:700px;padding:52px 64px;outline:none;
font-family:'Cairo',sans-serif;font-size:16px;line-height:2;
color:#111;direction:rtl;text-align:right;
word-break:break-word;overflow-wrap:break-word;
}
.de-editor:empty::before{content:'ابدأ الكتابة هنا...';color:#cbd5e1;pointer-events:none}
.de-editor table{border-collapse:collapse;margin:16px 0;direction:rtl;table-layout:fixed}
.de-editor th,.de-editor td{
border:1.5px solid #666;padding:9px 13px;
text-align:center;vertical-align:middle;
font-size:14px;font-family:'Cairo',sans-serif;
min-width:30px;cursor:cell;user-select:text;pointer-events:auto;
transition:background .1s;
}
.de-editor th{background:#f0f0f0;font-weight:700;color:#000}
.de-editor tr:nth-child(even) td{background:#f9f9f9}
.de-editor td:focus,.de-editor th:focus{outline:2.5px solid #10b981 !important;outline-offset:-1px;}

/* ✅ مقابض تغيير عرض الأعمدة - لا تعيق الكليك */
.resize-handle{
  position:absolute;
  right:-4px;top:0;
  width:8px;height:100%;
  cursor:col-resize;z-index:30;
  background:transparent;
  transition:background .15s;
  /* ✅ مهم: pointer-events:auto فقط على المقبض نفسه */
}
.resize-handle:hover,th:hover .resize-handle{background:#10b981;opacity:0.6}

/* ✅ مقبض تغيير ارتفاع الصف - في أسفل آخر td */
.resize-row-handle{
  position:absolute;
  bottom:0;left:0;
  height:6px;
  cursor:row-resize;z-index:30;
  background:transparent;
  transition:background .15s;
  /* ✅ يمتد على عرض الجدول الكامل */
  width:9999px;
}
.resize-row-handle:hover{background:rgba(16,185,129,.5)}

.row-move-handle{position:absolute;left:-32px;top:0;width:26px;height:100%;cursor:grab;display:flex;align-items:center;justify-content:center;font-size:18px;color:#10b981;z-index:25;opacity:0.6;user-select:none;}
.row-move-handle:hover{opacity:1;background:#f0fdf4;border-radius:4px}
.tbl-corner-handle{position:absolute;bottom:-6px;left:-6px;width:14px;height:14px;background:#10b981;border:2px solid #fff;border-radius:3px;cursor:nwse-resize;z-index:50;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:transform .15s;}
.tbl-corner-handle:hover{transform:scale(1.3)}
th[draggable="true"]{cursor:grab}
th[draggable="true"]:active{cursor:grabbing}
.movable-table-wrapper{position:relative;display:block;width:100%;margin:20px 0;}
.table-move-handle{position:absolute;top:-32px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;width:32px;height:26px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:grab;box-shadow:0 3px 10px rgba(0,0,0,.2);z-index:20;}
.table-resize-btn{position:absolute;top:-32px;left:calc(50% + 38px);transform:translateX(-50%);background:#0f766e;color:#fff;width:28px;height:26px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.2);z-index:20;transition:background .15s;}
.table-resize-btn:hover{background:#059669}
.tbl-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;direction:rtl}
.tbl-dialog{background:#fff;border-radius:16px;padding:26px;box-shadow:0 20px 50px rgba(0,0,0,.2);min-width:300px;max-height:90vh;overflow-y:auto}
.tbl-title{font-size:17px;font-weight:800;color:#059669;margin-bottom:14px;text-align:center}
.tbl-hint{font-size:14px;font-weight:700;color:#0f766e;text-align:center;margin-bottom:10px}
.tbl-grid{display:grid;grid-template-columns:repeat(10,22px);gap:3px;margin-bottom:16px;justify-content:center}
.tbl-cell{width:22px;height:22px;border:1.5px solid #d1fae5;border-radius:3px;cursor:pointer}
.tbl-cell.on{background:#10b981;border-color:#059669}
.tbl-cell:hover{border-color:#059669}
.tbl-manual{display:flex;gap:14px;justify-content:center;margin-bottom:16px}
.tbl-field{display:flex;flex-direction:column;align-items:center;gap:4px}
.tbl-field label{font-size:11px;color:#6b7280;font-weight:600}
.tbl-field input{width:72px;padding:6px;border:1.5px solid #d1fae5;border-radius:8px;font-size:14px;text-align:center;font-family:'Cairo',sans-serif;outline:none}
.tbl-field input:focus{border-color:#10b981}
.tbl-actions{display:flex;gap:10px;justify-content:center}
.tbl-insert{background:#10b981;color:#fff;border:none;padding:9px 24px;border-radius:9px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
.tbl-insert:hover{background:#059669}
.tbl-cancel{background:#f3f4f6;color:#374151;border:none;padding:9px 20px;border-radius:9px;font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer}
.tbl-cancel:hover{background:#e5e7eb}
.ctx-menu{position:fixed;background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.13);padding:5px;z-index:9999;list-style:none;min-width:180px;font-family:'Cairo',sans-serif;direction:rtl}
.ctx-menu li{padding:8px 12px;border-radius:6px;cursor:pointer;font-size:13px;color:#1f2937;display:flex;align-items:center;gap:8px;transition:background .12s}
.ctx-menu li:hover{background:#f0fdf4;color:#059669}
.ctx-menu li.danger{color:#dc2626}
.ctx-menu li.danger:hover{background:#fef2f2}
.ctx-icon{font-size:13px;width:18px;text-align:center;font-weight:700}
.ctx-sep{height:1px;background:var(--border);margin:4px 0;pointer-events:none}
.de-status{
position:fixed;bottom:0;left:0;right:0;height:28px;
background:#1e293b;color:#94a3b8;
font-family:'Cairo',sans-serif;font-size:11px;
display:flex;align-items:center;justify-content:space-between;
padding:0 16px;z-index:200;
}
.de-status-brand{color:#10b981;font-weight:700}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:#f1f5f9}
::-webkit-scrollbar-thumb{background:#a7f3d0;border-radius:99px}
::-webkit-scrollbar-thumb:hover{background:#10b981}
`}</style>

      <div className="de-page">
        <div className="de-header">
          <div>
            <div className="de-brand-name">NileMix — محرر المستندات</div>
            <div className="de-brand-sub">شركة النيل للخرسانة الجاهزة</div>
          </div>
          <div className="de-actions">
            <input className="de-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المستند..." />
            <button className="de-btn btn-dark" onClick={() => changePageWidth(-50)} title="تصغير الصفحة">📄−</button>
            <span style={{ fontSize: 13, color: '#64748b', padding: '8px 4px' }}>{pageWidth}px</span>
            <button className="de-btn btn-dark" onClick={() => changePageWidth(50)} title="تكبير الصفحة">📄+</button>
            <button className="de-btn btn-dark" onClick={resetPageWidth} title="إعادة تعيين">↺</button>
            <button className="de-btn btn-dark" onClick={() => setZoomLevel((v) => Math.max(30, v - 10))} title="تصغير">🔍−</button>
            <span style={{ fontSize: 13, color: '#64748b', padding: '8px 4px' }}>{zoomLevel}%</span>
            <button className="de-btn btn-dark" onClick={() => setZoomLevel((v) => Math.min(300, v + 10))} title="تكبير">🔍+</button>
            <button className="de-btn btn-dark" onClick={() => setZoomLevel(100)} title="100%">100%</button>
            <button className="de-btn btn-green" onClick={handlePrint}>🖨️ طباعة / PDF</button>
            <button className="de-btn btn-dark" onClick={() => navigate('/dashboard')}>← رجوع</button>
          </div>
        </div>

        <div className="de-toolbar" style={{ maxWidth: `${pageWidth}px` }}>
          <select className="tb-select" style={{ width: 96 }} onChange={(e) => applyFont(e.target.value)}>
            <option value="Cairo,sans-serif">Cairo</option>
            <option value="Tajawal,sans-serif">Tajawal</option>
            <option value="Amiri,serif">Amiri</option>
            <option value="Arial,sans-serif">Arial</option>
            <option value="'Times New Roman',serif">Times</option>
          </select>
          <select className="tb-select" style={{ width: 60 }} onChange={(e) => {
            if (e.target.value === 'custom') {
              saveSelection();
              setShowFontDlg(true);
            } else applySize(e.target.value);
          }}>
            {['8px','9px','10px','11px','12px','14px','16px','18px','20px','22px','24px','28px','32px','36px','48px','72px'].map(s => (
              <option key={s} value={s}>{s.replace('px','')}</option>
            ))}
            <option value="custom">مخصص…</option>
          </select>
          <div className="tb-sep" />
          <select className="tb-select" style={{ width: 80 }} onChange={(e) => execCmd('formatBlock', e.target.value)}>
            <option value="p">عادي</option>
            <option value="h1">عنوان 1</option>
            <option value="h2">عنوان 2</option>
            <option value="h3">عنوان 3</option>
          </select>
          <div className="tb-sep" />
          <button className="tb-btn" title="غامق" onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }}><b>B</b></button>
          <button className="tb-btn" title="مائل" onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }}><i>I</i></button>
          <button className="tb-btn" title="تسطير" onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} style={{ textDecoration: 'underline' }}>U</button>
          <button className="tb-btn" title="يتوسطه خط" onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough'); }} style={{ textDecoration: 'line-through' }}>S</button>
          <div className="tb-sep" />
          <input type="color" className="tb-color" defaultValue="#111111" onInput={(e) => { editorRef.current?.focus(); execCmd('foreColor', e.target.value); }} />
          <input type="color" className="tb-color" defaultValue="#ffffff" onInput={(e) => { editorRef.current?.focus(); execCmd('hiliteColor', e.target.value); }} />
          <div className="tb-sep" />
          <button className="tb-btn" title="يمين" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }}>⇒</button>
          <button className="tb-btn" title="توسيط" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }}>≡</button>
          <button className="tb-btn" title="يسار" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }}>⇐</button>
          <button className="tb-btn" title="ضبط" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyFull'); }}>☰</button>
          <div className="tb-sep" />
          <button className="tb-btn" title="نقطية" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }}>•≡</button>
          <button className="tb-btn" title="مرقمة" onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }}>1≡</button>
          <div className="tb-sep" />
          <button className="tb-btn" title="إدراج جدول" onMouseDown={(e) => { e.preventDefault(); openTableDialog(); }}>
            <svg viewBox="0 0 18 18" fill="none" width="15" height="15">
              <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="1" y1="6.5" x2="17" y2="6.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="1" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.2" />
              <line x1="7" y1="1" x2="7" y2="17" stroke="currentColor" strokeWidth="1.2" />
              <line x1="13" y1="1" x2="13" y2="17" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
          <div className="tb-sep" />
          <button className="tb-btn" title="مسح التنسيق" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }}>✕</button>
          <button className="tb-btn" title="تراجع" onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }}>↩</button>
          <button className="tb-btn" title="إعادة" onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }}>↪</button>
          <div className="tb-sep" />
          <span style={{ fontSize: 11, color: '#94a3b8', padding: '0 4px', whiteSpace: 'nowrap', direction: 'rtl' }}>
            Tab ← خلية التالية &nbsp;|&nbsp; ↑↓←→ ← تنقل بين الصفوف &nbsp;|&nbsp; ☰ اسحب لإعادة ترتيب الصفوف
          </span>
        </div>

        <div className="de-wrap" style={{ maxWidth: `${pageWidth}px` }}>
          <div
            ref={editorRef}
            className="de-editor"
            contentEditable
            suppressContentEditableWarning
            onInput={updateCounts}
            dir="rtl"
            spellCheck={false}
            style={{ zoom: `${zoomLevel}%` }}
          />
        </div>

        {showTblDlg && <TableDialog onInsert={insertTable} onClose={() => setShowTblDlg(false)} />}
        {ctxMenu && <ContextMenu pos={{ x: ctxMenu.x, y: ctxMenu.y }} onAction={handleTableAction} onClose={() => setCtxMenu(null)} />}
        {showFontDlg && (
          <FontSizeDialog
            onApply={(size) => {
              restoreSelection();
              applySize(size);
              setShowFontDlg(false);
            }}
            onClose={() => setShowFontDlg(false)}
          />
        )}
        {tblResizeTarget && <TableResizeDialog table={tblResizeTarget} onClose={() => setTblResizeTarget(null)} />}

        <div className="de-status">
          <span>كلمات: {wordCount} · أحرف: {charCount}</span>
          <span className="de-status-brand">NileMix Document Editor ✦</span>
        </div>
      </div>
    </>
  );
}