import React from 'react';
import { X, CheckCircle, Printer, Calendar, HeartPulse, User } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import { printBookingReceipt } from '../../utils/printReceipt';
import './tickets.css';

export default function TicketModal({ booking, onClose }) {
  if (!booking) return null;

  const handlePrint = () => {
    printBookingReceipt(booking);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ticket-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="ปิดหน้าต่างตั๋วเดินทาง"
        >
          <X size={20} />
        </button>

        <div className="ticket-header-success">
          <div className="ticket-success-badge">
            <CheckCircle size={16} /> ยืนยันการจองเรียบร้อยแล้ว
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '0.25rem' }}>
            ตั๋วและใบลายแทงการเดินทาง
          </h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
            บันทึกภาพหน้าจอหรือพิมพ์หน้านี้ไว้แสดงต่อเจ้าหน้าที่ในวันออกเดินทาง
          </p>
        </div>

        {/* Printable Ticket Paper */}
        <div className="ticket-paper">
          <div className="ticket-paper-title">
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: '700' }}>
                สุขใจวัยเกษียณทัวร์ | SUKJAI SENIOR TOUR
              </div>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--color-primary)' }}>
                {booking.tourTitle}
              </h3>
            </div>
            <div className="ticket-id-tag">
              {booking.id}
            </div>
          </div>

          <div className="ticket-info-grid">
            <div className="ticket-info-item">
              <span className="ticket-label">วันเวลาออกเดินทาง</span>
              <span className="ticket-value">
                <Calendar size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                {booking.departureDate}
              </span>
            </div>

            <div className="ticket-info-item">
              <span className="ticket-label">ผู้เดินทางหลัก</span>
              <span className="ticket-value">
                <User size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                {booking.leadName} ({booking.travelersCount} ท่าน)
              </span>
            </div>

            <div className="ticket-info-item">
              <span className="ticket-label">เบอร์โทรศัพท์ติดต่อ</span>
              <span className="ticket-value">{booking.leadPhone}</span>
            </div>

            <div className="ticket-info-item">
              <span className="ticket-label">เบอร์ติดต่อฉุกเฉิน / ลูกหลาน</span>
              <span className="ticket-value">{booking.emergencyContact}</span>
            </div>
          </div>

          {/* Pickup Point */}
          <div style={{ background: '#f8f9fa', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e9ecef' }}>
            <span className="ticket-label" style={{ display: 'block', marginBottom: '2px' }}>
              📍 จุดนัดพบและขึ้นรถ VIP
            </span>
            <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
              {booking.pickupPoint}
            </span>
          </div>

          {/* Caregivers Contacts */}
          <div className="ticket-contact-box">
            <div style={{ fontWeight: '700', color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HeartPulse size={18} />
              <span>เจ้าหน้าที่ประจำทริปของคุณ</span>
            </div>
            <div style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              👨‍💼 <strong>มัคคุเทศก์:</strong> {booking.assignedGuide}
            </div>
            <div style={{ fontSize: '0.95rem' }}>
              🩺 <strong>พยาบาลวิชาชีพ:</strong> {booking.assignedNurse}
            </div>
          </div>

          {/* Special Health Notes */}
          {booking.specialNeeds && (
            <div style={{ background: '#fdf7f0', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fae1c5', fontSize: '0.95rem' }}>
              <strong>📋 การดูแลสุขภาพที่บันทึกไว้:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                • รถเข็น: {booking.specialNeeds.wheelchair ? 'ต้องการวีลแชร์ (เตรียมไว้ให้พร้อม)' : 'เดินสบาย'}<br />
                • เมนูอาหาร: {booking.specialNeeds.dietary}<br />
                • โน้ตสุขภาพ: {booking.specialNeeds.medicalNote}
              </div>
            </div>
          )}

          {/* Child Greeting Note */}
          {booking.isBookedByChild && booking.childGreeting && (
            <div className="ticket-greeting-box">
              <span style={{ fontSize: '0.82rem', color: '#a36c18', fontWeight: '700', display: 'block' }}>
                💌 ข้อความความในใจจากลูกหลาน:
              </span>
              <p style={{ fontStyle: 'italic', color: '#6d4c1b', marginTop: '0.25rem' }}>
                "{booking.childGreeting}"
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cfb997', paddingTop: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>สถานะการชำระ:</span>{' '}
              <strong style={{ color: 'var(--color-success)' }}>{booking.paymentStatus}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>ยอดรวม:</span>{' '}
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>{formatPrice(booking.totalAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ticket-actions-bar">
          <button
            type="button"
            className="btn-outline"
            onClick={handlePrint}
            title="พิมพ์ตั๋วหรือบันทึกเป็นไฟล์ PDF"
          >
            <Printer size={18} /> พิมพ์ตั๋วเดินทาง / บันทึก PDF
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            เสร็จสิ้น & ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
