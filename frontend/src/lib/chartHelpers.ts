import { ChartData, ChartDefinition } from '@/lib/api';

// ===== KPI helpers =====

export function sumSeries(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = chart.data.series[seriesIndex].data as number[];
  return data.reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
}

export function lastValue(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = chart.data.series[seriesIndex].data as number[];
  for (let i = data.length - 1; i >= 0; i--) {
    if (typeof data[i] === 'number' && data[i] > 0) return data[i];
  }
  return 0;
}

export function avgSeries(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = (chart.data.series[seriesIndex].data as number[]).filter(v => typeof v === 'number');
  if (data.length === 0) return 0;
  return data.reduce((s, v) => s + v, 0) / data.length;
}

export function tableCount(chart: ChartData | undefined): number {
  if (!chart || chart.empty || !chart.data?.series?.[0]?.data) return 0;
  return (chart.data.series[0].data as unknown[]).length;
}

export function findChart(results: ChartData[], key: string): ChartData | undefined {
  return results.find(c => c.key === key);
}

// ===== KPI extraction =====

export interface KPI {
  key: string;
  label: string;
  value: string | number;
  change?: number | null;
  /** Aggregation hint for multi-month: 'sum' (default), 'last' (use latest), 'avg' */
  agg?: 'sum' | 'last' | 'avg';
  description?: { title: string; text: string; tip: string };
}

