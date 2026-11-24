import type { SVGProps } from "react";

/**
 * Lightweight inline icon set (stroke = currentColor).
 * Keeps the bundle dependency-free per project Tech Principles.
 */
type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export type Icon = (props: IconProps) => React.ReactElement;

export const DashboardIcon: Icon = (p) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const UsersIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
    <circle cx="9" cy="7" r="3.5" />
    <path d="M22 19v-1a4 4 0 0 0-3-3.87" />
    <path d="M16 3.5a4 4 0 0 1 0 7" />
  </svg>
);

export const ArtistsIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="8" cy="10" r="1" />
    <circle cx="12" cy="8" r="1" />
    <circle cx="16" cy="10" r="1" />
    <path d="M12 21a3 3 0 0 0 0-6 2 2 0 0 1-2-2 2 2 0 0 0-2-2" />
  </svg>
);

export const TattoosIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M3 12h18" />
  </svg>
);

export const ModerationIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M12 3 4 6v6c0 4.5 3.2 7.5 8 9 4.8-1.5 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ReportsIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M4 21V4a1 1 0 0 1 1-1h10l5 5v13" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

export const EventsIcon: Icon = (p) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const AnalyticsIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M3 3v18h18" />
    <path d="M7 15l3-4 3 2 4-6" />
  </svg>
);

export const TicketsIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
    <path d="M13 7v10" strokeDasharray="2 2" />
  </svg>
);

export const SettingsIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

export const BellIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export const SearchIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const MenuIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const CloseIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const EyeIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3 3.7M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.1-.8" />
    <path d="m9.5 9.5a3 3 0 0 0 4.2 4.2M2 2l20 20" />
  </svg>
);

export const ArrowLeftIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export const SunIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const MoonIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const ScanIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3.5" />
  </svg>
);

export const MemoriesIcon: Icon = (p) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m21 15-4.5-4.5L9 18" />
  </svg>
);

export const StarIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
  </svg>
);

export const TagIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M20.59 13.41 11 3H4a1 1 0 0 0-1 1v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 .01-2.82Z" />
    <path d="M7 7h.01" />
  </svg>
);

export const StyleIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M12 3v18M3 12h18" />
  </svg>
);

export const AuditIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M8 3h8a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export const LogoIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M8.5 9.5c0-1.7 1.6-2.5 3.5-2.5s3.5.8 3.5 2.5-1.6 2.3-3.5 2.5-3.5.8-3.5 2.5 1.6 2.5 3.5 2.5 3.5-.8 3.5-2.5" />
  </svg>
);

export const PagesIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M4 3h9l5 5v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M13 3v5h5" />
    <path d="M8 13h6M8 17h6" />
  </svg>
);

export const UserIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </svg>
);

export const BlogIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-1.5Z" />
    <path d="M4 19.5a1.5 1.5 0 0 1 1.5-1.5H19" />
    <path d="M8 7h8M8 10.5h8M8 14h5" />
  </svg>
);

export const GripIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </svg>
);

export const HelpIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

export const PlusIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const PencilIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
  </svg>
);

export const TrashIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const AdIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1.5-5H12l7 4V6l-7 4H6a2 2 0 0 0-2 2Z" />
    <path d="M17 8.5v7" />
  </svg>
);

export const UserPlusIcon: Icon = (p) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 20v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />
    <path d="M19 8v6M16 11h6" />
  </svg>
);

export const MessageIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
  </svg>
);

export const HeartIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4.5 5.4 4a4.9 4.9 0 0 1 6.6 2 4.9 4.9 0 0 1 6.6-2c3.4.5 5 3.8 3.4 7.2-2.5 4.7-10 9.3-10 9.3Z" />
  </svg>
);

export const CheckIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const FlagIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M4 21V4" />
    <path d="M4 4h13l-2.5 4L17 12H4" />
  </svg>
);

export const ShieldIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M12 3 4 6v6c0 4.5 3.2 7.5 8 9 4.8-1.5 8-4.5 8-9V6l-8-3Z" />
  </svg>
);

export const LogoutIcon: Icon = (p) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);
