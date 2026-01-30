# TikTok Report Generator

TikTok stratégiai riport generátor alkalmazás.

## Struktúra

```
├── backend/          # Express API (Docker)
├── frontend/         # Next.js app (Vercel)
└── docker-compose.yml
```

## Indítás

### 1. Backend (Docker)

```bash
docker-compose up --build
```

A backend elérhető: http://localhost:4000

### 2. Frontend (lokális fejlesztés)

```bash
cd frontend
npm run dev
```

A frontend elérhető: http://localhost:3000

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/companies` - Cégek listája
- `POST /api/report` - Riport generálás

## Vercel Deployment

1. Push a kódot GitHub-ra
2. Kapcsold össze Vercel-lel
3. Add hozzá a környezeti változót:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.com`

## Technológiák

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **API**: Windsor AI TikTok Organic
- **Charts**: QuickChart.io
