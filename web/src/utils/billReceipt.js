import { jsPDF } from 'jspdf';
import { formatOrderNumber, formatInvoiceNumber } from './orderNumber';
import toast from 'react-hot-toast';

/**
 * Generate standard HTML for printable SmartDine Tax Invoice
 */
export const generateBillHtml = (receipt) => {
  const tblNo = receipt.tableNumber || '01';
  const invNo = formatInvoiceNumber(receipt.invoiceNumber || 'INV-2026-001');
  const ordNo = receipt.orderNumber || (receipt.orderId ? formatOrderNumber(receipt.orderId) : 'ORD-1001');
  const customerName = receipt.customerName || `Table ${tblNo} Guest`;
  const paidTime = receipt.paidAt || new Date().toLocaleString();
  const txnId = receipt.transactionId || 'TXN-COUNTER';
  const payMethod = receipt.paymentMethod || (receipt.isPaid ? 'Online Payment (Verified)' : 'Pay at Counter');
  const isPaid = Boolean(receipt.isPaid);

  const items = (receipt.items && receipt.items.length > 0) ? receipt.items : [];
  const totalAmt = Number(receipt.amount ?? receipt.total ?? 0);
  const subtotalAmt = Number(receipt.subtotal ?? (totalAmt * 0.95));
  const taxAmt = Number(receipt.tax ?? (totalAmt * 0.05));
  const discAmt = Number(receipt.discount ?? receipt.discountAmount ?? 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SmartDine Invoice - Table ${tblNo} - ${invNo}</title>
  <style>
    @page {
      margin: 10mm;
      size: auto;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #F8FAFC;
      color: #0F172A;
    }
    .invoice-container {
      max-width: 540px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 2px solid #CBD5E1;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #020617 0%, #0F172A 100%);
      color: #F8FAFC;
      padding: 22px 20px 18px;
      text-align: center;
      border-bottom: 3px solid #F59E0B;
    }
    .restaurant-title {
      font-size: 22px;
      font-weight: 900;
      color: #F59E0B;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .tagline {
      font-size: 11px;
      color: #CBD5E1;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 14px 20px;
      background: #F8FAFC;
      border-bottom: 1.5px dashed #CBD5E1;
      font-size: 11px;
    }
    .meta-box span {
      color: #64748B;
      display: block;
      font-size: 9.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .meta-box strong {
      color: #0F172A;
      font-size: 12px;
    }
    .table-badge {
      display: inline-block;
      background: #EA580C;
      color: #FFFFFF;
      padding: 2px 8px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 11px;
    }
    .legal-strip {
      background: #FFFBEB;
      border-bottom: 1px dashed #FDE68A;
      padding: 6px 20px;
      font-size: 9.5px;
      color: #92400E;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .items-table th {
      background: #0F172A;
      color: #F59E0B;
      padding: 9px 18px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-table td {
      padding: 10px 18px;
      border-bottom: 1px solid #F1F5F9;
    }
    .items-table tr:nth-child(even) {
      background: #F8FAFC;
    }
    .veg-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: #16A34A;
      margin-right: 6px;
      vertical-align: middle;
    }
    .nonveg-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: #E11D48;
      margin-right: 6px;
      vertical-align: middle;
    }
    .calc-section {
      padding: 14px 20px;
      background: #F8FAFC;
      border-top: 2px dashed #CBD5E1;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 5px;
      color: #64748B;
      font-weight: 600;
    }
    .calc-row.discount {
      color: #16A34A;
      font-weight: 800;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      margin-top: 6px;
      border-top: 2px solid #0F172A;
      font-size: 14px;
      font-weight: 900;
      color: #0F172A;
    }
    .grand-total .amount {
      color: #EA580C;
      font-size: 20px;
      font-weight: 900;
      font-family: monospace;
    }
    .paid-stamp {
      background: ${isPaid ? '#ECFDF5' : '#FFFBEB'};
      border: 2px solid ${isPaid ? '#059669' : '#D97706'};
      color: ${isPaid ? '#059669' : '#B45309'};
      padding: 9px;
      border-radius: 12px;
      text-align: center;
      font-weight: 900;
      font-size: 12px;
      margin: 12px 20px;
    }
    .footer {
      background: #020617;
      color: #F59E0B;
      text-align: center;
      padding: 12px;
      font-size: 11px;
      font-weight: 700;
    }
    @media print {
      body {
        padding: 0;
        background: #FFFFFF;
      }
      .invoice-container {
        border: 1px solid #CBD5E1;
        box-shadow: none;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1 class="restaurant-title">👑 SMARTDINE RESTAURANT</h1>
      <div class="tagline">Authentic Royal Indian Cuisine • Tax Invoice</div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <span>Tax Invoice No</span>
        <strong style="font-family: monospace; font-size: 12px; color: #0F172A;">${invNo}</strong>
      </div>
      <div class="meta-box" style="text-align: right;">
        <span>Order Token</span>
        <strong style="font-family: monospace; font-size: 12px; color: #EA580C;">${ordNo}</strong>
      </div>
      <div class="meta-box">
        <span>Dining Table</span>
        <div><span class="table-badge">Table ${tblNo}</span> <span style="font-size:11px; color:#334155;">(${customerName})</span></div>
      </div>
      <div class="meta-box" style="text-align: right;">
        <span>Date & Time</span>
        <strong style="font-size: 11px;">${paidTime}</strong>
      </div>
    </div>

    <div class="legal-strip">
      <span><strong>GSTIN:</strong> 27AABCS1429B1Z8</span>
      <span><strong>SAC:</strong> 996331 (Dining)</span>
      <span><strong>FSSAI Lic:</strong> 11522036000412</span>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Delicacy / Dish</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <span class="${item.isVeg !== false ? 'veg-dot' : 'nonveg-dot'}"></span>
              <strong>${item.name || 'Delicacy'}</strong>
            </td>
            <td style="text-align: center; color: #EA580C; font-weight: 800;">${item.quantity || 1}x</td>
            <td style="text-align: right; color: #64748B;">₹${(Number(item.price) || 0).toFixed(0)}</td>
            <td style="text-align: right; font-weight: 800; color: #0F172A;">₹${(Number(item.totalPrice) || ((Number(item.price) || 0) * (Number(item.quantity) || 1))).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="calc-section">
      <div class="calc-row">
        <span>Subtotal (${items.length} items)</span>
        <strong style="color: #0F172A;">₹${subtotalAmt.toFixed(2)}</strong>
      </div>
      ${discAmt > 0 ? `
      <div class="calc-row discount">
        <span>Discount Applied</span>
        <span>-₹${discAmt.toFixed(2)}</span>
      </div>` : ''}
      <div class="calc-row">
        <span>CGST (2.5%)</span>
        <strong style="color: #0F172A;">₹${(taxAmt / 2).toFixed(2)}</strong>
      </div>
      <div class="calc-row">
        <span>SGST (2.5%)</span>
        <strong style="color: #0F172A;">₹${(taxAmt / 2).toFixed(2)}</strong>
      </div>
      <div class="grand-total">
        <span>${isPaid ? 'GRAND TOTAL PAID' : 'PAYABLE BILL AMOUNT'}</span>
        <span class="amount">₹${totalAmt.toFixed(2)}</span>
      </div>
    </div>

    <div class="paid-stamp">
      ${isPaid 
        ? `PAID & VERIFIED OFFICIAL INVOICE ✅ (${payMethod})<br><small style="font-size: 10px; font-weight: 600; color: #047857;">Txn ID: ${txnId}</small>`
        : `OFFICIAL BILL - PENDING CASH / COUNTER SETTLEMENT ⏳<br><small style="font-size: 10px; font-weight: 600; color: #92400E;">Payable at reception or table captain</small>`
      }
    </div>

    <div class="footer">
      ✨ Thank you for dining with SmartDine! Visit Again! ✨
    </div>
  </div>
</body>
</html>`;
};

/**
 * Robust Print Function using hidden iframe (prevents popup blocker on mobile & desktop)
 */
export const printBill = (receipt) => {
  const htmlContent = generateBillHtml(receipt);

  try {
    let iframe = document.getElementById('smartdine-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'smartdine-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    toast.loading('Opening printer...', { id: 'printing-bill-toast', duration: 1500 });

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.open:', err);
        fallbackWindowPrint(htmlContent);
      }
    }, 400);
  } catch (err) {
    console.warn('Iframe setup failed, falling back:', err);
    fallbackWindowPrint(htmlContent);
  }
};

const fallbackWindowPrint = (htmlContent) => {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (win) {
    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
  } else {
    window.print();
  }
};

/**
 * Generate High-DPI (2x Retina) Pure White Background Canvas of the Invoice
 */
export const generateBillCanvas = (receipt) => {
  const tblNo = receipt.tableNumber || '01';
  const invNo = formatInvoiceNumber(receipt.invoiceNumber || 'INV-2026-001');
  const ordNo = receipt.orderNumber || (receipt.orderId ? formatOrderNumber(receipt.orderId) : 'ORD-1001');
  const paidTime = receipt.paidAt || new Date().toLocaleString();
  const txnId = receipt.transactionId || 'TXN-COUNTER';
  const payMethod = receipt.paymentMethod || (receipt.isPaid ? 'Online Payment (Verified)' : 'Pay at Counter');
  const isPaid = Boolean(receipt.isPaid);

  const items = (receipt.items && receipt.items.length > 0) ? receipt.items : [];
  const totalAmt = Number(receipt.amount ?? receipt.total ?? 0);
  const subtotalAmt = Number(receipt.subtotal ?? (totalAmt * 0.95));
  const taxAmt = Number(receipt.tax ?? (totalAmt * 0.05));
  const discAmt = Number(receipt.discount ?? receipt.discountAmount ?? 0);

  const canvas = document.createElement('canvas');
  const width = 640;
  // Calculate dynamic height based on dish count
  const baseHeight = 490;
  const height = Math.max(540, baseHeight + (items.length * 30));

  canvas.width = width * 2; // 2x Retina resolution
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // 1. PURE 100% SOLID CRISP WHITE BACKGROUND
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Border & Header Banner
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#F59E0B';
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Top Dark Header Bar
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(17, 17, width - 34, 86);

  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👑 SMARTDINE RESTAURANT', width / 2, 54);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 10.5px system-ui, -apple-system, sans-serif';
  ctx.fillText('AUTHENTIC ROYAL INDIAN CUISINE • TAX INVOICE', width / 2, 76);

  // Gold Divider Under Header
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(16, 103);
  ctx.lineTo(width - 16, 103);
  ctx.stroke();

  // 3. Meta Data Grid Row
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 9.5px system-ui, sans-serif';
  ctx.fillText('TAX INVOICE NO', 36, 126);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(invNo, 36, 142);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 9.5px system-ui, sans-serif';
  ctx.fillText('ORDER TOKEN', 190, 126);
  ctx.fillStyle = '#EA580C';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(ordNo, 190, 142);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 9.5px system-ui, sans-serif';
  ctx.fillText('DINING TABLE', width / 2 + 50, 126);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`Table ${tblNo}`, width / 2 + 50, 142);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 9.5px system-ui, sans-serif';
  ctx.fillText('DATE & TIME', width - 150, 126);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText(paidTime, width - 150, 142);

  // Divider Under Meta
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(32, 160);
  ctx.lineTo(width - 32, 160);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // GST & Legal Info Strip
  ctx.fillStyle = '#FFFBEB';
  ctx.fillRect(32, 166, width - 64, 22);
  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('GSTIN: 27AABCS1429B1Z8  |  SAC: 996331  |  FSSAI: 11522036000412', 40, 181);

  // 4. Items Table Header
  let y = 210;
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(32, y - 14, width - 64, 26);
  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText('DELICACY / DISH', 44, y + 3);
  ctx.fillText('QTY', width - 160, y + 3);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', width - 44, y + 3);

  // 5. Dish Items
  y += 26;
  items.forEach((item, idx) => {
    ctx.textAlign = 'left';
    // Veg / Non-Veg Indicator
    ctx.fillStyle = item.isVeg !== false ? '#16A34A' : '#E11D48';
    ctx.fillRect(44, y - 8, 8, 8);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11.5px system-ui, sans-serif';
    const cleanName = (item.name || 'Delicacy').substring(0, 26);
    ctx.fillText(cleanName, 60, y);

    ctx.fillStyle = '#EA580C';
    ctx.font = 'bold 11.5px system-ui, sans-serif';
    ctx.fillText(`${item.quantity || 1}x`, width - 160, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11.5px system-ui, sans-serif';
    const rowPrice = Number(item.totalPrice) || ((Number(item.price) || 0) * (Number(item.quantity) || 1));
    ctx.fillText(`₹${rowPrice.toFixed(2)}`, width - 44, y);

    y += 24;
  });

  // Divider Under Items
  y += 4;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(32, y);
  ctx.lineTo(width - 32, y);
  ctx.stroke();

  // 6. Subtotal & Taxes Breakdown
  y += 22;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('Subtotal', 44, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(`₹${subtotalAmt.toFixed(2)}`, width - 44, y);

  if (discAmt > 0) {
    y += 18;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#16A34A';
    ctx.fillText('Discount Applied', 44, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-₹${discAmt.toFixed(2)}`, width - 44, y);
  }

  y += 18;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.fillText('GST (5% SGST + CGST)', 44, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(`₹${taxAmt.toFixed(2)}`, width - 44, y);

  // Grand Total Row
  y += 24;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, y - 6);
  ctx.lineTo(width - 32, y - 6);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(isPaid ? 'GRAND TOTAL PAID' : 'PAYABLE BILL AMOUNT', 44, y + 10);

  ctx.fillStyle = '#EA580C';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`₹${totalAmt.toFixed(2)}`, width - 44, y + 10);

  // 7. Status Stamp Box
  y += 38;
  ctx.fillStyle = isPaid ? '#ECFDF5' : '#FFFBEB';
  ctx.fillRect(32, y, width - 64, 44);
  ctx.strokeStyle = isPaid ? '#059669' : '#D97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, y, width - 64, 44);

  ctx.textAlign = 'center';
  ctx.fillStyle = isPaid ? '#059669' : '#B45309';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(
    isPaid ? `PAID & VERIFIED OFFICIAL INVOICE ✅ (${payMethod})` : `OFFICIAL BILL - PENDING CASH / COUNTER SETTLEMENT ⏳`,
    width / 2,
    y + 19
  );
  ctx.font = '10px monospace';
  ctx.fillStyle = isPaid ? '#15803D' : '#92400E';
  ctx.fillText(
    isPaid ? `Txn ID: ${txnId} • Safe 256-bit Verified` : `Please settle at cash reception or with table captain`,
    width / 2,
    y + 35
  );

  // 8. Footer
  y += 58;
  ctx.fillStyle = '#020617';
  ctx.fillRect(17, height - 36, width - 34, 20);
  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ Thank you for dining with SmartDine! Visit Again! ✨', width / 2, height - 22);

  return canvas;
};

/**
 * Direct Download as High-Resolution JPG Image
 */
export const downloadBillAsJpg = (receipt) => {
  try {
    const tblNo = receipt.tableNumber || '01';
    const invNo = formatInvoiceNumber(receipt.invoiceNumber || 'INV-2026-001');
    const canvas = generateBillCanvas(receipt);

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to generate image');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SmartDine_Invoice_Table${tblNo}_${invNo}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Bill downloaded as JPG Image! 🖼️', { icon: '🖼️' });
    }, 'image/jpeg', 1.0);
  } catch (err) {
    console.error('Download JPG Error:', err);
    toast.error('Could not download image: ' + err.message);
  }
};

/**
 * Direct Download as Clean Official PDF Document using jsPDF
 */
export const downloadBillAsPdf = (receipt) => {
  try {
    const tblNo = receipt.tableNumber || '01';
    const invNo = formatInvoiceNumber(receipt.invoiceNumber || 'INV-2026-001');
    const canvas = generateBillCanvas(receipt);

    // Convert high-DPI canvas to JPEG
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Dimensions in pt (standard PDF points)
    // 640px at 72/96 ratio is ~480pt wide
    const pdfWidth = 460;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [pdfWidth, pdfHeight]
    });

    doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    doc.save(`SmartDine_Invoice_Table${tblNo}_${invNo}.pdf`);

    toast.success('Bill downloaded as PDF Document! 📄', { icon: '📄' });
  } catch (err) {
    console.error('Download PDF Error:', err);
    toast.error('Could not download PDF: ' + err.message);
  }
};
