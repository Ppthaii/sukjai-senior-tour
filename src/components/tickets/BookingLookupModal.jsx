import React, { useState, useEffect } from 'react';
import { X, Ticket, ArrowRight, Calendar, Users } from 'lucide-react';
import { getUserBookingsByPhone } from '../../utils/storage';
import { formatPrice } from '../../utils/formatters';
import './tickets.css';

export default function BookingLookupModal({ currentUser, onClose, onSelectBooking }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [userBookings, setUserBookings] = useState(() => getUserBookingsByPhone(currentUser?.phone));

  useEffect(() => {
    const handleUpdate = () => {
      setUserBookings(getUserBookingsByPhone(currentUser?.phone));
    };
    handleUpdate();
    window.addEventListener('sukjai_bookings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sukjai_bookings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [currentUser?.phone]);

  // Filter within user's own bookings if search term entered
  const displayedBookings = userBookings.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (b.tourTitle && b.tourTitle.toLowerCase().includes(term)) ||
      (b.id && b.id.toLowerCase().includes(term)) ||
      (b.departureDate && b.departureDate.toLowerCase().includes(term)) ||
      (b.tourDestination && b.tourDestination.toLowerCase().includes(term))
    );
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lookup-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn lookup-close-btn"
          onClick={onClose}
          aria-label="ปิดหน้าต่างตั๋วของฉัน"
        >
          <X size={18} />
        </button>

        <div className="lookup-header">
          <div className="lookup-icon-circle">
            <Ticket size={28} />
          </div>
          <h2 className="lookup-title">
            ตั๋วการเดินทางของคุณ
          </h2>
          <p className="lookup-subtitle">
            เฉพาะประวัติการจองของเบอร์ <strong>{currentUser?.phone}</strong> ({currentUser?.name})
          </p>
        </div>

        {/* Search within own bookings if multiple bookings exist */}
        {userBookings.length > 1 && (
          <div className="lookup-search-form" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              className="lookup-search-input"
              placeholder="ค้นหาชื่อทัวร์ หรือรหัสตั๋วของคุณ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Results List */}
        <div className="lookup-results-list">
          {userBookings.length === 0 ? (
            <div className="lookup-empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎫</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                ยังไม่มีประวัติการจองสำหรับเบอร์นี้
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                เมื่อคุณทำการจองทริปสำเร็จ ตั๋วการเดินทางจะแสดงที่นี่โดยอัตโนมัติครับ
              </div>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="lookup-empty-state">
              ❌ ไม่พบการจองที่ตรงกับคำค้นหา "{searchTerm}"
            </div>
          ) : (
            displayedBookings.map((booking) => (
              <div key={booking.id} className="lookup-item-card">
                <div className="lookup-item-info">
                  <div className="lookup-item-meta">
                    <span className="ticket-id-tag">{booking.id}</span>
                    <span className="lookup-item-status">
                      ● {booking.paymentStatus}
                    </span>
                  </div>
                  <h4 className="lookup-item-title">
                    {booking.tourTitle}
                  </h4>
                  <div className="lookup-item-sub">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} color="var(--color-primary)" />
                      {booking.departureDate}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Users size={14} color="var(--color-primary)" />
                      {booking.travelersCount} ท่าน
                      {booking.selectedSeats?.length > 0 && ` (ที่นั่ง: ${booking.selectedSeats.join(', ')})`}
                    </span>
                    {booking.totalAmount && (
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatPrice(booking.totalAmount)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary lookup-item-action-btn"
                  onClick={() => {
                    if (onSelectBooking) {
                      onSelectBooking(booking);
                    }
                    onClose();
                  }}
                >
                  <span>ดูตั๋ว</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
