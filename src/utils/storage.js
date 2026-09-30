// จัดการบันทึกและค้นหาข้อมูลการจอง ข้อมูลสมาชิก และโปรแกรมทัวร์ (Dynamic CRUD) ใน LocalStorage + Cloud Sync
import { TOURS_DATA } from '../data/toursData';
import { getRegionByProvince } from './thaiProvinces';
import {
  fetchCloudUsers,
  pushCloudUsers,
  pushSingleCloudUser,
  fetchCloudTours,
  pushCloudTours,
  pushCloudBooking
} from './cloudSync';

const STORAGE_KEY = 'sukjai_tour_bookings_v2';
const USER_KEY = 'sukjai_user_profile_v2';
const TOURS_KEY = 'sukjai_tours_data_v3';
const REGISTERED_USERS_KEY = 'sukjai_registered_users_v2';


// ข้อมูลผู้ดูแลระบบ (Admin)
export const ADMIN_CREDENTIALS = {
  phone: '0999999999',
  pin: '8888',
  name: 'ผู้ดูแลระบบ (Admin)',
  avatar: '🛡️',
  role: 'admin',
  department: 'ฝ่ายจัดการการเดินทางและลูกค้าสัมพันธ์'
};

const INITIAL_MOCK_BOOKINGS = [
  {
    id: "SKJ-2026-8801",
    createdAt: new Date().toISOString(),
    tourId: "tour-nakhon-pathom",
    tourTitle: "สุขใจ ไหว้พระเมืองนครปฐม",
    tourDestination: "นครปฐม",
    tourDuration: "1 วัน (ไปเช้า-เย็นกลับ)",
    departureDate: "18 เมษายน 2026",
    travelersCount: 2,
    leadName: "คุณตาประสิทธิ์ มีสุข",
    leadPhone: "0819876543",
    leadAge: "72",
    emergencyContact: "คุณแอน (ลูกสาว) 0891234567",
    specialNeeds: {
      wheelchair: true,
      hasNurseAssistance: true,
      dietary: "อาหารโซเดียมต่ำ",
      medicalNote: "ความดันโลหิตสูง ทานยาช่วงเช้า"
    },
    seats: ["A1", "B1"],
    coTravelers: [
      {
        name: "คุณยายวิไลวรรณ มีสุข",
        age: "70",
        seat: "B1",
        specialNeeds: {
          wheelchair: false,
          hasNurseAssistance: true,
          dietary: "อาหารอ่อนเคี้ยวง่าย",
          medicalNote: "เบาหวาน ทานยาหลังอาหาร"
        }
      }
    ],
    isBookedByChild: true,
    childGreeting: "ขอให้คุณพ่อเที่ยวให้สนุก สุขภาพแข็งแรง อิ่มบุญอิ่มใจนะคะ รักพ่อค่ะ",
    customerNote: "ขอที่นั่งใกล้ประตูรถ และขอเจ้าหน้าที่ช่วยประคองคุณยายตอนขึ้นลงรถครับ",
    totalAmount: 7780,
    paymentMethod: "QR PromptPay",
    paymentStatus: "ชำระเงินสำเร็จ (ยืนยันแล้ว)",
    assignedGuide: "ไกด์สมชาย (081-222-3344)",
    assignedNurse: "พยาบาลวิภา (089-555-6677)",
    pickupPoint: "จุดขึ้นรถ VIP สถานีรถไฟฟ้าหมอชิต (ประตู 3) เวลา 07:30 น."
  },
  {
    id: "SKJ-2026-8802",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    tourId: "tour-ayutthaya",
    tourTitle: "สุขใจ อิ่มบุญเมืองเก่า",
    tourDestination: "พระนครศรีอยุธยา",
    tourDuration: "1 วัน (ไปเช้า-เย็นกลับ)",
    departureDate: "19 เมษายน 2026",
    travelersCount: 1,
    leadName: "คุณยายสมศรี บุญมาก",
    leadPhone: "0898765432",
    leadAge: "68",
    emergencyContact: "คุณต้น (ลูกชาย) 0867891234",
    specialNeeds: {
      wheelchair: false,
      hasNurseAssistance: true,
      dietary: "อาหารเจ/มังสวิรัติ",
      medicalNote: "ข้อเข่าเสื่อมเล็กน้อย เดินช้า"
    },
    seats: ["A2"],
    isBookedByChild: false,
    childGreeting: "",
    customerNote: "ขออาหารเจแบบเคร่งครัด ไม่ใส่กระเทียม และขอที่นั่งริมหน้าต่าง",
    totalAmount: 4190,
    paymentMethod: "QR PromptPay",
    paymentStatus: "ชำระเงินสำเร็จ (ยืนยันแล้ว)",
    assignedGuide: "ไกด์กัญญา (082-333-4455)",
    assignedNurse: "พยาบาลศิริพร (089-666-7788)",
    pickupPoint: "จุดขึ้นรถ VIP สถานีรถไฟฟ้าหมอชิต (ประตู 3) เวลา 07:30 น."
  }
];

