// Temporary in-memory data. Swap for server-side queries (paginated/filtered)
// per CLAUDE.md once the API layer exists.

export type UserStatus = "active" | "suspended" | "pending";
export type UserRole = "User" | "Artist";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  location: string;
  tattoos: number;
  joined: string;
};

export const users: AdminUser[] = [
  { id: "u1", name: "Alice Morgan", email: "alice@example.com", role: "User", status: "active", location: "Berlin, DE", tattoos: 4, joined: "2026-01-12" },
  { id: "u2", name: "Bob Chen", email: "bob@example.com", role: "Artist", status: "active", location: "Toronto, CA", tattoos: 38, joined: "2025-11-03" },
  { id: "u3", name: "Sara Kim", email: "sara@example.com", role: "User", status: "suspended", location: "Seoul, KR", tattoos: 2, joined: "2026-02-21" },
  { id: "u4", name: "David Park", email: "david@example.com", role: "Artist", status: "pending", location: "Austin, US", tattoos: 0, joined: "2026-06-19" },
  { id: "u5", name: "Emma Torres", email: "emma@example.com", role: "User", status: "active", location: "Madrid, ES", tattoos: 7, joined: "2026-03-08" },
  { id: "u6", name: "Liam Novak", email: "liam@example.com", role: "User", status: "active", location: "Prague, CZ", tattoos: 1, joined: "2026-05-30" },
  { id: "u7", name: "Mara Lindqvist", email: "mara@example.com", role: "Artist", status: "pending", location: "Oslo, NO", tattoos: 0, joined: "2026-06-28" },
  { id: "u8", name: "Noah Bauer", email: "noah@example.com", role: "User", status: "active", location: "Vienna, AT", tattoos: 5, joined: "2026-04-14" },
  { id: "u9", name: "Olivia Reyes", email: "olivia@example.com", role: "User", status: "suspended", location: "Manila, PH", tattoos: 3, joined: "2026-01-29" },
  { id: "u10", name: "Diego Ferreira", email: "diego@example.com", role: "Artist", status: "pending", location: "Lisbon, PT", tattoos: 0, joined: "2026-06-27" },
  { id: "u11", name: "Priya Nair", email: "priya@example.com", role: "User", status: "active", location: "Mumbai, IN", tattoos: 9, joined: "2026-02-02" },
  { id: "u12", name: "Tom Wright", email: "tom@example.com", role: "User", status: "active", location: "Leeds, UK", tattoos: 2, joined: "2026-05-11" },
  { id: "u13", name: "Yuki Tanaka", email: "yuki@example.com", role: "Artist", status: "active", location: "Osaka, JP", tattoos: 51, joined: "2025-09-17" },
  { id: "u14", name: "Hana Kovac", email: "hana@example.com", role: "User", status: "active", location: "Zagreb, HR", tattoos: 6, joined: "2026-03-22" },
];

export type ArtistApplication = {
  id: string;
  name: string;
  studio: string;
  location: string;
  specialties: string[];
  portfolio: number;
  submitted: string;
};

export const artistApplications: ArtistApplication[] = [
  { id: "ar1", name: "Mara Lindqvist", studio: "Nordic Ink", location: "Oslo, NO", specialties: ["Blackwork", "Fine line"], portfolio: 24, submitted: "2026-06-28" },
  { id: "ar2", name: "Diego Ferreira", studio: "Lisboa Tattoo Co.", location: "Lisbon, PT", specialties: ["Realism", "Color"], portfolio: 41, submitted: "2026-06-27" },
  { id: "ar3", name: "David Park", studio: "Lone Star Ink", location: "Austin, US", specialties: ["Traditional"], portfolio: 18, submitted: "2026-06-19" },
  { id: "ar4", name: "Sofia Russo", studio: "Inchiostro", location: "Milan, IT", specialties: ["Neo-traditional", "Dotwork"], portfolio: 33, submitted: "2026-06-18" },
  { id: "ar5", name: "Kenji Mori", studio: "Sumi Studio", location: "Kyoto, JP", specialties: ["Irezumi", "Japanese"], portfolio: 57, submitted: "2026-06-15" },
  { id: "ar6", name: "Lucia Mendez", studio: "Tinta Viva", location: "Mexico City, MX", specialties: ["Watercolor"], portfolio: 22, submitted: "2026-06-14" },
];

