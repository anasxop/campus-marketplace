import { useState, useRef, useEffect } from "react";
import universitiesData from "../data/universities.json";

// Single source of truth: all university names, alphabetically sorted
export const ALL_UNIVERSITIES = universitiesData
  .map(u => u.name)
  .sort((a, b) => a.localeCompare(b));

const baseInputStyle = {
  width: "100%",
  padding: "11px 14px",
  background: "#faf7ff",
  color: "#14141f",
  fontSize: 14,
  border: "1.5px solid #e5e5ec",
  borderRadius: 10,
  outline: "none",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  boxSizing: "border-box",
  transition: "border-color 180ms ease, box-shadow 180ms ease",
};

/**
 * UniversityDropdown — universal component for the whole app.
 *
 * Props:
 *  value      – currently selected university string
 *  onChange   – called with the selected name string
 *  disabled   – boolean
 *  label      – label text (defaults to "University / College")
 *  placeholder – input placeholder
 */
export default function UniversityDropdown({
  value,
  onChange,
  disabled = false,
  label = "University / College",
  placeholder = "Search your university...",
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Sync external value changes (e.g. reset form)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll selected item into view when opening
  useEffect(() => {
    if (open && listRef.current && value) {
      const selected = listRef.current.querySelector("[data-selected='true']");
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [open, value]);

  const filtered = ALL_UNIVERSITIES.filter(name =>
    query.trim() === "" || name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const handleSelect = (name) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    // Don't push partial text as the value; only committed selections do
    setOpen(true);
  };

  const borderColor = focused ? "#5c22d4" : "#e5e5ec";
  const boxShadow = focused ? "0 0 0 3px rgba(92,34,212,0.10)" : "none";

  return (
    <div style={{ marginBottom: 14, position: "relative" }} ref={containerRef}>
      {label && (
        <label style={{
          display: "block", fontSize: 13, fontWeight: 600,
          color: "#4b4b5c", marginBottom: 6,
        }}>
          {label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        <input
          type="text"
          style={{
            ...baseInputStyle,
            borderColor,
            boxShadow,
            paddingRight: 36,
          }}
          value={query}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        <div style={{
          position: "absolute", right: 12, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 15, pointerEvents: "none", opacity: 0.45,
          transition: "transform 200ms ease",
          display: "flex", alignItems: "center",
        }}>
          🔍
        </div>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#fff",
          borderRadius: 14,
          border: "1.5px solid #e0d0fd",
          boxShadow: "0 16px 48px rgba(92,34,212,0.18)",
          zIndex: 9999,
          overflow: "hidden",
          maxHeight: 260,
          overflowY: "auto",
          scrollBehavior: "smooth",
        }}
          ref={listRef}
        >
          {filtered.length === 0 ? (
            <div style={{
              padding: "16px 14px", textAlign: "center",
              fontSize: 13, color: "#9898a8",
            }}>
              No universities found for "{query}"
            </div>
          ) : (
            filtered.map((name) => {
              const isSelected = value === name;
              return (
                <button
                  key={name}
                  data-selected={isSelected ? "true" : "false"}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", textAlign: "left",
                    padding: "9px 14px",
                    background: isSelected ? "#f3ecfe" : "transparent",
                    border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#5c22d4" : "#14141f",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    borderLeft: isSelected ? "3px solid #5c22d4" : "3px solid transparent",
                    transition: "background 100ms ease",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur first
                    handleSelect(name);
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = "#faf7ff";
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ flexShrink: 0 }}>🎓</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