// In-memory cache to avoid repeated synchronous JSON.parse overhead on every render
let _cachedTours = null;
let _cachedBookings = null;

// Listen for external storage changes across tabs to invalidate memory cache
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === TOURS_KEY) _cachedTours = null;
    if (e.key === STORAGE_KEY) _cachedBookings = null;
  });
}

// ==========================================
// TOURS CRUD (สำหรับ Admin เพิ่ม/ลบ/แก้ไข)
// ==========================================
export function getStoredTours() {
  if (_cachedTours) {
    return _cachedTours;
  }
  try {
    const raw = localStorage.getItem(TOURS_KEY);
    if (!raw) {
      // ตรวจสอบข้อมูลจาก v2 เผื่อแอดมินเคยสร้างทัวร์ใหม่ไว้
      let initialList = [...TOURS_DATA];
      try {
        const oldRaw = localStorage.getItem('sukjai_tours_data_v2');
        if (oldRaw) {
          const oldList = JSON.parse(oldRaw);
          if (Array.isArray(oldList)) {
            const defaultIds = new Set(TOURS_DATA.map(t => t.id));
            const customTours = oldList.filter(t => !defaultIds.has(t.id));
            initialList = [...customTours, ...TOURS_DATA];
          }
        }
      } catch (_) {}

      localStorage.setItem(TOURS_KEY, JSON.stringify(initialList));
      _cachedTours = initialList;
      return initialList;
    }
    const parsed = JSON.parse(raw);
    const tourList = Array.isArray(parsed) && parsed.length > 0 ? parsed : TOURS_DATA;
    _cachedTours = tourList.map(t => ({
      ...t,
      region: getRegionByProvince(t.destination || '')
    }));
    return _cachedTours;
  } catch (e) {
    console.error("Failed to read tours", e);
    return TOURS_DATA;
  }
}

export function saveStoredTours(tours) {
  try {
    _cachedTours = tours;
    
    // พยายามบันทึกลง LocalStorage
    try {
      localStorage.setItem(TOURS_KEY, JSON.stringify(tours));
    } catch (quotaError) {
      console.warn("Storage quota warning! ปรับแต่งขนาดรูปภาพเพื่อรักษาข้อมูลทริปและกำหนดการ...", quotaError);
      // หากเนื้อที่เต็มเนื่องจากภาพ Base64 ขนาดใหญ่ ให้ย่อหรือใช้ภาพสำรองเพื่อป้องกันข้อมูลกำหนดการสูญหาย
      const sanitized = tours.map(t => {
        if (typeof t.image === 'string' && t.image.length > 200000) {
          return {
            ...t,
            image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'
          };
        }
        return t;
      });
      localStorage.setItem(TOURS_KEY, JSON.stringify(sanitized));
      _cachedTours = sanitized;
    }

    // แจ้งเตือน Component ให้ทราบว่าข้อมูลทัวร์อัปเดตแล้ว
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sukjai_tours_updated', { detail: { tours: _cachedTours } }));
    }

    // ส่งข้อมูลทัวร์ขึ้น Cloud อัตโนมัติ (Async ใน Background) เพื่อให้เครื่องอื่นเห็นตรงกัน
    pushCloudTours(_cachedTours).catch(err => {
      console.warn('[CloudSync] pushCloudTours background error:', err);
    });

    return _cachedTours;
  } catch (e) {
    console.error("Failed to save tours", e);
    return tours;
  }
}


