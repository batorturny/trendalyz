// ============================================
// DASHBOARD-STYLE PDF TEMPLATE
// Dark theme HTML template for Puppeteer PDF generation
// ============================================

const PLATFORM_COLORS = {
  TIKTOK_ORGANIC: '#06b6d4',
  TIKTOK_ADS: '#ec4899',
  FACEBOOK_ORGANIC: '#3b82f6',
  INSTAGRAM_ORGANIC: '#a855f7',
  INSTAGRAM_PUBLIC: '#a855f7',
  YOUTUBE: '#ef4444',
};

const PLATFORM_LABELS = {
  TIKTOK_ORGANIC: 'TikTok',
  TIKTOK_ADS: 'TikTok Ads',
  FACEBOOK_ORGANIC: 'Facebook',
  INSTAGRAM_ORGANIC: 'Instagram',
  INSTAGRAM_PUBLIC: 'Instagram Public',
  YOUTUBE: 'YouTube',
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNumber(val) {
  if (val == null) return '–';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return val.toLocaleString('hu-HU');
    return val.toLocaleString('hu-HU', { maximumFractionDigits: 2 });
  }
  return String(val);
}

function formatMonth(month) {
  const MONTHS = [
    'Január', 'Február', 'Március', 'Április',
    'Május', 'Június', 'Július', 'Augusztus',
    'Szeptember', 'Október', 'November', 'December',
  ];
  const [year, m] = month.split('-').map(Number);
  return `${year}. ${MONTHS[m - 1]}`;
}

/**
 * Build a complete HTML document for the dashboard PDF.
 * @param {Object} params
 * @param {string} params.companyName
 * @param {string} params.platform - e.g. 'TIKTOK_ORGANIC'
 * @param {string} params.platformLabel
 * @param {string} params.month - 'YYYY-MM'
 * @param {Array<{label: string, value: string|number, description?: string}>} params.kpis
 * @param {Array<{category: string, label: string, charts: Array}>} [params.sections]
 * @param {Array<Object>} [params.videos]
 * @param {string|null} [params.adminNote]
 * @param {string} [params.borderColor]
 * @returns {string} Full HTML document
 */
