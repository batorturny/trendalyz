# PRD — Ügyfél Értékelés & Kommunikáció

## Executive Summary

Havi értékelési rendszer ahol az admin szöveges értékelést ír az ügyfélnek platformonként, az ügyfél emoji reakcióval és szöveges válasszal reagálhat. Floating chat buborék a client dashboardon piros badge-dzsel ha van olvasatlan.

## Stakeholders

- **Admin** (marketing ügynökség): havi értékelést ír a cég/platform/hónap teljesítményére
- **Client** (ügyfél): megkapja, elolvassa, emoji reakcióval vagy szöveges válasszal reagál

## User Stories

### US-1: Admin ír értékelést
> Mint admin, szeretnék havi szöveges értékelést írni egy cég adott platformjának adott hónapjára, hogy az ügyfél kontextust kapjon a számai mellé.

### US-2: Ügyfél látja az értékelést
> Mint ügyfél, szeretnék értesítést kapni (piros badge) ha új értékelés érkezett, és egy floating buborékra kattintva elolvasni.

### US-3: Ügyfél emoji reakció
> Mint ügyfél, szeretnék gyorsan emoji reakcióval (👍❤️🔥🤔) reagálni az értékelésre.

### US-4: Ügyfél szöveges válasz
> Mint ügyfél, szeretnék szöveges választ ("poszt") írni az adminnak az értékelésre.

### US-5: Admin látja a reakciókat/válaszokat
> Mint admin, szeretném látni a cég profilnál az "Értékelések" fülön az összes küldött értékelést és az ügyfél reakcióit/válaszait.

## Adatmodell

```prisma
model Evaluation {
  id              String    @id @default(cuid())
  companyId       String
  company         Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  platform        String    // TIKTOK_ORGANIC, FACEBOOK_ORGANIC, YOUTUBE, TIKTOK_ADS
  month           String    // YYYY-MM format

  // Admin message
  adminMessage    String?   @db.Text
  adminMessageAt  DateTime?
  adminUserId     String?

  // Client response
  clientReaction  String?   // emoji: 👍❤️🔥🤔 or null
  clientReply     String?   @db.Text
  clientReplyAt   DateTime?
  clientReadAt    DateTime?
  clientUserId    String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([companyId, platform, month])
  @@index([companyId])
}
```

## UI Design

### Client Dashboard — Floating Buborék
- **Pozíció**: jobb alsó sarok, fix pozíció
- **Ikon**: 💬 MessageCircle (lucide)
- **Badge**: piros kör számmal (olvasatlan értékelések száma)
- **Kattintásra**: slide-up panel nyílik alulról
- **Panel tartalma**:
  - Header: "Havi értékelés — {platform} — {hónap}"
  - Admin üzenete (szöveg)
  - Emoji reakció sor: 👍 ❤️ 🔥 🤔 (kattintásra kiválasztódik, mentés azonnali)
  - "Válasz írása..." textarea
  - "Posztolás" gomb
- **Olvasott jelölés**: panel megnyitáskor `clientReadAt = now()`
- **Badge eltűnik**: ha nincs több olvasatlan

### Admin — Értékelések Tab
- **Hely**: Cég profil oldal (`/admin/companies/[id]`) → új "Értékelések" tab
- **Lista**: havi bontásban, platformonként
- **Minden elem mutatja**:
  - Hónap + Platform
  - Admin üzenete (szerkeszthető)
  - Ügyfél reakciója (emoji) — ha van
  - Ügyfél válasza (szöveg) — ha van
  - Státusz: Elküldve / Olvasva / Válaszolt
- **Írás**: textarea + "Küldés" gomb → menti az `adminMessage`-t

### Admin — Cég listán badge
- A cégek listáján 💬 badge szám ha van válasz az ügyféltől

## API Endpoints

```
GET    /api/evaluations?companyId=X&platform=Y&month=Z
POST   /api/evaluations                    — admin creates/updates evaluation
PATCH  /api/evaluations/:id/read           — client marks as read
PATCH  /api/evaluations/:id/react          — client sends emoji reaction
PATCH  /api/evaluations/:id/reply          — client sends text reply
GET    /api/evaluations/unread?companyId=X  — count unread for badge
```

## Implementation Plan

### Phase 1: Adatmodell + API (backend)
1. Prisma schema: `Evaluation` model hozzáadása
2. Migration futtatás
3. Backend API endpoints a `server.js`-ben
4. Auth: admin → create/update, client → read/react/reply

### Phase 2: Admin UI
1. Értékelések tab a cég profilnál (`CompanyEvaluations.tsx`)
2. Havi elemzés textarea integrálás (meglévő MonthlyAnalysis mellé)
3. Cég lista badge

### Phase 3: Client UI
1. `EvaluationBubble.tsx` — floating buborék komponens
2. `EvaluationPanel.tsx` — slide-up panel
3. Badge logika (unread count polling)
4. Emoji reakció + szöveges válasz

## Technikai döntések

- **Nem real-time**: nincs WebSocket, a client 60mp-ként poll-ol vagy page load-kor check-el
- **Posztolás (nem küldés)**: low-pressure, nem chat feeling
- **Egy evaluation per company/platform/month**: nem thread, hanem single message + reply
- **Emoji**: 4 fix opció (👍❤️🔥🤔), nem custom

## Acceptance Criteria

- [ ] Admin tud értékelést írni cég/platform/hónapra
- [ ] Ügyfél lát piros badge-et ha van olvasatlan
- [ ] Ügyfél megnyitja → badge eltűnik, readAt mentve
- [ ] Ügyfél tud emoji reakciót adni (1 db, cserélhető)
- [ ] Ügyfél tud szöveges választ posztolni
- [ ] Admin látja a reakciókat és válaszokat az Értékelések tab-on
- [ ] Cég listán badge jelzi ha van ügyfél válasz
