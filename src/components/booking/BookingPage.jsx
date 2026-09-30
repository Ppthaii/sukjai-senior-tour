import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Check, ArrowRight, ArrowLeft, QrCode, MessageSquare, HeartPulse } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPrice, generateBookingId } from '../../utils/formatters';
import { getBookings, saveBooking } from '../../utils/storage';
import BusSeatMap from './BusSeatMap';
import './booking.css';

// Helper to compute occupied seat aliases (e.g. "1A" <-> "A1")
function getOccupiedSeatsList(bookings, tour) {
  if (!bookings || !tour) return [];
  return bookings
    .filter(b => b.tourId === tour?.id || b.tourTitle === tour?.title)
    .flatMap(b => {
      const list = [];
      if (Array.isArray(b.selectedSeats)) list.push(...b.selectedSeats);
      if (Array.isArray(b.seats)) list.push(...b.seats);
      if (Array.isArray(b.coTravelers)) {
        b.coTravelers.forEach(c => {
          if (c.seat) list.push(c.seat);
        });
      }
      return list;
    })
    .filter(Boolean)
    .flatMap(seat => {
      const s = String(seat).trim().toUpperCase();
      const match1 = s.match(/^([0-9]+)([A-Z]+)$/);
      if (match1) return [s, `${match1[2]}${match1[1]}`];
      const match2 = s.match(/^([A-Z]+)([0-9]+)$/);
      if (match2) return [s, `${match2[1]}${match2[2]}`];
      return [s];
    });
}

