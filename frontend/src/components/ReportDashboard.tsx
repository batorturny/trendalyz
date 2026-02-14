'use client';

import { ReportResponse } from '@/lib/api';
import { KPICard } from './KPICard';
import { Chart } from './Chart';
import { TopVideoCard } from './TopVideoCard';
import { VideoTable } from './VideoTable';
import { DemographicsCard } from './DemographicsCard';

interface Props {
  report: ReportResponse;
}

export function ReportDashboard({ report }: Props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/15 border border-white/20 rounded-3xl p-6">
        <h2 className="text-3xl font-black">{report.company.name}</h2>
        <p className="text-cyan-400 font-semibold mt-1">
          {report.dateRange.from} — {report.dateRange.to} &bull; {report.month.label}
        </p>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
          <KPICard
            label="Like"
            value={report.data.daily.totals.totalLikes}
            change={report.data.daily.totals.likesChange}
            description={{
              title: 'Like-ok (kedvelések)',
              text: 'Az adott időszakban kapott összes kedvelés a profilodon megjelent tartalmakra. A like a leggyakoribb interakció: azt jelzi, hogy a tartalmad tetszett a nézőknek.',
              tip: 'Ha a like-ok száma nő, de a kommentek és megosztások nem, próbálj interaktívabb tartalmakat készíteni (kérdések, szavazások, CTA-k). Az igazán értékes tartalom megosztást és kommentet is generál.',
            }}
          />
          <KPICard
            label="Komment"
            value={report.data.daily.totals.totalComments}
            change={report.data.daily.totals.commentsChange}
            description={{
              title: 'Kommentek',
              text: 'Az időszakban érkezett összes hozzászólás a tartalmaidhoz. A komment az egyik legértékesebb interakció, mert aktív párbeszédet jelent a közönségeddel.',
              tip: 'A TikTok algoritmusa előnyben részesíti a kommenteket generáló videókat. Tegyél fel kérdéseket a videóidban, válaszolj a kommentekre, és használj vitaindító kijelentéseket a kommentszám növeléséhez.',
            }}
          />
          <KPICard
            label="Megosztás"
            value={report.data.daily.totals.totalShares}
            change={report.data.daily.totals.sharesChange}
            description={{
              title: 'Megosztások',
              text: 'Hányszor osztották meg a tartalmaidat más platformokra vagy ismerősöknek. A megosztás a legerősebb jelzés az algoritmus számára, hogy a tartalom értékes.',
              tip: 'A megosztás az organikus növekedés motorja. Olyan tartalmak generálnak megosztást, amelyek hasznosak, meglepőek vagy érzelmileg megérintik a nézőt. Készíts „mentsd el / oszd meg" típusú tartalmakat (tippek, listák, tutorialok).',
            }}
          />
          <KPICard
            label="Profilnézet"
            value={report.data.daily.totals.totalProfileViews}
            change={report.data.daily.totals.profileViewsChange}
            description={{
              title: 'Profilnézetek',
              text: 'Hányan nézték meg a TikTok profilodat az adott időszakban. Ez azt mutatja, hogy a tartalmaid felkeltették az érdeklődést a márkád iránt.',
              tip: 'A magas profilnézet azt jelenti, hogy az emberek kíváncsiak rád. Győződj meg róla, hogy a profilod optimalizált: jó profilkép, leíró bio, linktree vagy weboldal link. Így a profilnézetek konverzióvá alakulhatnak.',
            }}
          />
          <KPICard
            label="Új követők"
            value={`${report.data.daily.totals.totalNewFollowers >= 0 ? '+' : ''}${report.data.daily.totals.totalNewFollowers}`}
            description={{
              title: 'Új követők',
              text: 'Az időszak alatt szerzett új követők nettó száma (új követők mínusz elvesztett követők). Ez a fiókod növekedési ütemét mutatja.',
              tip: 'Az új követők aránya a tartalmad hosszú távú vonzerejét jelzi. Ha sok a megtekintés de kevés az új követő, a tartalmad szórakoztató, de nem épít márkakapcsolatot. Építs tartalomsorozatokat, hogy a nézők visszatérjenek.',
            }}
          />
          <KPICard
            label="Videók"
            value={report.data.video.totals.videoCount}
            change={report.data.video.totals.videoCountChange}
            description={{
              title: 'Publikált videók',
              text: 'Az adott időszakban feltöltött videók száma. A rendszeres posztolás az egyik legfontosabb tényező a TikTok növekedésben.',
              tip: 'A TikTok heti 3-5 videót javasol az optimális eléréshez. A konzisztens posztolás fontosabb, mint a tökéletesség. Kísérletezz különböző formátumokkal és mérd, melyik teljesít legjobban.',
            }}
          />
          <KPICard
            label="Megtekintés"
            value={report.data.video.totals.totalViews}
            change={report.data.video.totals.viewsChange}
            description={{
              title: 'Videó megtekintések',
              text: 'Az időszakban publikált videók összes megtekintése. Minden egyes lejátszás egy megtekintésnek számít, beleértve az ismételt nézéseket is.',
              tip: 'A megtekintésszám önmagában nem elég — nézd meg az ER%-ot is mellette. 100.000 megtekintés 0,5% ER-rel kevésbé értékes, mint 10.000 megtekintés 8% ER-rel. A cél: magas megtekintés ÉS magas engagement együtt.',
            }}
          />
          <KPICard
            label="Elérés"
            value={report.data.video.totals.totalReach}
            change={report.data.video.totals.reachChange}
            description={{
              title: 'Elérés (egyedi nézők)',
              text: 'Hány egyedi felhasználó látta a tartalmaidat az időszakban. Szemben a megtekintéssel, itt minden személy csak egyszer számít, függetlenül attól, hányszor nézte meg a videóidat.',
              tip: 'Ha az elérés jóval alacsonyabb a megtekintésnél, az azt jelenti, hogy a nézőid többször is visszanézik a videóidat — ez pozitív jelzés! Ha az elérés stagnál, próbálj más hashtageket, posztolási időpontokat vagy tartalomtípusokat.',
            }}
          />
          <KPICard
            label="ER%"
            value={`${report.data.video.totals.avgEngagement.toFixed(2)}%`}
            description={{
              title: 'Engagement Rate (elköteleződési arány)',
              text: 'Az interakciók (like + komment + megosztás) és a megtekintések aránya százalékban. Ez a legfontosabb minőségi mutató, ami megmutatja, mennyire aktívan reagál a közönséged a tartalmaidra.',
              tip: 'TikTokon az 1% alatti ER gyenge, 1-3% átlagos, 3-6% jó, 6%+ kiváló. Ha alacsony az ER, próbálj rövidebb, dinamikusabb videókat, erősebb hookot az első 3 másodpercben, és interaktív elemeket (kérdés, szavazás).',
            }}
          />
          <KPICard
            label="Követők"
            value={report.data.daily.totals.currentFollowers}
            description={{
              title: 'Összes követő',
              text: 'A fiókod jelenlegi összes követőszáma. Ez a szám a márkád TikTok-os közönségméretét mutatja.',
              tip: 'A követőszám fontos, de nem minden. Egy kisebb, aktív közönség értékesebb, mint egy nagy, passzív. Fókuszálj a minőségi növekedésre: célcsoportodnak releváns tartalmak, amelyek valódi érdeklődőket vonzanak.',
            }}
          />
        </div>
      </div>

      {/* Charts Section */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">Napi trendek</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.likesData} label="Napi like-ok" color="#bc6aff" />
          <Chart type="line" labels={report.data.daily.chartLabels} data={report.data.daily.totalFollowersData} label="Követők száma" color="#00ff95" />
          <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.commentsData} label="Kommentek" color="#ffce44" height={250} />
          <Chart type="bar" labels={report.data.daily.chartLabels} data={report.data.daily.sharesData} label="Megosztások" color="#4d96ff" height={250} />
        </div>
      </section>

      {/* Top 3 Videos */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">Top 3 videó</h3>
        <div className="space-y-3">
          {report.data.video.top3.length > 0 ? (
            report.data.video.top3.map((video, idx) => (
              <TopVideoCard key={idx} video={video} rank={idx + 1} />
            ))
          ) : (
            <p className="text-slate-400">Nincs videó ebben a hónapban</p>
          )}
        </div>
      </section>

      {/* Video Table */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">Videó lista</h3>
        <VideoTable videos={report.data.video.videos} />
      </section>

      {/* Demographics */}
      <section>
        <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">Közönség megoszlása</h3>
        <DemographicsCard demographics={report.data.demographics} />
      </section>
    </div>
  );
}
