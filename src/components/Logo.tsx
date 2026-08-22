/**
 * Biểu tượng phần mềm: cây gia phả một gốc ba cành, gợi hình cây đa đầu làng —
 * gốc là thuỷ tổ, các cành là những chi trong họ.
 */
export default function Logo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Biểu tượng cây gia phả"
    >
      <rect width="32" height="32" rx="8" className="fill-amber-800" />
      <g
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="stroke-amber-50/90"
      >
        <path d="M16 11.6v3.4M8 15h16M8 15v2.6M16 15v2.6M24 15v2.6" />
      </g>
      <g className="fill-amber-50">
        <circle cx="16" cy="8.4" r="2.7" />
        <circle cx="8" cy="20.2" r="2.4" />
        <circle cx="16" cy="20.2" r="2.4" />
        <circle cx="24" cy="20.2" r="2.4" />
      </g>
      {/* Rễ cây: nhắc nhớ gốc gác, nguồn cội */}
      <g
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="stroke-amber-50/50"
      >
        <path d="M16 22.6v2.4M16 25a3.6 3.6 0 0 0-3.4-2.2M16 25a3.6 3.6 0 0 1 3.4-2.2" />
      </g>
    </svg>
  );
}
