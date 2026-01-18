import React from 'react';

export function SplitIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 3h5v5" />
      <path d="M8 3H3v5" />
      <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
      <path d="m15 9 -1 1" />
      <path d="m12 12 -1 1" />
      <path d="m9 15 -1 1" />
      <path d="m6 18 -1 1" />
      <path d="M21 21l-9-9" />
      <path d="M3.5 8.5 9 14" />
      <path d="M14 9.5 8.5 15" />
    </svg>
  );
}
