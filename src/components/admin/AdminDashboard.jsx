import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Plus, Trash2, Edit3, Eye, LogOut, 
  MapPin, Calendar, Users, DollarSign, HeartPulse, Accessibility, 
  FileSpreadsheet, Check, X, Upload, Image as ImageIcon, Sparkles,
  Clock, CheckCircle2, ArrowUp, ArrowDown, 
  Bus, Map as MapIcon, CreditCard, Cloud, Download, Loader2,
  Printer, Ticket
} from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import TourCard from '../tours/TourCard';
import { 
  getStoredTours, saveStoredTours, addTour, updateTour, deleteTour, 
  getBookings, deleteBooking, expandBookingsToPassengers 
} from '../../utils/storage';
import { compressImage } from '../../utils/imageCompressor';
import { fetchCloudTours, exportAllDataAsJSON } from '../../utils/cloudSync';
import { printBookingReceipt, printTripManifest } from '../../utils/printReceipt';
import { getRegionByProvince, ALL_THAI_PROVINCES } from '../../utils/thaiProvinces';
import './admin.css';
import '../tours/tours.css';

// ============================================================================
// TEMPLATES & PRESETS (สำหรับให้พนักงานกด 1-คลิก เพื่อข้อมูลที่สมบูรณ์และไร้ข้อผิดพลาด)
// ============================================================================

// กำหนดการเริ่มต้นแบบกระชับ
const DEFAULT_ITINERARY = [
  { time: '06:30 น.', activity: 'นัดพบ ณ สถานีขนส่งหมอชิต ตรวจสุขภาพเบื้องต้น' },
  { time: '06:45 น.', activity: 'เริ่มออกเดินทางด้วยรถมินิบัส VIP สุขใจวัยเกษียณทัวร์' },
  { time: '07:45 น.', activity: 'พักแวะเข้าห้องน้ำ ยืดเส้นยืดสาย และรับประทานอาหารว่าง' },
  { time: '12:00 น.', activity: 'รับประทานอาหารกลางวันเพื่อสุขภาพ' },
  { time: '16:30 น.', activity: 'เดินทางกลับถึงกรุงเทพฯ โดยสวัสดิภาพ' }
];

// คลังไฮไลท์ยอดนิยม (Quick Highlights)
const PRESET_HIGHLIGHTS = [
  'ไหว้พระขอพรวัดดังเพื่อความเป็นสิริมงคล',
  'กิจกรรม Workshop งานฝีมือสร้างสรรค์ (นำผลงานกลับบ้านฟรี)',
  'อาหารกลางวันเพื่อสุขภาพ ปรุงสดใหม่ โซเดียมต่ำ เคี้ยวง่าย ย่อยง่าย',
  'ล่องเรือชมธรรมชาติและสัมผัสวิถีชีวิตชุมชนริมน้ำ',
  'แวะช้อปปิ้งตลาดโบราณและเลือกซื้อของฝากท้องถิ่นขึ้นชื่อ',
  'จุดชมวิวถ่ายภาพที่ระลึกสวยงามและอบอุ่น',
  'เดินทางด้วยรถมินิบัส VIP ปรับอากาศ เบาะนุ่ม มีพื้นที่วางวีลแชร์',
  'พยาบาลวิชาชีพร่วมเดินทาง คอยดูแลตรวจสุขภาพตลอดทั้งทริป'
];

// คลังการดูแลสุขภาพผู้สูงอายุ (Quick Medical Care)
const PRESET_MEDICAL = [
  'พยาบาลวิชาชีพดูแลอย่างใกล้ชิดตลอดการเดินทาง',
  'ตรวจวัดความดันโลหิต ชีพจร และระดับน้ำตาลเบื้องต้นก่อนออกเดินทาง',
  'อุปกรณ์ปฐมพยาบาล ยาสามัญ และออกซิเจนกระบอกประจำรถมินิบัส',
  'บริการรถเข็นวีลแชร์สำรอง และทีมงานคอยช่วยเข็นทุกจุด',
  'แวะจุดพักเข้าห้องน้ำทุก 1 - 1.5 ชั่วโมง (ท่องเที่ยวแบบไม่เร่งรีบ)'
];

