import React, { useState } from 'react';
import { X, Calendar, Users, HeartPulse, Check, ArrowRight, ArrowLeft, QrCode, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPrice, generateBookingId } from '../../utils/formatters';
import { saveBooking } from '../../utils/storage';
import './booking.css';

export default function BookingModal({ tour, onClose, onBookingSuccess }) {
  const [step, setStep] = useState(1);

  // Single-trip model
  const departureDate = tour?.duration ? `ทริป ${tour.duration}` : 'ทริป 1 วัน (ไปเช้า-เย็นกลับ)';
  const [travelersCount, setTravelersCount] = useState(1);
  const [leadName, setLeadName] = useState('');
  const [leadAge, setLeadAge] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  
  // Health & Special Care Needs
  const [needWheelchair, setNeedWheelchair] = useState(false);
  const [needNurseHelp, setNeedNurseHelp] = useState(true);
  const [dietary, setDietary] = useState('อาหารปกติ (สูตรหวาน-เค็มน้อย)');
  const [medicalNote, setMedicalNote] = useState('');

  // Child Booking for Parents
  const [isBookedByChild, setIsBookedByChild] = useState(false);
  const [childGreeting, setChildGreeting] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('promptpay');

  if (!tour) return null;

  const totalAmount = tour.price * travelersCount;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!leadName.trim()) {
        alert('กรุณากรอกชื่อผู้เดินทางเพื่อความปลอดภัยและทำประกันภัยครับ');
        return;
      }
      if (!leadPhone.trim()) {
        alert('กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อและรับตั๋วเดินทางครับ');
        return;
      }
      setStep(3);
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
      travelersCount,
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
      isBookedByChild,
      childGreeting: isBookedByChild ? childGreeting : '',
      totalAmount,
      paymentMethod: paymentMethod === 'promptpay' ? 'QR PromptPay' : 'จ่ายวันเดินทาง (มัดจำล่วงหน้า)',
      paymentStatus: 'ยืนยันการจองสำเร็จ',
      assignedGuide: 'ไกด์สมชาย ชำนาญการดูแลผู้สูงวัย (081-222-3344)',
      assignedNurse: 'พยาบาลวิภา พยาบาลวิชาชีพร่วมทริป (089-555-6677)',
      pickupPoint: 'จุดรับ-ส่ง VIP รถตู้ปรับเบาะนอน สถานีรถไฟฟ้าหมอชิต (ประตู 3) เวลา 08:30 น.'
    };

    saveBooking(newBooking);

    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onBookingSuccess(newBooking);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="ปิดหน้าต่างจองตั๋ว"
        >
          <X size={20} />
        </button>

        <div className="booking-modal-header">
          <h2 className="booking-modal-title">จองตั๋วทัวร์: {tour.title}</h2>
          <p className="booking-modal-subtitle">
            ขั้นตอนง่ายๆ ตัวหนังสือชัดเจน ไม่เร่งรีบ สอบถามได้ตลอดเวลา
          </p>
        </div>

        {/* Steps Header */}
        <div className="booking-steps-bar">
          <div className={`step-indicator-item ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
            <span className="step-num-badge">{step > 1 ? '✓' : '1'}</span>
            <span>จำนวนผู้เดินทาง</span>
          </div>
          <div className={`step-indicator-item ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
            <span className="step-num-badge">{step > 2 ? '✓' : '2'}</span>
            <span>ข้อมูลสุขภาพ & ผู้เดินทาง</span>
          </div>
          <div className={`step-indicator-item ${step === 3 ? 'active' : ''}`}>
            <span className="step-num-badge">3</span>
            <span>ชำระเงิน & ออกตั๋ว</span>
          </div>
        </div>

        <div className="booking-form-body">
          {/* STEP 1: Date & Travelers */}
          {step === 1 && (
            <>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={20} color="var(--color-primary)" />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.95rem' }}>รูปแบบการเดินทาง: ทริป 1 วัน (ไปเช้า-เย็นกลับ)</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>เดินทางครั้งเดียว ไม่ต้องเลือกรอบ สะดวกสบายตลอดเส้นทาง</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="travelers-count-input">
                  <Users size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  จำนวนผู้เดินทาง (ท่าน)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ width: '48px', height: '48px', fontSize: '1.4rem', padding: 0 }}
                    onClick={() => setTravelersCount(Math.max(1, travelersCount - 1))}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', minWidth: '40px', textAlign: 'center' }}>
                    {travelersCount}
                  </span>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ width: '48px', height: '48px', fontSize: '1.4rem', padding: 0 }}
                    onClick={() => setTravelersCount(travelersCount + 1)}
                  >
                    +
                  </button>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                    ({formatPrice(tour.price)} x {travelersCount} ท่าน)
                  </span>
                </div>
              </div>

              <div className="price-summary-card">
                <div className="summary-row">
                  <span>แพ็กเกจทัวร์:</span>
                  <span>{tour.title}</span>
                </div>
                <div className="summary-row">
                  <span>ระยะเวลา:</span>
                  <span>{tour.duration}</span>
                </div>
                <div className="summary-row total">
                  <span>ยอดรวมโดยประมาณ:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Traveler details & Health */}
          {step === 2 && (
            <>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="lead-name">
                    ชื่อ-นามสกุล ผู้เดินทางหลัก *
                  </label>
                  <input
                    id="lead-name"
                    type="text"
                    className="form-control"
                    placeholder="เช่น คุณตาประสิทธิ์ มีสุข"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lead-age">
                    อายุ (ปี)
                  </label>
                  <input
                    id="lead-age"
                    type="number"
                    className="form-control"
                    placeholder="เช่น 70"
                    value={leadAge}
                    onChange={(e) => setLeadAge(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="lead-phone">
                    เบอร์โทรศัพท์สำหรับติดต่อ *
                  </label>
                  <input
                    id="lead-phone"
                    type="tel"
                    className="form-control"
                    placeholder="เช่น 081-xxx-xxxx"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emergency-phone">
                    เบอร์โทรติดต่อฉุกเฉิน / เบอร์ลูกหลาน
                  </label>
                  <input
                    id="emergency-phone"
                    type="tel"
                    className="form-control"
                    placeholder="เช่น ลูกสาว คุณแอน 089-xxx-xxxx"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </div>
              </div>

              {/* Health & Special Care Options */}
              <div className="special-needs-box">
                <div style={{ fontWeight: '700', color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HeartPulse size={18} />
                  <span>ข้อมูลการดูแลสุขภาพเฉพาะบุคคล (ไม่มีค่าใช้จ่ายเพิ่ม)</span>
                </div>

                <label className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={needWheelchair}
                    onChange={(e) => setNeedWheelchair(e.target.checked)}
                  />
                  <div>
                    <strong>ต้องการใช้วีลแชร์ระหว่างทริป</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      (หากไม่ได้นำมาเอง ทีมงานจัดเตรียมรถเข็นฟรีพร้อมผู้ช่วยเข็น)
                    </div>
                  </div>
                </label>

                <label className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={needNurseHelp}
                    onChange={(e) => setNeedNurseHelp(e.target.checked)}
                  />
                  <div>
                    <strong>ต้องการให้พยาบาลช่วยจัดยาและเตือนรับประทานยาตามเวลา</strong>
                  </div>
                </label>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.9rem' }}>
                    อาหารที่ต้องการเป็นพิเศษ:
                  </label>
                  <select
                    className="form-control"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                  >
                    <option value="อาหารปกติ (สูตรหวาน-เค็มน้อย)">อาหารปกติ (สูตรหวาน-เค็มน้อย ปลอดชูรส)</option>
                    <option value="อาหารเบาหวาน (จำกัดน้ำตาลและแป้ง)">อาหารเบาหวาน (จำกัดน้ำตาลและแป้ง)</option>
                    <option value="อาหารโรคไต (โซเดียมต่ำมาก ไม่ใส่ซอสปรุงรสจัด)">อาหารโรคไต (โซเดียมต่ำมาก)</option>
                    <option value="อาหารอ่อน ย่อยง่าย เคี้ยวง่าย">อาหารอ่อน ย่อยง่าย เคี้ยวง่าย</option>
                    <option value="อาหารมังสวิรัติ / เจ">อาหารมังสวิรัติ / เจ</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.9rem' }}>
                    โรคประจำตัวหรือสิ่งที่อยากให้ทีมงานระวังเป็นพิเศษ:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น ความดันโลหิตสูง, เวียนหัวง่าย, แพ้กุ้ง..."
                    value={medicalNote}
                    onChange={(e) => setMedicalNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Mode: Booked by children */}
              <div className="child-gift-box">
                <label className="checkbox-card" style={{ padding: 0 }}>
                  <input
                    type="checkbox"
                    checked={isBookedByChild}
                    onChange={(e) => setIsBookedByChild(e.target.checked)}
                  />
                  <div>
                    <strong style={{ color: '#a36c18' }}>🎁 โหมด "ลูกหลานจองให้คุณพ่อคุณแม่"</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      พิมพ์การ์ดอวยพรแนบในตั๋ว + รับรายงานรูปถ่ายสดระหว่างทริปผ่าน LINE
                    </div>
                  </div>
                </label>

                {isBookedByChild && (
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.9rem' }}>
                      ข้อความอวยพรที่คุณอยากส่งถึงท่าน (จะพิมพ์ลงบนใบลายแทงเดินทาง):
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="เช่น ขอให้คุณพ่อคุณแม่เที่ยวให้สนุก สุขภาพแข็งแรงนะคะ รักมากค่ะ"
                      value={childGreeting}
                      onChange={(e) => setChildGreeting(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 3: Summary & Simulated Payment */}
          {step === 3 && (
            <>
              <div className="price-summary-card">
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                  📋 สรุปรายการจองตั๋วเดินทาง
                </h4>
                <div className="summary-row">
                  <span>โปรแกรม:</span>
                  <strong>{tour.title}</strong>
                </div>
                <div className="summary-row">
                  <span>รูปแบบทริป:</span>
                  <strong>{departureDate}</strong>
                </div>
                <div className="summary-row">
                  <span>ผู้เดินทาง:</span>
                  <span>{leadName} ({travelersCount} ท่าน)</span>
                </div>
                <div className="summary-row">
                  <span>เบอร์ติดต่อ:</span>
                  <span>{leadPhone}</span>
                </div>
                <div className="summary-row">
                  <span>บริการสุขภาพ:</span>
                  <span>{needWheelchair ? '♿ ใช้วีลแชร์' : 'เดินสบาย'} | {dietary}</span>
                </div>
                <div className="summary-row total">
                  <span>ยอดสุทธิที่ต้องชำระ:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="form-group">
                <label className="form-label">เลือกวิธีชำระเงิน</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={`btn-outline ${paymentMethod === 'promptpay' ? 'active' : ''}`}
                    style={{
                      background: paymentMethod === 'promptpay' ? 'var(--color-primary-light)' : '#ffffff',
                      borderColor: paymentMethod === 'promptpay' ? 'var(--color-primary)' : 'var(--border-color)',
                      padding: '0.85rem'
                    }}
                    onClick={() => setPaymentMethod('promptpay')}
                  >
                    💳 สแกน PromptPay QR Code
                  </button>

                  <button
                    type="button"
                    className={`btn-outline ${paymentMethod === 'on-trip' ? 'active' : ''}`}
                    style={{
                      background: paymentMethod === 'on-trip' ? 'var(--color-primary-light)' : '#ffffff',
                      borderColor: paymentMethod === 'on-trip' ? 'var(--color-primary)' : 'var(--border-color)',
                      padding: '0.85rem'
                    }}
                    onClick={() => setPaymentMethod('on-trip')}
                  >
                    💵 มัดจำ & จ่ายวันเดินทาง
                  </button>
                </div>
              </div>

              {paymentMethod === 'promptpay' && (
                <div className="qr-mock-box">
                  <div style={{ fontWeight: '700', color: '#0b3d2b', marginBottom: '0.5rem' }}>
                    สแกน QR Code ผ่านแอปธนาคารใดก็ได้
                  </div>
                  {/* SVG PromptPay Mockup */}
                  <div style={{
                    width: '180px',
                    height: '180px',
                    margin: '0 auto',
                    background: '#ffffff',
                    border: '3px solid #113566',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px'
                  }}>
                    <QrCode size={130} color="#113566" />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#113566' }}>THAI QR PAYMENT</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    ชื่อบัญชี: บจก. สุขใจวัยเกษียณทัวร์ | ธนาคารกสิกรไทย
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="booking-modal-footer">
          {step > 1 ? (
            <button
              type="button"
              className="btn-outline"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} /> ย้อนกลับ
            </button>
          ) : (
            <button type="button" className="btn-outline" onClick={onClose}>
              ยกเลิก
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
            >
              ถัดไป <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', fontSize: '1.15rem' }}
              onClick={handleConfirmBooking}
            >
              <Check size={20} /> ยืนยันการจองและรับตั๋ว
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
