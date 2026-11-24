import {
  DashboardIcon,
  UsersIcon,
  ArtistsIcon,
  TattoosIcon,
  ModerationIcon,
  EventsIcon,
  AnalyticsIcon,
  TicketsIcon,
  SettingsIcon,
  MemoriesIcon,
  StarIcon,
  AuditIcon,
  AdIcon,
  type Icon,
  TagIcon,
  StyleIcon,
  HelpIcon,
  PagesIcon,
  BellIcon,
  ReportsIcon,
  BlogIcon,
} from "@/components/icons";

export type NavItem = {
  label: string;
  href: string;
  icon: Icon;
  /** Optional badge count surfaced in the sidebar (e.g. pending items). */
  badge?: number;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/**
 * Single source of truth for admin navigation.
 * Routes map to App Router segments under app/(dashboard).
 */
export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: DashboardIcon }],
  },
  {
    title: "Management",
    items: [
      { label: "Users", href: "/users", icon: UsersIcon },
      { label: "Artists", href: "/artists", icon: ArtistsIcon },
      { label: "Tattoos", href: "/tattoos", icon: TattoosIcon },
      { label: "Memories", href: "/memories", icon: MemoriesIcon },
      { label: "Reviews", href: "/reviews", icon: StarIcon },
      { label: "Events", href: "/events", icon: EventsIcon },
      { label: "Specialities", href: "/specialities", icon: TagIcon },
      { label: "Styles", href: "/styles", icon: StyleIcon },
    ],  
  },
  {
    title: "Trust & Safety",
    items: [
      {
        label: "Moderation",
        href: "/moderation",
        icon: ModerationIcon,
      },
      { label: "Reports", href: "/reports", icon: ReportsIcon },
      { label: "Ads", href: "/ads", icon: AdIcon },
      { label: "Support", href: "/support", icon: TicketsIcon },
      { label: "Audit Log", href: "/audit-log", icon: AuditIcon },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
      { label: "Notifications", href: "/notifications", icon: BellIcon },
      { label: "Pages", href: "/pages", icon: PagesIcon },
      { label: "FAQ", href: "/faq", icon: HelpIcon },
      { label: "Blog", href: "/blog", icon: BlogIcon },
      // { label: "Settings", href: "/settings", icon: SettingsIcon },
    ],
  },
];

/** Longest-prefix match of the current route against nav items, for page titles/breadcrumbs. */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  for (const section of navSections) {
    for (const item of section.items) {
      const matches =
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      if (matches && (!best || item.href.length > best.href.length)) {
        best = item;
      }
    }
  }
  return best;
}