// --- Tattoos ---------------------------------------------------------------
export type TattooStatus = "published" | "flagged" | "removed";

export type Tattoo = {
  id: string;
  title: string;
  artist: string;
  style: string;
  placement: string;
  status: TattooStatus;
  likes: number;
  reports: number;
};

export const tattoos: Tattoo[] = [
  { id: "t1", title: "Koi Sleeve", artist: "Yuki Tanaka", style: "Japanese", placement: "Arm", status: "published", likes: 1240, reports: 0 },
  { id: "t2", title: "Geometric Wolf", artist: "Bob Chen", style: "Blackwork", placement: "Chest", status: "published", likes: 860, reports: 0 },
  { id: "t3", title: "Rose & Dagger", artist: "Sofia Russo", style: "Traditional", placement: "Forearm", status: "flagged", likes: 412, reports: 3 },
  { id: "t4", title: "Watercolor Phoenix", artist: "Lucia Mendez", style: "Watercolor", placement: "Back", status: "published", likes: 2010, reports: 0 },
  { id: "t5", title: "Skull Mandala", artist: "Kenji Mori", style: "Dotwork", placement: "Hand", status: "flagged", likes: 533, reports: 5 },
  { id: "t6", title: "Minimal Mountains", artist: "Mara Lindqvist", style: "Fine line", placement: "Wrist", status: "published", likes: 745, reports: 0 },
  { id: "t7", title: "Neo Tiger", artist: "Diego Ferreira", style: "Neo-traditional", placement: "Thigh", status: "removed", likes: 188, reports: 9 },
  { id: "t8", title: "Lighthouse", artist: "Bob Chen", style: "Realism", placement: "Calf", status: "published", likes: 977, reports: 0 },
];

// --- Events ----------------------------------------------------------------
export type EventStatus = "upcoming" | "live" | "ended";

export type PlatformEvent = {
  id: string;
  name: string;
  type: "Expo" | "Convention";
  location: string;
  date: string;
  status: EventStatus;
  rsvps: number;
  artists: number;
};

export const events: PlatformEvent[] = [
  { id: "e1", name: "Ink Expo 2026", type: "Expo", location: "Berlin, DE", date: "2026-07-18", status: "upcoming", rsvps: 1820, artists: 64 },
  { id: "e2", name: "London Tattoo Convention", type: "Convention", location: "London, UK", date: "2026-09-26", status: "upcoming", rsvps: 3450, artists: 120 },
  { id: "e3", name: "Tokyo Irezumi Fest", type: "Convention", location: "Tokyo, JP", date: "2026-06-30", status: "live", rsvps: 2100, artists: 88 },
  { id: "e4", name: "Nordic Ink Days", type: "Expo", location: "Oslo, NO", date: "2026-05-12", status: "ended", rsvps: 940, artists: 32 },
];

// --- Support tickets -------------------------------------------------------
export type TicketStatus = "open" | "pending" | "closed";
export type TicketPriority = "low" | "medium" | "high";

export type SupportTicket = {
  id: string;
  subject: string;
  requester: string;
  priority: TicketPriority;
  status: TicketStatus;
  updated: string;
};

export const supportTickets: SupportTicket[] = [
  { id: "s1", subject: "Cannot upload tattoo video", requester: "Liam Novak", priority: "high", status: "open", updated: "2026-06-30" },
  { id: "s2", subject: "Account verification stuck", requester: "Olivia Reyes", priority: "medium", status: "pending", updated: "2026-06-29" },
  { id: "s3", subject: "Refund for event ticket", requester: "Tom Wright", priority: "low", status: "open", updated: "2026-06-29" },
  { id: "s4", subject: "Wrong artist linked to tattoo", requester: "Sara Kim", priority: "medium", status: "pending", updated: "2026-06-28" },
  { id: "s5", subject: "Privacy settings not saving", requester: "Priya Nair", priority: "high", status: "open", updated: "2026-06-28" },
  { id: "s6", subject: "Feature request: dark mode", requester: "Noah Bauer", priority: "low", status: "closed", updated: "2026-06-22" },
];

