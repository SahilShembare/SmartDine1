import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BASE_URL = 'https://smartdine12.netlify.app';

const TABLES = [
  { num: '01', location: 'Window Side', capacity: 2, zone: 'Window Zone' },
  { num: '02', location: 'Main Hall', capacity: 4, zone: 'Central Dining' },
  { num: '03', location: 'Main Hall', capacity: 4, zone: 'Central Dining' },
  { num: '04', location: 'Family Booth', capacity: 6, zone: 'Family Section' },
  { num: '05', location: 'Terrace Balcony', capacity: 2, zone: 'Outdoor Balcony' },
  { num: '06', location: 'Terrace Balcony', capacity: 4, zone: 'Outdoor Balcony' },
  { num: '07', location: 'VIP Lounge', capacity: 8, zone: 'VIP Royal Section' },
  { num: '08', location: 'Main Hall', capacity: 4, zone: 'Central Dining' },
  { num: '09', location: 'Garden Courtyard', capacity: 2, zone: 'Garden Area' },
  { num: '10', location: 'Garden Courtyard', capacity: 6, zone: 'Garden Area' },
  { num: '11', location: 'Window Side', capacity: 2, zone: 'Window Zone' },
  { num: '12', location: 'Main Hall', capacity: 4, zone: 'Central Dining' },
  { num: '13', location: 'Main Hall', capacity: 4, zone: 'Central Dining' },
  { num: '14', location: 'Family Booth', capacity: 6, zone: 'Family Section' },
  { num: '15', location: 'Terrace Balcony', capacity: 2, zone: 'Outdoor Balcony' }
];

