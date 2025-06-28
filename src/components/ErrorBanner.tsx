import { useState, useRef } from 'react'
import { useS3 } from '@/contexts/s3'

function Tooltip({ label, children }: { label: string, children: React.ReactNode }) {
    const [show, setShow] = useState(false)
    return (
        <span
            className="relative inline-block"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#111] text-xs text-gray-200 rounded shadow z-50 whitespace-nowrap pointer-events-none">
                    {label}
                </span>
            )}
        </span>
    )
}

export default function ErrorBanner({ msg }: { msg: string }) {
    const { setError } = useS3() as any
    const textRef = useRef<HTMLDivElement>(null)

    const copy = () => {
        if (textRef.current) {
            navigator.clipboard.writeText(textRef.current.innerText)
        }
    }

    return (
        <div className="w-full flex items-center bg-red-900/80 border-b border-red-500 px-4 py-2 text-sm text-red-200 font-semibold relative z-50">
            <div ref={textRef} className="flex-1 truncate pr-4">
                {msg}
            </div>
            <Tooltip label="Copy error message">
                <button
                    onClick={copy}
                    className="ml-2 px-2 py-1 rounded hover:bg-red-800 transition-colors"
                    aria-label="Copy error message"
                    tabIndex={0}
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <rect x="8" y="4" width="8" height="2" rx="1" fill="#bbb" />
                        <rect x="6" y="6" width="12" height="14" rx="2" stroke="#bbb" strokeWidth="1.5" fill="none" />
                    </svg>
                </button>
            </Tooltip>
            <Tooltip label="Dismiss error">
                <button
                    onClick={() => setError(null)}
                    className="ml-2 px-2 py-1 rounded hover:bg-red-800 transition-colors"
                    aria-label="Dismiss error"
                    tabIndex={0}
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 20 20">
                        <path d="M6 6l8 8M14 6l-8 8" stroke="#ffcccc" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                </button>
            </Tooltip>
        </div>
    )
}
