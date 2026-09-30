import React from 'react';
import { Flower2, QrCode, Printer, Home, CheckCircle2 } from 'lucide-react';
import { printBookingReceipt } from '../../utils/printReceipt';
import './ticket.css';

export default function TicketPage({ booking, onBackHome }) {
  if (!booking) return null;

  return (
    <div className="ticket-page-container">
      
      <div className="print-btn-container" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          type="button" 
          className="btn-primary" 
          onClick={() => printBookingReceipt(booking)}
          title="พิมพ์ตั๋วและใบเสร็จ หรือบันทึกเป็น PDF"
        >
          <Printer size={18} /> พิมพ์ตั๋ว / บันทึกเป็น PDF
        </button>
        <button type="button" className="btn-outline" onClick={onBackHome}>
          <Home size={18} /> กลับหน้าแรก
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-success)' }}>
        <CheckCircle2 size={48} style={{ margin: '0 auto', marginBottom: '0.5rem' }} />
        <h2>การจองสำเร็จ!</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>ขอบคุณที่ไว้วางใจให้เราดูแลทริปของคุณ</p>
      </div>

      <div className="ticket-wrapper">
        {/* Ticket Left (Details) */}
        <div className="ticket-left">
          <div className="ticket-header">
            <div className="ticket-brand">
              <div className="ticket-brand-icon">
                <Flower2 size={20} />
              </div>
              สุขใจวัยเกษียณทัวร์
            </div>
            <div className="ticket-id">
              Booking Ref: {booking.id}
            </div>
          </div>

          <div className="ticket-body">
            <div className="ticket-field">
              <span className="ticket-label">โปรแกรมทัวร์ (Tour Program)</span>
              <span className="ticket-value highlight">{booking.tourTitle}</span>
            </div>
            
            <div className="ticket-field">
              <span className="ticket-label">วันเดินทาง (Departure Date)</span>
              <span className="ticket-value">{booking.departureDate}</span>
            </div>

            <div className="ticket-field">
              <span className="ticket-label">ผู้เดินทาง (Passenger)</span>
              <span className="ticket-value">
                {booking.leadName}
                {booking.coTravelers?.length > 0 && (
                  <span style={{ fontSize: '0.95rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>
                    {', '}{booking.coTravelers.map(c => c.name).filter(Boolean).join(', ')}
                  </span>
                )}
                {' '}({booking.travelersCount} ท่าน)
              </span>
            </div>

            <div className="ticket-field">
              <span className="ticket-label">ที่นั่ง (Seat)</span>
              <span className="ticket-value highlight">{booking.selectedSeats?.join(', ')}</span>
            </div>

            <div className="ticket-field">
              <span className="ticket-label">จุดรับ-ส่ง (Pick-up Point)</span>
              <span className="ticket-value">{booking.pickupPoint}</span>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-primary-light)' }}>
            <div className="ticket-label">ข้อมูลทีมงานดูแลประจำรถ</div>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
              <div><strong>ไกด์:</strong> {booking.assignedGuide}</div>
              {booking.specialNeeds?.hasNurseAssistance && (
                <div><strong>พยาบาล:</strong> {booking.assignedNurse}</div>
              )}
            </div>
          </div>

          {booking.isBookedByChild && booking.childGreeting && (
            <div className="ticket-greeting-card">
              <strong>💌 ข้อความจากลูกหลานถึงคุณ:</strong>
              <p style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>"{booking.childGreeting}"</p>
            </div>
          )}

          {booking.customerNote && (
            <div className="ticket-greeting-card" style={{ background: '#fffbeb', borderColor: '#fde68a', marginTop: '1rem' }}>
              <strong style={{ color: '#92400e' }}>💬 หมายเหตุเพิ่มเติมถึงทีมงาน:</strong>
              <p style={{ fontSize: '1.05rem', marginTop: '0.35rem', color: '#78350f' }}>"{booking.customerNote}"</p>
            </div>
          )}
        </div>

        {/* Ticket Right (Stub) */}
        <div className="ticket-right">
          <div className="ticket-label" style={{ marginBottom: '1rem' }}>แสดง QR นี้วันเดินทาง</div>
          <div className="ticket-qr">
            <QrCode size={120} color="var(--color-primary)" />
          </div>
          <div className="ticket-stamp">
            PAID
          </div>
          <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--color-primary-hover)' }}>
            นำตั๋วนี้มาแสดงในวันเดินทาง (สามารถแสดงผ่านมือถือได้)
          </div>
        </div>
      </div>

    </div>
  );
}
