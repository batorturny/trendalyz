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
  tt_followers: { title: 'Össz. követőnövekedés', text: 'Az adott időszakban szerzett új követők összesített száma. Ez mutatja, hogy mennyivel nőtt a fiók követőtábora.', tip: 'A rendszeres, értékes tartalom megosztása segít a követőszám organikus növelésében.' },
  tt_total_followers: { title: 'Összes követő', text: 'A fiók aktuális összes követőinek száma. Ez a kumulatív szám a fióklétrehozás óta.', tip: 'Ne csak a számra figyelj, hanem a követők minőségére is.' },
  tt_profile_views: { title: 'Profilnézetek', text: 'Hányszor tekintették meg a TikTok profilodat az adott időszakban.', tip: 'Egy jól megírt bio és profilkép növeli a profillátogatásból fakadó követővé válás esélyét.' },
  tt_likes: { title: 'Like-ok', text: 'Az adott időszakban kapott összes like száma.', tip: 'A videók első 3 másodperce kulcsfontosságú a like-ok generálásához.' },
  tt_comments: { title: 'Kommentek', text: 'Az összes beérkezett komment száma. A kommentek az egyik legfontosabb engagement mérőszámok.', tip: 'Kérdezz a videóid végén, hogy ösztönözd a közönséged kommentálásra.' },
  tt_shares: { title: 'Megosztások', text: 'Hányszor osztották meg a tartalmaidat. A megosztás az algoritmus egyik legértékesebb jelzése.', tip: 'Gyakorlati tippek és „mentsd el" típusú tartalmak kapják a legtöbb megosztást.' },
  tt_er: { title: 'Engagement Rate', text: 'Az átlagos napi engagement rate százalékban. Az interakciók aránya az eléréshez képest.', tip: 'Az 5% feletti ER általában jónak számít TikTokon.' },
  tt_videos: { title: 'Videók száma', text: 'Az adott időszakban közzétett videók száma.', tip: 'A rendszeres posztolás (napi 1-3 videó) jelentősen növeli az elérést.' },
  tt_bio_clicks: { title: 'Bio link kattintás', text: 'Hányszor kattintottak a profilodban található linkre.', tip: 'Használj CTA-t a videóidban: „Link a biomban!"' },
  tt_like_per_view: { title: 'Like / megtekintés', text: 'Az összes like elosztva az összes megtekintéssel.', tip: '4-5% feletti like/view arány kiváló eredménynek számít.' },
  tt_comment_per_view: { title: 'Komment / megtekintés', text: 'Az összes komment elosztva az összes megtekintéssel.', tip: 'Vitatémák és személyes kérdések erős komment-generátorok.' },
  tt_share_per_view: { title: 'Megosztás / megtekintés', text: 'Az összes megosztás elosztva az összes megtekintéssel.', tip: 'Hasznos vagy vicces tartalom általában több megosztást kap.' },
  tt_interactions_total: { title: 'Összes interakció', text: 'Like-ok + kommentek + megosztások összege az adott időszakban.', tip: 'Az interakciók összessége jelzi az általános közönség-aktivitást.' },
  tt_avg_views: { title: 'Átl. megtekintés/videó', text: 'Egy videóra jutó átlagos megtekintésszám.', tip: 'Ha ez az érték csökken, próbáld meg változtatni a tartalom stílusán.' },
  tt_avg_likes: { title: 'Átl. like/videó', text: 'Egy videóra jutó átlagos like szám.', tip: 'Az érzelmi tartalmak (humor, meglepetés) általában több like-ot kapnak.' },
  tt_avg_comments: { title: 'Átl. komment/videó', text: 'Egy videóra jutó átlagos kommentszám.', tip: 'Vitaindító és kérdésfeltevő tartalmak növelik a kommentszámot.' },
  tt_avg_shares: { title: 'Átl. megosztás/videó', text: 'Egy videóra jutó átlagos megosztásszám.', tip: 'Listás, „mentsd el később" típusú tartalmak megosztásra ösztönzik a közönséget.' },
  tt_avg_er: { title: 'Átl. ER%/videó', text: 'A videók átlagos engagement rate-je százalékban.', tip: 'Koncentrálj a minőségi tartalmakra – egy magas ER-ű videó többet ér.' },
  tt_avg_watch_time: { title: 'Átl. nézési idő', text: 'Az átlagos időtartam másodpercben, amennyit a nézők egy videót néznek.', tip: 'A hook (nyitó 1-2 mp) és a videó tempója meghatározza a nézési időt.' },
  tt_avg_full_watch: { title: 'Átl. végignézés%', text: 'A nézők hány %-a nézte végig a teljes videót átlagosan. Az algoritmus egyik legfontosabb jelzése.', tip: '40% felett kiváló! Rövidebb videók és feszültség-fenntartó szerkesztés segít.' },
  tt_avg_new_followers: { title: 'Átl. új követő/videó', text: 'Egy videó átlagosan hány új követőt hoz.', tip: 'CTA: „Kövess be, ha tetszett!"' },
  tt_total_reach: { title: 'Össz. elérés', text: 'Az összes videó összesített elérése.', tip: 'A magas elérés a For You Page megjelenés eredménye.' },
  // TikTok Ads
  ttads_spend: { title: 'Költés', text: 'Az adott időszakban elköltött teljes hirdetési összeg.', tip: 'Kövesd nyomon a napi költéskorlátokat.' },
  ttads_impressions: { title: 'Impressziók', text: 'Hányszor jelent meg a hirdetésed a felhasználók képernyőjén.', tip: 'Magas impressziószám alacsony CTR-rel = kreatív frissítés szükséges.' },
  ttads_clicks: { title: 'Kattintások', text: 'A hirdetésre történt kattintások száma.', tip: 'Erős CTA és vizuálisan kiemelkedő kreativitás növeli a kattintásokat.' },
  ttads_ctr: { title: 'CTR%', text: 'Click-Through Rate: a kattintások aránya az impressziókhoz képest.', tip: 'Az 1% feletti CTR általában jó TikTok hirdetéseknél.' },
  ttads_cpc: { title: 'CPC', text: 'Cost Per Click: egy kattintásra eső átlagos költség.', tip: 'Alacsonyabb CPC = hatékonyabb hirdetés. A/B tesztelj különböző kreatívokat.' },
  ttads_cpm: { title: 'CPM', text: 'Cost Per Mille: 1000 impresszióra eső költség.', tip: 'A célzás szűkítése növelheti a CPM-et.' },
  ttads_conv: { title: 'Konverziók', text: 'A hirdetés által generált konverziók száma.', tip: 'Győződj meg róla, hogy a konverziós pixel helyesen van beállítva.' },
  ttads_cost_conv: { title: 'Költség/konverzió', text: 'Egy konverzióra eső átlagos költség.', tip: 'Ha a költség/konverzió emelkedik, vizsgáld felül a célzást.' },
  ttads_roas: { title: 'ROAS', text: 'Return On Ad Spend: a hirdetési költésre vetített bevétel.', tip: 'Ideális esetben a ROAS 3x vagy magasabb legyen.' },
  ttads_conv_rate: { title: 'Konverziós arány', text: 'A kattintásokból konverzióvá váló felhasználók aránya százalékban.', tip: 'A landing page optimalizálása közvetlenül javítja a konverziós arányt.' },
  ttads_spend_per_click: { title: 'Költés/kattintás', text: 'Egy kattintásra eső költség.', tip: 'Használd a Spark Ads formátumot az organikus tartalmak hirdetéséhez.' },
  // Facebook Organic
  fb_followers: { title: 'Követők', text: 'A Facebook oldal aktuális követőinek száma.', tip: 'Az aktív, elkötelezett közönség értékesebb a puszta számnál.' },
  fb_reach: { title: 'Elérés', text: 'Hány egyedi felhasználó látta a tartalmaidat.', tip: 'Az organikus elérés növeléséhez fontos a posztolási idő és a tartalom típus (videó > kép > szöveg).' },
  fb_impressions: { title: 'Impressziók', text: 'Az összes megjelenés száma.', tip: 'Ha az impresszió/elérés arány magas, a tartalmad többször is megjelenik.' },
  fb_reactions: { title: 'Reakciók', text: 'Az összes Facebook reakció száma.', tip: 'A love és wow reakciók jobban jelzik az érzelmi kötődést.' },
  fb_comments: { title: 'Kommentek', text: 'Az adott időszakban kapott kommentek száma.', tip: 'Válaszolj a kommentekre – ez növeli a poszt elérését.' },
  fb_shares: { title: 'Megosztások', text: 'Hányszor osztották meg a tartalmaidat.', tip: 'Érzelmi, vicces vagy hasznos tartalmak kapják a legtöbb megosztást.' },
  fb_posts: { title: 'Posztok', text: 'Az adott időszakban közzétett posztok száma.', tip: 'Heti 3-5 poszt az optimális Facebook-on.' },
  fb_new_follows: { title: 'Napi új követők', text: 'Az adott időszakban szerzett napi új követők.', tip: 'A megosztható tartalmak jó forrásai az új követőknek.' },
  fb_video_views: { title: 'Videó nézések', text: 'A videó tartalmak összes megtekintési száma.', tip: 'A Facebook algoritmusa előnyben részesíti a natív videókat.' },
  fb_interactions_total: { title: 'Összes interakció', text: 'Reakciók + kommentek + megosztások összege.', tip: 'Az interakciók növekedése jelzi a tartalomstratégia hatékonyságát.' },
  fb_reaction_per_reach: { title: 'Reakció / elérés', text: 'A reakciók aránya az eléréshez képest százalékban.', tip: '1% feletti reakció/elérés arány jó organikus teljesítményt jelez.' },
  fb_er: { title: 'Engagement Rate', text: 'Az összes interakció aránya az eléréshez képest.', tip: 'Facebookon az 1-3% közötti ER normális, 3% felett kiváló.' },
  fb_avg_reach_post: { title: 'Átl. elérés/poszt', text: 'Egy posztra jutó átlagos elérés.', tip: 'Próbálj több videót és carousel posztot használni.' },
  fb_avg_reactions_post: { title: 'Átl. reakció/poszt', text: 'Egy posztra jutó átlagos reakciószám.', tip: 'A személy-központú posztok több reakciót kapnak.' },
  fb_avg_comments_post: { title: 'Átl. komment/poszt', text: 'Egy posztra jutó átlagos kommentszám.', tip: 'Adj hozzá kérdéseket a posztok végéhez.' },
  fb_avg_shares_post: { title: 'Átl. megosztás/poszt', text: 'Egy posztra jutó átlagos megosztásszám.', tip: 'Listák, infografikák és praktikus tippek kapják a legtöbb megosztást.' },
  // Instagram Organic
  ig_followers: { title: 'Követők', text: 'Az Instagram fiók aktuális követőinek száma.', tip: 'A hiteles tartalom és közösségépítés fenntarthatóbb növekedést eredményez.' },
  ig_reach_kpi: { title: 'Elérés', text: 'Hány egyedi felhasználó látta a tartalmaidat.', tip: 'A Reels formátum általában szélesebb elérést biztosít.' },
  ig_impressions: { title: 'Impressziók', text: 'Az összes megjelenés száma.', tip: 'Magas impressziók alacsony elérés mellett = a tartalmad újra megjelenik a meglévő közönségednek.' },
  ig_likes: { title: 'Like-ok', text: 'Az adott időszakban kapott összes like.', tip: 'A vizuálisan erős tartalmak kapják a legtöbb like-ot Instagramon.' },
  ig_comments: { title: 'Kommentek', text: 'A kapott kommentek száma.', tip: 'A hosszabb caption-ok kérdéssel a végén növelik a kommentelési kedvet.' },
  ig_shares: { title: 'Megosztások', text: 'Hányszor küldték el/osztották meg a tartalmaidat.', tip: 'A DM-ben megosztott tartalmak is számítanak és erős algoritmikus jelzés.' },
  ig_saves: { title: 'Mentések', text: 'Hányszor mentették el a tartalmaidat. A mentés az egyik legértékesebb interakció.', tip: 'Oktatási tartalmak kapják a legtöbb mentést.' },
  ig_profile_views: { title: 'Profilnézetek', text: 'Hányszor nézték meg a profilodat.', tip: 'Kiemelt történetek és letisztult bio növelik a profillátogatásból eredő konverziót.' },
  ig_media_count: { title: 'Tartalmak', text: 'Az adott időszakban közzétett tartalmak száma.', tip: 'Mix tartalom (Reels + carousel + slideshow) a leghatékonyabb stratégia.' },
  ig_new_followers: { title: 'Napi új követők', text: 'Az időszakban szerzett napi új követők összesítése.', tip: 'A Reels és Collaboration posztok a legjobb új követő szerzési módszerek.' },
  ig_save_rate_kpi: { title: 'Mentési arány', text: 'A mentések aránya az eléréshez képest.', tip: '2-3% feletti mentési arány kiváló.' },
  ig_story_reach: { title: 'Story elérés', text: 'Az Instagram Story-k összesített elérése.', tip: 'A rendszeres (napi 3-5) Story használat fenntartja az érdeklődést.' },
  ig_interactions_total: { title: 'Összes interakció', text: 'Like + komment + megosztás + mentés összege.', tip: 'A mentés és megosztás nagyobb súllyal esik latba az algoritmusnál.' },
  ig_like_per_reach: { title: 'Like / elérés', text: 'A like-ok aránya az eléréshez képest százalékban.', tip: '3-5% feletti arány jó teljesítményt jelez.' },
  ig_er: { title: 'Engagement Rate', text: 'Az összes interakció aránya az eléréshez képest.', tip: 'Instagramon a 3-6% közötti ER jó, 6% felett kiváló.' },
  ig_avg_reach_media: { title: 'Átl. elérés/tartalom', text: 'Egy tartalomra jutó átlagos elérés.', tip: 'Ha ez csökken, próbálj meg több Reels-t posztolni.' },
  ig_avg_likes_media: { title: 'Átl. like/tartalom', text: 'Egy tartalomra jutó átlagos like.', tip: 'Esztétikus vizuális konzisztencia növeli a like-ok számát.' },
  ig_avg_comments_media: { title: 'Átl. komment/tartalom', text: 'Egy tartalomra jutó átlagos kommentszám.', tip: 'A személyes történetek több kommentet generálnak.' },
  ig_avg_saves_media: { title: 'Átl. mentés/tartalom', text: 'Egy tartalomra jutó átlagos mentésszám.', tip: 'Carousel tippek és checklisták maximalizálják a mentéseket.' },
  ig_avg_shares_media: { title: 'Átl. megosztás/tartalom', text: 'Egy tartalomra jutó átlagos megosztásszám.', tip: 'A relatable mémek és idézetek kapják a legtöbb DM-megosztást.' },
  // IG Public
  igpub_likes: { title: 'Like-ok', text: 'A nyilvánosan elérhető like-ok száma.', tip: 'Pontos elemzéshez Instagram Business fiók szükséges.' },
  igpub_comments: { title: 'Kommentek', text: 'A nyilvánosan látható kommentek száma.', tip: 'A kommentek hangulata is fontos, nem csak a szám.' },
  igpub_avg_likes: { title: 'Átl. like/poszt', text: 'Egy posztra jutó átlagos like.', tip: 'Ez jó benchmark a jövőbeli tartalmak tervezéséhez.' },
  igpub_avg_comments: { title: 'Átl. komment/poszt', text: 'Egy posztra jutó átlagos komment.', tip: 'A kommentek mélysége is fontos mutató.' },
  igpub_media: { title: 'Tartalmak', text: 'Az időszak alatt közzétett tartalmak száma.', tip: 'A rendszeresség fontosabb, mint a mennyiség.' },
  igpub_interactions: { title: 'Összes interakció', text: 'Like-ok + kommentek összege.', tip: 'Publikus adatokból elérhető interakciók.' },
  igpub_avg_interaction: { title: 'Átl. interakció/poszt', text: 'Egy posztra jutó átlagos interakciók.', tip: 'Hasonlítsd össze az iparági átlaggal.' },
  // YouTube
  yt_subs: { title: 'Új feliratkozók', text: 'Az adott időszakban szerzett új feliratkozók száma.', tip: 'A videó végén használj feliratkozási CTA-t és End Screen elemeket.' },
  yt_views_kpi: { title: 'Megtekintések', text: 'Az összes videómegtekintés az adott időszakban.', tip: 'Az optimális cím és thumbnail a megtekintések legfontosabb hajtóereje.' },
  yt_watch: { title: 'Nézési idő', text: 'Az összes nézési idő percben. A YouTube legfontosabb rangsorolási tényezője.', tip: 'A hosszabb (8-15 perces) videók általában több összesített nézési időt hoznak.' },
  yt_likes_kpi: { title: 'Like-ok', text: 'A videókra kapott like-ok összessége.', tip: 'Kérd meg a nézőket a videó közben, hogy nyomjanak like-ot.' },
  yt_comments_kpi: { title: 'Kommentek', text: 'Az összes komment az adott időszakban.', tip: 'Pinned comment és Creator Heart funkciók ösztönzik a kommentálást.' },
  yt_shares_kpi: { title: 'Megosztások', text: 'Hányszor osztották meg a videóidat.', tip: 'A megosztható tartalmak (tippek, hogyan kell) terjednek a legjobban.' },
  yt_er: { title: 'ER%', text: 'Engagement Rate százalékban: az interakciók aránya a megtekintésekhez képest.', tip: 'YouTube-on a 4-6% közötti ER jónak számít.' },
  yt_video_count: { title: 'Videók', text: 'Az adott időszakban közzétett videók száma.', tip: 'Heti 1-2 videó rendszeres posztolása az ideális.' },
  yt_avg_view: { title: 'Átl. nézési %', text: 'A nézők a videó hány %-át nézték meg átlagosan.', tip: '50% felett kiváló! A videó elejei hook és dinamikus szerkesztés segít.' },
  yt_playlist: { title: 'Playlist hozzáadás', text: 'Hányszor adták hozzá a videóidat lejátszási listákhoz.', tip: 'Hozz létre saját lejátszási listákat – növeli a nézési időt.' },
  yt_like_per_view: { title: 'Like / megtekintés', text: 'A like-ok aránya a megtekintésekhez képest.', tip: '4-5% feletti arány kiváló YouTube-on.' },
  yt_comment_per_view: { title: 'Komment / megtekintés', text: 'A kommentek aránya a megtekintésekhez képest.', tip: 'A kérdésfeltevő szekciók a videóban növelik ezt az arányt.' },
  yt_interactions_total: { title: 'Összes interakció', text: 'Like + komment + megosztás összege.', tip: 'A magas interakció jelzi, hogy a tartalom rezonál a közönséggel.' },
  yt_avg_views_video: { title: 'Átl. megtekintés/videó', text: 'Egy videóra jutó átlagos megtekintésszám.', tip: 'Ha ez csökken, vizsgáld felül a thumbnail-eket és címeket.' },
  yt_avg_likes_video: { title: 'Átl. like/videó', text: 'Egy videóra jutó átlagos like.', tip: 'Érzelmileg erős tartalom növeli a like-okat.' },
  yt_avg_comments_video: { title: 'Átl. komment/videó', text: 'Egy videóra jutó átlagos kommentszám.', tip: 'Az értékes diskurzus a cél.' },
  yt_avg_watch_time_video: { title: 'Átl. nézési idő/videó', text: 'Egy videóra jutó átlagos nézési idő.', tip: 'Chapters (fejezetek) hozzáadása segít a nézőknek és növeli a nézési időt.' },
  yt_avg_er_video: { title: 'Átl. ER%/videó', text: 'Videó szintű átlagos engagement rate.', tip: 'Az interaktív elemek (polls, cards) növelik a videónkénti ER-t.' },
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
        { key: 'tt_profile_views', label: 'Profilnézetek', value: sumSeries(profileViews) },
        { key: 'tt_likes', label: 'Like-ok', value: totalLikes },
        { key: 'tt_comments', label: 'Kommentek', value: totalComments },
        { key: 'tt_shares', label: 'Megosztások', value: totalShares },
        { key: 'tt_er', label: 'ER%', value: `${avgSeries(er).toFixed(2)}%`, agg: 'avg' },
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
        // Arány metrikák
        { key: 'fb_interactions_total', label: 'Összes interakció', value: totalInteractions },
        { key: 'fb_reaction_per_reach', label: 'Reakció / elérés', value: fmtPct(totalReach > 0 ? totalReactions / totalReach * 100 : 0), agg: 'avg' },
        { key: 'fb_er', label: 'Engagement rate%', value: fmtPct(totalReach > 0 ? totalInteractions / totalReach * 100 : 0), agg: 'avg' },
        // Átlag poszt KPI-ok
        { key: 'fb_avg_reach_post', label: 'Átl. elérés/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'reach') / postCount) : 0, agg: 'avg' },
        { key: 'fb_avg_reactions_post', label: 'Átl. reakció/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'reactions') / postCount) : 0, agg: 'avg' },
        { key: 'fb_avg_comments_post', label: 'Átl. komment/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'comments') / postCount) : 0, agg: 'avg' },
        { key: 'fb_avg_shares_post', label: 'Átl. megosztás/poszt', value: postCount > 0 ? Math.round(tableSum(posts, 'shares') / postCount) : 0, agg: 'avg' },
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

      const totalLikes = sumSeries(engagement, 0);
      const totalComments = sumSeries(engagement, 1);

      return addDescriptions([
        { key: 'igpub_likes', label: 'Like-ok', value: totalLikes },
        { key: 'igpub_comments', label: 'Kommentek', value: totalComments },
        { key: 'igpub_avg_likes', label: 'Átl. like/poszt', value: fmtDec1(avgSeries(avgEng, 0)), agg: 'avg' },
        { key: 'igpub_avg_comments', label: 'Átl. komment/poszt', value: fmtDec1(avgSeries(avgEng, 1)), agg: 'avg' },
        { key: 'igpub_media', label: 'Tartalmak', value: tableCount(allMedia) },
        { key: 'igpub_interactions', label: 'Összes interakció', value: totalLikes + totalComments },
        { key: 'igpub_avg_interaction', label: 'Átl. interakció/poszt', value: fmtDec1(avgSeries(avgEng, 0) + avgSeries(avgEng, 1)), agg: 'avg' },
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
        { key: 'yt_er', label: 'ER%', value: fmtPct(avgSeries(er)), agg: 'avg' },
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

  for (let i = 1; i < count; i++) {
    const row = allMonthKpis[i];
    for (const rKpi of row) {
      const idx = keyIndex.get(rKpi.key);
      if (idx === undefined) continue;
      const m = merged[idx];

      // For 'last' aggregation, always take the latest month's value
      if (m.agg === 'last') {
        m.value = rKpi.value;
        continue;
      }

      const mVal = m.value;
      const rVal = rKpi.value;

      if (typeof mVal === 'number' && typeof rVal === 'number') {
        m.value = mVal + rVal;
      } else if (typeof mVal === 'string' && typeof rVal === 'string') {
        const mNum = parseFloat(mVal);
        const rNum = parseFloat(rVal);
        if (!isNaN(mNum) && !isNaN(rNum)) {
          if (mVal.endsWith('%') && rVal.endsWith('%')) {
            m.value = `${(mNum + rNum).toFixed(2)}%`;
          } else {
            m.value = `${(mNum + rNum).toFixed(2)}`;
          }
        }
      }
    }
  }

  // Now average the percentage values and 'avg' hints
  for (const kpi of merged) {
    const val = kpi.value;
    if (typeof val === 'string' && val.endsWith('%')) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        kpi.value = `${(num / count).toFixed(2)}%`;
      }
    }
    if (kpi.agg === 'avg' && typeof kpi.value === 'number') {
      kpi.value = Math.round(kpi.value / count);
    }
    if (kpi.agg === 'avg' && typeof kpi.value === 'string' && !kpi.value.endsWith('%')) {
      const num = parseFloat(kpi.value);
      if (!isNaN(num)) kpi.value = (num / count).toFixed(2);
    }
    kpi.change = undefined;
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