export function addTour(newTour) {
  const current = getStoredTours();
  const updated = [newTour, ...current];
  saveStoredTours(updated);
  return updated;
}

export function updateTour(updatedTour) {
  const current = getStoredTours();
  const updated = current.map(t => t.id === updatedTour.id ? updatedTour : t);
  saveStoredTours(updated);
  return updated;
}

export function deleteTour(tourId) {
  const current = getStoredTours();
  const updated = current.filter(t => t.id !== tourId);
  saveStoredTours(updated);
  return updated;
}

// ==========================================
// BOOKINGS (สำหรับดูรายการจอง & Export CSV)
// ==========================================
export function getBookings() {
  if (_cachedBookings) {
    return _cachedBookings;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_BOOKINGS));
      _cachedBookings = INITIAL_MOCK_BOOKINGS;
      return INITIAL_MOCK_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      _cachedBookings = parsed;
      return parsed;
    }
    _cachedBookings = [];
    return [];
  } catch (e) {
    console.error("Failed to read bookings", e);
    return [];
  }
}

export function saveBooking(newBooking) {
  try {
    const current = getBookings();
    const updated = [newBooking, ...current];
    _cachedBookings = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sukjai_bookings_updated', { detail: { newBooking } }));
    
    // ซิงค์การจองขึ้น Cloud
    pushCloudBooking(newBooking).catch(() => {});
    return newBooking;
  } catch (e) {
    console.error("Failed to save booking", e);
    return newBooking;
  }
}


export function deleteBooking(bookingId) {
  try {
    const current = getBookings();
    const cleanId = (bookingId || '').trim();
    const baseId = cleanId.replace(/-[0-9]+$/, '');
    const updated = current.filter(b => b.id !== cleanId && b.id !== baseId);
    _cachedBookings = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sukjai_bookings_updated', { detail: { deletedId: cleanId, baseId, updated } }));
    return updated;
  } catch (e) {
    console.error("Failed to delete booking", e);
    return getBookings();
  }
}

export function updateBookingStatus(bookingId, newStatus) {
  try {
    const current = getBookings();
    const updated = current.map(b => b.id === bookingId ? { ...b, paymentStatus: newStatus } : b);
    _cachedBookings = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to update booking status", e);
    return getBookings();
  }
}

export function findBookingsByPhone(phoneNumber) {
  const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  const all = getBookings();
  return all.filter(b => {
    const bPhone = (b.leadPhone || '').replace(/[^0-9]/g, '');
    const bEmergency = (b.emergencyContact || '').replace(/[^0-9]/g, '');
    return bPhone.includes(cleanPhone) || bEmergency.includes(cleanPhone) || (b.id && b.id.toLowerCase().includes(cleanPhone.toLowerCase()));
  });
}

export function getUserBookingsByPhone(phoneNumber) {
  const clean = (phoneNumber || '').replace(/[^0-9]/g, '');
  if (!clean) return [];
  const all = getBookings();
  return all.filter(b => {
    const bPhone = (b.leadPhone || '').replace(/[^0-9]/g, '');
    return bPhone === clean;
  });
}