export default function BookingPage({ tour, currentUser, onCancel, onBookingSuccess, onOpenProfile }) {
  const [step, setStep] = useState(1);

  // Single-trip model: specific travel date
  const departureDate = tour?.travelDate || tour?.departureDate || (Array.isArray(tour?.departureDates) && tour.departureDates[0]) || 'วันเสาร์ที่ 18 เมษายน 2569';
  
  // Seat Selection
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Real-time Bookings for Occupied Seats Detection
  const [allBookings, setAllBookings] = useState(() => getBookings());

  useEffect(() => {
    const handleUpdate = () => {
      setAllBookings(getBookings());
    };
    window.addEventListener('sukjai_bookings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sukjai_bookings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute occupied seats for this tour
  const occupiedSeats = useMemo(() => {
    return getOccupiedSeatsList(allBookings, tour);
  }, [allBookings, tour]);

  // Traveler Details (Read-only from member profile)
  const leadName = currentUser?.name || '';
  const leadAge = currentUser?.age || '65';
  const leadPhone = currentUser?.phone || '';
  const emergencyContact = currentUser?.emergencyContact || (currentUser?.hasNoRelative ? 'กรณีไม่มีญาติ (มอบหมายทีมพยาบาลและไกด์ดูแลพิเศษ)' : '');
  
  // Health & Special Care Needs (from member profile)
  const needWheelchair = currentUser?.needWheelchair || false;
  const needNurseHelp = currentUser?.needNurseHelp ?? true;
  const dietary = currentUser?.dietary || 'ปกติ (หวาน-เค็มน้อย)';
  const medicalNote = currentUser?.medicalNote || '';

  // Co-travelers state (for seats index 1 to selectedSeats.length - 1)
  const [coTravelers, setCoTravelers] = useState([]);

  // Customer Note to Staff (หมายเหตุเพิ่มเติมถึงพนักงาน)
  const [customerNote, setCustomerNote] = useState('');

  // Derived total amount (used in both JSX and handleConfirmBooking)
  const totalAmount = (tour?.price || 0) * (selectedSeats.length > 0 ? selectedSeats.length : 1);

  const handleUpdateCoTraveler = (index, field, value) => {
    setCoTravelers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handle seat click with synchronized coTraveler state
  const handleToggleSeat = useCallback((seatId) => {
    setSelectedSeats(prev => {
      const next = prev.includes(seatId) 
        ? prev.filter(s => s !== seatId)
        : [...prev, seatId];

      const needed = Math.max(0, next.length - 1);
      setCoTravelers(oldCo => {
        const updated = [];
        for (let i = 0; i < needed; i++) {
          updated.push(oldCo[i] || {
            name: '',
            age: '',
            needWheelchair: false,
            needNurseHelp: false,
            dietary: 'ปกติ (หวาน-เค็มน้อย)',
            medicalNote: ''
          });
        }
        return updated;
      });

      return next;
    });
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (selectedSeats.length === 0) {
        alert('กรุณาเลือกที่นั่งอย่างน้อย 1 ที่ครับ');
        return;
      }
      setStep(2);
      window.scrollTo(0, 0);
    } else if (step === 2) {
      if (!leadName.trim()) {
        alert('กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนทำการจองครับ');
        return;
      }

      // Check co-travelers names if multiple seats
      if (selectedSeats.length > 1) {
        for (let i = 0; i < coTravelers.length; i++) {
          if (!coTravelers[i]?.name?.trim()) {
            alert(`กรุณากรอกชื่อผู้ร่วมเดินทางคนที่ ${i + 2} (ที่นั่ง ${selectedSeats[i + 1]}) ด้วยครับ`);
            return;
          }
        }
      }

      setStep(3);
      window.scrollTo(0, 0);
    }
  };

  const handleConfirmBooking = () => {
    const bookingId = generateBookingId();
    const newBooking = {
      id: bookingId,
      createdAt: new Date().toISOString(),
      tourId: tour.id,
      tourTitle: tour.title,
      tourDestination: tour.destination,
      tourDuration: tour.duration,
      departureDate,
      travelersCount: selectedSeats.length,
      selectedSeats,
      leadName,
      leadPhone,
      leadAge: leadAge || 'ผู้สูงวัย',
      emergencyContact: emergencyContact || 'ไม่ระบุ',
      specialNeeds: {
        wheelchair: needWheelchair,
        hasNurseAssistance: needNurseHelp,
        dietary,
        medicalNote: medicalNote || 'ไม่มี'
      },
      coTravelers: coTravelers.map((c, idx) => ({
        ...c,
        seat: selectedSeats[idx + 1]
      })),
      isBookedByChild: false,
      childGreeting: '',
      customerNote: customerNote.trim(),
      totalAmount,
      paymentMethod: 'QR PromptPay',
      paymentStatus: 'ชำระเงินสำเร็จ (ยืนยันแล้ว)',
      assignedGuide: 'ไกด์สมชาย (081-222-3344)',
      assignedNurse: 'พยาบาลวิภา (089-555-6677)',
      pickupPoint: 'จุดขึ้นรถ VIP สถานีรถไฟฟ้าหมอชิต (ประตู 3) เวลา 08:30 น.'
    };

    saveBooking(newBooking);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    onBookingSuccess(newBooking);
  };

  return (
    <div className="booking-page">
      {/* Sticky Top Bar */}
      <div className="booking-top-bar">
        <div className="booking-header-inner">
          <div className="booking-tour-info">
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              onClick={step > 1 ? () => { setStep(step - 1); window.scrollTo(0, 0); } : onCancel}
            >
              <ArrowLeft size={16} /> <span>ย้อนกลับ</span>
            </button>
            <h2 className="booking-tour-title">{tour.title}</h2>
          </div>

          {/* Steps Indicator */}
          <div className="booking-steps-bar">
            <div className={`step-indicator-item ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
              <span className="step-num-badge">{step > 1 ? '✓' : '1'}</span>
              <span>เลือกที่นั่ง</span>
            </div>
            <div className={`step-indicator-item ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
              <span className="step-num-badge">{step > 2 ? '✓' : '2'}</span>
              <span>ข้อมูลผู้เดินทาง</span>
            </div>
            <div className={`step-indicator-item ${step === 3 ? 'active' : ''}`}>
              <span className="step-num-badge">3</span>
              <span>ชำระเงิน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Page Content Wrap */}
      <div className="booking-content-wrap">
        <div className="booking-form-body">
          {/* STEP 1: Seat Selection */}
          {step === 1 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                <span className="badge-available" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', padding: '0.4rem 0.95rem', fontSize: '0.92rem', fontWeight: 700 }}>
                  <Calendar size={15} /> วันเดินทาง: {departureDate}
                </span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>
                  แตะเลือกที่นั่งของคุณ
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {selectedSeats.length === 0
                    ? 'กรุณาแตะที่เก้าอี้เพื่อเลือกที่นั่ง (เลือกได้มากกว่า 1 ที่)'
                    : `เลือกแล้ว ${selectedSeats.length} ที่นั่ง (ที่นั่ง: ${selectedSeats.join(', ')})`}
                </p>
              </div>

              <div style={{
                background: '#f6fbf8',
                border: '1.5px solid #d1fae5',
                borderRadius: '12px',
                padding: '0.6rem 0.85rem',
                fontSize: '0.88rem',
                color: '#166534',
                marginBottom: '0.75rem',
                textAlign: 'center',
                lineHeight: 1.4
              }}>
                💡 <strong>คำแนะนำ:</strong> สำหรับท่านที่ <strong>เมารถง่าย</strong> แนะนำเลือกแถวหน้า (แถว A และ B โซนสีเขียวอ่อน) โคลงเคลงน้อยที่สุด นั่งสบาย และขึ้น-ลงสะดวกครับ
              </div>

              <BusSeatMap 
                selectedSeats={selectedSeats}
                onToggleSeat={handleToggleSeat}
                maxSeats={26}
                occupiedSeats={occupiedSeats}
              />

              {/* Real-time Seat Count & Price Display */}
              <div style={{
                background: selectedSeats.length > 0 ? '#fdf0f4' : 'var(--color-bg-surface)',
                border: '1.5px solid ' + (selectedSeats.length > 0 ? 'var(--color-primary-subtle)' : 'var(--border-color)'),
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                marginTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                    {selectedSeats.length > 0
                      ? `จำนวนที่นั่งที่เลือก: ${selectedSeats.length} ที่นั่ง (${selectedSeats.join(', ')})`
                      : 'ยังไม่ได้เลือกที่นั่ง'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    ราคา {formatPrice(tour.price)} ต่อ 1 ท่าน
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>ราคารวมทั้งหมด</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                    {formatPrice(selectedSeats.length * tour.price)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Traveler & Health */}
          {step === 2 && (
            <>
              {/* Lead Traveler 1 (Read-Only from Member Profile) */}
              <div className="lead-traveler-readonly-card">
                <div className="lead-readonly-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {currentUser?.avatar ? (
                      currentUser.avatar.startsWith('data:image') || currentUser.avatar.startsWith('http') ? (
                        <span className="navbar-avatar-circle" style={{ width: '32px', height: '32px', border: '1.5px solid var(--color-primary)' }}>
                          <img src={currentUser.avatar} alt="รูปโปรไฟล์" />
                        </span>
                      ) : (
                        <span style={{ fontSize: '1.45rem', lineHeight: 1 }}>{currentUser.avatar}</span>
                      )
                    ) : (
                      <span style={{ fontSize: '1.3rem' }}>👤</span>
                    )}
                    <span style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '1.08rem' }}>
                      ผู้เดินทางคนที่ 1 {selectedSeats.length > 1 ? '(ผู้เดินทางหลัก / ตัวคุณเอง)' : '(ตัวคุณเอง)'}
                    </span>
                    {selectedSeats[0] && (
                      <span className="lead-seat-badge">
                        ที่นั่ง {selectedSeats[0]}
                      </span>
                    )}
                  </div>
                  <span className="lead-locked-badge">
                    🔒 ข้อมูลสมาชิก
                  </span>
                </div>

                <div className="lead-locked-alert">
                  <div>
                    🛡️ <strong>ดึงข้อมูลจากบัญชีสมาชิกอัตโนมัติ</strong> (ระบบล็อคข้อมูลไว้เพื่อป้องกันการเผลอกดผิดพลาด หากต้องการแก้ไขข้อมูลส่วนตัว สามารถแก้ไขได้ที่หน้าแรก/เมนูข้อมูลส่วนตัว)
                  </div>
                  {onOpenProfile && (
                    <button
                      type="button"
                      className="btn-outline-sm"
                      onClick={onOpenProfile}
                    >
                      ✏️ แก้ไขข้อมูลส่วนตัว
                    </button>
                  )}
                </div>

                <div className="lead-info-display-grid">
                  <div className="lead-info-row">
                    <span className="lead-info-label">ชื่อ - นามสกุล:</span>
                    <span className="lead-info-value" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {leadName || 'ไม่ระบุ'}
                    </span>
                  </div>
                  <div className="lead-info-row">
                    <span className="lead-info-label">เพศ / อายุ:</span>
                    <span className="lead-info-value">
                      {currentUser?.gender ? `เพศ${currentUser.gender} • ` : ''}อายุ {leadAge || '-'} ปี
                    </span>
                  </div>
                  <div className="lead-info-row">
                    <span className="lead-info-label">เบอร์โทรศัพท์สำหรับติดต่อ:</span>
                    <span className="lead-info-value" style={{ fontWeight: 600 }}>
                      {leadPhone || '-'}
                    </span>
                  </div>
                  <div className="lead-info-row">
                    <span className="lead-info-label">ผู้ติดต่อฉุกเฉิน:</span>
                    <span className="lead-info-value">
                      {currentUser?.hasNoRelative
                        ? 'กรณีไม่มีญาติ (มีทีมพยาบาลและไกด์ทัวร์ดูแลพิเศษ)'
                        : (emergencyContact || '-')}
                    </span>
                  </div>
                </div>

                {/* Health & Special Care Summary */}
                <div className="lead-health-summary-box">
                  <div className="lead-health-title">
                    <HeartPulse size={18} />
                    <span>บริการดูแลสุขภาพและโภชนาการประจำตัว</span>
                  </div>
                  <div className="lead-health-items">
                    <div className="lead-health-tag" style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c', fontWeight: 600 }}>
                      🚫 อาหารที่แพ้: {currentUser?.foodAllergy || 'ไม่มี (รับประทานได้ทุกอย่าง)'}
                    </div>
                    <div className="lead-health-tag">
                      🍲 อาหาร: {dietary}
                    </div>
                    <div className="lead-health-tag">
                      {needWheelchair ? '♿ ต้องการใช้วีลแชร์' : '🚶 เดินเองได้ (ไม่ใช้วีลแชร์)'}
                    </div>
                    <div className="lead-health-tag">
                      {needNurseHelp ? '💊 ให้พยาบาลช่วยเตือนทานยา' : '✓ ดูแลยาประจำตัวเอง'}
                    </div>
                    {medicalNote && (
                      <div className="lead-health-tag note">
                        ⚠️ สิ่งที่แพ้ / โรคประจำตัว: {medicalNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Multiple Travelers Form (Co-Travelers) */}
              {selectedSeats.length > 1 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary)', marginBottom: '0.2rem' }}>
                      ข้อมูลผู้ร่วมเดินทาง ({selectedSeats.length - 1} ท่าน)
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                      กรอกชื่อเพื่อจัดเตรียมประกันการเดินทางและการดูแล
                    </p>
                  </div>

                  {coTravelers.map((traveler, index) => (
                    <div
                      key={index}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '1rem' }}>
                          👤 ผู้เดินทางคนที่ {index + 2}
                        </span>
                        <span style={{
                          background: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '0.85rem'
                        }}>
                          ที่นั่ง {selectedSeats[index + 1]}
                        </span>
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">ชื่อ-นามสกุล *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="ชื่อผู้ร่วมเดินทาง"
                            value={traveler.name}
                            onChange={(e) => handleUpdateCoTraveler(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">อายุ (ปี)</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="เช่น 68"
                            value={traveler.age}
                            onChange={(e) => handleUpdateCoTraveler(index, 'age', e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0.2rem 0' }}>
                        <label className="checkbox-card" style={{ padding: 0 }}>
                          <input
                            type="checkbox"
                            checked={traveler.needWheelchair}
                            onChange={(e) => handleUpdateCoTraveler(index, 'needWheelchair', e.target.checked)}
                          />
                          <span>ต้องการใช้วีลแชร์</span>
                        </label>

                        <label className="checkbox-card" style={{ padding: 0 }}>
                          <input
                            type="checkbox"
                            checked={traveler.needNurseHelp}
                            onChange={(e) => handleUpdateCoTraveler(index, 'needNurseHelp', e.target.checked)}
                          />
                          <span>พยาบาลช่วยเตือนยา</span>
                        </label>
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">อาหาร:</label>
                          <select
                            className="form-control"
                            value={traveler.dietary}
                            onChange={(e) => handleUpdateCoTraveler(index, 'dietary', e.target.value)}
                          >
                            <option value="ปกติ (หวาน-เค็มน้อย)">ปกติ (หวาน-เค็มน้อย)</option>
                            <option value="เบาหวาน (จำกัดน้ำตาล)">เบาหวาน (จำกัดน้ำตาล)</option>
                            <option value="โรคไต (โซเดียมต่ำ)">โรคไต (โซเดียมต่ำ)</option>
                            <option value="อาหารอ่อน ย่อยง่าย">อาหารอ่อน เคี้ยวง่าย</option>
                            <option value="มังสวิรัติ / เจ">มังสวิรัติ / เจ</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">โรคประจำตัว/แพ้อาหาร (ถ้ามี):</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="เช่น แพ้อาหารทะเล..."
                            value={traveler.medicalNote}
                            onChange={(e) => handleUpdateCoTraveler(index, 'medicalNote', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Customer Notes to Staff (หมายเหตุเพิ่มเติมถึงพนักงาน) */}
              <div 
                style={{ 
                  marginTop: '1.25rem', 
                  background: '#ffffff', 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: '16px', 
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <MessageSquare size={18} color="var(--color-primary)" />
                  <label className="form-label" style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    หมายเหตุเพิ่มเติม (ถ้ามี)
                  </label>
                </div>

                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="ระบุข้อความหรือสิ่งที่ต้องการแจ้งพนักงาน..."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  style={{ 
                    resize: 'vertical', 
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            </>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (
            <>
              <div className="price-summary-card">
                <div className="summary-row">
                  <span>โปรแกรม:</span>
                  <strong>{tour.title}</strong>
                </div>
                <div className="summary-row">
                  <span>รูปแบบทริป:</span>
                  <strong>{departureDate}</strong>
                </div>
                <div className="summary-row">
                  <span>ที่นั่ง:</span>
                  <strong>{selectedSeats.join(', ')} ({selectedSeats.length} ที่นั่ง)</strong>
                </div>
                <div className="summary-row">
                  <span>ผู้เดินทาง:</span>
                  <strong>
                    {leadName}
                    {coTravelers.length > 0 && `, ${coTravelers.map(c => c.name).filter(Boolean).join(', ')}`}
                  </strong>
                </div>
                {customerNote && (
                  <div className="summary-row" style={{ alignItems: 'flex-start' }}>
                    <span>หมายเหตุถึงทีมงาน:</span>
                    <strong style={{ color: '#c2410c', maxWidth: '65%', textAlign: 'right' }}>
                      "{customerNote}"
                    </strong>
                  </div>
                )}
                <div className="summary-row total">
                  <span>ยอดสุทธิที่ต้องชำระ:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <div className="qr-mock-box" style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    <QrCode size={22} color="#113566" />
                    <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#113566' }}>
                      ชำระเงินผ่าน QR Code (PromptPay)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 1rem' }}>
                    สแกน QR ผ่านแอปพลิเคชันทุกธนาคาร เพื่อยืนยันที่นั่งทันที
                  </p>
                  
                  <div style={{ width: '190px', height: '190px', margin: '0 auto', background: '#fff', border: '3px solid #113566', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(17, 53, 102, 0.12)' }}>
                    <QrCode size={135} color="#113566" />
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#113566', letterSpacing: '0.5px' }}>THAI QR PAYMENT</span>
                  </div>

                  <div style={{ marginTop: '1.15rem', background: '#eff6ff', borderRadius: '10px', padding: '0.75rem 1.25rem', display: 'inline-block', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.88rem', color: '#1e40af' }}>
                      ยอดที่ต้องชำระ: <strong style={{ fontSize: '1.25rem', color: '#1e3a8a' }}>{formatPrice(totalAmount)}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                      ชื่อบัญชี: บจก. สุขใจวัยเกษียณทัวร์ (พร้อมเพย์)
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="booking-bottom-bar">
        <div className="booking-bottom-inner">
          {step > 1 ? (
            <button type="button" className="btn-outline" onClick={() => { setStep(step - 1); window.scrollTo(0, 0); }}>
              <ArrowLeft size={18} /> <span>ย้อนกลับ</span>
            </button>
          ) : (
            <button type="button" className="btn-outline" onClick={onCancel}>
              <ArrowLeft size={18} /> <span>ยกเลิก</span>
            </button>
          )}

          {step === 1 && selectedSeats.length > 0 && (
            <div className="booking-footer-price">
              <span>{selectedSeats.length} ที่นั่ง</span> • <span>{formatPrice(selectedSeats.length * tour.price)}</span>
            </div>
          )}

          {step < 3 ? (
            <button type="button" className="btn-primary" onClick={handleNext}>
              <span>ถัดไป</span> <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
              onClick={handleConfirmBooking}
            >
              <Check size={20} /> <span>ยืนยันการจอง ({selectedSeats.length} ท่าน)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
