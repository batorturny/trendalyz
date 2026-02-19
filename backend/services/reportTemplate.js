// ============================================
// REPORT HTML TEMPLATE FOR PDF GENERATION
// Matches the Trendalyz dashboard design
// ============================================

const MONTH_NAMES = [
  'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
];

/**
 * Format a number like the KPICard component does.
 */
function formatKpiValue(value) {
  if (typeof value === 'number') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString('hu-HU');
  }
  return String(value);
}

/**
 * Build a standalone HTML document for a report PDF.
 * Design: grey background, white cards, gradient accent — matching the app.
 */
function buildReportHtml({ companyName, month, platformLabel, kpis, dailyMetrics, topVideos }) {
  const [year, monthNum] = month.split('-');
  const monthLabel = `${year}. ${MONTH_NAMES[parseInt(monthNum) - 1]}`;

  // Build KPI grid cards (like KPICard component)
  const kpiCards = (kpis || [])
    .filter(k => {
      const v = typeof k.value === 'number' ? k.value : parseFloat(String(k.value));
      return !isNaN(v) && v !== 0 || (typeof k.value === 'string' && k.value !== '0' && k.value !== 'NaN%');
    })
    .map(k => {
      const formatted = formatKpiValue(k.value);
      const valueLen = String(formatted).length;
      const fontSize = valueLen > 10 ? '18px' : valueLen > 7 ? '22px' : '28px';
      return `
        <div style="background: #ffffff; border: 1px solid #e0e0e4; border-radius: 12px; padding: 20px 12px; text-align: center; min-height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: ${fontSize}; font-weight: 800; color: #1a1a1e; margin-bottom: 4px; line-height: 1.1; word-break: break-all;">${formatted}</div>
          <div style="font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">${k.label}</div>
        </div>
      `;
    })
    .join('');

  // KPI section wrapped in grid
  const kpiSection = kpiCards ? `
    <div style="background: #ffffff; border: 1px solid #e0e0e4; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        ${kpiCards}
      </div>
    </div>
  ` : '';

  // Daily metrics table
  let dailySection = '';
  if (dailyMetrics && dailyMetrics.length > 0) {
    const headers = Object.keys(dailyMetrics[0]).filter(k => k !== 'date');
    const headerCells = headers.map(h =>
      `<th style="padding: 10px 12px; text-align: right; font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">${h}</th>`
    ).join('');
    const rows = dailyMetrics.map((row, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
      const cells = headers.map(h => {
        const v = typeof row[h] === 'number' ? row[h].toLocaleString('hu-HU') : (row[h] || '-');
        return `<td style="padding: 10px 12px; text-align: right; font-size: 12px; color: #1a1a1e;">${v}</td>`;
      }).join('');
      return `<tr style="background: ${bg}; border-bottom: 1px solid #f0f0f2;"><td style="padding: 10px 12px; font-size: 12px; color: #71717a; font-weight: 500;">${row.date}</td>${cells}</tr>`;
    }).join('');

    dailySection = `
      <div style="background: #ffffff; border: 1px solid #e0e0e4; border-radius: 16px; overflow: hidden; margin-bottom: 20px;">
        <div style="padding: 16px 20px 12px;">
          <h3 style="font-size: 15px; font-weight: 800; color: #1a1a1e; margin: 0;">Napi bontás</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f6; border-bottom: 1px solid #e0e0e4;">
              <th style="padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.3px;">Dátum</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // Top videos / content table
  let videosSection = '';
  if (topVideos && topVideos.length > 0) {
    const videoRows = topVideos.slice(0, 10).map((v, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
      return `
        <tr style="background: ${bg}; border-bottom: 1px solid #f0f0f2;">
          <td style="padding: 10px 12px; font-size: 12px; color: #71717a; font-weight: 600; width: 30px;">${i + 1}.</td>
          <td style="padding: 10px 12px; font-size: 12px; color: #1a1a1e; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v.title || '-'}</td>
          <td style="padding: 10px 12px; font-size: 12px; text-align: right; color: #1a1a1e; font-weight: 600;">${(v.views || 0).toLocaleString('hu-HU')}</td>
          <td style="padding: 10px 12px; font-size: 12px; text-align: right; color: #1a1a1e; font-weight: 600;">${(v.likes || 0).toLocaleString('hu-HU')}</td>
        </tr>
      `;
    }).join('');

    videosSection = `
      <div style="background: #ffffff; border: 1px solid #e0e0e4; border-radius: 16px; overflow: hidden; margin-bottom: 20px;">
        <div style="padding: 16px 20px 12px;">
          <h3 style="font-size: 15px; font-weight: 800; color: #1a1a1e; margin: 0;">Top tartalmak</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f6; border-bottom: 1px solid #e0e0e4;">
              <th style="padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; color: #71717a; width: 30px;">#</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase;">Cím</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase;">Nézések</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase;">Kedvelések</th>
            </tr>
          </thead>
          <tbody>${videoRows}</tbody>
        </table>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1e;
      background: #f4f4f6;
    }
    @page { margin: 0; }
  </style>
</head>
<body>
  <!-- Header with gradient accent -->
  <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 28px 32px 24px;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div>
        <h1 style="color: white; font-size: 20px; font-weight: 800; margin-bottom: 2px; letter-spacing: -0.3px;">Trendalyz</h1>
        <p style="color: rgba(255,255,255,0.75); font-size: 12px; font-weight: 500;">${platformLabel} riport</p>
      </div>
      <div style="text-align: right;">
        <p style="color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 600;">${monthLabel}</p>
      </div>
    </div>
  </div>

  <!-- Content on grey background -->
  <div style="padding: 24px 28px 32px; background: #f4f4f6;">

    <!-- Company title card -->
    <div style="background: #ffffff; border: 1px solid #e0e0e4; border-radius: 16px; padding: 20px 24px; margin-bottom: 20px;">
      <h2 style="font-size: 22px; font-weight: 800; color: #1a1a1e; margin-bottom: 2px; letter-spacing: -0.3px;">${companyName}</h2>
      <p style="color: #71717a; font-size: 13px; font-weight: 500;">${platformLabel} — ${monthLabel}</p>
    </div>

    <!-- KPI Cards Grid -->
    ${kpiSection}

    <!-- Daily Metrics -->
    ${dailySection}

    <!-- Top Videos -->
    ${videosSection}

    <!-- CTA card -->
    <div style="background: #ffffff; border: 1px solid #e0e0e4; border-radius: 16px; padding: 28px 24px; text-align: center;">
      <p style="color: #1a1a1e; font-size: 15px; font-weight: 600; margin-bottom: 6px;">Szeretnéd részletesebben látni a riportot?</p>
      <p style="color: #71717a; font-size: 13px; margin-bottom: 20px;">Lépj fel az oldalunkra, ahol a többi hónapodat is meg tudod nézni interaktív chartokkal.</p>
      <a href="https://trendalyz.hu/dashboard" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #22c55e); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">Részletes riport megtekintése</a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding: 14px 28px; background: #e8e8eb; text-align: center;">
    <p style="color: #a1a1aa; font-size: 10px; font-weight: 500;">
      Generálva: ${new Date().toLocaleDateString('hu-HU')} &nbsp;|&nbsp; Trendalyz &copy; ${new Date().getFullYear()}
    </p>
  </div>
</body>
</html>`;
}

module.exports = { buildReportHtml };
