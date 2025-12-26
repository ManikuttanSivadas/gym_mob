import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";

function MonthPickerModal({ value = [], onChange, min, max, onClose }) {
  const today = new Date();
  const initialYear = (value && value.length > 0) ? Number(value[0].split("-")[0]) : today.getFullYear();
  const [year, setYear] = useState(initialYear);

  const monthNames = useMemo(
    () => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    []
  );

  const parseYMIndex = useCallback((ym) => {
    if (!ym) return null;
    const p = ym.split("-");
    if (p.length !== 2) return null;
    const y = Number(p[0]), m = Number(p[1]) - 1;
    if (Number.isNaN(y) || Number.isNaN(m)) return null;
    return y * 12 + m;
  }, []);

  const minIndex = parseYMIndex(min);
  const maxIndex = parseYMIndex(max);
  const minYear = today.getFullYear() - 10;
  const maxYear = today.getFullYear();
  const canGoNext = year < maxYear;
  const canGoPrev = year > minYear;

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose && onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toYM(y, mIdx) {
    return `${y}-${String(mIdx + 1).padStart(2,"0")}`;
  }

  function isAllowed(y, mIdx) {
    const idx = y * 12 + mIdx;
    if (minIndex !== null && idx < minIndex) return false;
    if (maxIndex !== null && idx > maxIndex) return false;
    return true;
  }

  const selectedSet = useMemo(() => new Set(value || []), [value]);

  function toggleMonth(mIdx) {
    if (!isAllowed(year, mIdx)) return;
    const ym = toYM(year, mIdx);
    const s = new Set(value || []);
    if (s.has(ym)) s.delete(ym); else s.add(ym);
    const arr = Array.from(s).sort((a,b) => (parseYMIndex(a)||0) - (parseYMIndex(b)||0));
    onChange && onChange(arr);
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={() => onClose && onClose()}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="btn-secondary" onClick={() => canGoPrev && setYear(y => y - 1)} disabled={!canGoPrev} aria-label="Prev year" style={{ opacity: canGoPrev ? 1 : 0.5, cursor: canGoPrev ? "pointer" : "not-allowed", fontSize: 20, lineHeight: 1, padding: "4px 8px", background: "transparent", border: "none" }}>‹</button>
          <strong>{year}</strong>
          <button className="btn-secondary" onClick={() => canGoNext && setYear(y => y + 1)} disabled={!canGoNext} aria-label="Next year" style={{ opacity: canGoNext ? 1 : 0.5, cursor: canGoNext ? "pointer" : "not-allowed", fontSize: 20, lineHeight: 1, padding: "4px 8px", background: "transparent", border: "none" }}>›</button>
        </div>

        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {monthNames.map((m, idx) => {
              const allowed = isAllowed(year, idx);
              const ym = toYM(year, idx);
              const selected = selectedSet.has(ym);
              return (
                <button
                  key={m}
                  className={`month-btn ${selected ? "selected" : ""}`}
                  onClick={() => toggleMonth(idx)}
                  disabled={!allowed}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "transparent",
                    color: selected ? "var(--text-primary)" : "var(--text-primary)",
                    border: selected ? "1px solid var(--border-light)" : "1px solid transparent",
                    cursor: allowed ? "pointer" : "not-allowed",
                    minHeight: 44,
                    fontWeight: 700
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MonthPickerModal;
