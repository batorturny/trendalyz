import type { ReportResponse } from './api';

export interface KPIDefinition {
  label: string;
  getValue: (r: ReportResponse) => string | number;
  getChange?: (r: ReportResponse) => number | null | undefined;
  description: {
    title: string;
    text: string;
    tip: string;
  };
}

export const REPORT_KPIS: KPIDefinition[] = [
  {
    label: 'Like',
    getValue: (r) => r.data.daily.totals.totalLikes,
    getChange: (r) => r.data.daily.totals.likesChange,
    description: {
      title: 'Like-ok (kedvelések)',
      text: 'Az adott időszakban kapott összes kedvelés a profilodon megjelent tartalmakra. A like a leggyakoribb interakció: azt jelzi, hogy a tartalmad tetszett a nézőknek.',
      tip: 'Ha a like-ok száma nő, de a kommentek és megosztások nem, próbálj interaktívabb tartalmakat készíteni (kérdések, szavazások, CTA-k). Az igazán értékes tartalom megosztást és kommentet is generál.',
    },
  },
  {
    label: 'Komment',
    getValue: (r) => r.data.daily.totals.totalComments,
    getChange: (r) => r.data.daily.totals.commentsChange,
    description: {
      title: 'Kommentek',
      text: 'Az időszakban érkezett összes hozzászólás a tartalmaidhoz. A komment az egyik legértékesebb interakció, mert aktív párbeszédet jelent a közönségeddel.',
      tip: 'A TikTok algoritmusa előnyben részesíti a kommenteket generáló videókat. Tegyél fel kérdéseket a videóidban, válaszolj a kommentekre, és használj vitaindító kijelentéseket a kommentszám növeléséhez.',
    },
  },
  {
    label: 'Megosztás',
    getValue: (r) => r.data.daily.totals.totalShares,
    getChange: (r) => r.data.daily.totals.sharesChange,
    description: {
      title: 'Megosztások',
      text: 'Hányszor osztották meg a tartalmaidat más platformokra vagy ismerősöknek. A megosztás a legerősebb jelzés az algoritmus számára, hogy a tartalom értékes.',
      tip: 'A megosztás az organikus növekedés motorja. Olyan tartalmak generálnak megosztást, amelyek hasznosak, meglepőek vagy érzelmileg megérintik a nézőt. Készíts „mentsd el / oszd meg" típusú tartalmakat (tippek, listák, tutorialok).',
    },
  },
  {
    label: 'Profilnézet',
    getValue: (r) => r.data.daily.totals.totalProfileViews,
    getChange: (r) => r.data.daily.totals.profileViewsChange,
    description: {
      title: 'Profilnézetek',
      text: 'Hányan nézték meg a TikTok profilodat az adott időszakban. Ez azt mutatja, hogy a tartalmaid felkeltették az érdeklődést a márkád iránt.',
      tip: 'A magas profilnézet azt jelenti, hogy az emberek kíváncsiak rád. Győződj meg róla, hogy a profilod optimalizált: jó profilkép, leíró bio, linktree vagy weboldal link. Így a profilnézetek konverzióvá alakulhatnak.',
    },
  },
  {
    label: 'Új követők',
    getValue: (r) => `${r.data.daily.totals.totalNewFollowers >= 0 ? '+' : ''}${r.data.daily.totals.totalNewFollowers}`,
    description: {
      title: 'Új követők',
      text: 'Az időszak alatt szerzett új követők nettó száma (új követők mínusz elvesztett követők). Ez a fiókod növekedési ütemét mutatja.',
      tip: 'Az új követők aránya a tartalmad hosszú távú vonzerejét jelzi. Ha sok a megtekintés de kevés az új követő, a tartalmad szórakoztató, de nem épít márkakapcsolatot. Építs tartalomsorozatokat, hogy a nézők visszatérjenek.',
    },
  },
  {
    label: 'Videók',
    getValue: (r) => r.data.video.totals.videoCount,
    getChange: (r) => r.data.video.totals.videoCountChange,
    description: {
      title: 'Publikált videók',
      text: 'Az adott időszakban feltöltött videók száma. A rendszeres posztolás az egyik legfontosabb tényező a TikTok növekedésben.',
      tip: 'A TikTok heti 3-5 videót javasol az optimális eléréshez. A konzisztens posztolás fontosabb, mint a tökéletesség. Kísérletezz különböző formátumokkal és mérd, melyik teljesít legjobban.',
    },
  },
  {
    label: 'Megtekintés',
    getValue: (r) => r.data.video.totals.totalViews,
    getChange: (r) => r.data.video.totals.viewsChange,
    description: {
      title: 'Videó megtekintések',
      text: 'Az időszakban publikált videók összes megtekintése. Minden egyes lejátszás egy megtekintésnek számít, beleértve az ismételt nézéseket is.',
      tip: 'A megtekintésszám önmagában nem elég — nézd meg az ER%-ot is mellette. 100.000 megtekintés 0,5% ER-rel kevésbé értékes, mint 10.000 megtekintés 8% ER-rel. A cél: magas megtekintés ÉS magas engagement együtt.',
    },
  },
  {
    label: 'Elérés',
    getValue: (r) => r.data.video.totals.totalReach,
    getChange: (r) => r.data.video.totals.reachChange,
    description: {
      title: 'Elérés (egyedi nézők)',
      text: 'Hány egyedi felhasználó látta a tartalmaidat az időszakban. Szemben a megtekintéssel, itt minden személy csak egyszer számít, függetlenül attól, hányszor nézte meg a videóidat.',
      tip: 'Ha az elérés jóval alacsonyabb a megtekintésnél, az azt jelenti, hogy a nézőid többször is visszanézik a videóidat — ez pozitív jelzés! Ha az elérés stagnál, próbálj más hashtageket, posztolási időpontokat vagy tartalomtípusokat.',
    },
  },
  {
    label: 'ER%',
    getValue: (r) => `${r.data.video.totals.avgEngagement.toFixed(2)}%`,
    description: {
      title: 'Engagement Rate (elköteleződési arány)',
      text: 'Az interakciók (like + komment + megosztás) és a megtekintések aránya százalékban. Ez a legfontosabb minőségi mutató, ami megmutatja, mennyire aktívan reagál a közönséged a tartalmaidra.',
      tip: 'TikTokon az 1% alatti ER gyenge, 1-3% átlagos, 3-6% jó, 6%+ kiváló. Ha alacsony az ER, próbálj rövidebb, dinamikusabb videókat, erősebb hookot az első 3 másodpercben, és interaktív elemeket (kérdés, szavazás).',
    },
  },
  {
    label: 'Követők',
    getValue: (r) => r.data.daily.totals.currentFollowers,
    description: {
      title: 'Összes követő',
      text: 'A fiókod jelenlegi összes követőszáma. Ez a szám a márkád TikTok-os közönségméretét mutatja.',
      tip: 'A követőszám fontos, de nem minden. Egy kisebb, aktív közönség értékesebb, mint egy nagy, passzív. Fókuszálj a minőségi növekedésre: célcsoportodnak releváns tartalmak, amelyek valódi érdeklődőket vonzanak.',
    },
  },
];
