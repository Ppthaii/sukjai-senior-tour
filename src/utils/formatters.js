// ฟังก์ชันช่วยเหลือสำหรับจัดรูปแบบข้อมูล

export function formatPrice(price) {
  const num = typeof price === 'number' ? price : parseInt(String(price || 0).replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return '0 บาท';
  return num.toLocaleString('th-TH') + ' บาท';
}

export function generateBookingId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SKJ-2026-${randomNum}`;
}

export function formatDateThai(dateStr) {
  if (!dateStr) return '';
  return dateStr;
}