// --- Moderation queue ------------------------------------------------------
export type ModerationItem = {
  id: string;
  content: string;
  type: "Tattoo" | "Comment";
  author: string;
  reason: string;
  reportCount: number;
  flagged: string;
};

export const moderationQueue: ModerationItem[] = [
  { id: "m1", content: "Tattoo #4821 — “Rose & Dagger”", type: "Tattoo", author: "Sofia Russo", reason: "Offensive content", reportCount: 3, flagged: "2026-06-29" },
  { id: "m2", content: "Comment: “This is garbage, delete it”", type: "Comment", author: "anon_user_22", reason: "Harassment", reportCount: 6, flagged: "2026-06-29" },
  { id: "m3", content: "Tattoo #4790 — “Skull Mandala”", type: "Tattoo", author: "Kenji Mori", reason: "Copyright claim", reportCount: 5, flagged: "2026-06-28" },
  { id: "m4", content: "Comment: spam link to external site", type: "Comment", author: "promo_bot", reason: "Spam", reportCount: 8, flagged: "2026-06-28" },
  { id: "m5", content: "Tattoo #4655 — “Neo Tiger”", type: "Tattoo", author: "Diego Ferreira", reason: "Nudity", reportCount: 9, flagged: "2026-06-27" },
];

// --- Memories ----------------------------------------------------------------
export type MemoryType = "text" | "image" | "video";
export type PrivacyLevel = "private" | "tattoo" | "tattoo-memory" | "tattoo-memory-meta";
export type MemoryStatus = "active" | "flagged" | "removed";

export type Memory = {
  id: string;
  owner: string;
  tattoo: string;
  type: MemoryType;
  privacy: PrivacyLevel;
  status: MemoryStatus;
  excerpt: string;
  /** Video only, seconds (app enforces max 10s). */
  duration?: number;
  created: string;
};

export const privacyLabels: Record<PrivacyLevel, string> = {
  private: "Private",
  tattoo: "Tattoo only",
  "tattoo-memory": "Tattoo + memory",
  "tattoo-memory-meta": "Tattoo + memory + metadata",
};

export const memories: Memory[] = [
  { id: "mem1", owner: "Alice Morgan", tattoo: "Koi Sleeve", type: "text", privacy: "tattoo-memory", status: "active", excerpt: "Got this the summer we moved to Berlin — every scale is a week of that year.", created: "2026-06-30" },
  { id: "mem2", owner: "Emma Torres", tattoo: "Watercolor Phoenix", type: "video", privacy: "tattoo-memory-meta", status: "active", excerpt: "Reveal moment at the studio", duration: 8, created: "2026-06-30" },
  { id: "mem3", owner: "Tom Wright", tattoo: "Geometric Wolf", type: "image", privacy: "tattoo", status: "active", excerpt: "Healed photo, six months in", created: "2026-06-29" },
  { id: "mem4", owner: "Priya Nair", tattoo: "Minimal Mountains", type: "text", privacy: "private", status: "active", excerpt: "For dad. He never saw the Himalayas again, but now I carry them.", created: "2026-06-29" },
  { id: "mem5", owner: "Noah Bauer", tattoo: "Lighthouse", type: "video", privacy: "tattoo-memory", status: "flagged", excerpt: "First session timelapse", duration: 10, created: "2026-06-28" },
  { id: "mem6", owner: "Hana Kovac", tattoo: "Rose & Dagger", type: "image", privacy: "tattoo-memory-meta", status: "active", excerpt: "Matching piece with my sister", created: "2026-06-27" },
  { id: "mem7", owner: "Liam Novak", tattoo: "Skull Mandala", type: "text", privacy: "tattoo", status: "flagged", excerpt: "Inside joke from the tour — long story.", created: "2026-06-26" },
  { id: "mem8", owner: "Olivia Reyes", tattoo: "Neo Tiger", type: "image", privacy: "private", status: "removed", excerpt: "Original sketch comparison", created: "2026-06-25" },
  { id: "mem9", owner: "Alice Morgan", tattoo: "Koi Sleeve", type: "video", privacy: "private", status: "active", excerpt: "Shading session close-up", duration: 6, created: "2026-06-24" },
  { id: "mem10", owner: "Yuki Tanaka", tattoo: "Koi Sleeve", type: "image", privacy: "tattoo-memory", status: "active", excerpt: "Artist's studio shot before handoff", created: "2026-06-23" },
  { id: "mem11", owner: "Tom Wright", tattoo: "Lighthouse", type: "text", privacy: "tattoo-memory-meta", status: "active", excerpt: "Done in the town where my grandfather kept the light.", created: "2026-06-21" },
  { id: "mem12", owner: "Emma Torres", tattoo: "Watercolor Phoenix", type: "text", privacy: "tattoo-memory", status: "active", excerpt: "One year clean. The phoenix was the promise.", created: "2026-06-19" },
];

