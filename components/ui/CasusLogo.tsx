export function CasusLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      {/* Escudo simple: representa protección/privacidad, coherente con el
          concepto de CASUS de desidentificar antes de publicar. */}
      <path
        d="M16 6.5L23 9.2V15.4C23 20 20 23.6 16 25.5C12 23.6 9 20 9 15.4V9.2L16 6.5Z"
        stroke="var(--bg)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12.8 16L14.9 18.2L19.3 13.6"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
