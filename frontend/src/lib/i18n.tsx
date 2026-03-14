'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

// ─── Translations ────────────────────────────────────────────────────────────

const translations = {
  // Auth
  'Bejelentkezés': 'Log In',
  'Kijelentkezés': 'Log Out',
  'Email': 'Email',
  'Email cím': 'Email address',
  'Jelszó': 'Password',
  'Belépés': 'Sign In',
  'Belépés a platformra': 'Sign in to platform',
  'Havi riportok marketing ügynökségeknek — minden partner, egy helyen': 'Monthly reports for marketing agencies — all clients, one place',
  'Elfelejtett jelszó?': 'Forgot password?',
  'Elfelejtett jelszó': 'Forgot password',
  'Elfelejtettem a jelszavam': 'I forgot my password',
  'Add meg az email címed és küldünk egy linket a jelszó visszaállításához.': 'Enter your email and we will send you a password reset link.',
  'Küldés...': 'Sending...',
  'Visszaállító link küldése': 'Send reset link',
  'Vissza a bejelentkezéshez': 'Back to login',
  'Jelszó beállítása': 'Set Password',
  'Új jelszó': 'New password',
  'Jelszó megerősítése': 'Confirm password',
  'Jelszó mentése': 'Save password',
  'Regisztráció': 'Register',
  'Regisztráció...': 'Registering...',
  'Fiók létrehozása': 'Create account',
  'Bejelentkezés...': 'Logging in...',
  'Bejelentkezés Google fiókkal': 'Log in with Google',
  'Regisztráció Google fiókkal': 'Register with Google',
  'Hibás email vagy jelszó': 'Invalid email or password',
  'Sikeres regisztráció! Most már bejelentkezhetsz.': 'Registration successful! You can now log in.',
  'Hálózati hiba': 'Network error',
  'Ha létezik ilyen fiók, elküldtük a jelszó-visszaállító linket az email címedre.': 'If an account exists, we have sent a password reset link to your email.',
  'Név': 'Name',
  'Teljes neved': 'Your full name',
  'Min. 6 karakter': 'Min. 6 characters',

  // Navigation
  'ADMIN PANEL': 'ADMIN PANEL',
  'Dashboard': 'Dashboard',
  'Cégek': 'Companies',
  'Chartok': 'Charts',
  'Beállítások': 'Settings',
  'Számlázás': 'Billing',
  'RIPORTOK': 'REPORTS',
  'TikTok Organic': 'TikTok Organic',
  'Facebook': 'Facebook',
  'Instagram': 'Instagram',
  'YouTube': 'YouTube',
  'TikTok Ads': 'TikTok Ads',

  // Companies
  'Cégek kezelése': 'Manage Companies',
  'Új cég': 'New Company',
  '+ Új cég hozzáadása': '+ Add New Company',
  'Aktív': 'Active',
  'Inaktív': 'Inactive',
  'Cég részletei': 'Company Details',
  'Cég neve': 'Company Name',
  'Cég státusza': 'Company Status',
  'Mentés': 'Save',
  'Mégse': 'Cancel',
  'Törlés': 'Delete',
  'Szerkesztés': 'Edit',
  'Vissza': 'Back',
  '← Vissza': '← Back',
  'Cégnév': 'Company Name',
  'Státusz': 'Status',
  'Műveletek': 'Actions',
  'cég': 'companies',
  'Csomag váltás': 'Change Plan',
  'Nincs platform': 'No platform',
  'felhasználó': 'users',
  'Cég törlése': 'Delete Company',
  'Törlés...': 'Deleting...',
  'Szinkronizáláshoz saját Windsor API kulcs szükséges.': 'A Windsor API key is required for synchronization.',
  'A Beállítások oldalon tudod megadni az API kulcsot.': 'You can enter your API key on the Settings page.',

  // Integrations
  'Integrációk': 'Integrations',
  '+ Új integráció': '+ New Integration',
  'Új integráció': 'New Integration',
  'Platform kiválasztása': 'Select Platform',
  'integráció': 'integration',
  'integrációt?': 'integration?',
  'Nincs konfigurált integráció': 'No configured integration',
  'Adj hozzá egy platformot a fenti gombbal': 'Add a platform using the button above',
  'Integráció törlése': 'Delete Integration',
  'Biztosan törlöd a(z)': 'Are you sure you want to delete the',
  'Leválasztva': 'Disconnected',
  'Függőben': 'Pending',
  'Utolsó szinkronizáció': 'Last sync',
  'Teszt sikertelen': 'Test failed',
  'Tesztelés...': 'Testing...',
  'Windsor beállítás': 'Windsor Setup',
  'Kapcsolódva': 'Connected',
  'Várakozás': 'Pending',
  'Hiba': 'Error',
  'Kapcsolat tesztelése': 'Test Connection',
  'Kapcsolat törlése': 'Delete Connection',
  'Kapcsolódás': 'Connect',
  'Manuális megadás': 'Manual Entry',
  'vagy válassz meglévő fiókot': 'or select an existing account',
  'válaszd ki a fiókot': 'select the account',
  'Integráció hozzáadása': 'Add Integration',
  'Fiókok betöltése...': 'Loading accounts...',
  'WINDSOR-BEN TALÁLT FIÓKOK': 'ACCOUNTS FOUND IN WINDSOR',
  'vagy': 'or',
  'Account ID': 'Account ID',
  'Account ID megadása kötelező': 'Account ID is required',
  'Megjelenítési név (felülírás)': 'Display name (override)',

  // OAuth
  'Bejelentkezés Instagram-kal': 'Sign in with Instagram',
  'Bejelentkezés Facebook-kal': 'Sign in with Facebook',
  'Facebook fiókkal — automatikusan menti az összes oldalt': 'With Facebook account — automatically saves all pages',
  'Google fiókoddal — automatikusan felismeri a csatornádat': 'With your Google account — automatically detects your channel',
  'Kapcsolódás Instagram-kal': 'Connect with Instagram',
  'Kapcsolódás Facebook-kal': 'Connect with Facebook',
  'Bejelentkezés popup ablakban — egy kattintás': 'Login via popup — one click',
  'Kapcsolat előkészítése...': 'Preparing connection...',
  'OAuth link generálása...': 'Generating OAuth link...',
  'Várakozás a bejelentkezésre...': 'Waiting for login...',
  'Jelentkezz be a felugró ablakban, majd zárd be': 'Log in to the popup window, then close it',
  'Fiók szinkronizálása...': 'Syncing account...',
  'Fiók adatok lekérése Windsor-ből...': 'Fetching account data from Windsor...',
  'Bejelentkezés sikeres!': 'Login successful!',
  'Válaszd ki a fiókot az alábbi listából': 'Select the account from the list below',
  'Hiba történt': 'An error occurred',
  'Próbáld újra': 'Try again',

  // Dashboard Config
  'Dashboard konfiguráció': 'Dashboard Configuration',
  'Válaszd ki, mely KPI-okat és diagramokat lássa az ügyfél ezen a platformon.': 'Select which KPIs and charts the client sees on this platform.',
  'Válaszd ki, mely KPI-kat és chartokat lássák az ügyfelek': 'Select which KPIs and charts clients see',
  'KPI mutatók': 'KPI Metrics',
  'KPI-ok': 'KPIs',
  'Diagramok': 'Charts',
  'Napi diagramok': 'Daily Charts',
  'Megoszlások': 'Distributions',
  'Összes kijelölése': 'Select All',
  'Összes törlése': 'Clear All',
  'Megjegyzés az ügyfélnek': 'Note for client',
  'Ide írhatsz megjegyzést, amit az ügyfél látni fog a dashboardon...': 'Write a note that the client will see on their dashboard...',
  'Mentve': 'Saved',
  'Nincs még kapcsolat ezen a platformon': 'No connection on this platform yet',

  // Email Schedule
  'Automatikus email ütemezés': 'Automatic Email Scheduling',
  'Válaszd ki, hogy a havi riport emailt a hónap melyik napján és hány órakor kapják az ügyfelek.': 'Choose which day and time of the month clients receive the report email.',
  'Hónap napja': 'Day of month',
  'Óra (UTC)': 'Hour (UTC)',
  'Mentés...': 'Saving...',
  'Mentve!': 'Saved!',

  // Monthly Analysis
  'Havi elemzés': 'Monthly Analysis',
  'Havi elemzés az ügyfélnek': 'Monthly Analysis for Client',
  'Írj havi elemzést az ügyfélnek. Ezt a szöveget látja a dashboardján.': 'Write a monthly analysis for the client. They will see this text on their dashboard.',
  'Írj havi összefoglalót — az ügyfél látja a dashboardján, amikor kiválasztja a hónapot': 'Write a monthly summary — the client sees it on their dashboard when selecting the month',
  'elemzés szövege': 'analysis text',
  'Írd ide a havi értékelést az ügyfélnek...': 'Write the monthly evaluation for the client here...',
  'Pl.: Ebben a hónapban kiemelkedő eredményeket értünk el az elérés terén...': 'E.g.: This month we achieved outstanding results in reach...',
  'Az ügyfél ezt az elemzést látja a dashboardján, amikor a(z)': 'The client sees this analysis on their dashboard when selecting the',
  'hónapot kiválasztja.': 'month.',
  'karakter': 'characters',

  // Reports
  'Riport generálása': 'Generate Report',
  'Riport letöltése (PDF)': 'Download Report (PDF)',
  'Dátum kiválasztása': 'Select Date',
  'Hónap': 'Month',
  'Év': 'Year',
  'Kezdő dátum': 'Start date',
  'Záró dátum': 'End date',
  'havi elemzés': 'monthly analysis',
  'Előző hónaphoz képest': 'Compared to previous month',

  // KPI Labels
  'Követők': 'Followers',
  'Elérés': 'Reach',
  'Impressziók': 'Impressions',
  'Engagement': 'Engagement',
  'Videó nézések': 'Video Views',
  'Profil megtekintések': 'Profile Views',
  'Megosztások': 'Shares',
  'Kommentek': 'Comments',
  'Kedvelések': 'Likes',
  'Reakciók': 'Reactions',
  'Követők változása': 'Follower Change',
  'Engagement Rate': 'Engagement Rate',
  'Új követők': 'New Followers',
  'Elveszett követők': 'Lost Followers',
  'Összes reakció': 'Total Reactions',

  // Charts
  'Napi elérés': 'Daily Reach',
  'Napi impressziók': 'Daily Impressions',
  'Napi videó nézések': 'Daily Video Views',
  'Napi engagement': 'Daily Engagement',
  'Napi új követők': 'Daily New Followers',
  'Legjobb posztok': 'Top Posts',
  'Legjobb videók': 'Top Videos',
  'Poszt táblázat': 'Post Table',
  'Videó táblázat': 'Video Table',
  'Demográfia': 'Demographics',
  'Kor és nem': 'Age & Gender',
  'Országok': 'Countries',
  'Városok': 'Cities',

  // Client Dashboard
  'Dashboard még nincs konfigurálva': 'Dashboard not configured yet',
  'Az adminisztrátor még nem állította be, mely adatokat lásd ezen a platformon.': 'The administrator has not yet configured which data you see on this platform.',
  'Válassz platformot': 'Select a platform',
  'Válassz hónapot': 'Select a month',

  // Users
  'Felhasználók': 'Users',
  'Email meghívó küldése': 'Send Email Invite',
  'Meghívás': 'Invite',
  'Ügyfél meghívása': 'Invite Client',
  'Email cím megadása': 'Enter email address',
  'Meghívó elküldve': 'Invitation sent',
  'Nincs még felhasználó': 'No users yet',

  // Status / Feedback
  'Sikeres mentés': 'Saved successfully',
  'Sikeres': 'Successful',
  'Sikertelen': 'Failed',
  'Betöltés...': 'Loading...',
  'Nincs adat': 'No data',
  'Nincs találat': 'No results',
  'Ismeretlen hiba': 'Unknown error',
  'Hiba a mentés során': 'Error saving',
  'Sikertelen mentés': 'Save failed',
  'Generálás...': 'Generating...',
  'Riport generálása...': 'Generating report...',
  'PDF készítése...': 'Creating PDF...',
  'PDF generálás sikertelen': 'PDF generation failed',
  'PDF letöltés sikertelen': 'PDF download failed',
  'Letöltés PDF-ben': 'Download PDF',
  'Adatok lekérése és feldolgozása folyamatban': 'Fetching and processing data',
  'Nem sikerült adatot lekérni a megadott időszakra': 'Could not fetch data for the selected period',
  'Nem sikerült az OAuth link generálása': 'Failed to generate OAuth link',
  'Nem sikerült betölteni a chart katalógust': 'Failed to load chart catalog',

  // Sync
  'Szinkronizálás': 'Sync',
  'Összes szinkronizálása': 'Sync All',
  'Szinkronizálás folyamatban...': 'Syncing...',
  'Szinkronizálás kész': 'Sync complete',

  // Landing page
  'MARKETING ÜGYNÖKSÉGEKNEK': 'FOR MARKETING AGENCIES',
  'Havi riport minden': 'Monthly reports for all',
  'partnerednek. Automatikusan.': 'your clients. Automatically.',
  'HOGYAN MŰKÖDIK': 'HOW IT WORKS',
  'Három lépés az első riportig': 'Three steps to your first report',
  'Kösd be a platformokat': 'Connect the platforms',
  'Tekintsd meg az analitikát': 'View the analytics',
  'Automatikus havi riportok': 'Automatic monthly reports',
  'ÜGYNÖKSÉGEKNEK TERVEZVE': 'DESIGNED FOR AGENCIES',
  'Te kezeled. Ők kapják a riportot.': 'You manage. They get the report.',
  'Több partner, egy felület': 'Multiple clients, one interface',
  'Automatikus havi riport': 'Automatic monthly report',
  'Ügyfél dashboard hozzáférés': 'Client dashboard access',
  'TÁMOGATOTT PLATFORMOK': 'SUPPORTED PLATFORMS',
  'A Trendalyz marketing ügynökségek számára készült — összegyűjti az összes kezelt fiók TikTok, Facebook, Instagram és YouTube adatait, és minden hónapban automatikusan elküldi a riportot a partnereknek.': 'Trendalyz is built for marketing agencies — it collects TikTok, Facebook, Instagram and YouTube data from all managed accounts and automatically sends monthly reports to your clients.',
  'Facebook oldal havi riport generálása': 'Facebook page monthly report generation',
  'Elérés – napi bontás': 'Reach — daily breakdown',
  'Egy kattintással engedélyezd a hozzáférést a TikTok, Facebook, Instagram és YouTube fiókokhoz. Az OAuth tokeneket titkosítva tároljuk, jelszavadat soha nem látjuk.': 'Authorize access to TikTok, Facebook, Instagram and YouTube accounts with one click. OAuth tokens are stored encrypted — we never see your password.',
  'A dashboard valós időben mutatja az összes platform összesített adatait. Napi bontású grafikonok, poszt-szintű statisztikák, elérés, engagement és videó metrikák.': 'The dashboard shows aggregated data from all platforms in real time. Daily charts, post-level stats, reach, engagement and video metrics.',
  'Elérés és impressziók napi bontásban': 'Daily reach and impressions',
  'Posztszintű teljesítmény rangsor': 'Post-level performance ranking',
  'Videó megtekintések és megtartási arány': 'Video views and retention rate',
  'Engagement rate automatikus számítással': 'Engagement rate with automatic calculation',
  'Napi nézések': 'Daily views',
  'Állítsd be a hónap napját és az időpontot. Minden hónapban a Trendalyz automatikusan összeállítja a riportot és elküldi emailben PDF formátumban az ügyfelednek.': 'Set the day and time. Every month Trendalyz automatically compiles the report and sends it via email as a PDF to your client.',
  'Ütemezett küldés (pl. minden hónap 5-én)': 'Scheduled delivery (e.g. every 5th of the month)',
  'PDF export letölthetően is': 'Downloadable PDF export',
  'Előző hónappal való összehasonlítás': 'Comparison with previous month',
  'Egyedi ügyfél hozzáférés saját dashboardhoz': 'Custom client access to their own dashboard',
  'Trendalyz — Havi riport kész': 'Trendalyz — Monthly report ready',
  'A február havi riportod elkészült.': 'Your February monthly report is ready.',
  'Letöltés': 'Download',
  'A Trendalyz-zal egyszerre kezelheted az összes partnered social media fiókját. Minden hónapban egy kattintás nélkül megy ki a riport — te csak a stratégiára fókuszálhatsz.': 'With Trendalyz you can manage all your clients\' social media accounts at once. Reports go out every month without a single click — you just focus on strategy.',
  'Minden ügyfeled külön cégnél kezeled. Platformonkénti kapcsolatok, saját hozzáférések, saját riportok — minden rendezett és elkülönített.': 'Each client is managed under a separate company. Per-platform connections, individual access, separate reports — everything organized and isolated.',
  'Állítsd be egyszer, és minden hónapban automatikusan megy ki az email a partnernek — PDF-ben, az előző hónaphoz képesti változással.': 'Set it up once and every month the email goes out automatically to your client — as a PDF, with month-over-month comparison.',
  'Minden partner saját bejelentkezőt kap, ahol megnézheti az adatait. Nincs több "küld el Excel-ben" — ők is élőben látnak mindent.': 'Every client gets their own login where they can view their data. No more "send it in Excel" — they see everything live.',
  'Te (ügynökség)': 'You (agency)',
  'minden hónapban automatikusan': 'automatically every month',
  'Partner A': 'Client A',
  'Partner B': 'Client B',
  'Partner C': 'Client C',
  'riport kész': 'report ready',
  'Social media analytics platform marketing ügynökségeknek. Minden platform, egy helyen.': 'Social media analytics platform for marketing agencies. All platforms, one place.',
  'Minden jog fenntartva.': 'All rights reserved.',
  'EU-s szerver · GDPR megfelelő · Hetzner, Németország': 'EU server · GDPR compliant · Hetzner, Germany',

  // Client Dashboard
  'Riportok': 'Reports',
  'Összesített KPI-ok': 'Aggregated KPIs',
  'Ehhez a hónaphoz nem található adat. Próbálj másik hónapot választani.': 'No data found for this month. Try selecting a different month.',
  'Nincs hozzárendelt cég': 'No company assigned',
  'Kérd meg az adminisztrátort, hogy rendeljen hozzád egy céget.': 'Ask the administrator to assign you a company.',
  'HAMAROSAN': 'COMING SOON',
  'Hamarosan érkezik': 'Coming soon',
  'Menü megnyitása': 'Open menu',
  'Menü bezárása': 'Close menu',
  'Nyelv': 'Language',
  'Téma': 'Theme',
  'Platformok': 'Platforms',
  'számai': 'numbers',
  'hónap': 'month',

  // Integration wizard extras
  'Kiválasztott fiók': 'Selected account',
  'Megjelenítési név (opcionális)': 'Display name (optional)',
  'Már hozzáadva': 'Already added',
  'Megjegyzés': 'Note',
  'connecteld a(z)': 'connect the',
  'fiókot, majd add meg itt az account ID-t.': 'account, then enter the account ID here.',
  'fiók': 'account',
  'token': 'token',
  'dashboardon': 'on the dashboard',
  'Nem konfigurált': 'Not configured',
  'pl. 123456789': 'e.g. 123456789',
  'pl. Cég': 'e.g. Company',
  'Admin Panel': 'Admin Panel',

  // Demographics
  'Korcsoport': 'Age group',
  'Megoszlás': 'Distribution',
  'Nem': 'Gender',
  'Tipp': 'Tip',

  // Misc
  'Fejlesztés alatt': 'Under development',
  'Keresés...': 'Search...',
  'Részletek': 'Details',
  'Adatvédelmi irányelvek': 'Privacy Policy',
  'Kapcsolat': 'Contact',
  'Jogi': 'Legal',
} as const;

export type TranslationKey = keyof typeof translations;

// ─── Context ─────────────────────────────────────────────────────────────────

type Language = 'hu' | 'en';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'hu',
  setLang: () => {},
  t: (text) => text,
});

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  const { t } = useContext(I18nContext);
  return t;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('hu');

  useEffect(() => {
    const saved = localStorage.getItem('trendalyz-lang') as Language;
    if (saved === 'en' || saved === 'hu') {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('trendalyz-lang', newLang);
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback((text: string): string => {
    if (lang === 'hu') return text;
    return (translations as Record<string, string>)[text] ?? text;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