// ขยายรายการจองที่มีมากกว่า 1 ท่าน ให้แยกเป็นแถวของแต่ละบุคคล พร้อมรหัสการจองต่อเนื่อง (เช่น SKJ-2026-8801-01, SKJ-2026-8801-02)
export function expandBookingsToPassengers(bookings) {
  const result = [];

  (bookings || []).forEach(b => {
    const totalCount = Math.max(Number(b.travelersCount) || 1, b.seats?.length || 1);
    const perPersonPrice = Math.round((Number(b.totalAmount) || 0) / totalCount);

    if (totalCount <= 1) {
      result.push({
        id: b.id,
        displayId: b.id,
        parentBookingId: b.id,
        passengerIndex: 1,
        totalPassengers: 1,
        isLead: true,
        createdAt: b.createdAt,
        leadName: b.leadName || 'ผู้เดินทาง',
        name: b.leadName || 'ผู้เดินทาง',
        age: b.leadAge || '-',
        phone: b.leadPhone || '-',
        contactNote: '',
        customerNote: b.customerNote || b.childGreeting || '',
        tourTitle: b.tourTitle || '-',
        tourDestination: b.tourDestination || '-',
        departureDate: b.departureDate || '-',
        seat: b.seats?.[0] || '1 ที่นั่ง',
        specialNeeds: b.specialNeeds || {},
        amount: b.totalAmount || 0,
        totalGroupAmount: b.totalAmount || 0,
        paymentMethod: b.paymentMethod || 'QR PromptPay',
        paymentStatus: b.paymentStatus || 'ชำระเงินสำเร็จ (ยืนยันแล้ว)',
        rawBooking: b
      });
    } else {
      // 1. ผู้จองหลัก (คนที่ 1)
      result.push({
        id: `${b.id}-01`,
        displayId: `${b.id}-01`,
        parentBookingId: b.id,
        passengerIndex: 1,
        totalPassengers: totalCount,
        isLead: true,
        createdAt: b.createdAt,
        leadName: b.leadName || 'ผู้จองหลัก',
        name: b.leadName || 'ผู้จองหลัก',
        age: b.leadAge || '-',
        phone: b.leadPhone || '-',
        contactNote: 'ผู้จองหลัก',
        customerNote: b.customerNote || b.childGreeting || '',
        tourTitle: b.tourTitle || '-',
        tourDestination: b.tourDestination || '-',
        departureDate: b.departureDate || '-',
        seat: b.seats?.[0] || '1A',
        specialNeeds: b.specialNeeds || {},
        amount: perPersonPrice,
        totalGroupAmount: b.totalAmount || 0,
        paymentMethod: b.paymentMethod || 'QR PromptPay',
        paymentStatus: b.paymentStatus || 'ชำระเงินสำเร็จ (ยืนยันแล้ว)',
        rawBooking: b
      });

      // 2. ผู้ร่วมเดินทาง (คนที่ 2..N)
      for (let i = 1; i < totalCount; i++) {
        const co = b.coTravelers?.[i - 1] || {};
        const coNeeds = co.specialNeeds || {
          wheelchair: co.needWheelchair || false,
          hasNurseAssistance: co.needNurseHelp || false,
          dietary: co.dietary || 'ปกติ (หวาน-เค็มน้อย)',
          medicalNote: co.medicalNote || ''
        };

        const subNum = String(i + 1).padStart(2, '0');
        const defaultName = i === 1 && b.id === 'SKJ-2026-8801' ? 'คุณยายวิไลวรรณ มีสุข' : `${b.leadName} (ผู้ร่วมเดินทางคนที่ ${i + 1})`;

        result.push({
          id: `${b.id}-${subNum}`,
          displayId: `${b.id}-${subNum}`,
          parentBookingId: b.id,
          passengerIndex: i + 1,
          totalPassengers: totalCount,
          isLead: false,
          createdAt: b.createdAt,
          leadName: b.leadName,
          name: co.name?.trim() ? co.name : defaultName,
          age: co.age || (b.id === 'SKJ-2026-8801' && i === 1 ? '70' : '-'),
          phone: b.leadPhone || '-',
          contactNote: `ติดต่อผ่านคุณ${(b.leadName || '').split(' ')?.[0] || 'ผู้จอง'}`,
          customerNote: b.customerNote || b.childGreeting || '',
          tourTitle: b.tourTitle || '-',
          tourDestination: b.tourDestination || '-',
          departureDate: b.departureDate || '-',
          seat: b.seats?.[i] || co.seat || `1${String.fromCharCode(65 + i)}`,
          specialNeeds: coNeeds,
          amount: perPersonPrice,
          totalGroupAmount: b.totalAmount || 0,
          paymentMethod: b.paymentMethod || 'QR PromptPay',
          paymentStatus: b.paymentStatus || 'ชำระเงินสำเร็จ (ยืนยันแล้ว)',
          rawBooking: b
        });
      }
    }
  });

  return result;
}