function buildDashboardPdfHtml({
  companyName,
  platform,
  platformLabel,
  month,
  kpis = [],
  sections = [],
  videos = [],
  adminNote = null,
  borderColor,
}) {
  const color = borderColor || PLATFORM_COLORS[platform] || '#06b6d4';
  const label = platformLabel || PLATFORM_LABELS[platform] || platform;
  const monthDisplay = formatMonth(month);

  // KPI grid: 5 columns
  const kpiCols = Math.min(5, kpis.length || 1);

  const kpiCardsHtml = kpis.map(kpi => `
    <div class="kpi-card">
      <div class="kpi-label">${escapeHtml(kpi.label)}</div>
      <div class="kpi-value">${formatNumber(kpi.value)}</div>
      ${kpi.description ? `<div class="kpi-desc">${escapeHtml(kpi.description)}</div>` : ''}
    </div>
  `).join('');

  // Admin note
  const adminNoteHtml = adminNote ? `
    <div class="admin-note">
      <div class="admin-note-title">Megjegyzés</div>
      <div class="admin-note-text">${escapeHtml(adminNote)}</div>
    </div>
  ` : '';

  // Video table
  let videoTableHtml = '';
  if (videos && videos.length > 0) {
    const videoRows = videos.map(v => {
      const link = v.url || v.link || v.videoUrl || '';
      const title = v.title || v.description || v.caption || '–';
      const titleHtml = link
        ? `<a href="${escapeHtml(link)}" class="video-link">${escapeHtml(title.substring(0, 80))}</a>`
        : escapeHtml(title.substring(0, 80));
      return `
        <tr>
          <td>${titleHtml}</td>
          <td class="num">${formatNumber(v.views)}</td>
          <td class="num">${formatNumber(v.likes)}</td>
          <td class="num">${formatNumber(v.comments)}</td>
          <td class="num">${formatNumber(v.shares)}</td>
          ${v.engagementRate != null ? `<td class="num">${typeof v.engagementRate === 'number' ? v.engagementRate.toFixed(2) + '%' : v.engagementRate}</td>` : ''}
        </tr>
      `;
    }).join('');

    const hasER = videos.some(v => v.engagementRate != null);
    videoTableHtml = `
      <div class="section">
        <h3 class="section-title" style="border-color: ${color}">Videók / Tartalmak</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tartalom</th>
              <th class="num">Nézések</th>
              <th class="num">Like</th>
              <th class="num">Komment</th>
              <th class="num">Megosztás</th>
              ${hasER ? '<th class="num">ER%</th>' : ''}
            </tr>
          </thead>
          <tbody>${videoRows}</tbody>
        </table>
      </div>
    `;
  }

  // Daily trend data tables (from chart sections that have daily data)
  let dailyTablesHtml = '';
  if (sections && sections.length > 0) {
    for (const section of sections) {
      if (!section.charts || section.charts.length === 0) continue;
      for (const chart of section.charts) {
        if (chart.type === 'table') continue; // already handled as videos
        if (!chart.data?.labels || !chart.data?.series?.[0]?.data) continue;
        if (chart.data.labels.length === 0) continue;

        const rows = chart.data.labels.map((lbl, i) => {
          const cells = chart.data.series.map(s => `<td class="num">${formatNumber(s.data[i])}</td>`).join('');
          return `<tr><td>${escapeHtml(lbl)}</td>${cells}</tr>`;
        }).join('');

        const headerCells = chart.data.series.map(s => `<th class="num">${escapeHtml(s.name)}</th>`).join('');

        dailyTablesHtml += `
          <div class="section">
            <h3 class="section-title" style="border-color: ${color}">${escapeHtml(chart.title)}</h3>
            <table class="data-table">
              <thead><tr><th>Dátum</th>${headerCells}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;
      }
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 12mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f1117;
      color: #e2e8f0;
      font-size: 11px;
      line-height: 1.4;
    }

    .header {
      background: linear-gradient(135deg, ${color}22, ${color}11);
      border: 1px solid ${color}44;
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left h1 {
      font-size: 22px;
      font-weight: 800;
      color: #f1f5f9;
      margin-bottom: 4px;
    }
    .header-left .meta {
      font-size: 13px;
      color: #94a3b8;
    }
    .header-right {
      text-align: right;
    }
    .header-right .platform-label {
      font-size: 14px;
      font-weight: 700;
      color: ${color};
    }
    .header-right .month-label {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .admin-note {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
    }
    .admin-note-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .admin-note-text {
      font-size: 12px;
      color: #cbd5e1;
      white-space: pre-wrap;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(${kpiCols}, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 800;
      color: #f1f5f9;
    }
    .kpi-desc {
      font-size: 9px;
      color: #64748b;
      margin-top: 4px;
    }

    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
      border-left: 3px solid ${color};
      padding-left: 10px;
      margin-bottom: 10px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
      font-size: 10px;
    }
    .data-table th {
      background: #0f172a;
      padding: 8px 10px;
      text-align: left;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.3px;
    }
    .data-table th.num { text-align: right; }
    .data-table td {
      padding: 7px 10px;
      border-top: 1px solid #1e293b;
      color: #cbd5e1;
    }
    .data-table td.num { text-align: right; font-weight: 600; color: #e2e8f0; }
    .data-table tbody tr:nth-child(even) { background: #1a2332; }

    .video-link {
      color: ${color};
      text-decoration: none;
    }
    .video-link:hover { text-decoration: underline; }

    .footer {
      margin-top: 30px;
      padding-top: 14px;
      border-top: 1px solid #334155;
      text-align: center;
      font-size: 10px;
      color: #475569;
    }
    .footer strong { color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${escapeHtml(companyName)}</h1>
      <div class="meta">Havi riport</div>
    </div>
    <div class="header-right">
      <div class="platform-label">${escapeHtml(label)}</div>
      <div class="month-label">${escapeHtml(monthDisplay)}</div>
    </div>
  </div>

  ${adminNoteHtml}

  <div class="kpi-grid">
    ${kpiCardsHtml}
  </div>

  ${videoTableHtml}

  ${dailyTablesHtml}

  <div class="footer">
    <strong>Trendalyz</strong> &mdash; Social Media Analytics
  </div>
</body>
</html>`;
}

module.exports = { buildDashboardPdfHtml };
