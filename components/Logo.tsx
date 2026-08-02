import React from 'react'

/**
 * Brand mark for the top-left of the navbar. Pure CSS/SVG so there's no
 * asset to 404 — a terracotta monogram that nods to the Anthropic palette
 * used across Martyn's stack.
 */
export function Logo() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        fontWeight: 700,
        fontSize: '1.05rem',
        letterSpacing: '-0.01em',
      }}
    >
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#D97757" />
        <path
          d="M9 22 L16 9 L23 22 M11.6 17.5 H20.4"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span>Martyn</span>
    </span>
  )
}
