// src/components/Tooltip.tsx
'use client'

import { useState, ReactNode } from 'react'

export default function Tooltip({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap px-2 py-1 text-xs text-gray-200 bg-[rgba(0,0,0,0.85)] rounded shadow-lg z-50">
          {label}
        </span>
      )}
    </span>
  )
}
