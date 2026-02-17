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
  tt_followers: { title: 'Ossz. kovetonovekedés', text: 'Az adott idoszakban szerzett uj kovetok osszesitett szama. Ez mutatja, hogy mennyivel nott a fiok kovetotabora.', tip: 'A rendszeres, ertekes tartalom megosztasa segit a kovetoszam organikus noveleseben.' },
  tt_total_followers: { title: 'Osszes koveto', text: 'A fiok aktualis osszes kovetoinek szama. Ez a kumulativ szam a fiokletrehozas ota.', tip: 'Ne csak a szamra figyelj, hanem a kovetok minosegere is.' },
  tt_profile_views: { title: 'Profilnezetek', text: 'Hanyszor tekintetted meg a TikTok profilodat az adott idoszakban.', tip: 'Egy jol megirt bio es profilkep noveli a profillatasbol fakado kovetove valas eselyet.' },
  tt_likes: { title: 'Like-ok', text: 'Az adott idoszakban kapott osszes like szama.', tip: 'A videok elso 3 masodperce kulcsfontossagu a like-ok generálasahoz.' },
  tt_comments: { title: 'Kommentek', text: 'Az osszes beerkezett komment szama. A kommentek az egyik legfontosabb engagement meroszamok.', tip: 'Kerdezz a videoid vegen, hogy osztonozd a kozonseged kommentalasra.' },
  tt_shares: { title: 'Megosztasok', text: 'Hanyszor osztottak meg a tartalmaidat. A megosztas az algoritmus egyik legertekesebb jelzese.', tip: 'Gyakorlati tippek es mentsd el tipusu tartalmak kapjak a legtobb megosztast.' },
  tt_er: { title: 'Engagement Rate', text: 'Az atlagos napi engagement rate szazalekban. Az interakciok aranya az elereshez kepest.', tip: 'Az 5% feletti ER altalaban jonak szamit TikTokon.' },
  tt_videos: { title: 'Videok szama', text: 'Az adott idoszakban kozzetett videok szama.', tip: 'A rendszeres posztolas (napi 1-3 video) jelentosen noveli az elerest.' },
  tt_bio_clicks: { title: 'Bio link kattintas', text: 'Hanyszor kattintottak a profilodban talalhato linkre.', tip: 'Hasznalj CTA-t a videoidban: Link a biomban!' },
  tt_like_per_view: { title: 'Like / megtekintes', text: 'Az osszes like elosztva az osszes megtekintegessel.', tip: '4-5% feletti like/view arany kivalo eredmenynek szamit.' },
  tt_comment_per_view: { title: 'Komment / megtekintes', text: 'Az osszes komment elosztva az osszes megtekintegessel.', tip: 'Vitatemak es szemelyes kerdesek eros komment-generatorok.' },
  tt_share_per_view: { title: 'Megosztas / megtekintes', text: 'Az osszes megosztas elosztva az osszes megtekintegessel.', tip: 'Hasznos vagy vicces tartalom altalaban tobb megosztast kap.' },
  tt_interactions_total: { title: 'Osszes interakcio', text: 'Like-ok + kommentek + megosztasok osszege az adott idoszakban.', tip: 'Az interakciok osszessege jelzi az altalanos kozonseg-aktivitast.' },
  tt_avg_views: { title: 'Atl. megtekintes/video', text: 'Egy videora juto atlagos megtekintesszam.', tip: 'Ha ez az ertek csokken, probald meg valtoztatni a tartalom stilusan.' },
  tt_avg_likes: { title: 'Atl. like/video', text: 'Egy videora juto atlagos like szam.', tip: 'Az erzelmi tartalmak (humor, meglepetes) altalaban tobb like-ot kapnak.' },
  tt_avg_comments: { title: 'Atl. komment/video', text: 'Egy videora juto atlagos kommentszam.', tip: 'Vitaindito es kerdesfelevo tartalmak novelik a kommentszamot.' },
  tt_avg_shares: { title: 'Atl. megosztas/video', text: 'Egy videora juto atlagos megosztasszam.', tip: 'Listas, mentsd el kesobb tipusu tartalmak megosztasra osztonzik a kozonseget.' },
  tt_avg_er: { title: 'Atl. ER%/video', text: 'A videok atlagos engagement rate-je szazalekban.', tip: 'Koncentralj a minosegi tartalmakra - egy magas ER-u video tobbet er.' },
  tt_avg_watch_time: { title: 'Atl. nezesi ido', text: 'Az atlagos idotartam masodpercben, amennyit a nezok egy videot neznek.', tip: 'A hook (nyito 1-2 mp) es a video tempoja meghatarozza a nezesi idot.' },
  tt_avg_full_watch: { title: 'Atl. vegignezes%', text: 'A nezok hany %-a nezte vegig a teljes videot atlagosan. Az algoritmus egyik legfontosabb jelzese.', tip: '40% felett kivalo! Rovidebb videok es feszultseg-fenntarto szerkesztes segit.' },
  tt_avg_new_followers: { title: 'Atl. uj koveto/video', text: 'Egy video atlagosan hany uj kovetot hoz.', tip: 'CTA: Kovess be ha tetszett!' },
  tt_total_reach: { title: 'Ossz. eleres', text: 'Az osszes video osszesitett elerese.', tip: 'A magas eleres a For You Page megjelenes eredmenye.' },
  ttads_spend: { title: 'Koltes', text: 'Az adott idoszakban elkoltott teljes hirdetesi osszeg.', tip: 'Kovesd nyomon a napi kolteskorlatokat.' },
  ttads_impressions: { title: 'Impressziok', text: 'Hanyszor jelent meg a hirdetesed a felhasznalok kepernyon.', tip: 'Magas impresszioszam alacsony CTR-rel = kreativ frissites szukseges.' },
  ttads_clicks: { title: 'Kattintasok', text: 'A hirdetesre tortent kattintasok szama.', tip: 'Eros CTA es vizualisan kiemelkedo kreativitas noveli a kattintasokat.' },
  ttads_ctr: { title: 'CTR%', text: 'Click-Through Rate: a kattintasok aranya az impressziokhoz kepest.', tip: 'Az 1% feletti CTR altalaban jo TikTok hirdeteseknel.' },
  ttads_cpc: { title: 'CPC', text: 'Cost Per Click: egy kattintasra eso atlagos koltseg.', tip: 'Alacsonyabb CPC = hatekonyabb hirdetes. A/B tesztelj kulonbozo kreativokat.' },
  ttads_cpm: { title: 'CPM', text: 'Cost Per Mille: 1000 impressziora eso koltseg.', tip: 'A celzas szukitese novelheti a CPM-et.' },
  ttads_conv: { title: 'Konverziok', text: 'A hirdetes altal generalt konverziok szama.', tip: 'Gyozodj meg rola, hogy a konverzios pixel helyesen van beallitva.' },
  ttads_cost_conv: { title: 'Koltseg/konverzio', text: 'Egy konverziora eso atlagos koltseg.', tip: 'Ha a koltseg/konverzio emelkedik, vizsgald felul a celzast.' },
  ttads_roas: { title: 'ROAS', text: 'Return On Ad Spend: a hirdetesi koltesre vetitett bevetel.', tip: 'Idealis esetben a ROAS 3x vagy magasabb legyen.' },
  ttads_conv_rate: { title: 'Konverzios arany', text: 'A kattintasokbol konverziova valo felhasznalok aranya szazalekban.', tip: 'A landing page optimalizalasa kozvetlenul javitja a konverzios aranyt.' },
  ttads_spend_per_click: { title: 'Koltes/kattintas', text: 'Egy kattintasra eso koltseg.', tip: 'Hasznald a Spark Ads formatumot az organikus tartalmak hirdetesehez.' },
  fb_followers: { title: 'Kovetok', text: 'A Facebook oldal aktualis kovetoinek szama.', tip: 'Az aktiv, elkotelezett kozonseg ertekesebb a puszta szamnal.' },
  fb_reach: { title: 'Eleres', text: 'Hany egyedi felhasznalo latta a tartalmaidat.', tip: 'Az organikus eleres novelésehez fontos a posztolasi ido es a tartalom tipus (video > kep > szoveg).' },
  fb_impressions: { title: 'Impressziok', text: 'Az osszes megjelenes szama.', tip: 'Ha az impresszio/eleres arany magas, a tartalmad tobbszor is megjelenik.' },
  fb_reactions: { title: 'Reakciok', text: 'Az osszes Facebook reakcio szama.', tip: 'A love es wow reakciok jobban jelzik az erzelmi kotoddest.' },
  fb_comments: { title: 'Kommentek', text: 'Az adott idoszakban kapott kommentek szama.', tip: 'Valaszolj a kommentekre - ez noveli a poszt elereseget.' },
  fb_shares: { title: 'Megoszatasok', text: 'Hanyszor osztottak meg a tartalmaidat.', tip: 'Erzelmi, vicces vagy hasznos tartalmak kapjak a legtobb megosztast.' },
  fb_posts: { title: 'Posztok', text: 'Az adott idoszakban kozzetett posztok szama.', tip: 'Heti 3-5 poszt az optimalis Facebook-on.' },
  fb_new_follows: { title: 'Napi uj kovetok', text: 'Az adott idoszakban szerzett napi uj kovetok.', tip: 'A megosztható tartalmak jo forrasai az uj kovetoknek.' },
  fb_video_views: { title: 'Video nezesek', text: 'A video tartalmak osszes megtekintesi szama.', tip: 'A Facebook algoritmusa elonyben reszesiti a nativ videoket.' },
  fb_interactions_total: { title: 'Osszes interakcio', text: 'Reakciok + kommentek + megosztasok osszege.', tip: 'Az interakciok novekedese jelzi a tartalomstrategia hatekonysagat.' },
  fb_reaction_per_reach: { title: 'Reakcio / eleres', text: 'A reakciok aranya az elereshez kepest szazalekban.', tip: '1% feletti reakcio/eleres arany jo organikus teljesitmenyt jelez.' },
  fb_er: { title: 'Engagement Rate', text: 'Az osszes interakcio aranya az elereshez kepest.', tip: 'Facebookon az 1-3% kozotti ER normalis, 3% felett kivalo.' },
  fb_avg_reach_post: { title: 'Atl. eleres/poszt', text: 'Egy posztra juto atlagos eleres.', tip: 'Probaalj tobb videot es carousel posztot hasznalni.' },
  fb_avg_reactions_post: { title: 'Atl. reakcio/poszt', text: 'Egy posztra juto atlagos reakcioszam.', tip: 'A szemely-kozpontu posztok tobb reakciot kapnak.' },
  fb_avg_comments_post: { title: 'Atl. komment/poszt', text: 'Egy posztra juto atlagos kommentszam.', tip: 'Adj hozza kerdeseket a posztok vegehez.' },
  fb_avg_shares_post: { title: 'Atl. megosztas/poszt', text: 'Egy posztra juto atlagos megosztasszam.', tip: 'Listak, infografikak es praktikus tippek kapjak a legtobb megosztast.' },
  ig_followers: { title: 'Kovetok', text: 'Az Instagram fiok aktualis kovetoinek szama.', tip: 'A hiteles tartalom es kozossegepites fenntarthatobb novekedest eredmenyez.' },
  ig_reach_kpi: { title: 'Eleres', text: 'Hany egyedi felhasznalo latta a tartalmaidat.', tip: 'A Reels formatum altalaban szelessebb elerest biztosit.' },
  ig_impressions: { title: 'Impressziok', text: 'Az osszes megjelenes szama.', tip: 'Magas impressziok alacsony eleres mellett = a tartalmad ujra megjelenik a meglevo kozonsegednek.' },
  ig_likes: { title: 'Like-ok', text: 'Az adott idoszakban kapott osszes like.', tip: 'A vizualisan eros tartalmak kapjak a legtobb like-ot Instagramon.' },
  ig_comments: { title: 'Kommentek', text: 'A kapott kommentek szama.', tip: 'A hosszabb caption-ok kerdessel a vegen novelik a kommentelesi kedvet.' },
  ig_shares: { title: 'Megosztasok', text: 'Hanyszor kuldtek el/osztottak meg a tartalmaidat.', tip: 'A DM-ben megosztott tartalmak is szamitanak es eros algoritmikus jelzes.' },
  ig_saves: { title: 'Mentesek', text: 'Hanyszor mentetted el a tartalmaidat. A mentes az egyik legertkesebb interakcio.', tip: 'Oktatasi tartalmak kapjak a legtobb mentest.' },
  ig_profile_views: { title: 'Profilnezetek', text: 'Hanyszor neztek meg a profilodat.', tip: 'Kiemelt tortenetek es letisztult bio novelik a profillatasbol eredo konverziot.' },
  ig_media_count: { title: 'Tartalmak', text: 'Az adott idoszakban kozzetett tartalmak szama.', tip: 'Mix tartalom (Reels + carousel + slideshow) a leghatekonaabb strategia.' },
  ig_new_followers: { title: 'Napi uj kovetok', text: 'Az idoszakban szerzett napi uj kovetok osszesitese.', tip: 'A Reels es Collaboration posztok a legjobb uj koveto szerzesi modszerek.' },
  ig_save_rate_kpi: { title: 'Mentesi arany', text: 'A mentesek aranya az elereshez kepest.', tip: '2-3% feletti mentesiarany kivalo.' },
  ig_story_reach: { title: 'Story eleres', text: 'Az Instagram Story-k osszesitett elerese.', tip: 'A rendszeres (napi 3-5) Story hasznalat fenntartja az erdeklodest.' },
  ig_interactions_total: { title: 'Osszes interakcio', text: 'Like + komment + megosztas + mentes osszege.', tip: 'A mentes es megosztas nagyobb sullyal esik latba az algoritmusnal.' },
  ig_like_per_reach: { title: 'Like / eleres', text: 'A like-ok aranya az elereshez kepest szazalekban.', tip: '3-5% feletti arany jo teljesitmenyt jelez.' },
  ig_er: { title: 'Engagement Rate', text: 'Az osszes interakcio aranya az elereshez kepest.', tip: 'Instagramon a 3-6% kozotti ER jo, 6% felett kivalo.' },
  ig_avg_reach_media: { title: 'Atl. eleres/tartalom', text: 'Egy tartalomra juto atlagos eleres.', tip: 'Ha ez csokken, probaalj meg tobb Reels-t posztolni.' },
  ig_avg_likes_media: { title: 'Atl. like/tartalom', text: 'Egy tartalomra juto atlagos like.', tip: 'Esztetikus vizualis konzisztencia noveli a like-ok szamat.' },
  ig_avg_comments_media: { title: 'Atl. komment/tartalom', text: 'Egy tartalomra juto atlagos kommentszam.', tip: 'A szemelyes tortenetek tobb kommentet generalnak.' },
  ig_avg_saves_media: { title: 'Atl. mentes/tartalom', text: 'Egy tartalomra juto atlagos mentesszam.', tip: 'Carousel tippek es checklistak maximalizaljak a menteseket.' },
  ig_avg_shares_media: { title: 'Atl. megosztas/tartalom', text: 'Egy tartalomra juto atlagos megosztasszam.', tip: 'A relatable memes es idezetek kapjak a legtobb DM-megosztast.' },
  igpub_likes: { title: 'Like-ok', text: 'A nyilvanosan elerheto like-ok szama.', tip: 'Pontos elemzeshez Instagram Business fiok szukseges.' },
  igpub_comments: { title: 'Kommentek', text: 'A nyilvanosan lathato kommentek szama.', tip: 'A kommentek hangulata is fontos, nem csak a szam.' },
  igpub_avg_likes: { title: 'Atl. like/poszt', text: 'Egy posztra juto atlagos like.', tip: 'Ez jo benchmark a jovobeli tartalmak tervezesehez.' },
  igpub_avg_comments: { title: 'Atl. komment/poszt', text: 'Egy posztra juto atlagos komment.', tip: 'A kommentek melysege is fontos mutato.' },
  igpub_media: { title: 'Tartalmak', text: 'Az idoszak alatt kozzetett tartalmak szama.', tip: 'A rendszeresseg fontosabb, mint a mennyiseg.' },
  igpub_interactions: { title: 'Osszes interakcio', text: 'Like-ok + kommentek osszege.', tip: 'Publikus adatokbol elerheto interakciok.' },
  igpub_avg_interaction: { title: 'Atl. interakcio/poszt', text: 'Egy posztra juto atlagos interakciok.', tip: 'Hasonlitsd ossze az iparagi atlaggal.' },
  yt_subs: { title: 'Uj feliratkozok', text: 'Az adott idoszakban szerzett uj feliratkozok szama.', tip: 'A video vegen hasznalj feliratkozasi CTA-t es End Screen elemeket.' },
  yt_views_kpi: { title: 'Megtekintesek', text: 'Az osszes videomegtekintes az adott idoszakban.', tip: 'Az optimalis cim es thumbnail a megtekintesek legfontosabb hajtoereje.' },
  yt_watch: { title: 'Nezesi ido', text: 'Az osszes nezesi ido percben. A YouTube legfontosabb rangsorolasi tenyezoje.', tip: 'A hosszabb (8-15 perces) videok altalaban tobb osszesitett nezesi idot hoznak.' },
  yt_likes_kpi: { title: 'Like-ok', text: 'A videokra kapott like-ok osszessege.', tip: 'Kerd meg a nezoket a video kozben, hogy nyomjanak like-ot.' },
  yt_comments_kpi: { title: 'Kommentek', text: 'Az osszes komment az adott idoszakban.', tip: 'Pinned comment es Creator Heart funkciok osztonzik a kommentalast.' },
  yt_shares_kpi: { title: 'Megosztasok', text: 'Hanyszor osztottak meg a videoikat.', tip: 'A megosztható tartalmak (tippek, hogyan kell) terjednek a legjobban.' },
  yt_er: { title: 'ER%', text: 'Engagement Rate szazalekban: az interakciok aranya a megtekintesekhez kepest.', tip: 'YouTube-on a 4-6% kozotti ER jonak szamit.' },
  yt_video_count: { title: 'Videok', text: 'Az adott idoszakban kozzetett videok szama.', tip: 'Heti 1-2 video rendszeres posztolasa az idealis.' },
  yt_avg_view: { title: 'Atl. nezesi %', text: 'A nezok a video hany %-at neztek meg atlagosan.', tip: '50% felett kivalo! A video elejei hook es dinamikus szerkesztes segit.' },
  yt_playlist: { title: 'Playlist hozzaadas', text: 'Hanyszor adtak hozza a videoidat lejatszasi listakhoz.', tip: 'Hozz letre sajat lejatszasi listakat - noveli a nezesi idot.' },
  yt_like_per_view: { title: 'Like / megtekintes', text: 'A like-ok aranya a megtekintesekhez kepest.', tip: '4-5% feletti arany kivalo YouTube-on.' },
  yt_comment_per_view: { title: 'Komment / megtekintes', text: 'A kommentek aranya a megtekintesekhez kepest.', tip: 'A kerdesfelevo szekciok a videoban novelik ezt az aranyt.' },
  yt_interactions_total: { title: 'Osszes interakcio', text: 'Like + komment + megosztas osszege.', tip: 'A magas interakcio jelzi, hogy a tartalom rezonál a kozonseggel.' },
  yt_avg_views_video: { title: 'Atl. megtekintes/video', text: 'Egy videora juto atlagos megtekintesszam.', tip: 'Ha ez csokken, vizsgald felul a thumbnail-eket es cimeket.' },
  yt_avg_likes_video: { title: 'Atl. like/video', text: 'Egy videora juto atlagos like.', tip: 'Erzelmileg eros tartalom noveli a like-okat.' },
  yt_avg_comments_video: { title: 'Atl. komment/video', text: 'Egy videora juto atlagos kommentszam.', tip: 'Az ertekes diskurzus a cel.' },
  yt_avg_watch_time_video: { title: 'Atl. nezesi ido/video', text: 'Egy videora juto atlagos nezesi ido.', tip: 'Chapters (fejezetek) hozzadasa segit a nezoknek es noveli a nezesi idot.' },
  yt_avg_er_video: { title: 'Atl. ER%/video', text: 'Video szintu atlagos engagement rate.', tip: 'Az interaktiv elemek (polls, cards) novelik a videonkenti ER-t.' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTableData(chart: ChartData | undefined): any[] {
  if (!chart || chart.empty || !chart.data?.series?.[0]?.data) return [];
  return chart.data.series[0].data as any[];
}

function tableSum(chart: ChartData | undefined, field: string): number {
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
