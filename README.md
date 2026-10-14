# 📡 VEERAMANI TRACKER

> **"Map-la enna scene?"**  
> An original, map-first Tamil Nadu internet-culture parody tracker featuring animated radar markers, simulated frequencies, community parody lore, and zero personal tracking.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Interactive_Radar-green.svg)](https://leafletjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_RLS-3ECF8E.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Vitest-18_Passed-brightgreen.svg)](https://vitest.dev/)

---

## 1. Product Concept & Boundary

**Veeramani Tracker** is an unofficial, community-operated fan parody tracker inspired by Tamil Nadu cinema lore, tea stall myths, and internet culture.

### 🛡️ STRICT PRODUCT BOUNDARY & ANTI-STALKING CHARTER:
- **Zero Real-Time Tracking**: This product does **not** track or locate the private movements, coordinates, or residences of any individual.
- **Fictional Demonstration Signals**: Every pin displayed on the map represents an explicitly fictional parody demonstration signal (e.g., *"Marina Lighthouse 98.4 MHz Retro Radio Resonance"*, *"Siruvani Water Velocity & Tea Stall Hearsay Anomaly"*).
- **No Real Sightings or Stalking**: Community submissions claiming actual whereabouts, photographs taken to locate someone, hotel rooms, residential addresses, or paparazzi coordinates are strictly rejected and IP-blocked.
- **Mandatory Parody Certification**: Every submission requires explicit certification: *"I certify that this submission is 100% fictional satire and community folklore."*
- **Human Moderation with Mandatory Audit Reasons**: Submissions begin in a `pending` state and only appear publicly after review by authorized moderators.

---

## 2. Visual Identity & Color Palette

Custom Tamil Nadu-inspired design palette:

| Color Token | Hex Code | Role |
| :--- | :--- | :--- |
| **Deep Indigo** | `#19182B` | Application canvas & base surfaces |
| **Indigo Surface** | `#222038` | Cards, panels, and dropdown backgrounds |
| **Turmeric Yellow** | `#F5C542` | Primary brand accent, radar pings & key CTAs |
| **Warm Paper** | `#FFF8E8` | High-contrast typography & headings |
| **Maroon** | `#7D263D` | Fictional badges & moderation controls |
| **Coral** | `#F16F59` | Radar wave highlights & simulated alerts |
| **Leaf Green** | `#438567` | Active broadcasting indicators |
| **Muted Grey** | `#A5A2AD` | Telemetry readouts, frequency tags & borders |

**Typography**: Space Grotesk (display headings) + Inter (interface text) + Noto Sans Tamil (Tamil microcopy).

---

## 3. Architecture & Core Features

### 🎬 Branded 2.4s Cinematic Intro
- **0.0–0.5s**: Deep indigo canvas fades in with expanding turmeric radar rings.
- **0.5–1.3s**: Central radar dot transitions to an original geometric marker; *"VEERAMANI TRACKER"* enters with spring overshoot.
- **1.3–1.9s**: Tanglish cultural badge *"Map-la enna scene?"* (நையாண்டி ரேடார்) appears.
- **1.9–2.4s**: Intro slides upward to reveal the interactive map.
- **Controls**: `sessionStorage` prevents replay during the same session; **Skip Intro** button; automatically bypassed when `prefers-reduced-motion` is active.

### 🗺️ Interactive Tamil Nadu Radar Map
- Full client-side Leaflet integration (`ssr: false`) with OpenStreetMap attribution (`© OpenStreetMap contributors`).
- Custom geometric radar pins with expanding wave animations and frequency badges (e.g. `104.2 MHz`).
- Clicking a pin opens a **Signal Dossier Card** with simulated intensity, frequency readout, parody lore excerpt, and share action.
- Desktop slide-out dossier drawer and mobile bottom sheet.
- Search and multi-criteria filters (District, Parody Category, Signal Intensity).

### 📝 Parody Transmission Workflow (`/submit`)
- Allows community members to submit fictional lore, joke descriptions, and satirical pings.
- Zod schema validation rejecting forbidden private keywords (`residence`, `hotel room`, `spotted walking`, `following him`).
- Latitude and Longitude bound to Tamil Nadu / South India coordinates.
- Mandatory `is_fictional_confirmed: true` certification checkbox.
- Confetti celebration upon receipt; entries default to `pending` status.

### 🛡️ Parody Moderation Desk (`/admin`)
- Server-enforced moderator access (`moderator` or `admin` role).
- Tabs for `Pending`, `Approved`, `Rejected`, and `Removed` queues.
- Real-time audit trail recording every moderator action with mandatory audit reasons.
- Anti-stalking audit check ensuring zero personal surveillance elements.

### 👤 Contributor Account (`/account`)
- Track status of submitted parody transmissions (`Pending Review`, `Broadcasting Live`, `Rejected`).
- View moderator review feedback notes.
- Profile settings with opt-in public contributor attribution handle.

---

## 4. Dual-Layer Data Architecture (Free-First)

1. **Production Mode (Supabase)**:
   - Configured via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Uses PostgreSQL tables `tracker_entries`, `moderation_actions`, `profiles` with Row Level Security (RLS).
2. **Resilient Local Demo Mode (Zero Credentials Required)**:
   - Works instantly out of the box with 7 curated Tamil Nadu parody signals.
   - In-memory data store with search, bounding-box math, rate limiting (5 transmissions/hr), and audit logging.
   - Persona switcher in navbar allows instant switching between **Visitor**, **Contributor**, and **Moderator** to test all workflows locally.

---

## 5. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tracker-entries` | Fetch approved parody signals (supports `district`, `category`, `search`, `signalStrength`) |
| `POST` | `/api/tracker-entries` | Submit a new parody signal (rate-limited, validated, begins in `pending`) |
| `GET` | `/api/tracker-entries/[id]` | Fetch single parody signal dossier with related signals |
| `GET` | `/api/account/entries` | Fetch transmissions submitted by the authenticated user |
| `GET` | `/api/admin/entries` | Fetch moderation queue (requires moderator clearance) |
| `PATCH` | `/api/admin/entries/[id]` | Approve, reject, or remove a parody signal (requires reason) |

*(Legacy `/api/events/...` endpoints are preserved as seamless aliases).*

---

## 6. Verification & Quality Gates

### Unit Tests (Vitest)
```bash
npm run test
```
*Executes 18 tests covering Zod parody validation, coordinate boundaries, forbidden stalking keyword rejection, rate-limiting, data store filtering, and intro animation behavior.*

### Type Checking & Linting
```bash
npx tsc --noEmit
npm run lint
```
*Zero TypeScript errors, zero ESLint warnings.*

### Production Build
```bash
npm run build
```
*Optimized Next.js 16 build with static generation and server-rendered dynamic endpoints.*

### Concurrency Load Testing (Autocannon)
```bash
npm run test:load
```
*Benchmarks concurrent traffic against parody endpoints up to 100 virtual users (target: p97.5 latency < 800ms, HTTP 5xx < 1%).*

---

## 7. Setup & Run Locally

```bash
# 1. Clone repository
git clone https://github.com/your-username/veeramani-tracker.git
cd veeramani-tracker

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the Veeramani Tracker Parody Radar.

---

## 8. Disclaimer & Fair Use

Veeramani Tracker is an unofficial parody project created for entertainment and cultural enjoyment. It is NOT affiliated with, authorized, or endorsed by Veeramani or any representatives.
Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