// --- Reviews -----------------------------------------------------------------
export type ReviewStatus = "published" | "flagged" | "removed";

export type Review = {
  id: string;
  author: string;
  artist: string;
  rating: 1 | 2 | 3 | 4 | 5;
  excerpt: string;
  status: ReviewStatus;
  created: string;
};

export const reviews: Review[] = [
  { id: "rev1", author: "Alice Morgan", artist: "Yuki Tanaka", rating: 5, excerpt: "Yuki turned a vague idea into the best piece I own. Zero pain shortcuts, all patience.", status: "published", created: "2026-06-30" },
  { id: "rev2", author: "Tom Wright", artist: "Bob Chen", rating: 4, excerpt: "Clean linework and a great studio vibe. Booking took a while, worth it.", status: "published", created: "2026-06-29" },
  { id: "rev3", author: "anon_user_22", artist: "Sofia Russo", rating: 1, excerpt: "Terrible!!! Do not go here — [link removed]", status: "flagged", created: "2026-06-29" },
  { id: "rev4", author: "Emma Torres", artist: "Lucia Mendez", rating: 5, excerpt: "The watercolor blending is unreal in person. Healed beautifully.", status: "published", created: "2026-06-28" },
  { id: "rev5", author: "Priya Nair", artist: "Kenji Mori", rating: 4, excerpt: "Meticulous dotwork, calm studio. Aftercare instructions were very thorough.", status: "published", created: "2026-06-27" },
  { id: "rev6", author: "Noah Bauer", artist: "Mara Lindqvist", rating: 5, excerpt: "Fine line perfection. Mara redrew the design three times until it fit the wrist.", status: "published", created: "2026-06-26" },
  { id: "rev7", author: "promo_bot", artist: "Diego Ferreira", rating: 5, excerpt: "Best prices!! Visit our shop instead → tinyurl…", status: "flagged", created: "2026-06-26" },
  { id: "rev8", author: "Hana Kovac", artist: "Sofia Russo", rating: 3, excerpt: "Great result but the appointment started 90 minutes late.", status: "published", created: "2026-06-25" },
  { id: "rev9", author: "Olivia Reyes", artist: "Bob Chen", rating: 2, excerpt: "Design was fine, communication wasn't. Had to chase for the touch-up slot.", status: "published", created: "2026-06-24" },
  { id: "rev10", author: "Liam Novak", artist: "Kenji Mori", rating: 5, excerpt: "Traditional irezumi done with real respect for the craft.", status: "published", created: "2026-06-22" },
  { id: "rev11", author: "Sara Kim", artist: "Lucia Mendez", rating: 1, excerpt: "Offensive comments during the session. Reported separately.", status: "removed", created: "2026-06-20" },
  { id: "rev12", author: "Diego Ferreira", artist: "Yuki Tanaka", rating: 5, excerpt: "Guest-spotted at Sumi Studio — watching Yuki work is a masterclass.", status: "published", created: "2026-06-18" },
];

// --- Audit log ---------------------------------------------------------------
export type AuditCategory = "users" | "content" | "settings" | "auth";

export type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: AuditCategory;
  target: string;
  ip: string;
};

