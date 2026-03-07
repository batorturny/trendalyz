import Link from 'next/link';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';

// ─── Mock UI components ────────────────────────────────────────────────────

function KpiCard({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
  return (
    <div style={{ background: '#26262b', border: '1px solid #3a3a40', borderRadius: 12, padding: '16px 20px', minWidth: 140 }}>
      <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</p>
      <p style={{ color: '#f0f0f2', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</p>
      <p style={{ color: up ? '#34d399' : '#f87171', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
        {up ? '↑' : '↓'} {change}
      </p>
    </div>
  );
}

function BarChart({ bars }: { bars: { h: number; label: string }[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, padding: '0 4px' }}>
      {bars.map((b, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
          <div style={{ width: '100%', height: b.h, background: 'linear-gradient(180deg,#6366f1,#8b5cf6)', borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
          <span style={{ color: '#9a9aa0', fontSize: 8 }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart() {
  return (
    <svg viewBox="0 0 220 60" style={{ width: '100%', height: 60 }}>
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,50 L27,42 L55,38 L82,30 L110,32 L137,22 L165,18 L192,10 L220,6" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      <path d="M0,50 L27,42 L55,38 L82,30 L110,32 L137,22 L165,18 L192,10 L220,6 L220,60 L0,60Z" fill="url(#lg1)" />
    </svg>
  );
}

function PlatformBadge({ color, name }: { color: string; name: string }) {
  return (
    <span style={{ background: color + '22', color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: `1px solid ${color}44` }}>
      {name}
    </span>
  );
}

function MockBrowser({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div style={{ background: '#1a1a1e', borderRadius: 14, border: '1px solid #3a3a40', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
      {/* Browser chrome */}
      <div style={{ background: '#26262b', padding: '10px 14px', borderBottom: '1px solid #3a3a40', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
        </div>
        <div style={{ flex: 1, background: '#1a1a1e', borderRadius: 5, padding: '3px 10px', fontSize: 10, color: '#9a9aa0', marginLeft: 8 }}>
          trendalyz.hu/{title}
        </div>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: '#0f0f11', color: '#f0f0f2', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>

      {/* Nav */}
      <header style={{ borderBottom: '1px solid #3a3a40', position: 'sticky', top: 0, background: '#0f0f11cc', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <div style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendalyzLogo size="md" showText={false} />
            <span style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f2', letterSpacing: '-0.02em' }}>
              Trend<span style={{ color: '#a5b4fc' }}>alyz</span>
            </span>
          </div>
          <Link href="/login" className="btn-gradient" style={{ fontSize: 13, fontWeight: 700, padding: '9px 22px', borderRadius: 10, textDecoration: 'none' }}>
            Bejelentkezés
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#6366f122', border: '1px solid #6366f144', borderRadius: 999, padding: '4px 14px', fontSize: 11, color: '#a5b4fc', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 24 }}>
          SOCIAL MEDIA ANALYTICS PLATFORM
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Minden platform.<br />
          <span style={{ background: 'linear-gradient(135deg,#0d9488,#06b6d4,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Egy riport.
          </span>
        </h1>
        <p style={{ color: '#9a9aa0', fontSize: 18, maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          A Trendalyz összegyűjti a TikTok, Facebook, Instagram és YouTube fiókjaid teljesítményadatait, és automatikusan elkészíti a havi riportot az ügyfeleidnek.
        </p>
        <Link href="/login" className="btn-gradient" style={{ fontSize: 15, fontWeight: 700, padding: '13px 32px', borderRadius: 12, textDecoration: 'none', display: 'inline-block' }}>
          Belépés a platformra
        </Link>

        {/* Hero mock - dashboard overview */}
        <div style={{ marginTop: 56, textAlign: 'left' }}>
          <MockBrowser title="admin/reports/facebook">
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#5a9cf522', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#5a9cf5', fontSize: 16 }}>f</span>
              </div>
              <div>
                <p style={{ color: '#f0f0f2', fontWeight: 700, fontSize: 15, margin: 0 }}>Facebook</p>
                <p style={{ color: '#9a9aa0', fontSize: 11, margin: 0 }}>Facebook oldal havi riport generálása</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <div style={{ background: '#26262b', border: '1px solid #3a3a40', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#9a9aa0' }}>2026. Február</div>
                <div className="btn-gradient" style={{ borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Riport generálása</div>
              </div>
            </div>
            {/* KPI grid */}
            <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>2026. FEBRUÁR SZÁMAI</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              <KpiCard label="Követők" value="25,1K" change="0.3%" up={true} />
              <KpiCard label="Elérés" value="424,1K" change="35.6%" up={false} />
              <KpiCard label="Impressziók" value="508,7K" change="43.0%" up={false} />
              <KpiCard label="Engagement" value="5 508" change="35.5%" up={false} />
              <KpiCard label="Reakciók" value="1 877" change="355.6%" up={true} />
              <KpiCard label="Videó nézések" value="58,1K" change="24.6%" up={true} />
            </div>
            {/* Mini chart */}
            <div style={{ background: '#26262b', border: '1px solid #3a3a40', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Elérés – napi bontás</p>
              <LineChart />
            </div>
          </MockBrowser>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: '1px solid #3a3a40', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: '#9a9aa0', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>HOGYAN MŰKÖDIK</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>Három lépés az első riportig</h2>
          </div>

          {/* Step 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 80 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: '#6366f122', border: '1px solid #6366f144', color: '#a5b4fc', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>1</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.01em' }}>Kösd be a platformokat</h3>
              <p style={{ color: '#9a9aa0', lineHeight: 1.7, marginBottom: 16 }}>
                Egy kattintással engedélyezd a hozzáférést a TikTok, Facebook, Instagram és YouTube fiókokhoz. Az OAuth tokeneket titkosítva tároljuk, jelszavadat soha nem látjuk.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <PlatformBadge color="#e8687f" name="TikTok" />
                <PlatformBadge color="#5a9cf5" name="Facebook" />
                <PlatformBadge color="#d06a8e" name="Instagram" />
                <PlatformBadge color="#e06060" name="YouTube" />
              </div>
            </div>
            <MockBrowser title="admin/companies/beallitasok">
              <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>INTEGRÁCIÓK</p>
              {[
                { color: '#e8687f', letter: '♪', name: 'TikTok Organic', status: 'Kapcsolódva', ok: true },
                { color: '#5a9cf5', letter: 'f', name: 'Facebook Pages', status: 'Kapcsolódva', ok: true },
                { color: '#d06a8e', letter: '◎', name: 'Instagram Business', status: 'Várakozás', ok: false },
                { color: '#e06060', letter: '▶', name: 'YouTube', status: 'Kapcsolódva', ok: true },
              ].map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #3a3a40' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{p.letter}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f0f0f2' }}>{p.name}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.ok ? '#34d399' : '#fbbf24', background: p.ok ? '#34d39922' : '#fbbf2422', padding: '2px 10px', borderRadius: 999 }}>
                    {p.status}
                  </span>
                </div>
              ))}
            </MockBrowser>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 80 }}>
            <MockBrowser title="admin/reports/tiktok">
              <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>TIKTOK — 2026. FEBRUÁR</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <KpiCard label="Videó nézések" value="1,2M" change="18.4%" up={true} />
                <KpiCard label="Követők" value="48,3K" change="5.2%" up={true} />
                <KpiCard label="Engagement" value="94,7K" change="12.1%" up={true} />
                <KpiCard label="Profilmegtekintés" value="231K" change="3.8%" up={false} />
              </div>
              <div style={{ background: '#1a1a1e', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Napi nézések</p>
                <BarChart bars={[
                  { h: 28, label: '1' }, { h: 35, label: '3' }, { h: 22, label: '5' },
                  { h: 48, label: '7' }, { h: 40, label: '9' }, { h: 55, label: '11' },
                  { h: 62, label: '13' }, { h: 44, label: '15' }, { h: 38, label: '17' },
                  { h: 70, label: '19' }, { h: 58, label: '21' }, { h: 45, label: '23' },
                  { h: 52, label: '25' }, { h: 67, label: '27' },
                ]} />
              </div>
            </MockBrowser>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: '#6366f122', border: '1px solid #6366f144', color: '#a5b4fc', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>2</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.01em' }}>Tekintsd meg az analitikát</h3>
              <p style={{ color: '#9a9aa0', lineHeight: 1.7, marginBottom: 16 }}>
                A dashboard valós időben mutatja az összes platform összesített adatait. Napi bontású grafikonok, poszt-szintű statisztikák, elérés, engagement és videó metrikák.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Elérés és impressziók napi bontásban', 'Posztszintű teljesítmény rangsor', 'Videó megtekintések és megtartási arány', 'Engagement rate automatikus számítással'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9a9aa0', fontSize: 13 }}>
                    <span style={{ color: '#34d399', fontSize: 14 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: '#6366f122', border: '1px solid #6366f144', color: '#a5b4fc', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>3</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.01em' }}>Automatikus havi riportok</h3>
              <p style={{ color: '#9a9aa0', lineHeight: 1.7, marginBottom: 16 }}>
                Állítsd be a hónap napját és az időpontot. Minden hónapban a Trendalyz automatikusan összeállítja a riportot és elküldi emailben PDF formátumban az ügyfelednek.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Ütemezett küldés (pl. minden hónap 5-én)', 'PDF export letölthetően is', 'Előző hónappal való összehasonlítás', 'Egyedi ügyfél hozzáférés saját dashboardhoz'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9a9aa0', fontSize: 13 }}>
                    <span style={{ color: '#34d399', fontSize: 14 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
            <MockBrowser title="admin/companies/beallitasok">
              <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>AUTOMATIKUS EMAIL ÜTEMEZÉS</p>
              <p style={{ color: '#9a9aa0', fontSize: 12, marginBottom: 16 }}>Válaszd ki, hogy a havi riport emailt a hónap melyik napján és hány órakor kapják az ügyfelek.</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#9a9aa0', fontSize: 10, marginBottom: 6 }}>Hónap napja</p>
                  <div style={{ background: '#1a1a1e', border: '1px solid #3a3a40', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f0f0f2' }}>5.</div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#9a9aa0', fontSize: 10, marginBottom: 6 }}>Óra (UTC)</p>
                  <div style={{ background: '#1a1a1e', border: '1px solid #3a3a40', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f0f0f2' }}>08:00</div>
                </div>
              </div>
              {/* Fake email preview */}
              <div style={{ background: '#1a1a1e', border: '1px solid #3a3a40', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#0d9488,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>T</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#f0f0f2' }}>Trendalyz — Havi riport kész</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#9a9aa0' }}>noreply@trendalyz.hu</p>
                  </div>
                </div>
                <p style={{ color: '#9a9aa0', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                  A február havi riportod elkészült. Letöltés: <span style={{ color: '#6366f1' }}>riport-2026-02.pdf</span>
                </p>
              </div>
            </MockBrowser>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section style={{ borderTop: '1px solid #3a3a40', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#9a9aa0', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>TÁMOGATOTT PLATFORMOK</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {[
              { name: 'TikTok Organic', color: '#e8687f' },
              { name: 'TikTok Ads', color: '#e8687f' },
              { name: 'Facebook Pages', color: '#5a9cf5' },
              { name: 'Instagram Business', color: '#d06a8e' },
              { name: 'YouTube', color: '#e06060' },
            ].map(p => (
              <span key={p.name} style={{ background: p.color + '18', color: p.color, border: `1px solid ${p.color}33`, borderRadius: 999, padding: '7px 18px', fontSize: 13, fontWeight: 700 }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #3a3a40', background: '#0a0a0c' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <TrendalyzLogo size="sm" />
              <p style={{ color: '#9a9aa0', fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
                Social media analytics platform marketing ügynökségeknek. Minden platform, egy helyen.
              </p>
            </div>
            <div>
              <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Jogi</p>
              <Link href="/privacy" style={{ color: '#9a9aa0', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 8 }} className="hover:text-white">
                Adatvédelmi irányelvek
              </Link>
            </div>
            <div>
              <p style={{ color: '#9a9aa0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Kapcsolat</p>
              <a href="mailto:bator.turny@gmail.com" style={{ color: '#9a9aa0', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 8 }}>
                bator.turny@gmail.com
              </a>
              <p style={{ color: '#9a9aa0', fontSize: 13 }}>trendalyz.hu</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #3a3a40', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#9a9aa0', fontSize: 12 }}>© {new Date().getFullYear()} Trendalyz. Minden jog fenntartva.</p>
            <p style={{ color: '#9a9aa0', fontSize: 12 }}>EU-s szerver · GDPR megfelelő · Hetzner, Németország</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
