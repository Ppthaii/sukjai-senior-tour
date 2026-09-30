// ฟังก์ชันช่วยเหลือสำหรับจัดรูปแบบข้อมูล

export function formatPrice(price) {
  if (typeof price !== 'number') return '0 บาท';
  return price.toLocaleString('th-TH') + ' บาท';
}

export function generateBookingId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SKJ-2026-${randomNum}`;
}

export function formatDateThai(dateStr) {
  if (!dateStr) return '';
  return dateStr;
}
