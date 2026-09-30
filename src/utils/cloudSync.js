// ระบบ Cloud Synchronization ข้ามอุปกรณ์ (Zero-Config Serverless Multi-Device Sync)
// ใช้งานผ่าน KV Cloud API ฟรี 100% ไม่ต้องเปิดคอมทิ้งไว้ ไม่ต้องมีเซิร์ฟเวอร์ส่วนตัว
// รองรับการทำงานแบบ Offline-first (ทำงานได้แม้ไม่มีเน็ต และจะซิงค์ให้อัตโนมัติเมื่อออนไลน์)

const BUCKET_ID = '3r3JHMPnsjRnEPKkToPrXc';
const BASE_URL = `https://kvdb.io/${BUCKET_ID}`;

// สถานะการซิงค์ปัจจุบัน
let _syncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncedAt: null,
  isSyncing: false,
  error: null
};

// Dispatch custom event เมื่อสถานะการซิงค์เปลี่ยน
function notifySyncChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sukjai_cloud_sync_status', { detail: { ..._syncStatus } }));
  }
}

export function getSyncStatus() {
  return { ..._syncStatus };
}

// Helper fetch พร้อม Timeout และ Anti-Cache ป้องกันเบราว์เซอร์และ Proxy แคชข้อมูลเก่า
async function safeFetch(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isGet = !options.method || options.method === 'GET';
    const response = await fetch(url, {
      ...options,
      cache: isGet ? 'no-store' : options.cache,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ==========================================
// 1. CLOUD USERS SYNC (ซิงค์สมาชิกข้ามเครื่อง)
// ==========================================

export async function fetchCloudUsers() {
  try {
    const res = await safeFetch(`${BASE_URL}/sukjai_users?_t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Cloud fetch users failed: ${res.status}`);
    }
    const text = await res.text();
    if (!text || text.trim() === '') return [];
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[CloudSync] fetchCloudUsers offline/error:', err.message);
    return null;
  }
}

export async function pushCloudUsers(usersList) {
  if (!Array.isArray(usersList)) return;
  try {
    _syncStatus.isSyncing = true;
    notifySyncChange();

    await safeFetch(`${BASE_URL}/sukjai_users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usersList)
    });

    _syncStatus.lastSyncedAt = new Date().toISOString();
    _syncStatus.error = null;
  } catch (err) {
    console.warn('[CloudSync] pushCloudUsers error:', err.message);
    _syncStatus.error = err.message;
  } finally {
    _syncStatus.isSyncing = false;
    notifySyncChange();
  }
}

export async function pushSingleCloudUser(newUser) {
  try {
    const cloudUsers = await fetchCloudUsers();
    const current = Array.isArray(cloudUsers) ? cloudUsers : [];
    const cleanPhone = (newUser.phone || '').replace(/[^0-9]/g, '');
    const filtered = current.filter(u => (u.phone || '').replace(/[^0-9]/g, '') !== cleanPhone);
    const updated = [newUser, ...filtered];
    await pushCloudUsers(updated);
  } catch (err) {
    console.warn('[CloudSync] pushSingleCloudUser error:', err.message);
  }
}

// ==========================================
// 2. CLOUD TOURS SYNC (ซิงค์แพ็กเกจทัวร์ & กำหนดการ)
// ==========================================

export async function fetchCloudTours() {
  try {
    const res = await safeFetch(`${BASE_URL}/sukjai_tours?_t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Cloud fetch tours failed: ${res.status}`);
    }
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    const data = JSON.parse(text);
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch (err) {
    console.warn('[CloudSync] fetchCloudTours offline/error:', err.message);
    return null;
  }
}

export async function pushCloudTours(toursList) {
  if (!Array.isArray(toursList)) return;
  try {
    _syncStatus.isSyncing = true;
    notifySyncChange();

    await safeFetch(`${BASE_URL}/sukjai_tours`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toursList)
    });

    _syncStatus.lastSyncedAt = new Date().toISOString();
    _syncStatus.error = null;
  } catch (err) {
    console.warn('[CloudSync] pushCloudTours error:', err.message);
    _syncStatus.error = err.message;
  } finally {
    _syncStatus.isSyncing = false;
    notifySyncChange();
  }
}

// ==========================================
// 3. CLOUD BOOKINGS SYNC (ซิงค์รายการจอง)
// ==========================================

export async function fetchCloudBookings() {
  try {
    const res = await safeFetch(`${BASE_URL}/sukjai_bookings?_t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn('[CloudSync] fetchCloudBookings error:', err.message);
    return null;
  }
}

export async function pushCloudBookings(bookingsList) {
  if (!Array.isArray(bookingsList)) return;
  try {
    await safeFetch(`${BASE_URL}/sukjai_bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingsList)
    });
  } catch (err) {
    console.warn('[CloudSync] pushCloudBookings error:', err.message);
  }
}

export async function pushCloudBooking(newBooking) {
  try {
    const current = await fetchCloudBookings();
    const list = Array.isArray(current) ? current : [];
    const updated = [newBooking, ...list.filter(b => b.id !== newBooking.id)];
    await pushCloudBookings(updated);
  } catch (err) {
    console.warn('[CloudSync] pushCloudBooking error:', err);
  }
}

// ==========================================
// 4. BACKUP & RESTORE UTILITIES (สำรองข้อมูล)
// ==========================================

export function exportAllDataAsJSON(users, tours, bookings) {
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
    appName: 'สุขใจวัยเกษียณทัวร์',
    data: {
      users: users || [],
      tours: tours || [],
      bookings: bookings || []
    }
  };
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sukjai_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