async function generateQRCode(url) {
  return await QRCode.toDataURL(url, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
}

function renderTableCard(table, qrDataUrl) {
  const tableUrl = `${BASE_URL}/menu?table=${table.num}`;
  return `
  <div class="standee-card">
    <div class="card-inner">
      
      <!-- Brand Header -->
      <div class="brand-header">
        <div class="brand-logo-badge">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 2v20M6 2v20M2 7h20M2 17h20" stroke-linecap="round" />
          </svg>
        </div>
        <div class="brand-title-wrap">
          <div class="brand-name">SMART<span class="brand-highlight">DINE</span></div>
          <div class="brand-subtitle">CONTACTLESS DINING & ORDERING</div>
        </div>
      </div>

      <!-- Table Badge -->
      <div class="table-badge-section">
        <div class="table-badge">
          <span class="table-badge-label">TABLE</span>
          <span class="table-badge-number">${table.num}</span>
        </div>
        <div class="table-meta">
          <div class="table-location">${table.location}</div>
          <div class="table-capacity">Capacity: ${table.capacity} Guests • ${table.zone}</div>
        </div>
      </div>

      <!-- QR Code Section -->
      <div class="qr-container">
        <div class="qr-frame">
          <img class="qr-image" src="${qrDataUrl}" alt="Table ${table.num} QR Code" />
          <div class="qr-scan-badge">SCAN TO ORDER</div>
        </div>
        <div class="scan-cta">
          <div class="scan-cta-main">SCAN WITH ANY CAMERA OR GOOGLE LENS</div>
          <div class="scan-cta-sub">अपने फोन के कैमरे या Google Lens से स्कैन करें</div>
        </div>
      </div>

      <!-- 3-Step Ordering Instructions -->
      <div class="steps-grid">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-text">
            <strong>Scan QR</strong>
            <span>Point camera at code</span>
          </div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-text">
            <strong>Select Food</strong>
            <span>Browse delicious menu</span>
          </div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-text">
            <strong>Order & Enjoy</strong>
            <span>Served hot at table</span>
          </div>
        </div>
      </div>

      <!-- Card Footer -->
      <div class="card-footer">
        <div class="url-fallback">
          Direct Link: <span class="url-text">${tableUrl}</span>
        </div>
        <div class="wifi-note">
          📶 Free Wi-Fi Available • Instant Kitchen Ordering
        </div>
      </div>

    </div>
  </div>
  `;
}

async function buildHTML() {
  const tableDataWithQRs = await Promise.all(
    TABLES.map(async (table) => {
      const url = `${BASE_URL}/menu?table=${table.num}`;
      const qr = await generateQRCode(url);
      return { ...table, qr };
    })
  );

  // Group into pages: 2 tables per A4 sheet
  const pages = [];
  for (let i = 0; i < tableDataWithQRs.length; i += 2) {
    pages.push(tableDataWithQRs.slice(i, i + 2));
  }

  const pagesHtml = pages.map((pair, pageIdx) => {
    return `
    <div class="a4-sheet">
      <div class="sheet-header">
        <span>SmartDine Restaurant Table Standees — Sheet ${pageIdx + 1} of ${pages.length}</span>
        <span>A4 Print (Cut along the dotted center line for 2x Table Tent Cards)</span>
      </div>
      <div class="cards-grid">
        ${pair.map(table => renderTableCard(table, table.qr)).join('')}
      </div>
      <div class="sheet-footer">
        <span>Table ${pair[0].num} ${pair[1] ? `& Table ${pair[1].num}` : ''}</span>
        <span>https://smartdine12.netlify.app • High-Resolution Print Ready</span>
      </div>
    </div>
    `;
  }).join('');

  // Overview / Manager Index Page
  const summaryGridHtml = tableDataWithQRs.map(table => `
    <div class="summary-card">
      <div class="summary-top">
        <span class="summary-table-num">T-${table.num}</span>
        <span class="summary-loc">${table.location}</span>
      </div>
      <img class="summary-qr" src="${table.qr}" alt="T-${table.num}" />
      <div class="summary-meta">${table.capacity} Seats • ${table.zone}</div>
      <div class="summary-link">${BASE_URL}/menu?table=${table.num}</div>
    </div>
  `).join('');

  const indexPageHtml = `
  <div class="a4-sheet index-sheet">
    <div class="index-header">
      <div class="index-brand">
        <h1>SMART<span>DINE</span></h1>
        <p>RESTAURANT TABLE QR CODES — COMPLETE DIRECTORY (TABLE 01 TO 15)</p>
      </div>
      <div class="index-badge">15 TABLES READY</div>
    </div>

    <div class="index-info-bar">
      <div><strong>Target Domain:</strong> ${BASE_URL}</div>
      <div><strong>Ordering Mode:</strong> Contactless Mobile Table Ordering</div>
      <div><strong>Print Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
    </div>

    <div class="summary-grid">
      ${summaryGridHtml}
    </div>

    <div class="index-footer">
      <div>Instructions: The following 8 pages contain high-resolution tabletop standee cards ready for printing, cutting, and placing on tables 01 to 15.</div>
    </div>
  </div>
  `;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>SmartDine - Printable Table QR Standees (Tables 01-15)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f1f5f9;
        color: #0f172a;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* A4 Page Layout */
      @page {
        size: A4 portrait;
        margin: 8mm 8mm 8mm 8mm;
      }

      .a4-sheet {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto 15mm auto;
        background: #ffffff;
        padding: 8mm 8mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        page-break-after: always;
        break-after: page;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        position: relative;
      }

      @media print {
        body {
          background: #ffffff;
        }
        .a4-sheet {
          margin: 0;
          box-shadow: none;
          min-height: 280mm;
          height: auto;
          page-break-after: always;
          break-after: page;
        }
      }

      .sheet-header {
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding-bottom: 3mm;
        border-bottom: 1px solid #e2e8f0;
      }

      .sheet-footer {
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding-top: 3mm;
        border-top: 1px solid #e2e8f0;
      }

      /* 2 Standees per Sheet */
      .cards-grid {
        display: grid;
        grid-template-rows: 1fr 1fr;
        gap: 6mm;
        flex: 1;
        padding: 4mm 0;
        position: relative;
      }

      .cards-grid::after {
        content: '✂ Cut along this line';
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        text-align: center;
        font-size: 9px;
        font-weight: 700;
        color: #cbd5e1;
        letter-spacing: 1.5px;
        border-top: 1.5px dashed #cbd5e1;
        padding-top: 1.5mm;
      }

      /* Single Standee Card Styling */
      .standee-card {
        border: 2px solid #0f172a;
        border-radius: 14px;
        background: #ffffff;
        padding: 5mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
      }

      .standee-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: linear-gradient(90deg, #ea580c 0%, #f59e0b 50%, #10b981 100%);
      }

      .card-inner {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      }

      /* Brand Header */
      .brand-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 2mm;
        border-bottom: 1.5px solid #f1f5f9;
      }

      .brand-logo-badge {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
      }

      .brand-icon {
        width: 18px;
        height: 18px;
      }

      .brand-title-wrap {
        display: flex;
        flex-direction: column;
      }

      .brand-name {
        font-family: 'Outfit', sans-serif;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: -0.5px;
        color: #0f172a;
        line-height: 1;
      }

      .brand-highlight {
        color: #ea580c;
      }

      .brand-subtitle {
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: #64748b;
        margin-top: 2px;
      }

      /* Table Badge Section */
      .table-badge-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 2mm 0;
        padding: 2.5mm 3.5mm;
        background: #f8fafc;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }

      .table-badge {
        display: flex;
        align-items: baseline;
        gap: 6px;
        background: #0f172a;
        color: #ffffff;
        padding: 4px 12px;
        border-radius: 8px;
      }

      .table-badge-label {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: #f97316;
      }

      .table-badge-number {
        font-family: 'Outfit', sans-serif;
        font-size: 20px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: 0.5px;
      }

      .table-meta {
        text-align: right;
      }

      .table-location {
        font-size: 13px;
        font-weight: 800;
        color: #0f172a;
      }

      .table-capacity {
        font-size: 9.5px;
        font-weight: 600;
        color: #64748b;
        margin-top: 1px;
      }

      /* QR Code Center */
      .qr-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin: 2mm 0;
      }

      .qr-frame {
        background: #ffffff;
        padding: 6px;
        border: 2px solid #0f172a;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      }

      .qr-image {
        width: 108px;
        height: 108px;
        display: block;
      }

      .qr-scan-badge {
        font-size: 7.5px;
        font-weight: 900;
        letter-spacing: 1px;
        background: #ea580c;
        color: #ffffff;
        padding: 2px 8px;
        border-radius: 4px;
        margin-top: 4px;
      }

      .scan-cta {
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 160px;
      }

      .scan-cta-main {
        font-family: 'Outfit', sans-serif;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.3;
        color: #0f172a;
        letter-spacing: -0.2px;
      }

      .scan-cta-sub {
        font-size: 9px;
        font-weight: 600;
        color: #475569;
        margin-top: 3px;
        line-height: 1.3;
      }

      /* 3 Steps Ordering Guide */
      .steps-grid {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f1f5f9;
        border-radius: 8px;
        padding: 2mm 3mm;
        margin: 2mm 0;
      }

      .step-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .step-num {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #ea580c;
        color: #ffffff;
        font-size: 10px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .step-text {
        display: flex;
        flex-direction: column;
      }

      .step-text strong {
        font-size: 9.5px;
        font-weight: 800;
        color: #0f172a;
        line-height: 1;
      }

      .step-text span {
        font-size: 7.5px;
        color: #64748b;
        font-weight: 600;
        margin-top: 1px;
      }

      .step-arrow {
        font-size: 12px;
        font-weight: 900;
        color: #94a3b8;
      }

      /* Card Footer */
      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 2mm;
        border-top: 1px solid #f1f5f9;
        font-size: 8px;
      }

      .url-fallback {
        color: #64748b;
        font-weight: 600;
      }

      .url-text {
        font-family: 'JetBrains Mono', monospace;
        color: #ea580c;
        font-weight: 700;
      }

      .wifi-note {
        color: #059669;
        font-weight: 700;
      }

      /* Directory / Summary Sheet */
      .index-sheet {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 4mm;
      }

      .index-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 3mm;
      }

      .index-brand h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 26px;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: -0.5px;
        line-height: 1;
      }

      .index-brand h1 span {
        color: #ea580c;
      }

      .index-brand p {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: #64748b;
        margin-top: 2px;
      }

      .index-badge {
        background: #0f172a;
        color: #f97316;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 1px;
        padding: 6px 14px;
        border-radius: 8px;
      }

      .index-info-bar {
        display: flex;
        justify-content: space-between;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 3mm 4mm;
        font-size: 10px;
        color: #475569;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 3.5mm;
        margin-top: 2mm;
      }

      .summary-card {
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        padding: 2.5mm;
        text-align: center;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .summary-top {
        display: flex;
        justify-content: space-between;
        width: 100%;
        align-items: center;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 2px;
        margin-bottom: 2px;
      }

      .summary-table-num {
        font-family: 'Outfit', sans-serif;
        font-weight: 900;
        font-size: 11px;
        color: #ea580c;
      }

      .summary-loc {
        font-size: 7.5px;
        font-weight: 700;
        color: #64748b;
      }

      .summary-qr {
        width: 58px;
        height: 58px;
        margin: 2px 0;
      }

      .summary-meta {
        font-size: 7px;
        font-weight: 700;
        color: #0f172a;
      }

      .summary-link {
        font-size: 5.5px;
        font-family: 'JetBrains Mono', monospace;
        color: #94a3b8;
        word-break: break-all;
      }

      .index-footer {
        margin-top: auto;
        border-top: 1px solid #e2e8f0;
        padding-top: 2mm;
        font-size: 8.5px;
        color: #64748b;
        font-weight: 600;
        text-align: center;
      }
    </style>
  </head>
  <body>
    ${indexPageHtml}
    ${pagesHtml}
  </body>
  </html>
  `;
}

async function main() {
  console.log('Generating SmartDine Table QR Codes for Tables 01 to 15...');
  const htmlContent = await buildHTML();

  const htmlPath = path.resolve(ROOT_DIR, 'SmartDine_Table_QR_Printable.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`Saved printable HTML: ${htmlPath}`);

  const pdfPath = path.resolve(ROOT_DIR, 'SmartDine_Table_QR_Codes_1-15.pdf');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    htmlPath
  ];

  console.log('Converting to PDF via Microsoft Edge headless...');
  execFile(edgePath, args, (err) => {
    if (err) {
      console.error('Error generating PDF:', err);
      process.exit(1);
    }
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`✅ Successfully generated PDF: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.error('PDF file was not created.');
    }
  });
}

main().catch(console.error);
