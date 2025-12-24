import React from "react";

function FilterControls({ 
  showCalendarView, 
  onToggleCalendarView, 
  onOpenMonthFilter, 
  isEditingAnyExercise, 
  filterDisabled 
}) {
  return (
    <div className="history-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        className="filter-icon-btn"
        title={showCalendarView ? "List view" : "Calendar view"}
        aria-label={showCalendarView ? "List view" : "Calendar view"}
        onClick={onToggleCalendarView}
        style={{ width: 40, height: 40, borderRadius: 10, padding: 6, background: showCalendarView ? "rgba(239, 68, 68, 0.1)" : "transparent", border: "none" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <button
        className="filter-icon-btn"
        title="Filter by month"
        aria-label="Filter by month"
        onClick={onOpenMonthFilter}
        disabled={isEditingAnyExercise || filterDisabled}
        style={{ width: 40, height: 40, borderRadius: 10, padding: 6, background: "transparent", border: "none", opacity: filterDisabled ? 0.5 : 1, cursor: filterDisabled ? "not-allowed" : "pointer" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
          <path d="M3 5h18" />
          <path d="M6 12h12" />
          <path d="M10 19h4" />
        </svg>
      </button>
    </div>
  );
}

export default FilterControls;
