// ระบบสั่งพิมพ์และสร้างใบเสร็จ/ตั๋วเดินทาง (Print & E-Receipt Generator)
// ทำงานได้ 100% ทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ตโฟน ไม่ติดบล็อกและจัดหน้าพอดีกระดาษ A4

import { formatPrice } from './formatters';

/**
 * สั่งพิมพ์ตั๋วและใบเสร็จรับเงินผ่าน Hidden Print Iframe
 * ป้องกันปัญหาหน้าว่าง (Blank page), CSS ทับซ้อนใน Single Page Application,
 * และรองรับการพิมพ์บนทุกเบราว์เซอร์อย่างราบรื่น
 * @param {Object} booking - ข้อมูลการจอง
 */
export function printBookingReceipt(booking) {
  if (!booking) return;

  // 1. จัดเตรียมข้อมูลผู้เดินทาง
  const coTravelersNames = Array.isArray(booking.coTravelers) && booking.coTravelers.length > 0
    ? booking.coTravelers.map(c => c.name).filter(Boolean).join(', ')
    : '';

  const allPassengersText = coTravelersNames
    ? `${booking.leadName}, ${coTravelersNames}`
    : booking.leadName || 'ผู้เดินทาง';

  const seatsText = Array.isArray(booking.selectedSeats) && booking.selectedSeats.length > 0
    ? booking.selectedSeats.join(', ')
    : Array.isArray(booking.seats) && booking.seats.length > 0
      ? booking.seats.join(', ')
      : '1 ที่นั่ง';

  const printDateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // 2. สร้างโครงสร้าง HTML สำหรับพิมพ์โดยเฉพาะ (A4 Format สะอาด คมชัด สไตล์มินิมอลเพื่อผู้สูงอายุ)
  const printHtml = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ตั๋วเดินทางและใบเสร็จ_${booking.id || 'Sukjai_Tour'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background: #ffffff;
      font-size: 13.5px;
      line-height: 1.5;
    }
    .receipt-container {
      max-width: 750px;
      margin: 0 auto;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      overflow: hidden;
    }
    .header-banner {
      background: #9c3858;
      color: #ffffff;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #78263f;
    }
    .brand-title {
      font-size: 20px;
      font-weight: bold;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-sub {
      font-size: 11px;
      opacity: 0.9;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }
    .receipt-badge {
      text-align: right;
    }
    .badge-doc {
      display: inline-block;
      background: #ffffff;
      color: #9c3858;
      font-size: 11px;
      font-weight: bold;
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .ref-no {
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .body-content {
      padding: 20px 24px;
    }
    .tour-hero-box {
      background: #fdf2f4;
      border-left: 5px solid #9c3858;
      padding: 12px 18px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 20px;
    }
    .tour-name {
      font-size: 18px;
      font-weight: bold;
      color: #9c3858;
      margin: 0 0 4px 0;
    }
    .tour-meta {
      font-size: 13px;
      color: #475569;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      background: #fafafa;
    }
    .info-title {
      font-size: 11px;
      color: #64748b;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 6px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }
    .info-val {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .highlight-seat {
      color: #9c3858;
      font-size: 17px;
      font-weight: bold;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .pricing-table th {
      background: #f1f5f9;
      text-align: left;
      padding: 8px 12px;
      font-size: 12px;
      border: 1px solid #cbd5e1;
    }
    .pricing-table td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      font-size: 13px;
    }
    .total-row {
      background: #f8fafc;
      font-weight: bold;
      font-size: 15px;
    }
    .paid-stamp {
      display: inline-block;
      border: 2px solid #16a34a;
      color: #16a34a;
      padding: 4px 14px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 14px;
      letter-spacing: 1px;
      transform: rotate(-3deg);
    }
    .greeting-box {
      background: #fffbeb;
      border: 1px dashed #f59e0b;
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 18px;
      font-style: italic;
      color: #92400e;
    }
    .footer-note {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    
    <!-- Top Header -->
    <div class="header-banner">
      <div>
        <h1 class="brand-title">🌸 สุขใจวัยเกษียณทัวร์</h1>
        <div class="brand-sub">SUKJAI SENIOR TOUR (PWA) | บริการท่องเที่ยวอบอุ่นเพื่อผู้สูงวัย</div>
      </div>
      <div class="receipt-badge">
        <span class="badge-doc">ใบเสร็จรับเงิน / ตั๋วเดินทาง (E-TICKET)</span>
        <div class="ref-no">REF: ${booking.id || '-'}</div>
      </div>
    </div>

    <div class="body-content">
      
      <!-- Tour Hero -->
      <div class="tour-hero-box">
        <div class="tour-name">${booking.tourTitle || 'โปรแกรมทัวร์เพื่อผู้สูงอายุ'}</div>
        <div class="tour-meta">
          🗓️ <strong>รูปแบบการเดินทาง:</strong> ${booking.departureDate || 'ทริป 1 วัน (ไปเช้า-เย็นกลับ)'} | 
          ⏱️ <strong>ระยะเวลา:</strong> ${booking.tourDuration || '1 วัน (ไปเช้า-เย็นกลับ)'}
        </div>
      </div>

      <!-- Passengers & Seats Info Grid -->
      <div class="grid-2">
        <div class="info-card">
          <div class="info-title">👤 รายชื่อผู้เดินทาง (${booking.travelersCount || 1} ท่าน)</div>
          <div class="info-val">${allPassengersText}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            📞 <strong>เบอร์ติดต่อหลัก:</strong> ${booking.leadPhone || '-'}
          </div>
          ${booking.emergencyContact ? `
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
            🚨 <strong>ติดต่อฉุกเฉิน:</strong> ${booking.emergencyContact}
          </div>` : ''}
        </div>

        <div class="info-card">
          <div class="info-title">💺 หมายเลขที่นั่ง & จุดขึ้นรถ</div>
          <div class="info-val highlight-seat">ที่นั่ง: ${seatsText}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">
            📍 <strong>จุดนัดพบ:</strong> ${booking.pickupPoint || 'จุดขึ้นรถ VIP หมอชิต 07:30 น.'}
          </div>
        </div>
      </div>

      <!-- Caregivers Info -->
      <div class="info-card" style="margin-bottom: 20px; background: #f0fdf4; border-color: #bbf7d0;">
        <div class="info-title" style="color: #166534; border-color: #86efac;">
          🩺 ทีมงานและบริการดูแลสุขภาพประจำรถ
        </div>
        <div style="display: flex; gap: 24px; font-size: 13px; color: #14532d; flex-wrap: wrap;">
          <div>👨‍💼 <strong>มัคคุเทศก์:</strong> ${booking.assignedGuide || 'ไกด์ประจำทัวร์'}</div>
          <div>👩‍⚕️ <strong>พยาบาลวิชาชีพ:</strong> ${booking.assignedNurse || 'พยาบาลวิชาชีพดูแลตลอดทริป'}</div>
          ${booking.specialNeeds?.wheelchair ? '<div>♿ <strong>มีบริการรถเข็นวีลแชร์</strong></div>' : ''}
          ${booking.specialNeeds?.dietary ? `<div>🍽️ <strong>อาหาร:</strong> ${booking.specialNeeds.dietary}</div>` : ''}
        </div>
      </div>

      ${booking.isBookedByChild && booking.childGreeting ? `
      <div class="greeting-box">
        <strong>💌 ข้อความส่งความรักจากลูกหลาน:</strong> "${booking.childGreeting}"
      </div>` : ''}

      ${booking.customerNote ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; margin-bottom: 20px; font-size: 12px;">
        <strong>💬 หมายเหตุเพิ่มเติมถึงทีมงาน:</strong> ${booking.customerNote}
      </div>` : ''}

      <!-- Payment Summary Table -->
      <table class="pricing-table">
        <thead>
          <tr>
            <th>รายการ</th>
            <th style="text-align: center; width: 100px;">จำนวนผู้เดินทาง</th>
            <th style="text-align: right; width: 140px;">ยอดรวมชำระ (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>แพ็กเกจ: ${booking.tourTitle || 'ทัวร์สุขใจ'}</strong>
              <div style="font-size: 11px; color: #64748b;">(รวมรถมินิบัส VIP, พยาบาลวิชาชีพ, อาหารกลางวันสุขภาพ, ค่าเข้าชม และประกันอุบัติเหตุ)</div>
            </td>
            <td style="text-align: center;">${booking.travelersCount || 1} ท่าน</td>
            <td style="text-align: right; font-weight: 600;">${formatPrice(booking.totalAmount)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2" style="text-align: right;">ยอดสุทธิทั้งหมด (Net Total):</td>
            <td style="text-align: right; color: #9c3858;">${formatPrice(booking.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Payment Status Stamp & Instructions -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;">
        <div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
            💳 <strong>ช่องทางชำระ:</strong> ${booking.paymentMethod || 'QR PromptPay'}
          </div>
          <div class="paid-stamp">
            ✓ ${booking.paymentStatus || 'ชำระเงินสำเร็จ (PAID)'}
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <div>พิมพ์เมื่อ: ${printDateStr}</div>
          <div>สามารถแสดงเอกสารนี้หรือภาพหน้าจอบนมือถือแก่เจ้าหน้าที่ในวันเดินทาง</div>
        </div>
      </div>

      <!-- Footer Contact -->
      <div class="footer-note">
        <div>บริษัท สุขใจวัยเกษียณทัวร์ จำกัด | โทรสายด่วนฉุกเฉิน 24 ชม.: 02-999-8888, 081-999-7777</div>
        <div>หน้า 1 / 1</div>
      </div>

    </div>
  </div>
</body>
</html>
  `;

  // 3. ปริ้นท์ผ่าน Hidden Iframe (ทำงานได้ชัวร์ 100% ไม่ติดบล็อกป็อปอัป และไม่กวนหน้าเว็บปัจจุบัน)
  let printIframe = document.getElementById('sukjai-print-iframe');
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = 'sukjai-print-iframe';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);
  }

  const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    // รอให้ Font และ DOM โหลดเสร็จแล้วสั่งพิมพ์
    setTimeout(() => {
      try {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to window.print():', err);
        window.print();
      }
    }, 450);
  } else {
    // Fallback ถ้าสร้าง iframe ไม่ได้
    window.print();
  }
}

/**
 * สั่งพิมพ์ใบรายชื่อผู้โดยสารและข้อมูลสุขภาพประจำทริป (Trip Passenger Manifest & Health Roster)
 * สำหรับหัวหน้าทัวร์และพยาบาลวิชาชีพใช้เช็คชื่อและดูแลลูกทัวร์บนรถมินิบัส
 * @param {Object} trip - ข้อมูลทริป
 * @param {Array} passengers - รายชื่อผู้โดยสารประจำทริป
 */
export function printTripManifest(trip, passengers = []) {
  if (!trip) return;

  const printDateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const wheelchairCount = passengers.filter(p => p.specialNeeds?.wheelchair).length;
  const dietCount = passengers.filter(p => p.specialNeeds?.dietary && p.specialNeeds.dietary !== 'ปกติ (หวาน-เค็มน้อย)').length;

  const rowsHtml = passengers.map((p, idx) => {
    const specialList = [];
    if (p.specialNeeds?.wheelchair) specialList.push('♿ ใช้วีลแชร์');
    if (p.specialNeeds?.dietary) specialList.push(`🍽️ ${p.specialNeeds.dietary}`);
    if (p.specialNeeds?.medicalNote) specialList.push(`⚠️ ${p.specialNeeds.medicalNote}`);
    if (p.customerNote) specialList.push(`💬 ${p.customerNote}`);
    const specialText = specialList.length > 0 ? specialList.join('<br>') : '-';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 8px 6px; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: #0284c7; background: #f0f9ff; border-radius: 4px;">${p.seat || '-'}</td>
        <td style="padding: 8px 6px;">
          <strong>${p.name || '-'}</strong>
          <div style="font-size: 11px; color: #64748b;">รหัส: ${p.displayId || p.id}</div>
        </td>
        <td style="padding: 8px 6px; text-align: center;">${p.age || '-'} ปี</td>
        <td style="padding: 8px 6px; text-align: center;">${p.phone || '-'}</td>
        <td style="padding: 8px 6px; font-size: 12px; line-height: 1.4;">${specialText}</td>
        <td style="padding: 8px 6px; text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; background: #dcfce7; color: #166534; font-weight: bold;">
            ${p.paymentStatus?.includes('มัดจำ') ? 'มัดจำแล้ว' : 'ชำระแล้ว'}
          </span>
        </td>
        <td style="padding: 8px 6px; text-align: center; border: 1px dashed #cbd5e1; width: 60px;">
          <div style="height: 18px;"></div>
        </td>
      </tr>
    `;
  }).join('');

  const printHtml = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ใบรายชื่อผู้โดยสาร_${trip.title || 'Trip'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
    }
    .manifest-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-box {
      border-bottom: 2px solid #9c3858;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #9c3858;
      margin: 0;
    }
    .subtitle {
      font-size: 13px;
      color: #475569;
      margin-top: 3px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
    }
    .meta-item {
      display: flex;
      gap: 5px;
    }
    .meta-item strong {
      color: #1e293b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      background: #9c3858;
      color: #ffffff;
      padding: 8px 6px;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
      border: 1px solid #9c3858;
    }
    .footer-note {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="manifest-container">
    <div class="header-box">
      <div>
        <h1 class="title">🚌 สุขใจวัยเกษียณทัวร์ — ใบรายชื่อผู้โดยสารและข้อมูลสุขภาพ</h1>
        <div class="subtitle">โปรแกรมทัวร์: <strong>${trip.title}</strong> (จ.${trip.destination || '-'})</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #64748b;">
        <div>พิมพ์เมื่อ: ${printDateStr}</div>
        <div style="font-weight: bold; color: #15803d; margin-top: 2px;">พยาบาลวิชาชีพร่วมเดินทาง</div>
      </div>
    </div>

    <div class="meta-box">
      <div class="meta-item"><strong>จำนวนผู้เดินทาง:</strong> ${passengers.length} ท่าน</div>
      <div class="meta-item"><strong>ผู้ใช้วีลแชร์:</strong> ${wheelchairCount} ท่าน</div>
      <div class="meta-item"><strong>อาหารพิเศษ/ข้อควรระวัง:</strong> ${dietCount} รายการ</div>
      <div class="meta-item"><strong>ยานพาหนะ:</strong> รถมินิบัส VIP สุขใจวัยเกษียณทัวร์</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 32px;">ลำดับ</th>
          <th style="width: 48px;">ที่นั่ง</th>
          <th>ชื่อ - สกุล ผู้เดินทาง</th>
          <th style="width: 50px;">อายุ</th>
          <th style="width: 95px;">เบอร์ติดต่อ</th>
          <th>ข้อมูลสุขภาพ / วีลแชร์ / อาหาร</th>
          <th style="width: 75px;">สถานะ</th>
          <th style="width: 55px;">เช็คชื่อ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">ยังไม่มีรายชื่อผู้โดยสารในทริปนี้</td></tr>'}
      </tbody>
    </table>

    <div class="footer-note">
      <div>บริษัท สุขใจวัยเกษียณทัวร์ จำกัด | หัวหน้าทัวร์ & พยาบาลวิชาชีพ โทรสายด่วน: 081-999-7777</div>
      <div>เอกสารภายในสำหรับการปฏิบัติการทริป</div>
    </div>
  </div>
</body>
</html>
  `;

  let printIframe = document.getElementById('sukjai-manifest-iframe');
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = 'sukjai-manifest-iframe';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);
  }

  const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    setTimeout(() => {
      try {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      } catch (err) {
        console.warn('Manifest iframe print error:', err);
        window.print();
      }
    }, 450);
  } else {
    window.print();
  }
}