const KPI_DESC: Record<string, { title: string; text: string; tip: string }> = {
  // TikTok Organic
  tt_followers: { title: 'Össz. követőnövekedés', text: 'Az adott hónapban szerzett új követők összesített száma. Ez az egyik legfontosabb növekedési mutató, amely megmutatja, mennyire hatékonyan vonzza a tartalomstratégiád az új közönséget. A stabil havi növekedés a tartalom minőségének és a fiók egészségének jele.', tip: 'Posztolj naponta 1-3 videót, és használd a trendi hangokat és hashtageket, hogy a For You Page-re kerülj. Az értékes, szórakoztató vagy oktatási tartalom organikusan hozza az új követőket. Figyelj arra, melyik típusú tartalom hozza a legtöbb új követőt, és készíts több hasonlót.' },
  tt_total_views: { title: 'Össz. megtekintés', text: 'Az összes videó összes megtekintésének összege az adott időszakban. Ez az egyik legfontosabb teljesítménymutató, mert közvetlenül mutatja, hogy a tartalmaid összességében mekkora figyelmet kapnak. A magas megtekintésszám széles elérést és a For You Page-en való megjelenést jelzi.', tip: 'A megtekintések növeléséhez használj trendi hangokat, releváns hashtageket és figyelemfelkeltő nyitó képkockákat. A videó első 1-2 másodperce döntő — ha nem ragadja meg a figyelmet, a néző tovább görget. Elemezd, mely videóid kapták a legtöbb megtekintést, és készíts hasonló tartalmakat.' },
  tt_total_followers: { title: 'Összes követő', text: 'A fiók jelenlegi teljes követőtábora. Ez a kumulatív szám a fiók létrehozása óta, és a márka közösségi jelenlétének egyik alapmutatója. A követőszám közvetlenül befolyásolja az elérést és a márka hitelességét a potenciális partnerségek és együttműködések szempontjából.', tip: 'Ne csak a számra figyelj — a minőségi követők (akik rendszeresen interakcióba lépnek a tartalmaiddal) sokkal értékesebbek. Rendszeres tartalom, közösségi válaszok és kollaborációk más alkotókkal mind hozzájárulnak a fenntartható növekedéshez.' },
  tt_profile_views: { title: 'Profilnézetek', text: 'Az adott időszakban profilodat meglátogató felhasználók száma. Ez a mutató közvetlenül jelzi, hogy a tartalmaid mennyire ösztönzik a nézőket arra, hogy többet tudjanak meg rólad. A magas profilnézet arány azt jelenti, hogy a tartalmaid felkeltik az érdeklődést.', tip: 'Egy vonzó profilkép, jól megírt bio és egységes tartalmi arculat drámaian növeli a profillátogatásból fakadó követővé válás esélyét. Használj CTA-t a videóidban: „Nézd meg a profilomat a többi tippért!" A link in bio eszközökkel forgalmat is terelhetsz a weboldaladra.' },
  tt_likes: { title: 'Like-ok', text: 'Az összes videódra kapott like-ok havi összesítése. A like a leggyakoribb interakció-forma, és az algoritmus számára fontos jelzés arról, hogy a tartalom tetszik a közönségnek. A like-ok növekedése általában az elérés növekedésével is jár, mivel a TikTok algoritmusa előnyben részesíti a kedvelt tartalmakat.', tip: 'A videók első 3 másodperce kulcsfontosságú — egy erős hook (meglepő kijelentés, vizuális váltás, kérdés) azonnal megragadja a figyelmet és like-ra ösztönöz. Próbálj ki különböző nyitásokat, és figyeld meg, melyik hozza a legjobb eredményt. Az érzelmileg rezonáló tartalmak (humor, nosztalgia, inspiráció) jellemzően több like-ot kapnak.' },
  tt_comments: { title: 'Kommentek', text: 'Az összes videódra érkezett kommentek havi összesítése. A kommentek az engagement egyik legerősebb formája, mert aktív részvételt igényelnek a nézőtől. A TikTok algoritmusa kiemelt figyelmet fordít a kommentekre — a sok kommentet kapó videók nagyobb eséllyel kerülnek a For You Page-re.', tip: 'Tegyél fel nyitott kérdéseket a videóid végén, például „Ti mit gondoltok?" vagy „Nektek mi a véleményetek?" A vitaindító és véleménymegosztásra ösztönző tartalmak hozzák a legtöbb kommentet. Fontos: válaszolj a kommentekre, mert ez további interakciókat generál és közösséget épít a fiókodon.' },
  tt_shares: { title: 'Megosztások', text: 'A tartalmaid megosztásainak összesített száma. A megosztás a TikTok algoritmusának egyik legértékesebb jelzése, mivel azt mutatja, hogy a tartalom annyira tetszett, hogy a néző mások számára is ajánlja. A megosztások exponenciálisan növelik az elérést, hiszen új közönségekhez juttatják el a videódat.', tip: 'A „mentsd el későbbre" típusú tartalmak (tippek, receptek, útmutatók), a vicces és relatable videók, valamint a „küld el annak, aki..." formátumú tartalmak kapják a legtöbb megosztást. Gondolj arra, hogy a néződ miért küldené el valakinek a videódat, és készítsd a tartalmat ennek megfelelően.' },
  tt_er: { title: 'Engagement Rate', text: 'Az átlagos napi engagement rate százalékban kifejezve, amely az interakciók (like, komment, megosztás) arányát mutatja az eléréshez képest. Ez az egyik legfontosabb teljesítménymutató, mert a közönség tényleges aktivitását méri, nem csupán a passzív megtekintéseket. Magas ER azt jelzi, hogy a tartalmad valóban rezonál a közönségeddel.', tip: 'Az 5% feletti ER általában jónak számít TikTokon, 10% felett kiválónak. Az ER javításához koncentrálj az interakcióra ösztönző tartalmakra: kérdések, szavazások, kihívások. A kisebb, de elkötelezett közönség értékesebb, mint a nagy, de passzív követőtábor.' },
  tt_videos: { title: 'Videók száma', text: 'Az adott hónapban közzétett videók száma. A rendszeres posztolás a TikTok növekedés alapja, mivel az algoritmus előnyben részesíti az aktív alkotókat. Minden egyes videó egy új lehetőség a For You Page-re kerülésre és új közönség elérésére.', tip: 'A napi 1-3 videó posztolása az ideális frekvencia TikTokon. Ha kevesebb időd van, inkább a minőségre koncentrálj — heti 3-4 jó minőségű videó is elegendő lehet. Használj tartalomtervezőt és batch-készítsd a videókat, hogy könnyebb legyen fenntartani a rendszerességet.' },
  tt_bio_clicks: { title: 'Bio link kattintás', text: 'A profilodban található link kattintásainak száma. Ez közvetlenül méri, hogy a TikTok közönséged mennyire hajlandó a platformon kívüli cselekvésre (weblátogatás, vásárlás, feliratkozás). Ez az egyik legfontosabb konverziós mutató, különösen e-commerce és szolgáltató vállalkozások számára.', tip: 'Használj erős CTA-t a videóidban: „Link a biomban!" vagy „A részleteket megtalálod a profilomban!" Linktree vagy hasonló eszközzel több céloldalt is kínálhatsz egyetlen linkben. A videóid végén mutasd meg vizuálisan is, hol találják a linket.' },
  tt_like_per_view: { title: 'Like / megtekintés', text: 'Az összes like elosztva az összes megtekintéssel, százalékban kifejezve. Ez a mutató megmutatja, hogy a videóidat megtekintők mekkora hányada lép interakcióba a tartalommal. Magasabb arány jobb tartalmi minőséget és közönség-illeszkedést jelez.', tip: '4-5% feletti like/view arány kiváló eredménynek számít TikTokon. Ha ez az arány alacsony, a tartalmad eléri ugyan az embereket, de nem rezonál eléggé. Próbálj erősebb hookot, érzelmesebb vagy szórakoztatóbb tartalmat készíteni.' },
  tt_comment_per_view: { title: 'Komment / megtekintés', text: 'Az összes komment elosztva az összes megtekintéssel. Ez a mélyebb engagement jele, mert a kommentálás sokkal nagyobb elköteleződést igényel, mint egy egyszerű like. Az algoritmus is nagyobb súlyt ad neki, így a magas arány az organikus elérés növekedéséhez vezet.', tip: 'Vitatémák, személyes kérdések és „mondd el a véleményed" típusú felszólítások erős komment-generátorok. A kontroverz (de nem sértő) témák, „ez vagy az" választások és személyes történetek hozzák a legtöbb kommentet. Ne feledd: a kommentekre válaszolás is növeli ezt a mutatót.' },
  tt_share_per_view: { title: 'Megosztás / megtekintés', text: 'Az összes megosztás elosztva az összes megtekintéssel. A megosztási arány az egyik legfontosabb virális potenciál mutató, mert a megosztás az algoritmus legerősebb pozitív jelzése. Ha a nézők megosztják a videóidat, az azt jelenti, hogy a tartalom annyira értékes, hogy mások figyelmére is méltónak tartják.', tip: 'Hasznos tartalmak (tippek, útmutatók, checklisták), vicces és relatable videók, valamint a „küld el annak a barátodnak, aki..." formátumú tartalmak kapják a legtöbb megosztást. Gondolj arra, hogy a tartalmadat miért küldené el valaki egy ismerősének.' },
  tt_interactions_total: { title: 'Összes interakció', text: 'A like-ok, kommentek és megosztások havi összesítése egyetlen számban. Ez átfogó képet ad a közönséged aktivitásáról és a tartalomstratégiád hatékonyságáról. Az összes interakció növekedése az algoritmus számára is pozitív jelzés.', tip: 'Az interakciók összességének növeléséhez kombináld a különböző stratégiákat: erős vizuális hook a like-okhoz, kérdések a kommentekhez, és hasznos tartalom a megosztásokhoz. Figyeld meg, hogy melyik videótípus hozza a legtöbb összes interakciót, és készíts több hasonlót.' },
  tt_avg_views: { title: 'Átl. megtekintés/videó', text: 'Az egy videóra jutó átlagos megtekintésszám. Ez megmutatja, hogy a tartalmaid általánosságban mekkora közönséghez jutnak el. Ha ez az érték stabilan magas, az azt jelenti, hogy az algoritmus rendszeresen széles körben terjeszti a videóidat.', tip: 'Ha ez az érték csökkenő tendenciát mutat, próbáld meg változtatni a tartalom stílusán, a videó hosszán vagy a posztolás időpontján. Elemezd a legjobban teljesítő videóidat, és azonosítsd, mi teszi őket sikeressé. Az aktuális trendek és hangok használata is növelheti az átlagos megtekintéseket.' },
  tt_avg_likes: { title: 'Átl. like/videó', text: 'Az egy videóra jutó átlagos like szám. Ez a tartalmaid átlagos vonzerejét mutatja, és segít azonosítani, hogy az egyes videók teljesítménye hogyan viszonyul az átlaghoz. A magas átlag stabil, minőségi tartalomgyártást jelez.', tip: 'Az érzelmi tartalmak (humor, meglepetés, nosztalgia, inspiráció) általában több like-ot kapnak. Kísérletezz különböző formátumokkal és stílusokkal, hogy megtaláld a közönséged számára legvonzóbb tartalomtípust. A trendek és aktuális témák kihasználása is emeli az átlagos like-számot.' },
  tt_avg_comments: { title: 'Átl. komment/videó', text: 'Az egy videóra jutó átlagos kommentszám. A magas átlagos kommentszám azt jelzi, hogy a tartalmaid rendszeresen párbeszédre ösztönzik a közönséget, ami az egyik legértékesebb engagement-forma a TikTok algoritmusában.', tip: 'Minden videó végére tegyél egy egyszerű, nyitott kérdést. A vitaindító és kérdésfeltevő tartalmak drasztikusan növelik a kommentszámot. A kommentekre adott válaszokból készíts új videókat — ez közösséget épít és további kommentálásra ösztönöz.' },
  tt_avg_shares: { title: 'Átl. megosztás/videó', text: 'Az egy videóra jutó átlagos megosztásszám. Ez a virális potenciál egyik legfontosabb mutatója, mert azt jelzi, hogy a tartalmaid rendszeresen olyan értéket nyújtanak, amit a nézők mások számára is meg akarnak osztani.', tip: 'Listás tartalmak, „mentsd el később" típusú tippgyűjtemények, és „küldd el annak, aki..." formátumú videók kapják a legtöbb megosztást. Gondolj arra, hogy a célközönséged kinek küldené el a videódat, és ennek megfelelően tervezd a tartalmat.' },
  tt_avg_er: { title: 'Átl. ER%/videó', text: 'A videóid átlagos engagement rate-je százalékban kifejezve. Ez a tartalomminőség egyik legmegbízhatóbb mutatója, mert megmutatja, hogy az eléréshez képest mennyire aktívan reagál a közönség. Egy magas ER-ű videó sokkal többet ér az algoritmus szemében.', tip: 'Koncentrálj a minőségre a mennyiség helyett — egy magas ER-ű videó többet ér a növekedés szempontjából, mint öt alacsony ER-ű. Az interaktív elemek (kérdések, szavazások, kihívások) és az érzelmileg rezonáló tartalmak javítják az átlagos ER-t.' },
  tt_avg_watch_time: { title: 'Átl. nézési idő', text: 'Az átlagos időtartam másodpercben, amennyit a nézők egy videóból megnéznek. Ez az algoritmus egyik legfontosabb jelzése — ha a nézők hosszan figyelik a tartalmadat, a TikTok több embernek fogja megmutatni. A nézési idő közvetlenül befolyásolja a videó elérését.', tip: 'A videó első 1-2 másodperce (hook) meghatározza, hogy a néző tovább nézi-e. Használj meglepő kijelentéseket, vizuális váltásokat vagy kérdéseket az elejénn. A videó tempójának fenntartása is kulcsfontosságú — kerüld a lassú, üres részeket. Rövidebb, tömörebb videók általában jobb átlagos nézési időt produkálnak.' },
  tt_avg_full_watch: { title: 'Átl. végignézés%', text: 'A nézők hány százaléka nézte végig a teljes videót átlagosan. Ez az algoritmus egyik legfontosabb rangsorolási tényezője — a magas végignézési arányú videók drámaian több elérést kapnak. Ha a nézők végignézik a videóidat, az azt jelenti, hogy a tartalom elejétől végéig le tudja kötni a figyelmüket.', tip: '40% feletti átlag kiváló eredmény! A végignézési arány javításához használj feszültség-fenntartó szerkesztést, tartsd rövidre a videókat (15-30 mp ideális), és kerüld a felesleges részeket. A „maradj a végéig" típusú teaselés és a videó végén lévő meglepetés is segít.' },
  tt_avg_new_followers: { title: 'Átl. új követő/videó', text: 'Az egy videó által átlagosan hozott új követők száma. Ez megmutatja, hogy a videóid mennyire hatékonyan konvertálják a nézőket követőkké. A magas arány azt jelzi, hogy a tartalmaid nem csak szórakoztatóak, hanem a nézők hosszú távon is szeretnének tőled tartalmat látni.', tip: 'Használj CTA-t a videóidban: „Kövess be, ha tetszett!" vagy „Kövess a további tippekért!" A sorozat-tartalmak (1. rész, 2. rész) különösen hatékonyak az új követők szerzésében, mert a nézők be akarják követni, hogy ne maradjanak le a folytatásról.' },
  tt_total_reach: { title: 'Össz. elérés', text: 'Az összes videó összesített elérése az adott időszakban. Ez megmutatja, hogy összességében hány egyedi felhasználóhoz jutott el a tartalmad. A magas elérés jelzi, hogy a videóid rendszeresen megjelennek a For You Page-en, és széles közönséghez jutnak el.', tip: 'A magas elérés a For You Page megjelenés eredménye. Az algoritmus azokat a videókat részesíti előnyben, amelyeknél magas a nézési idő, sok az interakció, és a nézők végignézik a tartalmat. Koncentrálj ezekre a mutatókra, és az elérés természetesen növekedni fog.' },
  // TikTok Ads
  ttads_spend: { title: 'Költés', text: 'Az adott időszakban elköltött teljes hirdetési összeg. Ez az alapja minden hirdetési hatékonysági számításnak — a költés önmagában nem jó vagy rossz, mindig a megtérüléssel (ROAS, CPA) együtt kell értékelni. A napi és heti költésdinamika elemzése segít azonosítani a leghatékonyabb időszakokat.', tip: 'Állíts be napi és kampányszintű költségkorlátokat, hogy elkerüld a túlköltekezést. Kezdj kisebb büdzsével (napi 20-50 EUR), és fokozatosan emeld, ha a mutatók jók. A hétvégi és esti órák általában drágábbak — tesztelj különböző időszakokat.' },
  ttads_impressions: { title: 'Impressziók', text: 'A hirdetésed megjelenéseinek száma a felhasználók képernyőjén. Az impresszió azt méri, hányszor jelent meg a hirdetésed, függetlenül attól, hogy a felhasználó interakcióba lépett-e vele. Ez az elérés és a márkaismeretség alapmutatója a fizetett hirdetéseknél.', tip: 'Ha magas az impressziószám, de alacsony a CTR, az azt jelzi, hogy a kreatív anyag nem elég figyelemfelkeltő — frissítsd a videót vagy a szöveget. Próbálj ki A/B tesztet különböző thumbnailekkel és nyitó képkockákkal. Az impressziók célzás-szűkítéssel is optimalizálhatók.' },
  ttads_clicks: { title: 'Kattintások', text: 'A hirdetésedre érkezett kattintások száma. A kattintás az érdeklődés közvetlen jele — a felhasználó annyira érdekesnek találta a hirdetésedet, hogy tovább akart lépni. Ez az első lépés a konverzió felé, és közvetlenül befolyásolja a landing page forgalmát.', tip: 'Az erős CTA (Vásárolj most, Tudj meg többet, Regisztrálj) és a vizuálisan kiemelkedő kreatív növeli a kattintásokat. A videó első 3 másodperce döntő — ha nem ragadja meg a figyelmet, a felhasználó tovább görget. A/B tesztelj különböző CTA-kat és kreatívokat a legjobb eredményért.' },
  ttads_ctr: { title: 'CTR%', text: 'Click-Through Rate: a kattintások százalékos aránya az impressziókhoz képest. Ez a hirdetési kreatív hatékonyságának egyik legfontosabb mutatója. Magas CTR azt jelzi, hogy a hirdetésed releváns és vonzó a célközönség számára, ami alacsonyabb hirdetési költségeket is eredményezhet.', tip: 'Az 1% feletti CTR általában jónak számít TikTok hirdetéseknél, 2% felett kiválónak. Ha alacsony a CTR, próbálj natívabb, organikusabb stílusú kreatívot — a TikTok felhasználók jobban reagálnak a nem-reklám jellegű tartalmakra. A felhasználók által generált tartalom (UGC) stílusú hirdetések jellemzően magasabb CTR-t érnek el.' },
  ttads_cpc: { title: 'CPC', text: 'Cost Per Click: egy kattintásra jutó átlagos költség. Ez megmutatja, mennyibe kerül, hogy egy potenciális ügyfél a weboldaladra vagy landing page-edre érkezzen. Az alacsonyabb CPC hatékonyabb hirdetési költséget jelent, de mindig a konverziós aránnyal együtt kell értékelni.', tip: 'Az alacsonyabb CPC hatékonyabb hirdetést jelent. A/B tesztelj különböző kreatívokat, célzásokat és ajánlatokat. A Spark Ads formátum (organikus tartalmak hirdetése) gyakran alacsonyabb CPC-t ér el, mert a felhasználók jobban bíznak benne. A szélesebb célzás is csökkentheti a CPC-t.' },
  ttads_cpm: { title: 'CPM', text: 'Cost Per Mille: 1000 megjelenésre jutó költség. Ez a márkaismeretségi kampányok hatékonyságának fő mutatója, és az iparági benchmark-okkal való összehasonlítás alapja. A CPM-et befolyásolja a célzás pontossága, a szezonalitás és a verseny az adott célközönségért.', tip: 'A szűkebb célzás magasabb CPM-et eredményez, de relevánsabb közönséget ér el. Tesztelj szélesebb célzást is — a TikTok algoritmusa gyakran hatékonyan találja meg a megfelelő közönséget. Ünnepi szezonban (karácsony, Black Friday) a CPM jelentősen emelkedhet.' },
  ttads_conv: { title: 'Konverziók', text: 'A hirdetés által generált konverziók (vásárlás, regisztráció, letöltés) száma. Ez a kampány végső sikermutatója — a konverziók számítanak igazán, nem az impressziók vagy kattintások. A konverzió-optimalizált kampányok automatikusan azoknak mutatják a hirdetést, akik nagyobb eséllyel konvertálnak.', tip: 'Győződj meg róla, hogy a TikTok Pixel helyesen van beállítva és minden konverziós eseményt nyomon követ. A konverzió javításához optimalizáld a landing page-et (gyors betöltés, egyszerű form, mobil-barát design). A remarketing kampányok segítenek visszahozni azokat, akik már érdeklődtek.' },
  ttads_cost_conv: { title: 'Költség/konverzió', text: 'Egy konverzióra jutó átlagos költség (CPA). Ez a hirdetési hatékonyság legfontosabb mutatója — megmutatja, mennyibe kerül egy tényleges vásárló vagy lead megszerzése. Az üzleti modelled szempontjából ez a szám határozza meg, hogy a hirdetés nyereséges-e.', tip: 'Ha a költség/konverzió emelkedik, vizsgáld felül a célzást, a kreatívot és a landing page-et. Próbáld meg szegmentálni a közönséget és azonosítani, mely szegmensek hozzák a legolcsóbb konverziókat. A Lookalike audience-ek a meglévő ügyfeleid alapján hatékonyan csökkenthetik a CPA-t.' },
  ttads_roas: { title: 'ROAS', text: 'Return On Ad Spend: a hirdetési költésre vetített bevétel. Ha a ROAS 3x, az azt jelenti, hogy minden elköltött 1 Ft-ra 3 Ft bevétel jut. Ez a végső profitabilitási mutató — a ROAS megmutatja, hogy a hirdetésed valóban pénzt termel-e a vállalkozásodnak.', tip: 'Az ideális ROAS iparágtól függ, de általában 3x vagy magasabb a cél. Ha a ROAS alacsony, optimalizáld a konverziós folyamatot: landing page, árazás, ajánlat. A legjobban teljesítő kreatívokat emeld ki és adj nekik több büdzsét, a gyengébbeket állítsd le.' },
  ttads_conv_rate: { title: 'Konverziós arány', text: 'A kattintásokból konverzióvá váló felhasználók százalékos aránya. Ez megmutatja, hogy a hirdetésedre kattintók közül mennyien hajtják végre a kívánt műveletet. Az alacsony konverziós arány a landing page vagy az ajánlat problémájára utalhat, nem feltétlenül a hirdetésére.', tip: 'A landing page optimalizálása közvetlenül javítja a konverziós arányt: legyen gyors, mobil-barát, egyszerű és meggyőző. A hirdetés üzenete és a landing page tartalma között legyen összhang. Az A/B tesztelés (különböző fejlécek, gombok, képek) segít megtalálni a legjobb kombinációt.' },
  ttads_spend_per_click: { title: 'Költés/kattintás', text: 'Az egy kattintásra jutó költség, amely megegyezik a CPC-vel, de más perspektívából vizsgálja a hirdetési hatékonyságot. Fontos nyomon követni, mert közvetlenül befolyásolja a kampány összes többi költségmutatóját (CPA, ROAS).', tip: 'A Spark Ads formátum (organikus tartalmak hirdetése) gyakran alacsonyabb kattintási költséget ér el, mert a felhasználók jobban bíznak az organikusnak tűnő tartalmakban. Kísérletezz különböző kreatív formátumokkal és célzási beállításokkal a költségek optimalizálásához.' },
  // Facebook Organic
  fb_followers: { title: 'Követők', text: 'A Facebook oldal aktuális követőinek teljes száma. A követők azok az emberek, akik úgy döntöttek, hogy rendszeresen látni akarják a tartalmaidat a hírfolyamukban. A követőszám a márka közösségi jelenlétének és hitelességének egyik alapmutatója, és közvetlenül befolyásolja az organikus elérést.', tip: 'Az aktív, elkötelezett közönség sokkal értékesebb a puszta számnál. Koncentrálj olyan tartalmakra, amelyek valódi értéket nyújtanak, és ösztönzik a közösség tagjait az interakcióra. A rendszeres, minőségi posztolás és az aktív közösségkezelés fenntarthatóbb növekedést eredményez.' },
  fb_reach: { title: 'Elérés', text: 'Az adott időszakban tartalmaidat látó egyedi felhasználók száma. Az organikus elérés Facebookon egyre nehezebb, mivel a platform erősen szűri, milyen tartalmak jelennek meg a hírfolyamban. A magas organikus elérés azt jelzi, hogy a tartalmaid valóban érdeklik a közönségedet.', tip: 'Az organikus elérés növeléséhez fontos a posztolási idő (amikor a közönséged aktív), a tartalom típusa (videó > kép > szöveg sorrend), és az interakciók generálása az első órában. A Facebook Groups és a személyes megosztások is jelentősen növelhetik az elérést.' },
  fb_impressions: { title: 'Impressziók', text: 'A tartalmaid összes megjelenési száma, beleértve a többszöri megjelenéseket is. Ha az impresszió/elérés arány magas (pl. 2x vagy több), az azt jelenti, hogy a tartalmad többször is megjelenik ugyanazoknak a felhasználóknak — ez a tartalom erős teljesítményét jelzi.', tip: 'Ha magas az impresszió az eléréshez képest, az pozitív jel — a Facebook újra és újra megmutatja a tartalmadat. A videó tartalmak és a carousel posztok általában magasabb impressziószámot érnek el. Figyeld meg, mely tartalomtípusok generálják a legtöbb ismételt megjelenést.' },
  fb_reactions: { title: 'Reakciók', text: 'Az összes Facebook reakció (like, love, haha, wow, sad, angry) havi összesítése. A reakciók az érzelmi elköteleződés jelei — a különböző reakciótípusok más-más érzelmi választ tükröznek. A „love" és „wow" reakciók különösen értékesek, mert mélyebb kötődést jeleznek.', tip: 'A „love" és „wow" reakciók erősebb algoritmikus jelzést adnak, mint az egyszerű like. Készíts érzelmileg rezonáló tartalmakat: inspiráló történetek, kulisszák mögötti pillanatok, személyes momentumok. A vizuálisan erős tartalmak (minőségi fotók, videók) több reakciót kapnak.' },
  fb_comments: { title: 'Kommentek', text: 'Az adott időszakban a posztjaidra érkezett kommentek száma. A kommentek a legmélyebb organikus engagement-formát jelentik Facebookon, és a Facebook algoritmusa kiemelt figyelmet fordít rájuk. A sok kommentet kapó posztok drámaian nagyobb elérést érnek el.', tip: 'A kommentszám növeléséhez kérdezz a posztjaid végén, ossz meg vitaindító véleményeket, és mindig válaszolj a beérkező kommentekre. A Facebook algoritmusa különösen a „meaningful interactions"-t díjazza — a hosszabb, tartalmas kommentek többet érnek az egyszerű emoji-reakcióknál.' },
  fb_shares: { title: 'Megosztások', text: 'A tartalmaid megosztásainak száma az adott időszakban. A megosztás a Facebook algoritmusának egyik legerősebb jelzése, mert a felhasználó saját hírfolyamára emeli a tartalmadat, ezzel új közönségekhez juttatva el. Egy megosztás sokszorosa lehet egy egyszerű like-nak az algoritmikus hatás szempontjából.', tip: 'Az érzelmileg erős (vicces, inspiráló, meglepő), a hasznos (praktikus tippek, útmutatók) és az aktuális tartalmak kapják a legtöbb megosztást. Gondolj arra: a közönséged miért osztaná meg a posztod a barátaival? A megosztásra ösztönző CTA-k is segíthetnek.' },
  fb_posts: { title: 'Posztok', text: 'Az adott hónapban közzétett posztok száma. A rendszeres és következetes posztolás kulcsfontosságú a Facebook organikus elérés fenntartásához. A posztolási frekvencia közvetlenül befolyásolja, milyen gyakran jelensz meg a követőid hírfolyamában.', tip: 'Heti 3-5 poszt az optimális frekvencia Facebookon — ennél kevesebb esetén az algoritmus „elfelejt", ennél több pedig túlzottan terhelheti a közönséget. Használj tartalomtervezőt és ütemezd előre a posztokat. Variáld a tartalom típusát: videó, kép, carousel, szöveges poszt.' },
  fb_new_follows: { title: 'Napi új követők', text: 'Az adott időszakban naponta szerzett új követők összesítése. Ez a mutató megmutatja, milyen ütemben növekszik a közönséged, és segít azonosítani, mely napok vagy tartalmak hozzák a legtöbb új követőt a Facebook oldal számára.', tip: 'A megosztható tartalmak és a más csatornákról (Instagram, TikTok, weboldal) történő keresztpromóció jó forrásai az új Facebook követőknek. A Facebook hirdetések „Page Like" kampánytípusa közvetlenül is növelheti a követőszámot, de az organikus növekedés fenntarthatóbb.' },
  fb_video_views: { title: 'Videó nézések', text: 'A videó tartalmak összes megtekintési száma az adott időszakban. A videó a Facebook leghatékonyabb tartalomtípusa az elérés és az engagement szempontjából. A Facebook algoritmusa kifejezetten előnyben részesíti a videó tartalmakat, különösen a natív (közvetlenül feltöltött) videókat.', tip: 'Mindig natív videókat tölts fel (ne YouTube linkeket), mert a Facebook algoritmusa a saját platformjára feltöltött videókat részesíti előnyben. A videók első 3 másodperce döntő — használj feliratot, mert a felhasználók nagy része hang nélkül nézi. A 1-3 perces videók teljesítenek a legjobban organikusan.' },
  fb_interactions_total: { title: 'Összes interakció', text: 'A reakciók, kommentek és megosztások havi összesítése egyetlen számban. Ez a tartalomstratégia átfogó hatékonysági mutatója — megmutatja, hogy összességében mennyire aktívan reagál a közönséged a tartalmaidra. A növekvő trend a tartalomstratégia sikerét jelzi.', tip: 'Az interakciók növekedéséhez azonosítsd a legjobban teljesítő tartalomtípusokat és készíts többet belőlük. A tartalom mix (videó, kép, carousel, kérdés) és a rendszeres közösségi interakció (kommentekre válaszolás) együttesen növelik az összes interakciót.' },
  fb_reaction_per_reach: { title: 'Reakció / elérés', text: 'A reakciók százalékos aránya az eléréshez képest. Ez megmutatja, hogy a tartalmadat látók mekkora hányada reagál érzelmileg. Magasabb arány jobb tartalmi minőséget és közönség-illeszkedést jelez, ami az algoritmus számára is fontos pozitív jelzés.', tip: '1% feletti reakció/elérés arány jó organikus teljesítményt jelez Facebookon. Ha ez alacsony, a tartalmad eléri ugyan az embereket, de nem rezonál eléggé — próbáld meg személyesebbé, érzelmesebbbé tenni a posztjaidat.' },
  fb_er: { title: 'Engagement Rate', text: 'Az összes interakció aránya az eléréshez képest százalékban. Ez a Facebook tartalomteljesítmény legátfogóbb mutatója, amely megmutatja, mennyire aktívan reagál a közönség a tartalmaidra. A magas ER azt jelzi, hogy a tartalmaid valóban érdeklik és bevonják a követőidet.', tip: 'Facebookon az 1-3% közötti ER normális, 3% felett kiváló teljesítményt jelent. Az ER javításához kérdéseket, szavazásokat, vitaindító tartalmakat és személyes történeteket érdemes megosztani. A kisebb, de aktív közönség jobb ER-t produkál, mint a nagy, passzív követőtábor.' },
  fb_avg_reach_post: { title: 'Átl. elérés/poszt', text: 'Az egy posztra jutó átlagos elérés, amely megmutatja, hány egyedi felhasználóhoz jut el átlagosan egy-egy tartalmad. Ez az organikus tartalomstratégia hatékonyságának egyik legfontosabb mutatója — ha csökken, a tartalom típusán vagy a posztolási stratégián érdemes változtatni.', tip: 'A videók és carousel posztok általában szélesebb elérést érnek el, mint a statikus képek vagy szöveges posztok. Posztolj akkor, amikor a közönséged a legaktívabb (a Facebook Insights mutatja az optimális időpontokat). A korai interakciók (az első 1-2 órában) drámaian befolyásolják a poszt elérését.' },
  fb_avg_reactions_post: { title: 'Átl. reakció/poszt', text: 'Az egy posztra jutó átlagos reakciószám. Ez megmutatja, hogy a tartalmaid általánosságban mennyire váltanak ki érzelmi reakciót a közönségből. A stabil vagy növekvő átlag jó tartalomstratégiát jelez.', tip: 'A személyes, emberi tartalmak (csapatfotók, kulisszák mögötti pillanatok, ügyféltörténetek) jellemzően több reakciót kapnak, mint a „corporate" jellegű posztok. Próbálj ki különböző tartalomtípusokat és figyeld, melyik hozza a legtöbb reakciót.' },
  fb_avg_comments_post: { title: 'Átl. komment/poszt', text: 'Az egy posztra jutó átlagos kommentszám. A magas kommentátlag azt jelzi, hogy a tartalmaid rendszeresen párbeszédre ösztönzik a közönségedet, ami a Facebook algoritmusának egyik legfontosabb pozitív jelzése.', tip: 'Kérdés a poszt végén drasztikusan növeli a kommentszámot. Próbáld ki a „melyiket választanád?" vagy „egyetértesz?" típusú záró kérdéseket. A kommentekre adott válaszok is növelik a poszt összesített kommentszámát és az elérését.' },
  fb_avg_shares_post: { title: 'Átl. megosztás/poszt', text: 'Az egy posztra jutó átlagos megosztásszám. Ez a tartalom virális potenciáljának mutatója — a magas megosztási átlag azt jelzi, hogy a tartalmaid rendszeresen olyan értéket adnak, amit a követőid meg akarnak osztani a saját ismerőseikkel.', tip: 'Listák, infografikák, praktikus tippek és checklisták kapják a legtöbb megosztást Facebookon. Gondolj a tartalomra úgy, mint egy „ajándékra", amit a közönséged szívesen továbbad — hasznos, szórakoztató vagy érzelmileg erős tartalom kell legyen.' },
  fb_engaged_users: { title: 'Elkötelezett felhasználók', text: 'Az oldalon bármilyen interakciót (kattintás, reakció, komment, megosztás) végző egyedi felhasználók száma. Ez az egyik legfontosabb Facebook metrika, mert a tényleges, aktív közönség méretét mutatja — nem a passzív követők számát, hanem azokét, akik ténylegesen foglalkoznak a tartalmaddal.', tip: 'Az elkötelezett felhasználók számának növeléséhez rendszeresen válaszolj a kommentekre, tegyél fel kérdéseket, és készíts interaktív tartalmakat (szavazások, kvízek). A Facebook Groups használata is növeli az engaged user-ek számát. Célozd meg a hirdetéseidet az elkötelezett felhasználókra (Engagement Custom Audience).' },
  fb_page_views: { title: 'Oldal megtekintések', text: 'A Facebook oldal összesen hányszor lett megtekintve az adott időszakban. Ez megmutatja, hogy az emberek aktívan felkeresik az oldalad, nem csak a hírfolyamban találkoznak a tartalmaiddal. A magas oldalmegtekintés-szám a márka iránti közvetlen érdeklődést jelzi.', tip: 'Egy jól kitöltött „About" szekció, rendszeres posztolás és vonzó borítókép növeli az oldalmegtekintéseket. A más platformokról (Instagram, weboldal, email) történő hivatkozás a Facebook oldalra szintén növeli a forgalmat.' },
  fb_avg_clicks_post: { title: 'Átl. kattintás/poszt', text: 'Az egy posztra jutó átlagos kattintásszám (beleértve a link kattintásokat, fotó nagyítást, „tovább olvasás" kattintásokat). Ez megmutatja, hogy a tartalmaid mennyire ösztönzik a közönséget a további felfedezésre és interakcióra.', tip: 'A link posztok, a curiosity gap-et kihasználó szövegek és az erős CTA-k növelik a kattintásszámot. A poszt képe vagy thumbnail-je kulcsfontosságú — ez dönti el, hogy a felhasználó megáll-e a hírfolyamban. Tesztelj különböző CTA-kat: „Tudj meg többet", „Kattints a részletekért", „Nézd meg most".' },
  // Instagram Organic
  ig_followers: { title: 'Követők', text: 'Az Instagram fiók aktuális összes követőinek száma. A követőszám a márka közösségi jelenlétének és megbízhatóságának egyik alapmutatója. Az Instagramon különösen fontos a hiteles, organikus növekedés, mivel a vásárolt követők rontják az engagement rate-et és az algoritmus is büntethetik.', tip: 'A hiteles tartalom és aktív közösségépítés fenntarthatóbb növekedést eredményez, mint bármilyen gyors megoldás. Koncentrálj a Reels tartalmakra az új közönség eléréséhez, a carousel posztokra az oktatáshoz, és a Story-kra a közösség fenntartásához. A Collaboration posztok és a keresztpromóció más platformokkal gyorsítja a növekedést.' },
  ig_reach_kpi: { title: 'Elérés', text: 'Az adott időszakban tartalmaidat látó egyedi felhasználók száma. Az elérés megmutatja, mennyire hatékonyan jut el a tartalmad a célközönségedhez, beleértve a meglévő követőket és az Explore/Reels fülön keresztül elért új felhasználókat is.', tip: 'A Reels formátum drámaian szélesebb elérést biztosít, mint a statikus posztok, mert a Reels fülön és az Explore-on is megjelenik. A hashtagek stratégiai használata (mix a nagy és niche hashtagekből) és a posztolási idő optimalizálása is növeli az elérést. Figyelj a tartalom minőségére — az algoritmus a jó minőségű, eredeti tartalmakat részesíti előnyben.' },
  ig_impressions: { title: 'Impressziók', text: 'A tartalmaid összes megjelenési száma, beleértve a többszöri megjelenéseket. Ha az impresszió jóval magasabb az elérésnél, az azt jelenti, hogy a tartalmad többször is megjelenik a felhasználóknak — ez pozitív jel, amely a tartalom erős teljesítményét mutatja az algoritmus szemében.', tip: 'Magas impresszió alacsony elérés mellett = a tartalmad többször megjelenik a meglévő közönségednek, de kevés új embert ér el. Ilyenkor érdemes több Reels-t posztolni és változatosabb hashtageket használni az új közönség elérése érdekében.' },
  ig_likes: { title: 'Like-ok', text: 'Az adott időszakban az összes tartalmadra kapott like-ok összesítése. Bár az Instagram elrejti a like-számot másoktól, ez továbbra is fontos engagement mutató, amely az algoritmus számára jelzi a tartalom népszerűségét és relevianciáját.', tip: 'A vizuálisan erős, esztétikusan konzisztens tartalmak kapják a legtöbb like-ot Instagramon. Koncentrálj a minőségi fotózásra, egységes szűrőhasználatra és vonzó kompozícióra. A Reels tartalmak általában magasabb like-számot érnek el, mint a statikus posztok.' },
  ig_comments: { title: 'Kommentek', text: 'Az adott időszakban a tartalmaidra érkezett kommentek összesített száma. A kommentek az engagement legerősebb formája Instagramon, és az algoritmus kiemelt figyelmet fordít rájuk — különösen a hosszabb, tartalmas kommentekre, amelyek valódi párbeszédet jeleznek.', tip: 'Hosszabb caption-ok kérdéssel a végén jelentősen növelik a kommentelési kedvet. Próbáld ki a „Te mit tennél?" vagy „Egyetértesz?" típusú záró kérdéseket. A kommentekre mindig válaszolj — ez további interakciókat generál, és az algoritmus is pozitívan értékeli a beszélgetéseket.' },
  ig_shares: { title: 'Megosztások', text: 'A tartalmaid DM-ben vagy Story-ban történő megosztásainak száma. A megosztás az Instagram algoritmusának egyik legerősebb jelzése, mert a felhasználó aktívan ajánlja a tartalmadat másoknak. A DM-ben megosztott tartalmak különösen értékesek az algoritmus szempontjából.', tip: 'A mémek, relatable tartalmak, hasznos tippek és a „küld el annak, akire ez igaz" típusú tartalmak kapják a legtöbb megosztást. A DM-ben megosztott tartalmak is erős algoritmikus jelzések — gondolj arra, hogy ki és miért küldené el a posztod egy barátjának.' },
  ig_saves: { title: 'Mentések', text: 'A tartalmaid mentéseinek száma az adott időszakban. A mentés az Instagram egyik legértékesebb interakciója, mert azt jelzi, hogy a felhasználó annyira hasznosnak találta a tartalmat, hogy később is vissza akar térni hozzá. Az algoritmus kiemelt súllyal kezeli a mentéseket az elérés-elosztásnál.', tip: 'Oktatási tartalmak (tippek, útmutatók, checklisták), inspiráló idézetek és „mentsd el későbbre" típusú carousel posztok kapják a legtöbb mentést. Használj CTA-t a captionban: „Mentsd el, ha hasznos volt!" A carousel formátum különösen hatékony a mentések generálásához.' },
  ig_profile_views: { title: 'Profilnézetek', text: 'Az adott időszakban a profilodat felkereső felhasználók száma. Ez megmutatja, hogy a tartalmaid mennyire keltik fel az érdeklődést — ha valaki a profilodat nézi, az azt jelenti, hogy többet akar megtudni rólad, és potenciálisan követővé válhat.', tip: 'A kiemelt Story-k (Highlights), a letisztult bio és az egységes vizuális arculat növelik a profillátogatásból eredő követővé válás esélyét. Használj link-in-bio eszközöket, és utalj rájuk a tartalmaidban. A Reels videók végén megjelenő profilkép is ide irányítja a nézőket.' },
  ig_media_count: { title: 'Tartalmak', text: 'Az adott időszakban közzétett tartalmak (posztok, Reels, carousel) száma. A rendszeres posztolás kulcsfontosságú az Instagram algoritmusa szempontjából, mert az aktív fiókokat részesíti előnyben az elérés-elosztásnál.', tip: 'A mix tartalom stratégia (Reels + carousel + statikus posztok + Story-k) a leghatékonyabb. Heti 4-7 feed poszt és napi Story-k az ideális frekvencia. A Reels az új közönség eléréséhez, a carousel az oktatáshoz, a Story-k a közösség fenntartásához a legalkalmasabbak.' },
  ig_new_followers: { title: 'Napi új követők', text: 'Az időszakban szerzett napi új követők összesítése. Ez a növekedési dinamika legfontosabb mutatója — megmutatja, milyen ütemben bővül a közönséged, és segít azonosítani, mely tartalmak vagy kampányok hozzák a legtöbb új követőt.', tip: 'A Reels tartalmak és a Collaboration posztok a legjobb módszerek az új követők szerzéséhez, mert ezek jutnak el a legnagyobb új közönséghez. A konzisztens vizuális arculat és a niche-specifikus hashtagek is segítik az organikus növekedést. Figyeld meg, melyik tartalomtípus hozza a legtöbb új követőt.' },
  ig_save_rate_kpi: { title: 'Mentési arány', text: 'A mentések százalékos aránya az eléréshez képest. Ez az egyik legmegbízhatóbb tartalomminőségi mutató, mert megmutatja, hogy az elérésed mekkora hányada tartja annyira értékesnek a tartalmadat, hogy elmentse. Az algoritmus kiemelt figyelmet fordít erre a mutatóra.', tip: '2-3% feletti mentési arány kiváló eredménynek számít Instagramon. A mentési arány növeléséhez készíts „reference" típusú tartalmakat (checklisták, tippgyűjtemények, step-by-step útmutatók), amelyekhez a követők vissza akarnak térni. A carousel formátum jellemzően magasabb mentési arányt ér el.' },
  ig_story_reach: { title: 'Story elérés', text: 'Az Instagram Story-k összesített elérése az adott időszakban. A Story-k fontos szerepet játszanak a közönség fenntartásában és az interakció ösztönzésében, bár jellemzően kisebb elérést generálnak, mint a feed posztok. A Story elérés mutatja, mennyire követik aktívan a mindennapi tartalmaidat.', tip: 'A rendszeres (napi 3-5) Story használat fenntartja az érdeklődést és az algoritmus is előnyben részesíti az aktív fiókokat. Használj interaktív elemeket: szavazásokat, kérdésdobozt, kvízeket, visszaszámlálókat. A Story-k kulisszák mögötti tartalmakhoz, gyors frissítésekhez és közönség-bevonáshoz ideálisak.' },
  ig_interactions_total: { title: 'Összes interakció', text: 'A like-ok, kommentek, megosztások és mentések havi összesítése egyetlen számban. Ez a tartalomstratégia átfogó hatékonysági mutatója Instagramon. Fontos kiemelni, hogy az algoritmus nem egyformán súlyozza ezeket — a mentések és megosztások nagyobb hatással vannak az elérésre, mint a like-ok.', tip: 'A mentés és megosztás nagyobb súllyal esik latba az algoritmusnál, mint az egyszerű like. Ezért a tartalomstratégiát érdemes úgy alakítani, hogy a „mentsd el" és „küldd el" típusú interakciókat ösztönözze — oktatási, hasznos és relatable tartalmakkal.' },
  ig_like_per_reach: { title: 'Like / elérés', text: 'A like-ok százalékos aránya az eléréshez képest. Ez megmutatja, hogy a tartalmadat látók mekkora hányada reagál like-kal, ami a tartalom általános vonzerejének és a közönség-illeszkedésnek az egyik fő mutatója.', tip: '3-5% feletti arány jó teljesítményt jelez Instagramon. Ha ez az arány alacsony, a tartalmad eléri az embereket, de nem rezonál eléggé. Próbáld javítani a vizuális minőséget, az érzelmi kötődést vagy a tartalom relevanciáját a célközönség számára.' },
  ig_er: { title: 'Engagement Rate', text: 'Az összes interakció (like + komment + megosztás + mentés) aránya az eléréshez képest. Ez az Instagram tartalomteljesítmény legfontosabb összesítő mutatója, amely megmutatja, mennyire aktívan reagál a közönség a tartalmaidra összességében.', tip: 'Instagramon a 3-6% közötti ER jónak számít, 6% felett kiválónak. Az ER javításához koncentrálj az interakcióra ösztönző tartalmakra: kérdések, szavazások, carousel tippek, és relatable Reels-ek. A kisebb, de aktív közönség jobb ER-t produkál, mint a nagy, passzív követőtábor.' },
  ig_avg_reach_media: { title: 'Átl. elérés/tartalom', text: 'Az egy tartalomra jutó átlagos elérés. Ez megmutatja, hogy egy-egy posztod átlagosan hány egyedi felhasználóhoz jut el. Ha ez az érték csökkenő tendenciát mutat, az a tartalomstratégia felülvizsgálatát teszi szükségessé.', tip: 'Ha csökken az átlagos elérés, próbálj meg több Reels-t posztolni — ezek jellemzően 2-5x szélesebb elérést generálnak, mint a statikus posztok. A hashtagek optimalizálása és a posztolási idő finomhangolása szintén jelentősen javíthatja az elérést.' },
  ig_avg_likes_media: { title: 'Átl. like/tartalom', text: 'Az egy tartalomra jutó átlagos like szám. Ez a tartalmaid átlagos vonzerejét mutatja, és segít azonosítani, milyen típusú tartalmak teljesítenek az átlag felett vagy alatt.', tip: 'Az esztétikusan konzisztens vizuális arculat és a magas képminőség növeli a like-ok számát. Elemezd a legjobban teljesítő tartalmaidat: milyen stílus, téma és formátum hozza a legtöbb like-ot? Készíts több tartalmat a bevált formátumokból.' },
  ig_avg_comments_media: { title: 'Átl. komment/tartalom', text: 'Az egy tartalomra jutó átlagos kommentszám. A magas átlagos kommentszám azt jelzi, hogy a tartalmaid rendszeresen párbeszédre ösztönzik a közönséget, ami az algoritmus egyik legfontosabb pozitív jelzése.', tip: 'A személyes történetek, kulisszák mögötti tartalmak és a nyitott kérdések a legjobb komment-generátorok. Készíts „caption CTA"-kat: „Melyik a kedvenced?" vagy „Mesélj a tapasztalatodról!" A kommentekre adott válaszok is növelik az összesített kommentszámot.' },
  ig_avg_saves_media: { title: 'Átl. mentés/tartalom', text: 'Az egy tartalomra jutó átlagos mentésszám. A mentés az egyik legértékesebb interakció az algoritmus szempontjából, ezért ez a mutató kulcsfontosságú a tartalomstratégia finomhangolásához. A magas mentésátlag az oktatási és értékadó tartalmak jellemzője.', tip: 'Carousel tippek, checklisták, step-by-step útmutatók és infografikák maximalizálják a mentéseket. Gondolj arra: a célközönséged mire szeretne visszatérni később? Ezeket a tartalmakat érdemes rendszeresen gyártani, mert az algoritmus is kiemelt helyen jeleníti meg őket.' },
  ig_avg_shares_media: { title: 'Átl. megosztás/tartalom', text: 'Az egy tartalomra jutó átlagos megosztásszám (DM és Story megosztás). A megosztás a tartalom virális potenciáljának mutatója, és az algoritmus az egyik legerősebb pozitív jelzésként értékeli.', tip: 'A relatable mémek, idézetek, és a „küld el annak, akire ez igaz" típusú tartalmak kapják a legtöbb DM-megosztást. A hasznos, „mentsd el és oszd meg" jellegű carousel posztok szintén magas megosztási számot érhetnek el. Gondolj arra, hogy a közönséged kinek és miért küldené el a posztod.' },
  // IG Public
  igpub_likes: { title: 'Like-ok', text: 'A nyilvánosan elérhető like-ok száma az elemzett fiók tartalmain. A publikus like-adatok jó alapot nyújtanak a versenytárs-elemzéshez és az iparági benchmark-ok felállításához, bár a teljes kép érdekében a privát metrikák (elérés, mentés) is fontosak lennének.', tip: 'A publikus like-adatok jó kiindulópontot jelentenek, de a pontos, részletes elemzéshez Instagram Business fiók és a hozzáférés engedélyezése szükséges. Hasonlítsd össze a versenytársak like-számát a sajátoddal, és figyeld meg, milyen tartalomtípusok kapják a legtöbb interakciót.' },
  igpub_comments: { title: 'Kommentek', text: 'A nyilvánosan látható kommentek száma az elemzett fiók tartalmain. A kommentek mennyisége mellett érdemes a kommentek minőségét és hangulatát is vizsgálni — a pozitív, tartalmas kommentek erős közösséget jeleznek, míg a negatív vagy spam kommentek problémát jelezhetnek.', tip: 'A kommentek hangulata és mélysége is fontos, nem csak a szám. Elemezd, milyen kérdéseket tesznek fel a követők a kommentekben — ezek jó tartalomötletek lehetnek számodra is. A versenytársak komment-szekciója értékes piackutatási forrás.' },
  igpub_avg_likes: { title: 'Átl. like/poszt', text: 'Az elemzett fiók egy posztjára jutó átlagos like szám. Ez jó benchmark a saját tartalmaid tervezéséhez és az iparági átlagok összehasonlításához. Az átlagtól való eltérések (kiugróan magas vagy alacsony like-ok) segítenek azonosítani a sikeres tartalomformátumokat.', tip: 'Használd ezt az értéket benchmark-ként a saját tartalmaid tervezéséhez. Figyeld meg, mely típusú tartalmak kapnak az átlagnál jóval több like-ot, és adaptáld a bevált formátumokat a saját stratégiádba. Az iparági átlag ismerete reális elvárásokat állít.' },
  igpub_avg_comments: { title: 'Átl. komment/poszt', text: 'Az elemzett fiók egy posztjára jutó átlagos kommentszám. A magas kommentátlag aktív, elkötelezett közösséget jelez. A kommentek mélysége és témái is fontosak — a tartalmas, kérdező kommentek értékesebbek az emoji-válaszoknál.', tip: 'A kommentek mélysége és tartalma is fontos mutató, nem csak a mennyiség. Vizsgáld meg, milyen kérdéseket tesznek fel a versenytárs követői — ezekből tartalomötleteket meríthetsz. A magas kommentátlag általában jó közösségmenedzsmentet és interaktív tartalomstratégiát jelez.' },
  igpub_media: { title: 'Tartalmak', text: 'Az elemzett fiók által az adott időszakban közzétett tartalmak száma. Ez megmutatja a versenytárs posztolási frekvenciáját és tartalmi aktivitását. A rendszeresség és a konzisztencia az Instagram sikertényezőinek egyike.', tip: 'A rendszeresség fontosabb, mint a mennyiség — jobb heti 3-4 jó minőségű posztot feltölteni, mint naponta gyenge tartalmakat. Figyeld meg a versenytárs posztolási frekvenciáját és formátum-mixét, és vond le a tanulságokat a saját stratégiádhoz.' },
  igpub_interactions: { title: 'Összes interakció', text: 'A like-ok és kommentek összesítése (a publikusan elérhető interakciók). Ez átfogó képet ad a fiók tartalmi teljesítményéről, bár a privát metrikák (mentések, megosztások) nélkül nem teljes a kép. A versenytárs-összehasonlításhoz ez a legjobb publikusan elérhető mutató.', tip: 'A publikus interakció-adatok kiváló alapot nyújtanak a versenytárs-elemzéshez. Hasonlítsd össze a saját interakcióidat a hasonló méretű fiókokéval, és azonosítsd a fejlődési területeket. Ne feledd: a nem-publikus metrikák (mentés, megosztás) is nagyon fontosak.' },
  igpub_avg_interaction: { title: 'Átl. interakció/poszt', text: 'Az elemzett fiók egy posztjára jutó átlagos interakciószám (like + komment). Ez a legmegbízhatóbb publikusan elérhető tartalomteljesítmény-mutató, amely lehetővé teszi a különböző fiókok összehasonlítását méretfüggetlenül.', tip: 'Hasonlítsd össze az iparági átlaggal és a hasonló méretű versenytársakkal. Ha az átlagos interakció jóval az iparági átlag alatt van, a tartalomstratégia felülvizsgálata szükséges. Az átlag feletti teljesítmény esetén elemezd, mi teszi sikeressé a tartalmat.' },
  igpub_followers: { title: 'Követők', text: 'Az elemzett fiók aktuális követőinek száma a publikus adatok alapján. A követőszám önmagában nem mond el mindent — a valódi érték az elköteleződésben (engagement) rejlik. Egy 10K-s fiók erős engagement-tel értékesebb, mint egy 100K-s fiók gyenge interakciókkal.', tip: 'A követőszám és az engagement rate együttes vizsgálata adja a legjobb képet. A magas követőszám alacsony ER-rel vásárolt követőkre vagy inaktív közönségre utalhat. A valódi, organikus növekedés lassabb, de fenntarthatóbb és értékesebb hosszú távon.' },
  igpub_er: { title: 'Engagement rate%', text: 'Az összes interakció (like + komment) százalékos aránya a követőszámhoz képest. Ez a leggyakrabban használt Instagram teljesítménymutató a versenytárs-elemzésben, mert méretfüggetlenül összehasonlíthatóvá teszi a fiókokat. Magasabb ER aktívabb, elkötelezetebb közösséget jelez.', tip: '3-6% közötti ER jónak számít Instagramon. A kisebb fiókok (10K alatt) jellemzően magasabb ER-t produkálnak. Ha a versenytárs ER-je jóval az átlag felett van, vizsgáld meg a tartalmait és a közösségkezelési stratégiáját — tanulhatsz belőle.' },
  // YouTube
  yt_subs: { title: 'Új feliratkozók', text: 'Az adott időszakban szerzett új feliratkozók száma. A feliratkozók a csatorna legértékesebb közönsége, mert ők kapnak értesítést az új videókról és jellemzően magasabb interakciós arányt mutatnak. A stabil feliratkozó-növekedés a csatorna egészségének jele.', tip: 'A videó végén használj feliratkozási CTA-t és End Screen elemeket. A „Csengő ikon" bekapcsolására való emlékeztetés is hatékony. A sorozat-tartalmak (epizódok) különösen ösztönzik a feliratkozást, mert a nézők nem akarnak lemaradni a folytatásról.' },
  yt_views_kpi: { title: 'Megtekintések', text: 'Az összes videómegtekintés az adott időszakban. A megtekintések a YouTube egyik legfontosabb mutatója, amely közvetlenül befolyásolja a csatorna bevételét és az algoritmus általi ajánlás esélyét. Egy megtekintés akkor számít, ha a néző legalább 30 másodpercig nézte a videót.', tip: 'A megtekintések legfontosabb hajtóereje az optimális cím és thumbnail — ezek döntenek arról, hogy a néző rákattint-e a videóra. Készíts figyelemfelkeltő, de nem megtévesztő thumbnaileket. A SEO (keresőoptimalizálás) és a kulcsszavak a leírásban és a címben szintén növelik a megtekintéseket.' },
  yt_watch: { title: 'Nézési idő', text: 'Az összes nézési idő percben, ami a YouTube algoritmusa szempontjából a legfontosabb rangsorolási tényező. A magas nézési idő azt jelzi a YouTube-nak, hogy a tartalmad értékes és érdemes ajánlani más felhasználóknak. A nézési idő közvetlenül befolyásolja a keresési pozíciót és az ajánlott videók közé kerülés esélyét.', tip: 'A hosszabb (8-15 perces) videók általában több összesített nézési időt hoznak, de csak akkor, ha a tartalom végig leköti a nézőt. Használj Chapters-t (fejezeteket) a navigálás megkönnyítésére. A sorozat-videók és a lejátszási listák növelik a session watch time-ot, ami szintén fontos rangsorolási tényező.' },
  yt_likes_kpi: { title: 'Like-ok', text: 'A videóidra kapott like-ok havi összesítése. A like az egyik legegyszerűbb engagement-forma YouTube-on, és fontos pozitív jelzés az algoritmus számára. A like/dislike arány is releváns — a pozitív arány azt jelzi, hogy a tartalom tetszik a közönségnek.', tip: 'Kérd meg a nézőket a videó közben, hogy nyomjanak like-ot — ez egyszerű, de hatékony CTA. Az érzelmileg rezonáló momentumok (meglepetés, humor, tanulság) után a nézők hajlamosabbak like-olni. Ne a videó legelején kérd, hanem miután már értéket adtál a nézőnek.' },
  yt_comments_kpi: { title: 'Kommentek', text: 'Az összes komment az adott időszakban. A kommentek a YouTube engagement legértékesebb formája, mert aktív részvételt igényelnek és hosszabb időre a videónál tartják a nézőt. Az algoritmus kiemelt figyelmet fordít a kommentekre — a sok kommentet kapó videók többet jelennek meg az ajánlottakban.', tip: 'A Pinned Comment (kitűzött komment) segít irányítani a beszélgetést — tegyél fel kérdést vagy adj hozzá kontextust. A Creator Heart funkció ösztönzi a kommentálást, mert a nézők értékelik a személyes interakciót. Válaszolj rendszeresen a kommentekre, különösen az első órákban a feltöltés után.' },
  yt_shares_kpi: { title: 'Megosztások', text: 'A videóid megosztásainak száma (közösségi médiára, emailen, üzenetben). A megosztás azt jelzi, hogy a néző annyira értékesnek találta a tartalmat, hogy mások számára is ajánlja. Ez az algoritmus egyik legerősebb pozitív jelzése, és exponenciálisan növelheti a videó elérését.', tip: 'A megosztható tartalmak (hasznos tippek, hogyan kell útmutatók, meglepő tények, szórakoztató összeállítások) terjednek a legjobban. Gondolj a videóidra úgy, mint amit a néződ szívesen elküldene egy barátjának, mert hasznos, vicces vagy meglepő. A videó végén is kérhetsz megosztást CTA-ként.' },
  yt_er: { title: 'ER%', text: 'Engagement Rate százalékban: az interakciók (like, komment, megosztás) összegének aránya a megtekintésekhez képest. Ez a tartalomminőség egyik legmegbízhatóbb mutatója YouTube-on, mert nem a mennyiséget, hanem a közönség aktivitását méri a tartalom iránt.', tip: 'YouTube-on a 4-6% közötti ER jónak számít, 8% felett kiválónak. Az ER javításához koncentrálj az interakcióra ösztönző tartalmakra: kérdések, szavazások a Community tab-on, és aktív válaszadás a kommentekre. A videó közben elhelyezett CTA-k (like, komment, feliratkozás) is növelik az ER-t.' },
  yt_video_count: { title: 'Videók', text: 'Az adott hónapban feltöltött videók száma. A rendszeres és kiszámítható feltöltési ütemezés kulcsfontosságú a YouTube-on, mert az algoritmus előnyben részesíti az aktív csatornákat, és a nézők is elvárják a rendszerességet.', tip: 'Heti 1-2 videó rendszeres posztolása az ideális YouTube-on. Fontosabb a rendszeresség, mint a mennyiség — a nézők és az algoritmus is jutalmazza a kiszámítható feltöltési ütemezést. Használj tartalomtervezőt, és készíts előre 2-3 hetes tartalmat, hogy ne legyen kiesés.' },
  yt_avg_view: { title: 'Átl. nézési %', text: 'A nézők a videó hány százalékát nézték meg átlagosan. Ez a YouTube algoritmusának egyik legfontosabb mutatója — a magas nézési százalék azt jelzi, hogy a tartalom végig leköti a figyelmet, ami drámaian növeli az ajánlásba kerülés esélyét.', tip: '50% felett kiváló eredmény! A nézési százalék javításához használj erős hookot a videó elején (az első 30 másodperc döntő), dinamikus szerkesztést, és kerüld a lassú, üres részeket. A Chapters funkció segíti a nézőket a navigálásban. Elemezd a YouTube Analytics „Audience Retention" grafikonját, hogy lásd, hol veszted el a nézőket.' },
  yt_playlist: { title: 'Playlist hozzáadás', text: 'Hányszor adták hozzá a videóidat lejátszási listákhoz. Ez erős jelzés a tartalom hosszú távú értékéről — ha valaki lejátszási listára teszi a videódat, az azt jelenti, hogy későbbi visszanézésre is alkalmasnak tartja. A playlistek növelik a nézési időt is.', tip: 'Hozz létre saját tematikus lejátszási listákat, és irányítsd a nézőket ezekre — ez növeli a session watch time-ot. A videók végén ajánlj a témához kapcsolódó saját videókat. Az oktatási és sorozat-jellegű tartalmak kerülnek leggyakrabban lejátszási listákra.' },
  yt_like_per_view: { title: 'Like / megtekintés', text: 'A like-ok százalékos aránya a megtekintésekhez képest. Ez megmutatja, hogy a videóidat megnézők mekkora hányada értékeli pozitívan a tartalmat. A magas arány jó tartalmi minőséget és közönség-illeszkedést jelez.', tip: '4-5% feletti arány kiváló YouTube-on. Ha az arány alacsony, a tartalom eléri a nézőket, de nem rezonál eléggé. Próbáld javítani a tartalom minőségét, a témaválasztást és az előadásmódot. A CTA (kérd a like-ot a videóban) is növeli ezt az arányt.' },
  yt_comment_per_view: { title: 'Komment / megtekintés', text: 'A kommentek százalékos aránya a megtekintésekhez képest. Ez a mélyebb engagement mutatója, mert a kommentálás sokkal nagyobb elköteleződést igényel. A magas arány azt jelzi, hogy a tartalmad aktív vitát és párbeszédet generál.', tip: 'A kérdésfeltevő szekciók a videóban növelik ezt az arányt. Próbálj ki „mi a véleményed?" típusú záró kérdéseket, vagy kérj tapasztalati beszámolókat a nézőktől. A kontroverz (de nem sértő) témák és a személyes történetek is ösztönzik a kommentálást.' },
  yt_interactions_total: { title: 'Összes interakció', text: 'A like-ok, kommentek és megosztások havi összesítése. Ez a csatorna teljes interakciós aktivitásának átfogó mutatója, amely megmutatja, mennyire aktívan foglalkozik a közönség a tartalmakkal összességében.', tip: 'A magas interakció jelzi, hogy a tartalom valóban rezonál a közönséggel. Az interakciók növeléséhez kombináld a különböző stratégiákat: CTA a like-hoz, kérdések a kommentekhez, és értékes tartalom a megosztásokhoz. A Community tab posztok is növelik az összesített interakciókat.' },
  yt_avg_views_video: { title: 'Átl. megtekintés/videó', text: 'Az egy videóra jutó átlagos megtekintésszám. Ez megmutatja, hogy a videóid általánosságban mekkora közönséghez jutnak el. Ha ez az érték csökkenő tendenciát mutat, érdemes felülvizsgálni a tartalomstratégiát, a thumbnail-eket és a címeket.', tip: 'Ha ez az érték csökken, vizsgáld felül a thumbnail-eket és címeket — ezek döntik el, hogy a néző rákattint-e a videóra. A YouTube Analytics „Impressions Click-Through Rate" mutatója megmutatja, mennyire hatékonyak a thumbnail-jeid. Kísérletezz A/B teszteléssel a thumbnail-eken.' },
  yt_avg_likes_video: { title: 'Átl. like/videó', text: 'Az egy videóra jutó átlagos like szám. Ez a tartalmaid átlagos vonzerejét mutatja, és segít azonosítani, milyen típusú videók teljesítenek az átlag felett. A stabil vagy növekvő átlag jó tartalomstratégiát jelez.', tip: 'Az érzelmileg erős tartalmak (inspiráció, humor, meglepetés, tanulság) általában több like-ot kapnak. Elemezd a legjobban teljesítő videóidat: milyen téma, stílus és formátum hozza a legtöbb like-ot? Készíts több tartalmat a bevált formátumokból.' },
  yt_avg_comments_video: { title: 'Átl. komment/videó', text: 'Az egy videóra jutó átlagos kommentszám. A magas átlag aktív, elkötelezett közösséget jelez, ami a YouTube algoritmusának is fontos pozitív jelzés. A kommentek segítenek megérteni a közönség igényeit és visszajelzéseit.', tip: 'Az értékes diskurzus a cél — a tartalmas kommentek többet érnek az egyszerű „szuper videó" válaszoknál. Tegyél fel nyitott kérdéseket, kérj véleményt és tapasztalatot, és válaszolj a kommentekre rendszeresen. A Community tab is jó hely a közönség bevonására.' },
  yt_avg_watch_time_video: { title: 'Átl. nézési idő/videó', text: 'Az egy videóra jutó átlagos nézési idő percben. Ez a tartalmaid „ragadósságát" mutatja — minél hosszabb az átlagos nézési idő, annál jobban le tudod kötni a nézők figyelmét, ami közvetlenül javítja az algoritmikus pozíciódat.', tip: 'A Chapters (fejezetek) hozzáadása segít a nézőknek a navigálásban és növeli a nézési időt. A videó elejei hook (meglepő kijelentés, teaser), a dinamikus szerkesztés és a feszültség fenntartása mind hozzájárulnak a hosszabb nézési időhöz. Elemezd a retention-görbét az Analytics-ben.' },
  yt_avg_er_video: { title: 'Átl. ER%/videó', text: 'Az egyes videók átlagos engagement rate-je. Ez a tartalomminőség legmegbízhatóbb videó-szintű mutatója, mert megmutatja, hogy a megtekintésekhez képest milyen arányban lépnek interakcióba a nézők a tartalommal.', tip: 'Az interaktív elemek (Cards, End Screens, Polls a Community tab-on) növelik a videónkénti ER-t. A CTA-k stratégiai elhelyezése (a videó közepén és végén, nem az elején) hatékonyabb. A nézőkkel való kapcsolat fenntartása (válaszolj a kommentekre, használd a Community tab-ot) szintén növeli az ER-t.' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTableData(chart: ChartData | undefined): any[] {
  if (!chart || chart.empty || !chart.data?.series?.[0]?.data) return [];
  return chart.data.series[0].data as any[];
}

export function tableSum(chart: ChartData | undefined, field: string): number {
  return getTableData(chart).reduce((s, r) => s + (Number(r[field]) || 0), 0);
}

function tableAvg(chart: ChartData | undefined, field: string): number {
  const rows = getTableData(chart);
  if (rows.length === 0) return 0;
  return rows.reduce((s, r) => s + (Number(r[field]) || 0), 0) / rows.length;
}

function fmtPct(n: number): string { return `${n.toFixed(2)}%`; }
function fmtDec(n: number): string { return n.toFixed(2); }
function fmtDec1(n: number): string { return n.toFixed(1); }

function addDescriptions(kpis: KPI[]): KPI[] {
  return kpis.map(k => ({ ...k, description: KPI_DESC[k.key] }));
}

export function extractKPIs(platformKey: string, results: ChartData[]): KPI[] {
  switch (platformKey) {
    case 'TIKTOK_ORGANIC': {
      const followers = findChart(results, 'followers_growth');
      const profileViews = findChart(results, 'profile_views');
      const likes = findChart(results, 'daily_likes');
      const comments = findChart(results, 'daily_comments');
      const shares = findChart(results, 'daily_shares');
      const er = findChart(results, 'engagement_rate');
      const videos = findChart(results, 'all_videos');
      const bioClicks = findChart(results, 'tt_bio_link_clicks');
      const totalFollowersChart = findChart(results, 'tt_total_followers');

      const totalLikes = sumSeries(likes);
      const totalComments = sumSeries(comments);
      const totalShares = sumSeries(shares);
      const vidRows = getTableData(videos);
      const vidCount = vidRows.length;
      const totalVidViews = tableSum(videos, 'views');
      const totalVidReach = tableSum(videos, 'reach');

      return addDescriptions([
        { key: 'tt_followers', label: 'Össz. követőnövekedés', value: sumSeries(followers) },
        { key: 'tt_total_followers', label: 'Összes követő', value: lastValue(totalFollowersChart), agg: 'last' },
        { key: 'tt_total_views', label: 'Össz. megtekintés', value: totalVidViews },
        { key: 'tt_profile_views', label: 'Profilnézetek', value: sumSeries(profileViews) },
        { key: 'tt_likes', label: 'Like-ok', value: totalLikes },
        { key: 'tt_comments', label: 'Kommentek', value: totalComments },
        { key: 'tt_shares', label: 'Megosztások', value: totalShares },
        // User requested average of individual video ERs: sum(video_ER) / count(videos)
        { key: 'tt_er', label: 'ER%', value: `${tableAvg(videos, 'engagementRate').toFixed(2)}%`, agg: 'avg' },
        { key: 'tt_videos', label: 'Videók száma', value: vidCount },
        { key: 'tt_bio_clicks', label: 'Bio link kattintás', value: sumSeries(bioClicks) },
        { key: 'tt_like_per_view', label: 'Like / megtekintés', value: fmtPct(totalVidViews > 0 ? totalLikes / totalVidViews * 100 : 0), agg: 'avg' },
        { key: 'tt_comment_per_view', label: 'Komment / megtekintés', value: fmtPct(totalVidViews > 0 ? totalComments / totalVidViews * 100 : 0), agg: 'avg' },
        { key: 'tt_share_per_view', label: 'Megosztás / megtekintés', value: fmtPct(totalVidViews > 0 ? totalShares / totalVidViews * 100 : 0), agg: 'avg' },
        { key: 'tt_interactions_total', label: 'Összes interakció', value: totalLikes + totalComments + totalShares },
        { key: 'tt_avg_views', label: 'Átl. megtekintés/videó', value: vidCount > 0 ? Math.round(totalVidViews / vidCount) : 0, agg: 'avg' },
        { key: 'tt_avg_likes', label: 'Átl. like/videó', value: vidCount > 0 ? Math.round(tableSum(videos, 'likes') / vidCount) : 0, agg: 'avg' },
        { key: 'tt_avg_comments', label: 'Átl. komment/videó', value: vidCount > 0 ? Math.round(tableSum(videos, 'comments') / vidCount) : 0, agg: 'avg' },
        { key: 'tt_avg_shares', label: 'Átl. megosztás/videó', value: vidCount > 0 ? Math.round(tableSum(videos, 'shares') / vidCount) : 0, agg: 'avg' },
        { key: 'tt_avg_er', label: 'Átl. ER%/videó', value: `${tableAvg(videos, 'engagementRate').toFixed(2)}%`, agg: 'avg' },
        { key: 'tt_avg_watch_time', label: 'Átl. nézési idő (mp)', value: fmtDec1(tableAvg(videos, 'avgWatchTime')), agg: 'avg' },
        { key: 'tt_avg_full_watch', label: 'Átl. végignézés%', value: `${tableAvg(videos, 'fullWatchRate').toFixed(2)}%`, agg: 'avg' },
        { key: 'tt_avg_new_followers', label: 'Átl. új követő/videó', value: vidCount > 0 ? Math.round(tableSum(videos, 'newFollowers') / vidCount) : 0, agg: 'avg' },
        { key: 'tt_total_reach', label: 'Össz. elérés', value: totalVidReach },
      ]);
    }
    case 'TIKTOK_ADS': {
      const spend = findChart(results, 'ttads_spend_trend');
      const impClicks = findChart(results, 'ttads_impressions_clicks');
      const ctr = findChart(results, 'ttads_ctr_trend');
      const cpcCpm = findChart(results, 'ttads_cpc_cpm');
      const conversions = findChart(results, 'ttads_conversions');
      const costConv = findChart(results, 'ttads_cost_per_conversion');

      const totalSpend = sumSeries(spend);
      const totalImpressions = sumSeries(impClicks, 0);
      const totalClicks = sumSeries(impClicks, 1);
      const totalConversions = sumSeries(conversions);

      return addDescriptions([
        { key: 'ttads_spend', label: 'Költés', value: totalSpend },
        { key: 'ttads_impressions', label: 'Impressziók', value: totalImpressions },
        { key: 'ttads_clicks', label: 'Kattintások', value: totalClicks },
        { key: 'ttads_ctr', label: 'CTR%', value: fmtPct(avgSeries(ctr)), agg: 'avg' },
        { key: 'ttads_cpc', label: 'CPC', value: fmtDec(avgSeries(cpcCpm, 0)), agg: 'avg' },
        { key: 'ttads_cpm', label: 'CPM', value: fmtDec(avgSeries(cpcCpm, 1)), agg: 'avg' },
        { key: 'ttads_conv', label: 'Konverziók', value: totalConversions },
        { key: 'ttads_cost_conv', label: 'Költség/konverzió', value: fmtDec(avgSeries(costConv)), agg: 'avg' },
        { key: 'ttads_roas', label: 'ROAS', value: totalSpend > 0 ? fmtDec(totalConversions / totalSpend) : '0.00', agg: 'avg' },
        { key: 'ttads_conv_rate', label: 'Konverziós arány%', value: fmtPct(totalClicks > 0 ? totalConversions / totalClicks * 100 : 0), agg: 'avg' },
        { key: 'ttads_spend_per_click', label: 'Költés/kattintás', value: totalClicks > 0 ? fmtDec(totalSpend / totalClicks) : '0.00', agg: 'avg' },
      ]);
    }
    case 'FACEBOOK_ORGANIC': {
      const reach = findChart(results, 'fb_page_reach');
      const fans = findChart(results, 'fb_page_fans');
      const engagement = findChart(results, 'fb_engagement');
      const posts = findChart(results, 'fb_all_posts');
      const follows = findChart(results, 'fb_follows_trend');
      const videoViews = findChart(results, 'fb_video_views');

      const engagedUsers = findChart(results, 'fb_engaged_users');
      const pageViews = findChart(results, 'fb_page_views');
      const erChart = findChart(results, 'fb_engagement_rate');

      const totalReach = sumSeries(reach, 0);
      const totalReactions = sumSeries(engagement, 0);
      const totalComments = sumSeries(engagement, 1);
      const totalShares = sumSeries(engagement, 2);
      const totalInteractions = totalReactions + totalComments + totalShares;
      const postRows = getTableData(posts);
      const postCount = postRows.length;

      return addDescriptions([
        // Alap metrikák
        { key: 'fb_followers', label: 'Követők', value: lastValue(fans), agg: 'last' },
        { key: 'fb_reach', label: 'Elérés', value: totalReach },
        { key: 'fb_impressions', label: 'Impressziók', value: sumSeries(reach, 1) },
        { key: 'fb_reactions', label: 'Reakciók', value: totalReactions },
        { key: 'fb_comments', label: 'Kommentek', value: totalComments },
        { key: 'fb_shares', label: 'Megosztások', value: totalShares },
        { key: 'fb_posts', label: 'Posztok', value: postCount },
        { key: 'fb_new_follows', label: 'Napi új követők', value: sumSeries(follows, 0) },
        { key: 'fb_video_views', label: 'Videó nézések', value: sumSeries(videoViews) },
        { key: 'fb_engaged_users', label: 'Elkötelezett felhasználók', value: sumSeries(engagedUsers) },
        { key: 'fb_page_views', label: 'Oldal megtekintések', value: sumSeries(pageViews) },
        // Arány metrikák
        { key: 'fb_interactions_total', label: 'Összes interakció', value: totalInteractions },
        { key: 'fb_reaction_per_reach', label: 'Reakció / elérés', value: fmtPct(totalReach > 0 ? totalReactions / totalReach * 100 : 0), agg: 'avg' },
        { key: 'fb_er', label: 'Engagement rate%', value: fmtPct(totalReach > 0 ? totalInteractions / totalReach * 100 : 0), agg: 'avg' },
        // Átlag poszt KPI-ok
        { key: 'fb_avg_reach_post', label: 'Átl. elérés/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'reach') / postCount) : 0, agg: 'avg' },
        { key: 'fb_avg_reactions_post', label: 'Átl. reakció/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'reactions') / postCount) : 0, agg: 'avg' },
        { key: 'fb_avg_comments_post', label: 'Átl. komment/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'comments') / postCount) : 0, agg: 'avg' },
        { key: 'fb_avg_shares_post', label: 'Átl. megosztás/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'shares') / postCount) : 0, agg: 'avg' },
        { key: 'fb_avg_clicks_post', label: 'Átl. kattintás/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'clicks') / postCount) : 0, agg: 'avg' },
      ]);
    }
    case 'INSTAGRAM_ORGANIC': {
      const reach = findChart(results, 'ig_reach');
      const followers = findChart(results, 'ig_follower_growth');
      const engagement = findChart(results, 'ig_engagement');
      const profile = findChart(results, 'ig_profile_activity');
      const media = findChart(results, 'ig_all_media');
      const dailyFollowers = findChart(results, 'ig_daily_followers');
      const saveRate = findChart(results, 'ig_save_rate');
      const storyOverview = findChart(results, 'ig_story_overview');

      const totalReach = sumSeries(reach, 0);
      const totalLikes = sumSeries(engagement, 0);
      const totalComments = sumSeries(engagement, 1);
      const totalShares = sumSeries(engagement, 2);
      const totalSaves = sumSeries(engagement, 3);
      const totalInteractions = totalLikes + totalComments + totalShares + totalSaves;
      const mediaRows = getTableData(media);
      const mediaCount = mediaRows.length;

      return addDescriptions([
        // Alap metrikák
        { key: 'ig_followers', label: 'Követők', value: lastValue(followers), agg: 'last' },
        { key: 'ig_reach_kpi', label: 'Elérés', value: totalReach },
        { key: 'ig_impressions', label: 'Impressziók', value: sumSeries(reach, 1) },
        { key: 'ig_likes', label: 'Like-ok', value: totalLikes },
        { key: 'ig_comments', label: 'Kommentek', value: totalComments },
        { key: 'ig_shares', label: 'Megosztások', value: totalShares },
        { key: 'ig_saves', label: 'Mentések', value: totalSaves },
        { key: 'ig_profile_views', label: 'Profilnézetek', value: sumSeries(profile, 0) },
        { key: 'ig_media_count', label: 'Tartalmak', value: mediaCount },
        { key: 'ig_new_followers', label: 'Napi új követők', value: sumSeries(dailyFollowers) },
        { key: 'ig_save_rate_kpi', label: 'Mentési arány', value: fmtPct(avgSeries(saveRate)), agg: 'avg' },
        { key: 'ig_story_reach', label: 'Story elérés', value: sumSeries(storyOverview, 0) },
        // Arány metrikák
        { key: 'ig_interactions_total', label: 'Összes interakció', value: totalInteractions },
        { key: 'ig_like_per_reach', label: 'Like / elérés', value: fmtPct(totalReach > 0 ? totalLikes / totalReach * 100 : 0), agg: 'avg' },
        { key: 'ig_er', label: 'Engagement rate%', value: fmtPct(totalReach > 0 ? totalInteractions / totalReach * 100 : 0), agg: 'avg' },
        // Átlag tartalom KPI-ok
        { key: 'ig_avg_reach_media', label: 'Átl. elérés/tartalom', value: mediaCount > 0 ? Math.round(tableSum(media, 'reach') / mediaCount) : 0, agg: 'avg' },
        { key: 'ig_avg_likes_media', label: 'Átl. like/tartalom', value: mediaCount > 0 ? Math.round(tableSum(media, 'likes') / mediaCount) : 0, agg: 'avg' },
        { key: 'ig_avg_comments_media', label: 'Átl. komment/tartalom', value: mediaCount > 0 ? Math.round(tableSum(media, 'comments') / mediaCount) : 0, agg: 'avg' },
        { key: 'ig_avg_saves_media', label: 'Átl. mentés/tartalom', value: mediaCount > 0 ? Math.round(tableSum(media, 'saved') / mediaCount) : 0, agg: 'avg' },
        { key: 'ig_avg_shares_media', label: 'Átl. megosztás/tartalom', value: mediaCount > 0 ? Math.round(tableSum(media, 'shares') / mediaCount) : 0, agg: 'avg' },
      ]);
    }
    case 'INSTAGRAM_PUBLIC': {
      const engagement = findChart(results, 'igpub_engagement_overview');
      const avgEng = findChart(results, 'igpub_avg_engagement');
      const allMedia = findChart(results, 'igpub_all_media');
      const followersTrend = findChart(results, 'igpub_followers_trend');
      const erChart = findChart(results, 'igpub_engagement_rate');

      const totalLikes = sumSeries(engagement, 0);
      const totalComments = sumSeries(engagement, 1);
      const followers = lastValue(followersTrend);
      const totalInteractions = totalLikes + totalComments;

      return addDescriptions([
        { key: 'igpub_followers', label: 'Követők', value: followers, agg: 'last' },
        { key: 'igpub_likes', label: 'Like-ok', value: totalLikes },
        { key: 'igpub_comments', label: 'Kommentek', value: totalComments },
        { key: 'igpub_avg_likes', label: 'Átl. like/poszt', value: fmtDec1(avgSeries(avgEng, 0)), agg: 'avg' },
        { key: 'igpub_avg_comments', label: 'Átl. komment/poszt', value: fmtDec1(avgSeries(avgEng, 1)), agg: 'avg' },
        { key: 'igpub_media', label: 'Tartalmak', value: tableCount(allMedia) },
        { key: 'igpub_interactions', label: 'Összes interakció', value: totalInteractions },
        { key: 'igpub_avg_interaction', label: 'Átl. interakció/poszt', value: fmtDec1(avgSeries(avgEng, 0) + avgSeries(avgEng, 1)), agg: 'avg' },
        { key: 'igpub_er', label: 'Engagement rate%', value: fmtPct(followers > 0 ? totalInteractions / followers * 100 : 0), agg: 'avg' },
      ]);
    }
    case 'YOUTUBE': {
      const subs = findChart(results, 'yt_subscribers_growth');
      const views = findChart(results, 'yt_views_trend');
      const watchTime = findChart(results, 'yt_watch_time');
      const engagement = findChart(results, 'yt_daily_engagement');
      const er = findChart(results, 'yt_engagement_rate');
      const videos = findChart(results, 'yt_all_videos');
      const avgViewPct = findChart(results, 'yt_avg_view_pct');
      const playlistAdds = findChart(results, 'yt_playlist_adds');

      const totalViews = sumSeries(views);
      const totalLikes = sumSeries(engagement, 0);
      const totalComments = sumSeries(engagement, 1);
      const totalShares = sumSeries(engagement, 2);
      const totalInteractions = totalLikes + totalComments + totalShares;
      const vidRows = getTableData(videos);
      const vidCount = vidRows.length;

      return addDescriptions([
        // Alap metrikák
        { key: 'yt_subs', label: 'Új feliratkozók', value: sumSeries(subs) },
        { key: 'yt_views_kpi', label: 'Megtekintések', value: totalViews },
        { key: 'yt_watch', label: 'Nézési idő (perc)', value: sumSeries(watchTime) },
        { key: 'yt_likes_kpi', label: 'Like-ok', value: totalLikes },
        { key: 'yt_comments_kpi', label: 'Kommentek', value: totalComments },
        { key: 'yt_shares_kpi', label: 'Megosztások', value: totalShares },
        { key: 'yt_er', label: 'ER%', value: fmtPct(totalViews > 0 ? totalInteractions / totalViews * 100 : 0), agg: 'avg' },
        { key: 'yt_video_count', label: 'Videók', value: vidCount },
        { key: 'yt_avg_view', label: 'Átl. nézési %', value: `${avgSeries(avgViewPct).toFixed(1)}%`, agg: 'avg' },
        { key: 'yt_playlist', label: 'Playlist hozzáadás', value: sumSeries(playlistAdds) },
        // Arány metrikák
        { key: 'yt_like_per_view', label: 'Like / megtekintés', value: fmtPct(totalViews > 0 ? totalLikes / totalViews * 100 : 0), agg: 'avg' },
        { key: 'yt_comment_per_view', label: 'Komment / megtekintés', value: fmtPct(totalViews > 0 ? totalComments / totalViews * 100 : 0), agg: 'avg' },
        { key: 'yt_interactions_total', label: 'Összes interakció', value: totalInteractions },
        // Átlag videó KPI-ok
        { key: 'yt_avg_views_video', label: 'Átl. megtekintés/videó', value: vidCount > 0 ? Math.round(tableSum(videos, 'views') / vidCount) : 0, agg: 'avg' },
        { key: 'yt_avg_likes_video', label: 'Átl. like/videó', value: vidCount > 0 ? Math.round(tableSum(videos, 'likes') / vidCount) : 0, agg: 'avg' },
        { key: 'yt_avg_comments_video', label: 'Átl. komment/videó', value: vidCount > 0 ? Math.round(tableSum(videos, 'comments') / vidCount) : 0, agg: 'avg' },
        { key: 'yt_avg_watch_time_video', label: 'Átl. nézési idő/videó', value: vidCount > 0 ? fmtDec1(tableAvg(videos, 'avgViewDuration')) : '0.0', agg: 'avg' },
        { key: 'yt_avg_er_video', label: 'Átl. ER%/videó', value: fmtPct(tableAvg(videos, 'engagementRate')), agg: 'avg' },
      ]);
    }
    default:
      return [];
  }
}

export function mergeKPIs(allKpis: KPI[][]): KPI[] {
  if (allKpis.length === 0) return [];
  if (allKpis.length === 1) return allKpis[0];

  const merged: KPI[] = allKpis[0].map(kpi => ({ ...kpi }));

  for (let i = 1; i < allKpis.length; i++) {
    const row = allKpis[i];
    for (let j = 0; j < merged.length && j < row.length; j++) {
      const mVal = merged[j].value;
      const rVal = row[j].value;
      if (typeof mVal === 'number' && typeof rVal === 'number') {
        merged[j].value = mVal + rVal;
      } else if (typeof mVal === 'string' && mVal.endsWith('%') && typeof rVal === 'string' && rVal.endsWith('%')) {
        const a = parseFloat(mVal);
        const b = parseFloat(rVal);
        merged[j].value = `${((a * i + b) / (i + 1)).toFixed(2)}%`;
      }
    }
  }

  return merged;
}

/**
 * Aggregate KPIs from multiple months.
 * number values → sum
 * string values ending with '%' → average
 * string values not ending with '%' → sum (parse as number)
 */
export function aggregateMonthlyKPIs(allMonthKpis: KPI[][]): KPI[] {
  if (allMonthKpis.length === 0) return [];
  if (allMonthKpis.length === 1) return allMonthKpis[0];

  const count = allMonthKpis.length;
  // Build merged map keyed by KPI key for reliable matching
  const merged: KPI[] = allMonthKpis[0].map(kpi => ({ ...kpi }));
  const keyIndex = new Map(merged.map((kpi, idx) => [kpi.key, idx]));

  // Initialize values for accumulation
  for (const m of merged) {
    if (m.agg === 'last') continue; // Will be set to last month's value later
    // Convert initial value to number for accumulation
    if (typeof m.value === 'string') {
      const parsed = parseFloat(m.value.replace(/[^0-9.-]/g, ''));
      m.value = isNaN(parsed) ? 0 : parsed;
    }
  }

  for (let i = 1; i < count; i++) {
    const row = allMonthKpis[i];
    for (const rKpi of row) {
      const idx = keyIndex.get(rKpi.key);
      if (idx === undefined) continue;
      const m = merged[idx];

      // For 'last' aggregation, always take the latest month's value directly
      if (m.agg === 'last') {
        m.value = rKpi.value;
        continue;
      }

      let rVal = rKpi.value;
      if (typeof rVal === 'string') {
        const parsed = parseFloat(rVal.replace(/[^0-9.-]/g, ''));
        rVal = isNaN(parsed) ? 0 : parsed;
      }

      if (typeof m.value === 'number' && typeof rVal === 'number') {
        m.value += rVal;
      }
    }
  }

  // Finalize values (average if needed, format back to string if needed)
  for (const m of merged) {
    if (m.agg === 'last') continue;

    if (typeof m.value === 'number') {
      if (m.agg === 'avg' || m.key.includes('_er') || m.key.includes('rate') || m.key.includes('ctr') || m.key.includes('_avg_')) {
        m.value = m.value / count;
      }

      // Format back to string if original was percentage or if it looks like a rate
      const original = allMonthKpis[0].find(k => k.key === m.key)?.value;
      if (typeof original === 'string' && original.endsWith('%')) {
        m.value = `${m.value.toFixed(2)}%`;
      } else if (m.agg === 'avg' && !Number.isInteger(m.value)) {
        m.value = m.value.toFixed(1); // Decimals for averages
        if (m.value.endsWith('.0')) m.value = m.value.slice(0, -2);
      } else if (!m.agg) {
        // Sums are usually integers, but keep decimals if present
        m.value = Math.round(m.value * 100) / 100;
      }
    }
  }

  return merged;
}

/**
 * Generate per-month date ranges from an end month and period count.
 * Returns array of { startDate, endDate, month } objects, oldest first.
 */
export function generateMonthRanges(endMonth: string, periodMonths: number): { startDate: string; endDate: string; month: string }[] {
  const ranges: { startDate: string; endDate: string; month: string }[] = [];
  const [endYear, endMonthNum] = endMonth.split('-').map(Number);

  for (let i = periodMonths - 1; i >= 0; i--) {
    const d = new Date(endYear, endMonthNum - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const mm = String(m).padStart(2, '0');
    const monthStr = `${y}-${mm}`;
    const startDate = `${monthStr}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
    ranges.push({ startDate, endDate, month: monthStr });
  }

  return ranges;
}

/**
 * Compute % change for each KPI by comparing current vs previous month KPIs.
 * Returns a new array with `change` field populated.
 */
export function computeKPIChanges(current: KPI[], previous: KPI[]): KPI[] {
  const prevMap = new Map(previous.map(k => [k.key, k]));
  return current.map(kpi => {
    const prev = prevMap.get(kpi.key);
    if (!prev) return kpi;

    const curVal = typeof kpi.value === 'number' ? kpi.value : parseFloat(String(kpi.value).replace(/[^0-9.-]/g, ''));
    const prevVal = typeof prev.value === 'number' ? prev.value : parseFloat(String(prev.value).replace(/[^0-9.-]/g, ''));

    if (isNaN(curVal) || isNaN(prevVal) || prevVal === 0) return kpi;

    const change = ((curVal - prevVal) / Math.abs(prevVal)) * 100;
    return { ...kpi, change };
  });
}

// ===== Section grouping =====

export const CATEGORY_LABELS: Record<string, string> = {
  trend: 'Napi trendek',
  engagement: 'Engagement',
  timing: 'Időzítés',
  video: 'Videók',
  post: 'Posztok',
  media: 'Tartalmak',
  audience: 'Közönség',
  ads: 'Hirdetések',
};

export const CATEGORY_ORDER = ['trend', 'engagement', 'timing', 'ads', 'post', 'media', 'video', 'audience'];

export function groupByCategory(catalog: ChartDefinition[], results: ChartData[]) {
  const groups: { category: string; label: string; charts: ChartData[] }[] = [];

  for (const cat of CATEGORY_ORDER) {
    const catCharts = catalog
      .filter(c => c.category === cat)
      .map(c => results.find(r => r.key === c.key))
      .filter((c): c is ChartData => !!c && !c.empty && !c.error);
    if (catCharts.length > 0) {
      groups.push({ category: cat, label: CATEGORY_LABELS[cat] || cat, charts: catCharts });
    }
  }
  return groups;
}