// Export Bookings to CSV (Format สำหรับเปิดใน Excel หรือ Google Sheets แยกรายบุคคล)
export function exportBookingsToCSV() {
  const rawBookings = getBookings();
  const passengers = expandBookingsToPassengers(rawBookings);

  const headers = [
    "รหัสการจองรายบุคคล",
    "รหัสกลุ่มการจอง",
    "ลำดับในกลุ่ม",
    "วันที่ทำรายการ",
    "โปรแกรมทัวร์",
    "จังหวัด",
    "รอบวันเดินทาง",
    "หมายเลขที่นั่ง",
    "ชื่อผู้เดินทาง",
    "อายุ",
    "เบอร์โทรศัพท์",
    "ผู้ติดต่อหลัก",
    "ต้องการวีลแชร์",
    "อาหารพิเศษ",
    "โน้ตสุขภาพ",
    "ยอดชำระต่อท่าน (บาท)",
    "ช่องทางการชำระเงิน",
    "สถานะการชำระเงิน",
    "หมายเหตุเพิ่มเติมถึงทีมงาน"
  ];

  const rows = passengers.map(p => [
    `"${p.displayId || ''}"`,
    `"${p.parentBookingId || ''}"`,
    `"${p.passengerIndex}/${p.totalPassengers}"`,
    `"${p.createdAt ? new Date(p.createdAt).toLocaleDateString('th-TH') : ''}"`,
    `"${(p.tourTitle || '').replace(/"/g, '""')}"`,
    `"${p.tourDestination || ''}"`,
    `"${p.departureDate || ''}"`,
    `"${p.seat || ''}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.age || '-',
    `"\t${p.phone || ''}"`,
    `"${(p.leadName || '').replace(/"/g, '""')}"`,
    p.specialNeeds?.wheelchair ? '"ต้องการ"' : '"ไม่ต้องการ"',
    `"${p.specialNeeds?.dietary || ''}"`,
    `"${(p.specialNeeds?.medicalNote || '').replace(/"/g, '""')}"`,
    p.amount || 0,
    `"${p.paymentMethod || 'QR PromptPay'}"`,
    `"${p.paymentStatus || 'ชำระแล้ว'}"`,
    `"${(p.customerNote || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Sukjai_Tour_Passengers_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// USER PROFILES & AUTHENTICATION
// ==========================================
const INITIAL_REGISTERED_USERS = [
  {
    id: 'usr-001',
    avatar: '👴',
    gender: 'ชาย',
    firstName: 'ประสิทธิ์',
    lastName: 'มีสุข',
    name: 'คุณตาประสิทธิ์ มีสุข',
    age: '72',
    phone: '0819876543',
    email: '',
    foodAllergy: 'ไม่แพ้อาหาร',
    emergencyName: 'คุณแอน',
    emergencyPhone: '0891234567',
    emergencyRelation: 'ลูกสาว',
    hasNoRelative: false,
    emergencyContact: 'คุณแอน (ลูกสาว) 0891234567',
    needWheelchair: true,
    needNurseHelp: true,
    dietary: 'อาหารโซเดียมต่ำ',
    medicalNote: 'ความดันโลหิตสูง'
  }
];

export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(INITIAL_REGISTERED_USERS));
      return INITIAL_REGISTERED_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read registered users", e);
    return INITIAL_REGISTERED_USERS;
  }
}

export function findUserByPhone(phoneNumber) {
  const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  // Check if it's Admin
  if (cleanPhone === ADMIN_CREDENTIALS.phone.replace(/[^0-9]/g, '')) {
    return ADMIN_CREDENTIALS;
  }

  const users = getRegisteredUsers();
  return users.find(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanPhone) || null;
}

// ค้นหาผู้ใช้แบบ Realtime ทั้งจากเครื่องนี้และจากระบบ Cloud
export async function findUserByPhoneAsync(phoneNumber) {
  // 1. ตรวจในเครื่องก่อน (รวดเร็วทันที)
  const localUser = findUserByPhone(phoneNumber);
  if (localUser) return localUser;

  const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  // 2. ถ้าในเครื่องไม่มี ให้ดึงจาก Cloud Sync (ช่วยแก้ปัญหาเข้าเครื่องอื่นไม่ได้)
  try {
    const cloudUsers = await fetchCloudUsers();
    if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      const match = cloudUsers.find(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
      if (match) {
        // นำมาแคชไว้ในเครื่องปัจจุบันสำหรับครั้งถัดไป
        const currentLocal = getRegisteredUsers();
        const updated = [match, ...currentLocal.filter(u => (u.phone || '').replace(/[^0-9]/g, '') !== cleanPhone)];
        try {
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));
        } catch {
          // ignore quota
        }
        return match;
      }
    }
  } catch (err) {
    console.warn('[findUserByPhoneAsync] Cloud lookup failed:', err);
  }

  return null;
}

export function registerUser(newUser) {
  try {
    const users = getRegisteredUsers();
    const cleanPhone = (newUser.phone || '').replace(/[^0-9]/g, '');
    const filtered = users.filter(u => (u.phone || '').replace(/[^0-9]/g, '') !== cleanPhone);
    const updated = [newUser, ...filtered];
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));
    } catch {
      // หากเนื้อที่รูป Profile ใหญ่เกิน ให้ย่ออวาตาร์กลับเป็นอีโมจิเริ่มต้น
      const fallbackUser = { ...newUser, avatar: '👴' };
      const fallbackList = [fallbackUser, ...filtered];
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(fallbackList));
    }
    saveUserProfile(newUser);

    // ซิงค์สมาชิกใหม่ขึ้น Cloud ทันที เพื่อให้ล็อกอินจากเครื่องอื่นได้
    pushSingleCloudUser(newUser).catch(err => {
      console.warn('[CloudSync] pushSingleCloudUser error:', err);
    });

    return newUser;
  } catch (e) {
    console.error("Failed to register user", e);
    saveUserProfile(newUser);
    return newUser;
  }
}


export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read user profile", e);
    return null;
  }
}

export function saveUserProfile(profile) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    
    // Also keep registered users in sync if not admin
    if (profile.role !== 'admin') {
      const users = getRegisteredUsers();
      const cleanPhone = (profile.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone) {
        const idx = users.findIndex(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...profile };
        } else {
          users.unshift(profile);
        }
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      }
    }

    return profile;
  } catch (e) {
    console.error("Failed to save user profile", e);
    return profile;
  }
}

export function clearUserProfile() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error("Failed to clear user profile", e);
  }
}

// ==========================================
// 5. AUTO BACKGROUND CLOUD SYNC INITIALIZER
// ==========================================
export async function initAutoCloudSync(onToursUpdated) {
  try {
    // 1. ดึงทัวร์ล่าสุดจาก Cloud
    const cloudTours = await fetchCloudTours();
    if (Array.isArray(cloudTours) && cloudTours.length > 0) {
      _cachedTours = cloudTours;
      try {
        localStorage.setItem(TOURS_KEY, JSON.stringify(cloudTours));
      } catch (err) {
        console.warn('Quota warning caching cloud tours:', err);
      }
      if (onToursUpdated) onToursUpdated(cloudTours);
    } else {
      // ถ้าบนคลาวด์ยังว่างอยู่ ให้เริ่มอัปโหลดทัวร์ตั้งต้นขึ้นไป
      const localTours = getStoredTours();
      pushCloudTours(localTours).catch(() => {});
    }

    // 2. ดึงสมาชิกล่าสุดจาก Cloud ผสานเข้ากับ Local
    const cloudUsers = await fetchCloudUsers();
    if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      const localUsers = getRegisteredUsers();
      const phoneSet = new Set(localUsers.map(u => (u.phone || '').replace(/[^0-9]/g, '')));
      let changed = false;
      cloudUsers.forEach(cu => {
        const p = (cu.phone || '').replace(/[^0-9]/g, '');
        if (p && !phoneSet.has(p)) {
          localUsers.push(cu);
          phoneSet.add(p);
          changed = true;
        }
      });
      if (changed) {
        try {
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(localUsers));
        } catch {
          // ignore
        }
      }
    } else {
      // อัปโหลดสมาชิกตั้งต้นขึ้นคลาวด์
      const localUsers = getRegisteredUsers();
      pushCloudUsers(localUsers).catch(() => {});
    }
  } catch (err) {
    console.warn('[initAutoCloudSync] Initial sync note:', err);
  }
}

