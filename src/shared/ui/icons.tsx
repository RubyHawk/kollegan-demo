import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const defaultProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function svgProps(size: number, strokeWidth: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    ...defaultProps,
    strokeWidth,
  };
}

export function PhoneIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function PhoneOffIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function XCircleIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

export function LockIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function SearchIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function UsersIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function BedIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M2 18h20" />
    </svg>
  );
}

export function BuildingIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-4h6v4" />
    </svg>
  );
}

export function MapPinIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function MenuIcon({ size = 18, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function InfoCircleIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function CalendarIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function ClockIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function UserIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function MailIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function CompanyIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

export function SparkleIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

export function NoteIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function SendIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function ChatBubbleIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function CloseIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function GripDotsIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="8" cy="5" r="2" />
      <circle cx="16" cy="5" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="8" cy="19" r="2" />
      <circle cx="16" cy="19" r="2" />
    </svg>
  );
}

export function PlusIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function EditIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function TrashIcon({ size = 14, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export function SunIcon({ size = 18, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function MoonIcon({ size = 18, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth)} className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
