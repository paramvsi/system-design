"use client";

export default function SidebarToggle() {
  return (
    <button
      type="button"
      className="sidebar-toggle"
      aria-label="Open sidebar"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("sidebar:toggle"))
      }
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M2 4h12M2 8h12M2 12h12" />
      </svg>
    </button>
  );
}
