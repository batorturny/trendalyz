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

### Core
- `GET /api/health` - Health check
- `GET /api/companies` - Cégek listája
- `POST /api/report` - Riport generálás

### Chart API (v2)
- `GET /api/charts/catalog` - Elérhető chartok listája
- `POST /api/charts` - Chartok generálása

### Account Management
- `POST /api/accounts` - Új TikTok fiók hozzáadása
- `DELETE /api/accounts/:id` - Fiók törlése

## Environment Variables

### Backend (.env)
```
WINDSOR_API_KEY=your_windsor_api_key
PORT=4000
ENABLE_CHART_API=true
ENABLE_ACCOUNT_MANAGEMENT=true
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API Example: Chart Generation

```bash
# Get available charts
curl http://localhost:4000/api/charts/catalog

# Generate charts
curl -X POST http://localhost:4000/api/charts \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "besth",
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "charts": [
      {"key": "followers_growth"},
      {"key": "daily_likes"},
      {"key": "engagement_by_hour"}
    ]
  }'
```

## Available Charts

| Key | Title | Type |
|-----|-------|------|
| `followers_growth` | Követők növekedése | line |
| `profile_views` | Profil megtekintések | line |
| `daily_likes` | Napi like-ok | bar |
| `daily_comments` | Kommentek | bar |
| `daily_shares` | Megosztások | bar |
| `engagement_rate` | Engagement rate trend | line |
| `engagement_by_day` | Engagement napok szerint | bar |
| `engagement_by_hour` | Engagement órák szerint | bar |
| `all_videos` | Összes videó | table |
| `top_3_videos` | Top 3 videó | table |
| `worst_3_videos` | Legrosszabb 3 videó | table |

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
