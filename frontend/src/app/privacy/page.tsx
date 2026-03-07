import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';

export const metadata: Metadata = {
  title: 'Adatvédelmi irányelvek | Trendalyz',
  description: 'Trendalyz adatvédelmi irányelvek és felhasználási feltételek.',
};

const sections = [
  {
    id: 'intro',
    title: '1. Bevezetés',
    content: (
      <p className="text-gray-600 leading-relaxed">
        A Trendalyz egy social media analytics platform, amely lehetővé teszi vállalkozások
        számára, hogy összekössék közösségi média fiókjaikat és megtekinthessék a teljesítmény
        metrikákat. Ez az adatvédelmi tájékoztató ismerteti, hogy milyen adatokat gyűjtünk,
        hogyan használjuk, tároljuk és védjük azokat a{' '}
        <span className="font-medium text-gray-800">trendalyz.hu</span> szolgáltatás használata során.
        A Trendalyz használatával elfogadja a jelen tájékoztatóban foglaltakat.
      </p>
    ),
  },
  {
    id: 'data',
    title: '2. Gyűjtött adatok',
    content: (
      <div className="space-y-5">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Fiókadatok</h3>
          <ul className="space-y-1 text-gray-600 text-sm">
            {['Név és e-mail cím', 'Titkosított jelszó (bcrypt hash)', 'Cégnév és kapcsolattartási adatok'].map(i => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Közösségi média platform adatok</h3>
          <p className="text-gray-600 text-sm mb-3">
            Kizárólag az összekapcsolt fiókokhoz tartozó analitikai adatokat olvassuk le:
          </p>
          <div className="space-y-2">
            {[
              { platform: 'Facebook Pages', data: 'Oldal impressziók, elérés, követőszám, napi követők/lekövetők, videó megtekintések, oldal megtekintések, post-szintű impressziók, elérés, reakciók, megosztások, kattintások.' },
              { platform: 'Instagram Business', data: 'Impressziók, elérés, profilmegtekintések, webhelykattintások, követőszám változás, média (kép/videó/reel) szintű elérés, like-ok, kommentek, megosztások, mentések.' },
              { platform: 'TikTok Organic', data: 'Videó megtekintések, like-ok, kommentek, megosztások, követőszám, profilmegtekintések, videó megtartási arány, nézési idő.' },
              { platform: 'YouTube', data: 'Megtekintések, like-ok, kommentek, megosztások, feliratkozók változása, megtekintési idő, kártyakattintások.' },
            ].map(item => (
              <div key={item.platform} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-gray-800 text-sm mb-0.5">{item.platform}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{item.data}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Hitelesítési tokenek</h3>
          <p className="text-gray-600 text-sm">
            Az OAuth hozzáférési tokeneket{' '}
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">AES-256-GCM</code>{' '}
            titkosítással tároljuk. Kizárólag az analitikai adatok lekérdezésére használjuk
            az Ön nevében. A tokeneket harmadik félnek nem adjuk tovább.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'use',
    title: '3. Adatfelhasználás',
    content: (
      <div className="space-y-3">
        <ul className="space-y-2 text-gray-600 text-sm">
          {[
            'Közösségi média analitika és teljesítménymetrikák megjelenítése a dashboardon',
            'Automatikus havi riportok generálása és e-mailben való kiküldése',
            'Munkamenet hitelesítése és biztonságos fenntartása',
            'Tranzakciós e-mailek küldése (riport kézbesítés, értesítések)',
            'Szolgáltatás fejlesztése és technikai problémák elhárítása',
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500 border border-gray-100 rounded-lg p-3 bg-gray-50">
          Az Ön adatait nem adjuk el harmadik félnek, és nem használjuk hirdetési célokra.
        </p>
      </div>
    ),
  },
  {
    id: 'facebook',
    title: '4. Facebook és Instagram adatok',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">
          A Trendalyz a Facebook Graph API-t és az Instagram Graph API-t használja.
          Fiókja összekapcsolásával az alábbi engedélyeket adja meg:
        </p>
        <div className="space-y-2">
          {[
            { perm: 'pages_show_list', desc: 'A kezelt Facebook oldalak listázása' },
            { perm: 'pages_read_engagement', desc: 'Posztok engagement adatainak olvasása' },
            { perm: 'read_insights', desc: 'Oldal-szintű analitika és demográfiai adatok' },
            { perm: 'instagram_basic', desc: 'Alapvető Instagram fiókadatok elérése' },
            { perm: 'instagram_manage_insights', desc: 'Instagram analitikai adatok olvasása' },
            { perm: 'ads_read', desc: 'Facebook Ads teljesítményadatok (opcionális)' },
          ].map(item => (
            <div key={item.perm} className="flex items-center gap-3 border border-gray-100 rounded-lg p-2.5">
              <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono flex-shrink-0">{item.perm}</code>
              <span className="text-gray-500 text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs">
          A hozzáférést bármikor visszavonhatja a Facebook Beállítások → Alkalmazások és webhelyek menüponton keresztül.
        </p>
      </div>
    ),
  },
  {
    id: 'security',
    title: '5. Adattárolás és biztonság',
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: 'EU-s szerverek', desc: 'Hetzner, Németország — GDPR megfelelő adatközpont' },
          { title: 'AES-256-GCM titkosítás', desc: 'OAuth tokenek titkosítva tárolva' },
          { title: 'HTTPS / TLS', desc: 'Minden adatátvitel titkosított csatornán' },
          { title: 'Bcrypt jelszavak', desc: 'Jelszavak soha nem kerülnek egyszerű szövegként tárolásra' },
        ].map(item => (
          <div key={item.title} className="border border-gray-100 rounded-lg p-3">
            <p className="font-medium text-gray-800 text-sm">{item.title}</p>
            <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'gdpr',
    title: '6. Az Ön jogai (GDPR)',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { right: 'Hozzáférés', desc: 'Másolat kérése a személyes adatairól' },
            { right: 'Helyesbítés', desc: 'Pontatlan személyes adatok korrekciója' },
            { right: 'Törlés', desc: 'Az elfeledtetéshez való jog' },
            { right: 'Korlátozás', desc: 'Adatkezelés korlátozásának kérése' },
            { right: 'Hordozhatóság', desc: 'Adatok géppel olvasható formátumban' },
            { right: 'Tiltakozás', desc: 'Adatkezelés ellen való tiltakozás' },
          ].map(item => (
            <div key={item.right} className="border border-gray-100 rounded-lg p-3">
              <p className="font-medium text-gray-800 text-sm">{item.right}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-sm">
          Jogai gyakorlásához írjon a{' '}
          <a href="mailto:bator.turny@gmail.com" className="text-indigo-600 hover:underline">
            bator.turny@gmail.com
          </a>{' '}
          címre. 30 napon belül válaszolunk.
        </p>
      </div>
    ),
  },
  {
    id: 'deletion',
    title: '7. Adattörlés',
    content: (
      <div className="space-y-3">
        <p className="text-gray-600 text-sm">Adatainak törlését bármikor kérheti:</p>
        <ul className="space-y-2 text-gray-600 text-sm">
          {[
            'E-mail küldése a bator.turny@gmail.com címre',
            'Közösségi média fiók leválasztása a Trendalyz dashboardon belül',
            'Alkalmazás hozzáférésének visszavonása Facebook / Instagram / TikTok beállításokban',
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-gray-500 text-xs">
          Minden személyes adat véglegesen törlődik a kérés beérkezésétől számított 30 napon belül.
        </p>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><TrendalyzLogo size="md" /></Link>
          <span className="text-xs text-gray-400">Utoljára frissítve: 2026-03-07</span>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 py-12 border-b border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Adatvédelmi irányelvek</h1>
        <p className="text-gray-500 text-base">
          Pontosan ismertetjük, milyen adatokat gyűjtünk, hogyan használjuk és hogyan védjük azokat.
        </p>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {sections.map((section) => (
          <div key={section.id} id={section.id}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              {section.title}
            </h2>
            {section.content}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50" id="data-deletion">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/"><TrendalyzLogo size="sm" /></Link>
          <div className="text-center md:text-right">
            <a href="mailto:bator.turny@gmail.com" className="text-sm text-indigo-600 hover:underline">
              bator.turny@gmail.com
            </a>
            <p className="text-gray-400 text-xs mt-1">
              &copy; {new Date().getFullYear()} Trendalyz &middot; trendalyz.hu
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