// รูปภาพตัวอย่างมาตรฐาน เผื่อพนักงานไม่มีรูปในเครื่อง
const PRESET_SAMPLE_IMAGES = [
  { label: '🛕 ทัวร์ไหว้พระ / เจดีย์', url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80' },
  { label: '🏛️ โบราณสถาน / อยุธยา', url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80' },
  { label: '🌿 ธรรมชาติ / สวนผึ้ง', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
  { label: '⛵ ตลาดน้ำ / อัมพวา', url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80' }
];

export default function AdminDashboard({ onBackToHome, onLogout, onToursUpdated }) {
  const [activeTab, setActiveTab] = useState('tours'); // 'tours' or 'bookings'
  const [tours, setTours] = useState(() => getStoredTours());
  const [bookings, setBookings] = useState(() => getBookings());
  const passengersList = useMemo(() => expandBookingsToPassengers(bookings), [bookings]);

  // Trip-based Bookings Grouping State
  const [selectedTripId, setSelectedTripId] = useState('all');

  const tripsData = useMemo(() => {
    const map = new window.Map();

    // 1. Add all registered tours
    tours.forEach(tour => {
      map.set(tour.id, {
        id: tour.id,
        title: tour.title,
        destination: tour.destination,
        image: tour.image,
        price: tour.price,
        departureDates: tour.departureDates || [],
        passengers: [],
        bookings: []
      });
    });

    // 2. Distribute passengers to corresponding trips
    passengersList.forEach(p => {
      let tourId = p.rawBooking?.tourId;
      if (!tourId || !map.has(tourId)) {
        const found = tours.find(t => t.title === p.tourTitle || t.id === tourId);
        if (found) tourId = found.id;
      }

      if (tourId && map.has(tourId)) {
        const trip = map.get(tourId);
        trip.passengers.push(p);
        if (p.rawBooking && !trip.bookings.some(b => b.id === p.rawBooking.id)) {
          trip.bookings.push(p.rawBooking);
        }
      } else {
        const fallbackKey = tourId || p.tourTitle || 'custom-trip';
        if (!map.has(fallbackKey)) {
          map.set(fallbackKey, {
            id: fallbackKey,
            title: p.tourTitle || 'ทัวร์พิเศษ',
            destination: p.tourDestination || '-',
            image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
            price: p.amount || 0,
            departureDates: [p.departureDate],
            passengers: [],
            bookings: []
          });
        }
        const trip = map.get(fallbackKey);
        trip.passengers.push(p);
        if (p.rawBooking && !trip.bookings.some(b => b.id === p.rawBooking.id)) {
          trip.bookings.push(p.rawBooking);
        }
      }
    });

    return Array.from(map.values()).map(trip => {
      const rev = trip.passengers.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const wc = trip.passengers.filter(p => p.specialNeeds?.wheelchair).length;
      const diet = trip.passengers.filter(p => p.specialNeeds?.dietary && p.specialNeeds.dietary !== 'ปกติ (หวาน-เค็มน้อย)').length;
      const med = trip.passengers.filter(p => p.specialNeeds?.medicalNote).length;

      return {
        ...trip,
        totalRevenue: rev,
        wheelchairCount: wc,
        specialDietCount: diet,
        medicalNoteCount: med
      };
    });
  }, [tours, passengersList]);

  const activeTrip = useMemo(() => {
    if (selectedTripId === 'all') return null;
    return tripsData.find(t => t.id === selectedTripId) || null;
  }, [tripsData, selectedTripId]);

  const displayedPassengers = useMemo(() => {
    if (selectedTripId === 'all' || !activeTrip) {
      return passengersList;
    }
    return activeTrip.passengers;
  }, [selectedTripId, activeTrip, passengersList]);

  // Inline Quick Price Edit State
  const [editingTourId, setEditingTourId] = useState(null);
  const [editPriceInput, setEditPriceInput] = useState('');

  // Tour Form Modal State (for both Add and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [modalSection, setModalSection] = useState('basic'); // 'basic', 'itinerary', 'highlights', 'dates_care', 'preview'
  const [previewSubTab, setPreviewSubTab] = useState('card'); // 'card' or 'detail'
  const [currentTourId, setCurrentTourId] = useState(null);

  // Form Fields - Basic Info
  const [formTitle, setFormTitle] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const detectedRegion = getRegionByProvince(formDestination);
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formDuration, setFormDuration] = useState('1 วัน (ไปเช้า-เย็นกลับ)');
  const [formImage, setFormImage] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formTravelDate, setFormTravelDate] = useState('วันเสาร์ที่ 18 เมษายน 2569');

  // Form Fields - Detailed Dynamic Lists
  const [formItinerary, setFormItinerary] = useState(DEFAULT_ITINERARY);
  const [formHighlightsList, setFormHighlightsList] = useState(['ไหว้พระทำบุญเสริมสิริมงคล', 'กิจกรรม Workshop งานฝีมือ', 'แวะซื้อของฝากท้องถิ่น']);
  const [formMedicalCareList, setFormMedicalCareList] = useState(PRESET_MEDICAL);
  const [formDepartureDatesList, setFormDepartureDatesList] = useState(['18 เมษายน 2026', '26 เมษายน 2026', '2 พฤษภาคม 2026']);

  // Date Picker Helper State
  const [pickerDate, setPickerDate] = useState('');

  // Cloud Sync & Compression State
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudMessage, setCloudMessage] = useState('');


  // Stats Calculations (Memoized in a single pass to eliminate redundant computations on render)
  const {
    totalRevenue,
    totalTravelers,
    wheelchairCount,
    promptPayBookings,
    promptPayRevenue,
    onTripBookings,
    onTripRevenue
  } = useMemo(() => {
    let rev = 0;
    let trav = 0;
    let wc = 0;
    const ppBookings = [];
    let ppRev = 0;
    const otBookings = [];
    let otRev = 0;

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      const amount = Number(b.totalAmount) || 0;
      rev += amount;
      trav += Number(b.travelersCount) || 1;
      if (b.specialNeeds?.wheelchair) wc++;

      const method = (b.paymentMethod || '').toLowerCase();
      if (method.includes('promptpay') || (b.paymentMethod || '').includes('QR')) {
        ppBookings.push(b);
        ppRev += amount;
      } else {
        otBookings.push(b);
        otRev += amount;
      }
    }

    return {
      totalRevenue: rev,
      totalTravelers: trav,
      wheelchairCount: wc,
      promptPayBookings: ppBookings,
      promptPayRevenue: ppRev,
      onTripBookings: otBookings,
      onTripRevenue: otRev
    };
  }, [bookings]);

  // Preview Object
  const previewTour = {
    id: currentTourId || 'tour-preview',
    title: formTitle.trim() || 'ชื่อโปรแกรมทัวร์ (ตัวอย่าง)',
    destination: formDestination.trim() || 'จังหวัด',
    region: detectedRegion,
    price: parseInt(String(formPrice).replace(/[^0-9]/g, ''), 10) || 0,
    originalPrice: parseInt(String(formOriginalPrice).replace(/[^0-9]/g, ''), 10) || (parseInt(String(formPrice).replace(/[^0-9]/g, ''), 10) + 600 || 0),
    duration: formDuration.trim() || '1 วัน (ไปเช้า-เย็นกลับ)',
    travelDate: formTravelDate.trim() || 'วันเสาร์ที่ 18 เมษายน 2569',
    departureDate: formTravelDate.trim() || '18 เมษายน 2569',
    image: formImage.trim() || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    tagline: formTagline.trim() || `ท่องเที่ยวพักผ่อน จ.${formDestination || 'ปลายทาง'} สำหรับผู้สูงวัย`,
    rating: 4.96,
    reviewsCount: 1,
    hasNurse: true,
    wheelchairFriendly: true,
    vehicleType: 'รถมินิบัส VIP สุขใจวัยเกษียณทัวร์',
    itinerary: formItinerary.filter(i => i.time.trim() || i.activity.trim()),
    highlights: formHighlightsList.filter(h => h.trim()),
    medicalCare: formMedicalCareList.filter(m => m.trim()),
    departureDates: [formTravelDate.trim() || '18 เมษายน 2569']
  };

  // Open Modal for Creating a New Tour
  const handleOpenAddModal = () => {
    setModalMode('add');
    setModalSection('basic');
    setPreviewSubTab('card');
    setCurrentTourId(null);
    setFormTitle('');
    setFormDestination('');
    setFormPrice('');
    setFormOriginalPrice('');
    setFormDuration('1 วัน (ไปเช้า-เย็นกลับ)');
    setFormTravelDate('วันเสาร์ที่ 18 เมษายน 2569');
    setFormImage('https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80');
    setFormTagline('');
    setFormItinerary([...DEFAULT_ITINERARY]);
    setFormHighlightsList(['ไหว้พระทำบุญเสริมสิริมงคล', 'กิจกรรม Workshop งานฝีมือ', 'แวะซื้อของฝากท้องถิ่น']);
    setFormMedicalCareList([...PRESET_MEDICAL]);
    setFormDepartureDatesList(['18 เมษายน 2569']);
    setIsModalOpen(true);
  };

  // Open Modal for Editing an Existing Tour
  const handleOpenEditModal = (tour) => {
    setModalMode('edit');
    setModalSection('basic');
    setPreviewSubTab('card');
    setCurrentTourId(tour.id);
    setFormTitle(tour.title || '');
    setFormDestination(tour.destination || '');
    setFormPrice(String(tour.price || ''));
    setFormOriginalPrice(String(tour.originalPrice || ''));
    setFormDuration(tour.duration || '1 วัน (ไปเช้า-เย็นกลับ)');
    setFormTravelDate(tour.travelDate || tour.departureDate || (Array.isArray(tour.departureDates) && tour.departureDates[0]) || 'วันเสาร์ที่ 18 เมษายน 2569');
    setFormImage(tour.image || '');
    setFormTagline(tour.tagline || '');
    
    // Load existing lists or fallbacks
    setFormItinerary(Array.isArray(tour.itinerary) && tour.itinerary.length > 0 ? [...tour.itinerary] : [...DEFAULT_ITINERARY]);
    setFormHighlightsList(Array.isArray(tour.highlights) && tour.highlights.length > 0 ? [...tour.highlights] : ['ไหว้พระทำบุญ', 'กิจกรรม Workshop']);
    setFormMedicalCareList(Array.isArray(tour.medicalCare) && tour.medicalCare.length > 0 ? [...tour.medicalCare] : [...PRESET_MEDICAL]);
    setFormDepartureDatesList(Array.isArray(tour.departureDates) && tour.departureDates.length > 0 ? [...tour.departureDates] : [tour.travelDate || '18 เมษายน 2569']);
    
    setIsModalOpen(true);
  };

  // Image Upload handler with Auto Compression (ย่อขนาดอัตโนมัติ ไม่เกิน 80KB ป้องกัน rollback)
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file, 1000, 0.78);
        setFormImage(compressed);
      } catch (err) {
        console.error("Compression error:", err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // Manual Cloud Sync
  const handleManualCloudSync = async () => {
    setIsCloudSyncing(true);
    setCloudMessage('กำลังซิงค์ข้อมูลกับคลาวด์...');
    try {
      const cloudTours = await fetchCloudTours();
      if (Array.isArray(cloudTours) && cloudTours.length > 0) {
        setTours(cloudTours);
        saveStoredTours(cloudTours);
        if (onToursUpdated) onToursUpdated(cloudTours);
        setCloudMessage('✅ ซิงค์ข้อมูลล่าสุดจากคลาวด์เรียบร้อยแล้ว');
      } else {
        saveStoredTours(tours);
        setCloudMessage('✅ อัปโหลดข้อมูลทัวร์ขึ้นคลาวด์เรียบร้อยแล้ว');
      }
    } catch {
      setCloudMessage('⚠️ เชื่อมต่อคลาวด์ไม่สำเร็จ (ใช้งานข้อมูลในเครื่อง)');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudMessage(''), 4000);
    }
  };

  const handleExportBackup = () => {
    const rawBookings = getBookings();
    exportAllDataAsJSON(null, tours, rawBookings);
  };


  // Quick Price Edit in List
  const handleSavePrice = (tourId) => {
    const num = parseInt(editPriceInput.replace(/[^0-9]/g, ''), 10);
    if (!num || num <= 0) {
      alert('กรุณากรอกราคาที่ถูกต้องครับ');
      return;
    }
    const updated = tours.map(t => t.id === tourId ? { ...t, price: num } : t);
    setTours(updated);
    saveStoredTours(updated);
    if (onToursUpdated) onToursUpdated(updated);
    setEditingTourId(null);
  };

  // Delete Tour
  const handleDeleteTour = (tourId, title) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโปรแกรมทัวร์ "${title}"?`)) {
      const updated = deleteTour(tourId);
      setTours(updated);
      if (onToursUpdated) onToursUpdated(updated);
    }
  };

  // ==========================================
  // ITINERARY HANDLERS (จัดการกำหนดการเดินทาง)
  // ==========================================
  const handleAddItineraryRow = () => {
    setFormItinerary([...formItinerary, { time: '14:00 น.', activity: '' }]);
  };

  const handleRemoveItineraryRow = (idx) => {
    setFormItinerary(formItinerary.filter((_, i) => i !== idx));
  };

  const handleUpdateItineraryRow = (idx, field, val) => {
    const next = [...formItinerary];
    next[idx][field] = val;
    setFormItinerary(next);
  };

  const handleMoveItineraryUp = (idx) => {
    if (idx <= 0) return;
    const next = [...formItinerary];
    const temp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = temp;
    setFormItinerary(next);
  };

  const handleMoveItineraryDown = (idx) => {
    if (idx >= formItinerary.length - 1) return;
    const next = [...formItinerary];
    const temp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = temp;
    setFormItinerary(next);
  };

  // ==========================================
  // HIGHLIGHTS HANDLERS
  // ==========================================
  const handleAddHighlight = () => setFormHighlightsList([...formHighlightsList, '']);
  const handleRemoveHighlight = (idx) => setFormHighlightsList(formHighlightsList.filter((_, i) => i !== idx));
  const handleUpdateHighlight = (idx, val) => {
    const next = [...formHighlightsList];
    next[idx] = val;
    setFormHighlightsList(next);
  };
  const handleAddPresetHighlight = (text) => {
    if (!formHighlightsList.includes(text)) {
      setFormHighlightsList([...formHighlightsList, text]);
    }
  };




  // ==========================================
  // MEDICAL CARE HANDLERS
  // ==========================================
  const handleAddMedical = () => setFormMedicalCareList([...formMedicalCareList, '']);
  const handleRemoveMedical = (idx) => setFormMedicalCareList(formMedicalCareList.filter((_, i) => i !== idx));
  const handleUpdateMedical = (idx, val) => {
    const next = [...formMedicalCareList];
    next[idx] = val;
    setFormMedicalCareList(next);
  };
  const handleAddPresetMedical = (text) => {
    if (!formMedicalCareList.includes(text)) {
      setFormMedicalCareList([...formMedicalCareList, text]);
    }
  };

  // ==========================================
  // DATES HANDLERS & DATE PICKER HELPER
  // ==========================================
  const handleAddDate = () => setFormDepartureDatesList([...formDepartureDatesList, '']);
  const handleRemoveDate = (idx) => setFormDepartureDatesList(formDepartureDatesList.filter((_, i) => i !== idx));
  const handleUpdateDate = (idx, val) => {
    const next = [...formDepartureDatesList];
    next[idx] = val;
    setFormDepartureDatesList(next);
  };

  const handleAddDateFromPicker = () => {
    if (!pickerDate) return;
    const [year, month, day] = pickerDate.split('-');
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthName = thaiMonths[parseInt(month, 10) - 1];
    const formatted = `${parseInt(day, 10)} ${monthName} ${year}`;
    if (!formDepartureDatesList.includes(formatted)) {
      setFormDepartureDatesList([...formDepartureDatesList, formatted]);
    }
    setPickerDate('');
  };



  // ==========================================
  // SAVE COMPLETE TOUR
  // ==========================================
  const handleFormSubmit = (e) => {
    e?.preventDefault();
    if (!formTitle.trim() || !formDestination.trim() || !formPrice) {
      alert('กรุณากรอกข้อมูลสำคัญ (ชื่อทัวร์, จังหวัด, ราคา) ในส่วนข้อมูลทั่วไปให้ครบถ้วนครับ');
      setModalSection('basic');
      return;
    }

    const priceNum = parseInt(String(formPrice).replace(/[^0-9]/g, ''), 10);
    const origPriceNum = parseInt(String(formOriginalPrice).replace(/[^0-9]/g, ''), 10) || (priceNum + 600);

    const tourDataToSave = {
      id: currentTourId || `tour-custom-${Date.now()}`,
      title: formTitle.trim(),
      destination: formDestination.trim(),
      region: detectedRegion,
      duration: formDuration.trim() || '1 วัน (ไปเช้า-เย็นกลับ)',
      price: priceNum,
      originalPrice: origPriceNum,
      rating: 4.96,
      reviewsCount: 1,
      image: formImage.trim() || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
      tagline: formTagline.trim() || `ท่องเที่ยวพักผ่อน จ.${formDestination} สำหรับผู้สูงวัย`,
      wheelchairFriendly: true,
      hasNurse: true,
      vehicleType: 'รถมินิบัส VIP สุขใจวัยเกษียณทัวร์',
      itinerary: formItinerary.filter(i => i.time.trim() || i.activity.trim()),
      highlights: formHighlightsList.filter(h => h.trim()),
      medicalCare: formMedicalCareList.filter(m => m.trim()),
      travelDate: formTravelDate.trim() || 'วันเสาร์ที่ 18 เมษายน 2569',
      departureDate: formTravelDate.trim() || '18 เมษายน 2569',
      departureDates: [formTravelDate.trim() || '18 เมษายน 2569']
    };

    if (modalMode === 'edit') {
      const updatedList = updateTour(tourDataToSave);
      setTours(updatedList);
      if (onToursUpdated) onToursUpdated(updatedList);
    } else {
      const updatedList = addTour(tourDataToSave);
      setTours(updatedList);
      if (onToursUpdated) onToursUpdated(updatedList);
    }

    setIsModalOpen(false);
    alert(`✅ บันทึกโปรแกรมทัวร์ "${tourDataToSave.title}" สำเร็จ!\nกำหนดการเดินทาง ${tourDataToSave.itinerary.length} รายการและข้อมูลทั้งหมดถูกบันทึกและซิงค์ขึ้นระบบคลาวด์เรียบร้อยแล้ว`);
  };

  // Delete Booking
  const handleDeleteBooking = (bookingId, title = '') => {
    if (window.confirm(`ต้องการยกเลิก/ลบ${title || `รายการจองรหัส ${bookingId}`} ใช่หรือไม่?`)) {
      const updated = deleteBooking(bookingId);
      setBookings(updated);
    }
  };

  return (
    <div className="admin-dashboard-page">
      <div className="container" style={{ maxWidth: '1180px' }}>
        
        {/* Top Header Bar */}
        <header className="admin-header-bar">
          <div>
            <div className="admin-badge">
              <ShieldCheck size={16} /> โหมดผู้ดูแลระบบ (Admin Role)
            </div>
            <h1 className="admin-title">แผงควบคุมระบบ สุขใจวัยเกษียณทัวร์</h1>
            <p className="admin-subtitle">จัดการโปรแกรมทัวร์, กำหนดการเดินทาง และตรวจสอบรายชื่อผู้โดยสารแยกตามแต่ละทริป</p>
          </div>

          <div className="admin-header-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={handleManualCloudSync}
              disabled={isCloudSyncing}
              title="ซิงค์ข้อมูลล่าสุดกับระบบ Cloud ฟรีข้ามทุกอุปกรณ์"
              style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534', fontSize: '0.92rem', padding: '0.6rem 1.1rem' }}
            >
              {isCloudSyncing ? <Loader2 size={17} className="animate-spin" /> : <Cloud size={17} />}
              {isCloudSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลคลาวด์'}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={handleExportBackup}
              title="ดาวน์โหลดไฟล์สำรองข้อมูล JSON เก็บไว้ในเครื่อง"
              style={{ background: '#ffffff', fontSize: '0.92rem', padding: '0.6rem 1.1rem' }}
            >
              <Download size={17} /> สำรองข้อมูล (Backup)
            </button>
            <button 
              type="button" 
              className="btn-outline"
              onClick={onBackToHome}
              title="สลับไปดูหน้าเว็บในมุมมองลูกค้าทั่วไป"
              style={{ background: '#ffffff', fontSize: '0.92rem', padding: '0.6rem 1.1rem' }}
            >
              <Eye size={17} /> มุมมองลูกค้า (หน้าแรก)
            </button>
            <button 
              type="button" 
              className="btn-outline"
              onClick={onLogout}
              style={{ color: '#ef4444', borderColor: '#fca5a5', background: '#fff', fontSize: '0.92rem', padding: '0.6rem 1.1rem' }}
            >
              <LogOut size={17} /> ออกจากระบบ
            </button>
          </div>
        </header>

        {cloudMessage && (
          <div style={{
            background: cloudMessage.includes('✅') ? '#f0fdf4' : '#fef2f2',
            border: cloudMessage.includes('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: cloudMessage.includes('✅') ? '#15803d' : '#b91c1c',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontWeight: 600,
            fontSize: '0.92rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            {cloudMessage}
          </div>
        )}

        {/* Overview Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <MapPin size={24} />
            </div>
            <div>
              <div className="stat-label">โปรแกรมทัวร์ที่เปิดอยู่</div>
              <div className="stat-val">{tours.length} ทัวร์</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="stat-label">ผู้เดินทางทั้งหมด</div>
              <div className="stat-val">{totalTravelers} ท่าน</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrap" style={{ background: '#fdf2f8', color: '#9c3858' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div className="stat-label">ยอดจองรวมทั้งหมด</div>
              <div className="stat-val">{formatPrice(totalRevenue)}</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Accessibility size={24} />
            </div>
            <div>
              <div className="stat-label">ต้องการวีลแชร์พิเศษ</div>
              <div className="stat-val">{wheelchairCount} รายการ</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button 
            type="button"
            className={`admin-tab-btn ${activeTab === 'tours' ? 'active' : ''}`}
            onClick={() => setActiveTab('tours')}
          >
            <MapPin size={18} /> จัดการโปรแกรมทัวร์ ({tours.length})
          </button>
          <button 
            type="button"
            className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Users size={18} /> รายการจองตั๋วแยกตามทริป ({bookings.length} การจอง / {passengersList.length} ที่นั่ง)
          </button>
        </div>

        {/* ===================== TAB 1: TOURS MANAGEMENT ===================== */}
        {activeTab === 'tours' && (
          <section className="admin-card-section">
            <div className="section-top-row">
              <div>
                <h2 className="section-h2">รายการโปรแกรมทัวร์ในระบบ</h2>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  สามารถกดแก้ไขทัวร์เดิม เพิ่มทัวร์ใหม่ หรือเปลี่ยนราคาแบบรวดเร็วได้ทันที
                </p>
              </div>

              <button 
                type="button" 
                className="btn-primary"
                onClick={handleOpenAddModal}
                style={{ fontSize: '0.95rem', padding: '0.65rem 1.25rem' }}
              >
                <Plus size={19} /> เพิ่มโปรแกรมทัวร์ใหม่
              </button>
            </div>

            <div className="admin-tour-list">
              {tours.map((tour) => (
                <div key={tour.id} className="admin-tour-item">
                  <img src={tour.image} alt={tour.title} className="admin-tour-img" />
                  
                  <div className="admin-tour-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge-tag paid" style={{ fontSize: '0.78rem' }}>{tour.duration}</span>
                      <span className="badge-tag region" style={{ fontSize: '0.78rem' }}>จ.{tour.destination} ({tour.region})</span>
                    </div>

                    <h3 className="admin-tour-title">{tour.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0.5rem', lineHeight: '1.4' }}>
                      {tour.tagline || 'ท่องเที่ยวพักผ่อนสำหรับผู้สูงวัย'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {/* Price & Inline Editing */}
                      {editingTourId === tour.id ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input 
                            type="number"
                            value={editPriceInput}
                            onChange={(e) => setEditPriceInput(e.target.value)}
                            className="admin-form-input"
                            style={{ width: '110px', padding: '0.35rem 0.6rem', fontSize: '0.95rem' }}
                            placeholder="ราคาใหม่"
                            autoFocus
                          />
                          <button 
                            type="button" 
                            className="btn-primary" 
                            style={{ padding: '0.4rem 0.7rem', fontSize: '0.85rem' }}
                            onClick={() => handleSavePrice(tour.id)}
                          >
                            <Check size={14} /> บันทึก
                          </button>
                          <button 
                            type="button" 
                            className="btn-outline" 
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            onClick={() => setEditingTourId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary, #9c3858)' }}>
                            {formatPrice(tour.price)}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/ ท่าน</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingTourId(tour.id);
                              setEditPriceInput(String(tour.price));
                            }}
                            style={{ color: '#2563eb', fontSize: '0.8rem', textDecoration: 'underline', padding: '0.2rem 0.4rem' }}
                          >
                            แก้ราคาด่วน
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-tour-actions">
                    <button 
                      type="button"
                      className="btn-outline"
                      onClick={() => handleOpenEditModal(tour)}
                      style={{ padding: '0.5rem 0.9rem', fontSize: '0.88rem', background: '#fff' }}
                      title="แก้ไขข้อมูลทั้งหมดของทัวร์นี้"
                    >
                      <Edit3 size={15} /> แก้ไขข้อมูลทัวร์
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteTour(tour.id, tour.title)}
                      style={{ color: '#ef4444', padding: '0.5rem', borderRadius: '8px' }}
                      title="ลบโปรแกรมทัวร์นี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================== TAB 2: BOOKINGS MANAGEMENT (SEPARATED BY TRIP) ===================== */}
        {activeTab === 'bookings' && (
          <section className="admin-card-section">
            <div className="section-top-row" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 className="section-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Bus size={24} color="var(--color-primary, #9c3858)" /> 
                  รายการจองตั๋วแยกตามทริป
                </h2>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.92rem' }}>
                  คลิกเลือกทริปที่ต้องการดู เพื่อตรวจสอบรายชื่อผู้โดยสารและข้อมูลสุขภาพอย่างเป็นระเบียบ ไม่สับสน
                </p>
              </div>

              {/* Action buttons on top */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-print-manifest"
                  onClick={() => printTripManifest(activeTrip || { title: 'ทุกทริป (ภาพรวม)', destination: 'ทุกเส้นทาง' }, displayedPassengers)}
                  disabled={displayedPassengers.length === 0}
                  title="สั่งพิมพ์ใบรายชื่อผู้โดยสารและข้อมูลสุขภาพ (Passenger Manifest) ใส่กระดาษ A4"
                  style={{ opacity: displayedPassengers.length === 0 ? 0.5 : 1 }}
                >
                  <Printer size={16} /> พิมพ์ใบรายชื่อผู้โดยสาร{activeTrip ? ` (${activeTrip.title})` : ''}
                </button>
              </div>
            </div>

            {/* 1. Trip Selector Cards Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>
                  🧭 เลือกทริปการเดินทาง ({tripsData.length} โปรแกรม):
                </div>
                {selectedTripId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedTripId('all')}
                    style={{ fontSize: '0.82rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ดูทุกทริปรวมกัน
                  </button>
                )}
              </div>

              <div className="trip-selector-grid">
                {/* Option 0: All Trips */}
                <div 
                  className={`trip-selector-card ${selectedTripId === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedTripId('all')}
                >
                  <div>
                    <div className="trip-selector-card-top">
                      <div className="trip-card-all-icon">🗺️</div>
                      <div>
                        <div className="trip-card-title">✨ ทุกทริปรวมกัน (ภาพรวม)</div>
                        <div className="trip-card-prov">รวมทุกเส้นทาง</div>
                      </div>
                    </div>
                    <div className="trip-card-metrics">
                      <span className="badge-tag" style={{ background: '#ecfdf5', color: '#047857', fontWeight: 600 }}>
                        <Users size={12} /> {passengersList.length} ที่นั่ง
                      </span>
                      <span className="badge-tag" style={{ background: '#f8fafc', color: '#475569' }}>
                        {bookings.length} รายการจอง
                      </span>
                    </div>
                  </div>
                  <div className="trip-card-footer">
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatPrice(totalRevenue)}</span>
                    <span style={{ color: selectedTripId === 'all' ? 'var(--color-primary, #9c3858)' : '#94a3b8', fontWeight: 600 }}>
                      {selectedTripId === 'all' ? '✓ กำลังดูอยู่' : 'คลิกเพื่อดู'}
                    </span>
                  </div>
                </div>

                {/* Individual Trip Cards */}
                {tripsData.map(trip => {
                  const isSelected = selectedTripId === trip.id;
                  const hasBookings = trip.passengers.length > 0;
                  return (
                    <div
                      key={trip.id}
                      className={`trip-selector-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedTripId(trip.id)}
                    >
                      <div>
                        <div className="trip-selector-card-top">
                          <img 
                            src={trip.image || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'} 
                            alt={trip.title} 
                            className="trip-card-thumb"
                          />
                          <div>
                            <div className="trip-card-title" title={trip.title}>{trip.title}</div>
                            <div className="trip-card-prov">จ.{trip.destination}</div>
                          </div>
                        </div>

                        <div className="trip-card-metrics">
                          {hasBookings ? (
                            <>
                              <span className="badge-tag" style={{ background: '#ecfdf5', color: '#047857', fontWeight: 700 }}>
                                <Users size={12} /> {trip.passengers.length} ที่นั่ง
                              </span>
                              <span className="badge-tag" style={{ background: '#f1f5f9', color: '#334155' }}>
                                {trip.bookings.length} ใบจอง
                              </span>
                              {trip.wheelchairCount > 0 && (
                                <span className="badge-tag wheelchair" style={{ fontSize: '0.72rem' }}>
                                  <Accessibility size={11} /> {trip.wheelchairCount}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="badge-tag" style={{ background: '#f8fafc', color: '#94a3b8' }}>
                              ยังไม่มีผู้จอง (0 ที่นั่ง)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="trip-card-footer">
                        <div>
                          {hasBookings ? (
                            <strong style={{ color: '#0f172a' }}>{formatPrice(trip.totalRevenue)}</strong>
                          ) : (
                            <span style={{ color: '#64748b' }}>{formatPrice(trip.price)} / ท่าน</span>
                          )}
                        </div>
                        <span style={{ color: isSelected ? 'var(--color-primary, #9c3858)' : '#64748b', fontWeight: isSelected ? 700 : 500 }}>
                          {isSelected ? '✓ กำลังดูทริปนี้' : 'เลือกทริปนี้'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Focused Trip Header Banner */}
            <div className="trip-detail-banner">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge-tag" style={{ background: 'var(--color-primary, #9c3858)', color: '#fff', fontSize: '0.78rem' }}>
                    {activeTrip ? 'ทริปที่เลือก' : 'ภาพรวมทั้งหมด'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                    {activeTrip ? activeTrip.title : 'รวมผู้โดยสารทุกทริป'}
                  </h3>
                  {activeTrip && (
                    <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                      (จ.{activeTrip.destination})
                    </span>
                  )}
                </div>

                <div className="trip-detail-stats-row">
                  <div className="trip-stat-chip">
                    <Users size={15} color="#0284c7" />
                    <span>ผู้โดยสาร: <strong>{displayedPassengers.length} ท่าน</strong></span>
                  </div>
                  <div className="trip-stat-chip">
                    <DollarSign size={15} color="#16a34a" />
                    <span>ยอดชำระ: <strong style={{ color: '#16a34a' }}>{formatPrice(activeTrip ? activeTrip.totalRevenue : totalRevenue)}</strong></span>
                  </div>
                  <div className="trip-stat-chip">
                    <Accessibility size={15} color="#d97706" />
                    <span>ใช้วีลแชร์: <strong>{activeTrip ? activeTrip.wheelchairCount : wheelchairCount} ท่าน</strong></span>
                  </div>
                  <div className="trip-stat-chip">
                    <HeartPulse size={15} color="#dc2626" />
                    <span>การดูแลพิเศษ: <strong>{(activeTrip ? activeTrip.specialDietCount + activeTrip.medicalNoteCount : passengersList.filter(p => (p.specialNeeds?.dietary && p.specialNeeds.dietary !== 'ปกติ (หวาน-เค็มน้อย)') || p.specialNeeds?.medicalNote).length)} รายการ</strong></span>
                  </div>
                </div>
              </div>

              {activeTrip && (
                <div>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setSelectedTripId('all')}
                    style={{ fontSize: '0.85rem', background: '#fff', padding: '0.5rem 0.9rem' }}
                  >
                    ดูทุกทริปรวมกัน
                  </button>
                </div>
              )}
            </div>

            {/* 3. Passengers Table & Mobile Cards */}
            {displayedPassengers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                <Users size={44} style={{ opacity: 0.35, marginBottom: '0.75rem', color: 'var(--color-primary, #9c3858)' }} />
                <h4 style={{ margin: '0 0 0.35rem', color: '#334155', fontSize: '1.05rem' }}>
                  {activeTrip ? `ยังไม่มีผู้โดยสารจองทริป "${activeTrip.title}"` : 'ยังไม่มีรายการจองในระบบ'}
                </h4>
                <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.88rem' }}>
                  เมื่อมีลูกค้าจองผ่านหน้าเว็บ ข้อมูลผู้เดินทางและรายละเอียดสุขภาพจะปรากฏที่นี่ทันที
                </p>
                {activeTrip && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setSelectedTripId('all')}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    สลับไปดูทริปอื่นที่มีผู้จองแล้ว
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* 3.1 Desktop Table View (>= 768px) */}
                <div className="table-responsive desktop-only-table">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>รหัสการจอง</th>
                        <th>ชื่อผู้เดินทาง</th>
                        <th>เบอร์โทรศัพท์</th>
                        {selectedTripId === 'all' && <th>โปรแกรมทัวร์</th>}
                        <th>รอบเดินทาง</th>
                        <th>ที่นั่ง</th>
                        <th>การดูแลสุขภาพพิเศษ</th>
                        <th>ยอดชำระ</th>
                        <th>ตั๋ว / ใบเสร็จ</th>
                        <th>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPassengers.map((passenger) => (
                        <tr 
                          key={passenger.id}
                          style={{ 
                            backgroundColor: passenger.totalPassengers > 1 ? '#fafbfc' : 'transparent',
                            borderLeft: passenger.totalPassengers > 1 ? '3px solid var(--color-primary, #9c3858)' : 'none'
                          }}
                        >
                          <td>
                            <strong style={{ color: 'var(--color-primary, #9c3858)', fontSize: '0.95rem' }}>
                              {passenger.displayId}
                            </strong>
                            {passenger.totalPassengers > 1 && (
                              <div>
                                {passenger.isLead ? (
                                  <span className="badge-tag" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', marginTop: '0.2rem', display: 'inline-block' }}>
                                    ผู้จองหลัก (1/{passenger.totalPassengers})
                                  </span>
                                ) : (
                                  <span className="badge-tag" style={{ background: '#eff6ff', color: '#1e40af', fontSize: '0.72rem', marginTop: '0.2rem', display: 'inline-block' }}>
                                    ผู้ร่วมเดินทาง ({passenger.passengerIndex}/{passenger.totalPassengers})
                                  </span>
                                )}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                              {passenger.createdAt ? new Date(passenger.createdAt).toLocaleDateString('th-TH') : ''}
                            </div>
                          </td>
                          <td>
                            <strong>{passenger.name}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>อายุ {passenger.age || '-'} ปี</div>
                            {passenger.customerNote && (
                              <div className="passenger-customer-note-box">
                                💬 <strong>หมายเหตุ:</strong> {passenger.customerNote}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>
                              <a href={`tel:${passenger.phone}`} style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}>
                                {passenger.phone}
                              </a>
                            </div>
                            {passenger.contactNote && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{passenger.contactNote}</div>
                            )}
                          </td>
                          {selectedTripId === 'all' && (
                            <td style={{ maxWidth: '170px' }}>
                              <div style={{ fontWeight: 600 }}>{passenger.tourTitle}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>จ.{passenger.tourDestination}</div>
                            </td>
                          )}
                          <td style={{ whiteSpace: 'nowrap' }}>{passenger.departureDate}</td>
                          <td>
                            <strong style={{ color: '#0284c7', fontSize: '1rem', background: '#f0f9ff', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                              {passenger.seat}
                            </strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {passenger.specialNeeds?.wheelchair && (
                                <span className="badge-tag wheelchair">
                                  <Accessibility size={12} /> ใช้วีลแชร์
                                </span>
                              )}
                              {passenger.specialNeeds?.dietary && (
                                <span className="badge-tag food">
                                  🍽️ {passenger.specialNeeds.dietary}
                                </span>
                              )}
                              {passenger.specialNeeds?.medicalNote && (
                                <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>
                                  ⚠️ {passenger.specialNeeds.medicalNote}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatPrice(passenger.amount)}</div>
                            {passenger.totalPassengers > 1 && (
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>
                                (ยอดกลุ่ม {formatPrice(passenger.totalGroupAmount)})
                              </div>
                            )}
                            <div style={{ marginTop: '0.25rem' }}>
                              <span className={`badge-tag payment-method ${(passenger.paymentMethod?.toLowerCase().includes('promptpay') || passenger.paymentMethod?.includes('QR')) ? 'promptpay' : 'ontrip'}`}>
                                {(passenger.paymentMethod?.toLowerCase().includes('promptpay') || passenger.paymentMethod?.includes('QR')) ? '💳 PromptPay' : '💵 จ่ายวันเดินทาง'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-ticket-print"
                              onClick={() => printBookingReceipt(passenger.rawBooking)}
                              title="พิมพ์ตั๋วและใบเสร็จรับเงินสำหรับรายการนี้"
                            >
                              <Ticket size={13} /> พิมพ์ตั๋ว
                            </button>
                          </td>
                          <td>
                            <button 
                              type="button"
                              onClick={() => handleDeleteBooking(
                                passenger.parentBookingId, 
                                passenger.totalPassengers > 1 ? `การจองกลุ่มรหัส ${passenger.parentBookingId} ทั้งหมด` : `การจองรหัส ${passenger.displayId}`
                              )}
                              style={{ color: '#ef4444', padding: '0.35rem 0.5rem', background: '#fee2e2', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                              title={passenger.totalPassengers > 1 ? `ยกเลิกการจองกลุ่ม ${passenger.parentBookingId}` : `ยกเลิกการจองนี้`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 3.2 Mobile Smartphone Card View (< 768px) */}
                <div className="mobile-only-cards">
                  {displayedPassengers.map((passenger) => (
                    <div 
                      key={passenger.id} 
                      className="mobile-passenger-card"
                      style={{ 
                        borderLeft: passenger.totalPassengers > 1 ? '4px solid var(--color-primary, #9c3858)' : '1px solid #e2e8f0' 
                      }}
                    >
                      <div className="mobile-card-header">
                        <div>
                          <strong style={{ color: 'var(--color-primary, #9c3858)', fontSize: '0.98rem' }}>
                            {passenger.displayId}
                          </strong>
                          {passenger.totalPassengers > 1 && (
                            <span 
                              className="badge-tag" 
                              style={{ 
                                marginLeft: '0.4rem', 
                                background: passenger.isLead ? '#fef3c7' : '#eff6ff', 
                                color: passenger.isLead ? '#92400e' : '#1e40af', 
                                fontSize: '0.72rem' 
                              }}
                            >
                              {passenger.isLead ? `ผู้จองหลัก (1/${passenger.totalPassengers})` : `ผู้ร่วมเดินทาง (${passenger.passengerIndex}/${passenger.totalPassengers})`}
                            </span>
                          )}
                        </div>
                        <span className="mobile-seat-badge">
                          ที่นั่ง {passenger.seat}
                        </span>
                      </div>

                      <div className="mobile-card-body">
                        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                          👤 {passenger.name} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#64748b' }}>(อายุ {passenger.age || '-'} ปี)</span>
                        </div>

                        <div style={{ marginTop: '0.35rem', fontSize: '0.88rem' }}>
                          <a 
                            href={`tel:${passenger.phone}`} 
                            className="mobile-phone-link"
                            title="กดเพื่อโทรออกทันที"
                          >
                            📞 {passenger.phone}
                          </a>
                          {passenger.contactNote && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.4rem' }}>
                              ({passenger.contactNote})
                            </span>
                          )}
                        </div>

                        {selectedTripId === 'all' && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.86rem', color: '#334155' }}>
                            <strong>ทัวร์:</strong> {passenger.tourTitle} (จ.{passenger.tourDestination})
                          </div>
                        )}
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                          <strong>วันเดินทาง:</strong> {passenger.departureDate}
                        </div>

                        {/* Special needs */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                          {passenger.specialNeeds?.wheelchair && (
                            <span className="badge-tag wheelchair">
                              <Accessibility size={12} /> ใช้วีลแชร์
                            </span>
                          )}
                          {passenger.specialNeeds?.dietary && (
                            <span className="badge-tag food">
                              🍽️ {passenger.specialNeeds.dietary}
                            </span>
                          )}
                          {passenger.specialNeeds?.medicalNote && (
                            <span style={{ fontSize: '0.78rem', color: '#dc2626', width: '100%', marginTop: '0.15rem' }}>
                              ⚠️ {passenger.specialNeeds.medicalNote}
                            </span>
                          )}
                        </div>

                        {/* Customer note on mobile */}
                        {passenger.customerNote && (
                          <div className="passenger-customer-note-box" style={{ marginTop: '0.5rem' }}>
                            💬 <strong>หมายเหตุถึงทีมงาน:</strong> {passenger.customerNote}
                          </div>
                        )}
                      </div>

                      <div className="mobile-card-footer">
                        <div>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            {formatPrice(passenger.amount)}
                          </span>
                          {passenger.totalPassengers > 1 && (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>
                              (ยอดกลุ่ม {formatPrice(passenger.totalGroupAmount)})
                            </span>
                          )}
                          <div style={{ marginTop: '0.2rem' }}>
                            <span className={`badge-tag payment-method ${(passenger.paymentMethod?.toLowerCase().includes('promptpay') || passenger.paymentMethod?.includes('QR')) ? 'promptpay' : 'ontrip'}`} style={{ fontSize: '0.7rem' }}>
                              {(passenger.paymentMethod?.toLowerCase().includes('promptpay') || passenger.paymentMethod?.includes('QR')) ? '💳 PromptPay' : '💵 จ่ายวันเดินทาง'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            className="btn-ticket-print"
                            onClick={() => printBookingReceipt(passenger.rawBooking)}
                            title="พิมพ์ตั๋ว/ใบเสร็จ"
                          >
                            <Ticket size={13} /> ตั๋ว/ใบเสร็จ
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteBooking(
                              passenger.parentBookingId, 
                              passenger.totalPassengers > 1 ? `การจองกลุ่มรหัส ${passenger.parentBookingId} ทั้งหมด` : `การจองรหัส ${passenger.displayId}`
                            )}
                            style={{ color: '#ef4444', padding: '0.4rem 0.55rem', borderRadius: '8px', background: '#fee2e2', border: 'none', cursor: 'pointer' }}
                            title="ยกเลิก/ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

      </div>

      {/* ===================== FULL TOUR EDITOR MODAL ===================== */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px', width: '96%', maxHeight: '92vh', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a' }}>
                  {modalMode === 'edit' ? '✏️ แก้ไขข้อมูลโปรแกรมทัวร์' : '➕ เพิ่มโปรแกรมทัวร์ใหม่'}
                </h2>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  แก้ไขข้อมูลได้ทุกส่วนที่ลูกค้ามองเห็น พร้อมปุ่มเทมเพลตตัวช่วยกรอก เพื่อป้องกันความผิดพลาด
                </p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: '#64748b', padding: '0.4rem' }}>
                <X size={22} />
              </button>
            </div>

            {/* Step / Section Navigation Tabs */}
            <div className="modal-step-tabs">
              <button
                type="button"
                className={`modal-step-btn ${modalSection === 'basic' ? 'active' : ''}`}
                onClick={() => setModalSection('basic')}
              >
                <span>📌 1. ข้อมูลทั่วไป & รูป</span>
              </button>
              <button
                type="button"
                className={`modal-step-btn ${modalSection === 'itinerary' ? 'active' : ''}`}
                onClick={() => setModalSection('itinerary')}
              >
                <span>🕒 2. กำหนดการเดินทาง ({formItinerary.length})</span>
              </button>
              <button
                type="button"
                className={`modal-step-btn ${modalSection === 'highlights' ? 'active' : ''}`}
                onClick={() => setModalSection('highlights')}
              >
                <span>🌟 3. ไฮไลท์จุดเด่น ({formHighlightsList.length})</span>
              </button>
              <button
                type="button"
                className={`modal-step-btn ${modalSection === 'dates_care' ? 'active' : ''}`}
                onClick={() => setModalSection('dates_care')}
              >
                <span>🩺 4. การดูแล & วันเดินทาง</span>
              </button>
              <button
                type="button"
                className={`modal-step-btn ${modalSection === 'preview' ? 'active' : ''}`}
                onClick={() => setModalSection('preview')}
                style={{ color: '#0284c7' }}
              >
                <span>👁️ 5. ดูตัวอย่างจริง (Preview)</span>
              </button>
            </div>

            {/* ================= SECTION 1: BASIC INFO & IMAGE ================= */}
            {modalSection === 'basic' && (
              <div style={{ animation: 'fadeIn 0.15s ease' }}>
                <div className="admin-form-group">
                  <label>ชื่อโปรแกรมทัวร์ *</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="เช่น สุขใจ ไหว้พระเมืองนครปฐม"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label>จังหวัดปลายทาง *</label>
                    <input 
                      type="text" 
                      list="thai-provinces-list"
                      className="admin-form-input" 
                      placeholder="พิมพ์หรือเลือกจังหวัด เช่น นครปฐม"
                      value={formDestination}
                      onChange={(e) => setFormDestination(e.target.value)}
                      required
                    />
                    <datalist id="thai-provinces-list">
                      {ALL_THAI_PROVINCES.map((prov) => (
                        <option key={prov} value={prov} />
                      ))}
                    </datalist>

                    {/* Quick Province Preset Chips */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.45rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ปลายทางยอดนิยม:</span>
                      {['นครปฐม', 'พระนครศรีอยุธยา', 'ราชบุรี', 'สมุทรสงคราม', 'กาญจนบุรี', 'เชียงใหม่', 'ชลบุรี'].map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          className="preset-chip"
                          style={{ padding: '0.15rem 0.5rem', fontSize: '0.78rem' }}
                          onClick={() => setFormDestination(prov)}
                        >
                          {prov}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0f172a' }}>
                      <MapIcon size={15} color="var(--color-primary, #9c3858)" /> ภูมิภาค (ระบบตรวจจับให้อัตโนมัติ ป้องกันข้อมูลผิดพลาด)
                    </label>
                    <div style={{
                      padding: '0.65rem 0.9rem',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      minHeight: '44px'
                    }}>
                      <span style={{
                        background: 'var(--color-primary, #9c3858)',
                        color: '#ffffff',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}>
                        📍 {detectedRegion}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {formDestination.trim() ? `ระบุตามจังหวัด ${formDestination}` : '(กรุณาเลือกหรือพิมพ์จังหวัด)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label>ราคาขายต่อท่าน (บาท) *</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      placeholder="เช่น 3890"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>ราคาเดิมก่อนลด (สำหรับแสดงขีดฆ่าส่วนลด)</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      placeholder="เช่น 4590"
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>ระยะเวลาทัวร์</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="เช่น 1 วัน (ไปเช้า-เย็นกลับ)"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontWeight: 700 }}>
                    <Calendar size={16} color="var(--color-primary, #9c3858)" /> วันเดินทางของทริป * (แสดงที่หน้าเว็บให้ลูกค้าเห็น)
                  </label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="เช่น วันเสาร์ที่ 18 เมษายน 2569"
                    value={formTravelDate}
                    onChange={(e) => setFormTravelDate(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    ระบุวันเดินทางของทริปนี้ เช่น วันเสาร์ที่ 18 เมษายน 2569 ข้อมูลจะปรากฏบนการ์ดทัวร์และหน้ารายละเอียดของลูกค้าทันที
                  </span>
                </div>

                <div className="admin-form-group">
                  <label>คำโปรยย่อ (Tagline สรุปสั้นๆ 1 ประโยค แสดงใต้ชื่อทัวร์ให้ลูกค้าอ่าน)</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="เช่น ไหว้พระวัดไร่ขิง สักการะพระปฐมเจดีย์ เวิร์กช็อปถุงหอม ช้อปเพลินตลาดดอนหวาย"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                  />
                </div>

                {/* Local Computer Image Upload Section */}
                <div className="admin-form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontWeight: 700 }}>
                    <ImageIcon size={18} color="var(--color-primary, #9c3858)" /> รูปภาพหน้าปกโปรแกรมทัวร์
                  </label>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      id="admin-tour-file-input"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="admin-tour-file-input" 
                      className="btn-outline"
                      style={{ cursor: 'pointer', background: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.15rem', fontSize: '0.92rem', opacity: isCompressing ? 0.7 : 1 }}
                    >
                      {isCompressing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {isCompressing ? 'กำลังบีบอัดรูปภาพ...' : 'อัปโหลดรูปภาพจากเครื่อง...'}
                    </label>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>ระบบจะย่อและปรับขนาดภาพให้อัตโนมัติ (ไม่เกิน 80KB) บันทึกได้ไม่จำกัดและไม่ rollback</span>
                  </div>

                  {/* Preset Standard Images */}
                  <div style={{ marginTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>
                      หรือเลือกใช้รูปตัวอย่างมาตรฐาน:
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {PRESET_SAMPLE_IMAGES.map((img) => (
                        <button
                          key={img.label}
                          type="button"
                          className="preset-chip"
                          onClick={() => setFormImage(img.url)}
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Live Preview */}
                  {formImage && (
                    <div style={{ position: 'relative', marginTop: '0.85rem', width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #cbd5e1' }}>
                      <img 
                        src={formImage} 
                        alt="Tour Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px', 
                          background: 'rgba(0,0,0,0.65)', 
                          color: '#fff', 
                          borderRadius: '50%', 
                          width: '28px', 
                          height: '28px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="ลบรูปภาพนี้"
                      >
                        <X size={16} />
                      </button>
                      <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                        ตัวอย่างรูปภาพที่เลือก
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>หรือระบุลิงก์รูปภาพออนไลน์ (URL):</span>
                    <input 
                      type="url" 
                      className="admin-form-input" 
                      placeholder="https://..."
                      value={formImage.startsWith('data:image') ? '(ใช้รูปที่อัปโหลดจากเครื่อง)' : formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      disabled={formImage.startsWith('data:image')}
                      style={{ marginTop: '0.25rem', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => setModalSection('itinerary')}
                  >
                    ถัดไป: กำหนดการเดินทาง ➡️
                  </button>
                </div>
              </div>
            )}

            {/* ================= SECTION 2: ITINERARY TIMELINE BUILDER ================= */}
            {modalSection === 'itinerary' && (
              <div style={{ animation: 'fadeIn 0.15s ease' }}>

                {/* Timeline Builder List */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    🕒 รายการกำหนดการเดินทาง ({formItinerary.length} ช่วงเวลา)
                  </label>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    * สามารถกดปุ่มลูกศร ⬆️ ⬇️ เพื่อจัดเรียงลำดับเวลาได้
                  </span>
                </div>

                <div className="timeline-builder-card">
                  {formItinerary.map((item, idx) => (
                    <div key={idx} className="timeline-item-row">
                      {/* Step Number */}
                      <span style={{ fontSize: '0.85rem', color: '#64748b', width: '22px', textAlign: 'center', fontWeight: 700 }}>
                        {idx + 1}.
                      </span>

                      {/* Time Input */}
                      <input 
                        type="text" 
                        className="timeline-time-input"
                        placeholder="เช่น 07:30 น."
                        value={item.time}
                        onChange={(e) => handleUpdateItineraryRow(idx, 'time', e.target.value)}
                        style={{ width: '115px' }}
                      />

                      {/* Activity Details Input */}
                      <input 
                        type="text" 
                        className="timeline-act-input"
                        placeholder="รายละเอียดกิจกรรม เช่น ไหว้พระวัดไร่ขิง ทำบุญเสริมสิริมงคล..."
                        value={item.activity}
                        onChange={(e) => handleUpdateItineraryRow(idx, 'activity', e.target.value)}
                      />

                      {/* Move Up / Down Buttons */}
                      <button
                        type="button"
                        className="timeline-btn-reorder"
                        onClick={() => handleMoveItineraryUp(idx)}
                        disabled={idx === 0}
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp size={13} />
                      </button>

                      <button
                        type="button"
                        className="timeline-btn-reorder"
                        onClick={() => handleMoveItineraryDown(idx)}
                        disabled={idx === formItinerary.length - 1}
                        title="เลื่อนลง"
                      >
                        <ArrowDown size={13} />
                      </button>

                      {/* Delete Row Button */}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItineraryRow(idx)}
                        style={{ color: '#ef4444', padding: '0.35rem', cursor: 'pointer' }}
                        title="ลบช่วงเวลานี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    className="btn-outline"
                    onClick={handleAddItineraryRow}
                    style={{ width: '100%', marginTop: '0.5rem', background: '#ffffff', padding: '0.55rem', fontSize: '0.92rem', justifyContent: 'center' }}
                  >
                    <Plus size={16} /> เพิ่มช่วงเวลา / กิจกรรมใหม่แบบว่าง
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setModalSection('basic')}>⬅️ ย้อนกลับ</button>
                  <button type="button" className="btn-primary" onClick={() => setModalSection('highlights')}>ถัดไป: ไฮไลท์จุดเด่น ➡️</button>
                </div>
              </div>
            )}

            {/* ================= SECTION 3: HIGHLIGHTS & INCLUSIONS ================= */}
            {modalSection === 'highlights' && (
              <div style={{ animation: 'fadeIn 0.15s ease' }}>
                
                {/* Highlights */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      🌟 จุดเด่นและกิจกรรมไฮไลท์ ({formHighlightsList.length} ข้อ)
                    </label>
                    <button 
                      type="button" 
                      className="preset-chip"
                      onClick={handleAddHighlight}
                    >
                      <Plus size={13} /> เพิ่มจุดเด่นแบบว่าง
                    </button>
                  </div>

                  {/* Highlights Preset Palette */}
                  <div className="preset-panel" style={{ marginBottom: '0.75rem' }}>
                    <div className="preset-panel-title">
                      <Sparkles size={14} color="var(--color-primary, #9c3858)" />
                      คลิกเพื่อเพิ่มจุดเด่นยอดนิยมทันที:
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {PRESET_HIGHLIGHTS.map((hl, i) => (
                        <button
                          key={i}
                          type="button"
                          className="preset-chip"
                          onClick={() => handleAddPresetHighlight(hl)}
                        >
                          + {hl}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {formHighlightsList.map((highlight, idx) => (
                    <div key={idx} className="dynamic-item-row">
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', width: '22px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}.</span>
                      <input 
                        type="text" 
                        className="admin-form-input"
                        placeholder="เช่น ไหว้พระวัดไร่ขิง สักการะพระปฐมเจดีย์"
                        value={highlight}
                        onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveHighlight(idx)}
                        style={{ color: '#ef4444', padding: '0.4rem', cursor: 'pointer' }}
                        title="ลบข้อนี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setModalSection('itinerary')}>⬅️ ย้อนกลับ</button>
                  <button type="button" className="btn-primary" onClick={() => setModalSection('dates_care')}>ถัดไป: การดูแล & วันเดินทาง ➡️</button>
                </div>
              </div>
            )}

            {/* ================= SECTION 4: DATES & MEDICAL CARE ================= */}
            {modalSection === 'dates_care' && (
              <div style={{ animation: 'fadeIn 0.15s ease' }}>
                
                {/* Departure Dates */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      📅 รอบวันเดินทางที่เปิดรับจอง ({formDepartureDatesList.length} รอบ)
                    </label>
                    <button 
                      type="button" 
                      className="preset-chip"
                      onClick={handleAddDate}
                    >
                      <Plus size={13} /> เพิ่มรอบเดินทางว่าง
                    </button>
                  </div>

                  {/* Thai Date Picker Helper */}
                  <div className="quick-date-box">
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      🗓️ ตัวช่วยเลือกจากปฏิทิน:
                    </span>
                    <input 
                      type="date" 
                      className="admin-form-input" 
                      style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.88rem' }}
                      value={pickerDate}
                      onChange={(e) => setPickerDate(e.target.value)}
                    />
                    <button 
                      type="button"
                      className="btn-primary"
                      onClick={handleAddDateFromPicker}
                      disabled={!pickerDate}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.84rem' }}
                    >
                      ➕ แปลงและเพิ่มเป็นวันที่ไทย
                    </button>
                  </div>

                  {/* Quick Preset Dates */}
                  <div className="preset-panel" style={{ marginBottom: '0.75rem' }}>
                    <div className="preset-panel-title">
                      <Calendar size={14} color="var(--color-primary, #9c3858)" />
                      คลิกเพื่อเพิ่มรอบเดินทางสำเร็จรูป:
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {['18 เมษายน 2026', '19 เมษายน 2026', '25 เมษายน 2026', '26 เมษายน 2026', '2 พฤษภาคม 2026', '9 พฤษภาคม 2026'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className="preset-chip"
                          onClick={() => {
                            if (!formDepartureDatesList.includes(d)) {
                              setFormDepartureDatesList([...formDepartureDatesList, d]);
                            }
                          }}
                        >
                          + {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formDepartureDatesList.map((dateStr, idx) => (
                    <div key={idx} className="dynamic-item-row">
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', width: '22px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}.</span>
                      <input 
                        type="text" 
                        className="admin-form-input"
                        placeholder="เช่น 18 เมษายน 2026"
                        value={dateStr}
                        onChange={(e) => handleUpdateDate(idx, e.target.value)}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDate(idx)}
                        style={{ color: '#ef4444', padding: '0.4rem', cursor: 'pointer' }}
                        title="ลบรอบนี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Medical Care */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      🩺 มาตรการและการดูแลสุขภาพสำหรับผู้สูงอายุ ({formMedicalCareList.length} ข้อ)
                    </label>
                    <button 
                      type="button" 
                      className="preset-chip"
                      onClick={handleAddMedical}
                    >
                      <Plus size={13} /> เพิ่มการดูแลสุขภาพ
                    </button>
                  </div>

                  {/* Medical Presets Palette */}
                  <div className="preset-panel" style={{ marginBottom: '0.75rem' }}>
                    <div className="preset-panel-title">
                      <HeartPulse size={14} color="var(--color-primary, #9c3858)" />
                      คลิกเพื่อเพิ่มการดูแลสุขภาพมาตรฐาน:
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {PRESET_MEDICAL.map((med, i) => (
                        <button
                          key={i}
                          type="button"
                          className="preset-chip"
                          onClick={() => handleAddPresetMedical(med)}
                        >
                          + {med}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formMedicalCareList.map((med, idx) => (
                    <div key={idx} className="dynamic-item-row">
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', width: '22px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}.</span>
                      <input 
                        type="text" 
                        className="admin-form-input"
                        placeholder="เช่น พยาบาลวิชาชีพดูแลอย่างใกล้ชิดตลอดการเดินทาง"
                        value={med}
                        onChange={(e) => handleUpdateMedical(idx, e.target.value)}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMedical(idx)}
                        style={{ color: '#ef4444', padding: '0.4rem', cursor: 'pointer' }}
                        title="ลบข้อนี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setModalSection('highlights')}>⬅️ ย้อนกลับ</button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn-outline" 
                      onClick={() => setModalSection('preview')}
                      style={{ color: '#0284c7', borderColor: '#38bdf8' }}
                    >
                      <Eye size={16} /> ดูตัวอย่างทั้งหมด (Preview) ➡️
                    </button>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={handleFormSubmit}
                    >
                      <Check size={16} /> {modalMode === 'edit' ? 'บันทึกการแก้ไข' : 'บันทึกโปรแกรมทัวร์'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SECTION 5: LIVE PREVIEW (CUSTOMER VIEW) ================= */}
            {modalSection === 'preview' && (
              <div style={{ animation: 'fadeIn 0.15s ease' }}>
                <div style={{ background: '#fdf4f7', border: '1px solid #fbcfe8', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary, #9c3858)', fontSize: '0.9rem' }}>
                  <Sparkles size={18} />
                  <span><strong>ตัวอย่างการแสดงผลจริง:</strong> ลูกค้าจะเห็นข้อมูลและรูปแบบการแสดงผลตามด้านล่างนี้ 100% ครับ</span>
                </div>

                {/* Sub Tab Switcher: Card vs Detail */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    className={`btn-outline ${previewSubTab === 'card' ? 'active' : ''}`}
                    onClick={() => setPreviewSubTab('card')}
                    style={{ 
                      background: previewSubTab === 'card' ? 'var(--color-primary, #9c3858)' : '#fff',
                      color: previewSubTab === 'card' ? '#fff' : '#475569',
                      fontSize: '0.88rem',
                      padding: '0.45rem 1rem'
                    }}
                  >
                    1. หน้าตาการ์ดหน้าแรก (Home Tour Card)
                  </button>
                  <button
                    type="button"
                    className={`btn-outline ${previewSubTab === 'detail' ? 'active' : ''}`}
                    onClick={() => setPreviewSubTab('detail')}
                    style={{ 
                      background: previewSubTab === 'detail' ? 'var(--color-primary, #9c3858)' : '#fff',
                      color: previewSubTab === 'detail' ? '#fff' : '#475569',
                      fontSize: '0.88rem',
                      padding: '0.45rem 1rem'
                    }}
                  >
                    2. หน้ารายละเอียดเต็มที่ลูกค้าอ่าน (Full Detail Page)
                  </button>
                </div>

                {/* Preview 1: Home Tour Card */}
                {previewSubTab === 'card' && (
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div style={{ maxWidth: '380px', margin: '0 auto', background: 'var(--color-bg-page, #fdfafb)', padding: '1rem', borderRadius: '18px', border: '1px dashed #cbd5e1' }}>
                      <TourCard 
                        tour={previewTour} 
                        onSelectTour={() => {}} 
                        onStartBooking={() => {}} 
                      />
                    </div>
                  </div>
                )}

                {/* Preview 2: Full Tour Detail Simulation */}
                {previewSubTab === 'detail' && (
                  <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    
                    {/* Header Image & Duration */}
                    <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
                      <img 
                        src={previewTour.image} 
                        alt={previewTour.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} /> {previewTour.duration}
                      </div>
                    </div>

                    {/* Title & Tagline & Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem' }}>
                          {previewTour.title}
                        </h2>
                        <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0 0 0.5rem' }}>
                          {previewTour.tagline}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapIcon size={15} color="var(--color-primary, #9c3858)" /> {previewTour.destination} ({previewTour.region})
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Bus size={15} color="var(--color-primary, #9c3858)" /> {previewTour.vehicleType}
                          </span>
                        </div>
                      </div>

                      <div style={{ background: '#fdf2f8', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(156, 56, 88, 0.2)', textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary, #9c3858)' }}>
                          {formatPrice(previewTour.price)}
                          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}> / ท่าน</span>
                        </div>
                        {previewTour.originalPrice && (
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                            ปกติ {formatPrice(previewTour.originalPrice)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Highlights */}
                    {previewTour.highlights.length > 0 && (
                      <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                          🌟 จุดเด่นและกิจกรรมไฮไลท์:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                          {previewTour.highlights.map((h, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#334155' }}>
                              <CheckCircle2 size={16} color="var(--color-primary, #9c3858)" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.65rem', fontSize: '0.95rem' }}>
                        🕒 กำหนดการเดินทางท่องเที่ยวแบบไม่เร่งรีบ ({previewTour.itinerary.length} ช่วงเวลา):
                      </div>
                      <div className="itinerary-timeline" style={{ paddingLeft: '1.25rem' }}>
                        {previewTour.itinerary.map((item, idx) => (
                          <div key={idx} className="timeline-step">
                            <span className="timeline-time">{item.time}</span>
                            <div className="timeline-activity" style={{ fontSize: '0.92rem' }}>{item.activity}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Senior Care & Inclusions Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontWeight: 700, color: '#166534', marginBottom: '0.4rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <HeartPulse size={17} /> บริการดูแลสุขภาพผู้สูงอายุ:
                        </div>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.84rem', color: '#14532d', lineHeight: '1.6' }}>
                          {previewTour.medicalCare.map((m, idx) => <li key={idx}>{m}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* Departure Dates / Trip Type */}
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={17} color="var(--color-primary, #9c3858)" /> รูปแบบการเดินทาง:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {Array.isArray(previewTour.departureDates) && previewTour.departureDates.length > 0 ? (
                          previewTour.departureDates.map((d, idx) => (
                            <span key={idx} style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                              {d}
                            </span>
                          ))
                        ) : (
                          <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                            ทริป 1 วัน (ไปเช้า-เย็นกลับ) - เดินทางครั้งเดียว
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Final Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn-outline" 
                    onClick={() => setModalSection('basic')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Edit3 size={16} /> กลับไปแก้ไขฟอร์ม
                  </button>

                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={handleFormSubmit}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.8rem 2.2rem', fontSize: '1.05rem' }}
                  >
                    <Check size={18} /> ยืนยันบันทึกข้อมูลทัวร์
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