export const auditLog: AuditEntry[] = [
  { id: "a1", timestamp: "2026-07-01 16:42", actor: "Admin User", action: "memory.remove", category: "content", target: "mem8 — Neo Tiger sketch", ip: "84.112.40.18" },
  { id: "a2", timestamp: "2026-07-01 15:10", actor: "Admin User", action: "auth.login", category: "auth", target: "Admin dashboard", ip: "84.112.40.18" },
  { id: "a3", timestamp: "2026-07-01 11:03", actor: "mod.lena@adlora.com", action: "review.flag", category: "content", target: "rev7 — promo_bot on Diego Ferreira", ip: "192.76.11.5" },
  { id: "a4", timestamp: "2026-06-30 18:26", actor: "Admin User", action: "user.suspend", category: "users", target: "u9 — Olivia Reyes", ip: "84.112.40.18" },
  { id: "a5", timestamp: "2026-06-30 17:55", actor: "mod.lena@adlora.com", action: "tattoo.flag", category: "content", target: "t5 — Skull Mandala", ip: "192.76.11.5" },
  { id: "a6", timestamp: "2026-06-30 09:14", actor: "Admin User", action: "artist.approve", category: "users", target: "ar4 — Sofia Russo", ip: "84.112.40.18" },
  { id: "a7", timestamp: "2026-06-29 21:40", actor: "system", action: "auth.mfa_challenge", category: "auth", target: "mod.lena@adlora.com", ip: "192.76.11.5" },
  { id: "a8", timestamp: "2026-06-29 16:08", actor: "Admin User", action: "settings.update", category: "settings", target: "Feed limit 100 → 100 / 7d", ip: "84.112.40.18" },
  { id: "a9", timestamp: "2026-06-29 10:31", actor: "mod.arjun@adlora.com", action: "report.resolve", category: "content", target: "r6 — Tattoo #4655", ip: "77.240.98.2" },
  { id: "a10", timestamp: "2026-06-28 19:02", actor: "Admin User", action: "user.reinstate", category: "users", target: "u3 — Sara Kim", ip: "84.112.40.18" },
  { id: "a11", timestamp: "2026-06-28 14:47", actor: "system", action: "auth.login_failed", category: "auth", target: "unknown — admin@adlora.com", ip: "203.0.113.9" },
  { id: "a12", timestamp: "2026-06-28 09:20", actor: "mod.arjun@adlora.com", action: "comment.remove", category: "content", target: "Comment #9912", ip: "77.240.98.2" },
  { id: "a13", timestamp: "2026-06-27 15:36", actor: "Admin User", action: "settings.update", category: "settings", target: "Require MFA → enabled", ip: "84.112.40.18" },
  { id: "a14", timestamp: "2026-06-27 08:55", actor: "Admin User", action: "artist.reject", category: "users", target: "ar6 — Lucia Mendez (resubmit)", ip: "84.112.40.18" },
];

// --- Analytics -------------------------------------------------------------
export const analytics = {
  dau: [
    { label: "Mon", value: 7200 },
    { label: "Tue", value: 7850 },
    { label: "Wed", value: 8100 },
    { label: "Thu", value: 7600 },
    { label: "Fri", value: 8420 },
    { label: "Sat", value: 9100 },
    { label: "Sun", value: 8650 },
  ],
  uploads: [
    { label: "Mon", value: 320 },
    { label: "Tue", value: 410 },
    { label: "Wed", value: 380 },
    { label: "Thu", value: 450 },
    { label: "Fri", value: 520 },
    { label: "Sat", value: 610 },
    { label: "Sun", value: 540 },
  ],
  styles: [
    { label: "Blackwork", value: 32 },
    { label: "Realism", value: 24 },
    { label: "Traditional", value: 18 },
    { label: "Fine line", value: 14 },
    { label: "Watercolor", value: 12 },
  ],
  scans: [
    { label: "Mon", value: 9800 },
    { label: "Tue", value: 10450 },
    { label: "Wed", value: 11020 },
    { label: "Thu", value: 10380 },
    { label: "Fri", value: 11640 },
    { label: "Sat", value: 12920 },
    { label: "Sun", value: 12480 },
  ],
  memoriesByType: [
    { label: "Text", value: 46 },
    { label: "Image", value: 38 },
    { label: "Video", value: 16 },
  ],
  privacyLevels: [
    { label: "Private", value: 31 },
    { label: "Tattoo only", value: 27 },
    { label: "Tattoo + memory", value: 25 },
    { label: "Tattoo + memory + metadata", value: 17 },
  ],
  mau: 30800,
  avgRating: 4.6,
};

