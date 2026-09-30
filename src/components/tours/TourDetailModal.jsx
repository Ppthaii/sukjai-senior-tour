import React from 'react';
import { X, CheckCircle2, Clock, Footprints, Bus, HeartPulse } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

export default function TourDetailModal({ tour, onClose, onStartBooking }) {
  if (!tour) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="tour-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="ปิดหน้าต่างรายละเอียด"
        >
          <X size={22} />
        </button>

        <img src={tour.image} alt={tour.title} className="modal-hero-img" />

        <div className="modal-content-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span className="section-badge" style={{ margin: 0 }}>{tour.region}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: '700' }}>
              📍 {tour.destination}
            </span>
          </div>

          <h2 style={{ fontSize: '1.85rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {tour.title}
          </h2>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            {tour.tagline}
          </p>

          {/* Key Amenities Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            background: 'var(--color-bg-page)',
            padding: '1.25rem',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '2rem',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>ระยะเวลา</div>
              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} color="var(--color-primary)" /> {tour.duration}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>จังหวะการเดินทาง</div>
              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Footprints size={16} color="var(--color-primary)" /> {tour.pace}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>ยานพาหนะ</div>
              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bus size={16} color="var(--color-primary)" /> {tour.vehicleType}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>ทีมดูแลพิเศษ</div>
              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <HeartPulse size={16} color="var(--color-primary)" /> พยาบาลวิชาชีพดูแล 24 ชม.
              </div>
            </div>
          </div>

          {/* Highlights */}
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
            ✨ จุดเด่นและสิ่งที่คุณพ่อคุณแม่จะประทับใจ
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' }}>
            {tour.highlights.map((h, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '1.05rem' }}>
                <CheckCircle2 size={18} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>{h}</span>
              </li>
            ))}
          </ul>

          {/* Itinerary */}
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
            📅 กำหนดการท่องเที่ยวแบบไม่เร่งรีบ (Leisurely Itinerary)
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            * ตารางเวลาปรับตามความสะดวกของผู้ร่วมทริป มีจุดแวะพักเข้าห้องน้ำสะอาดทุก 1.5 - 2 ชั่วโมง
          </p>

          <div className="itinerary-timeline">
            {tour.itinerary.map((item, idx) => (
              <div key={idx} className="timeline-step">
                <div className="timeline-time">{item.time}</div>
                <div className="timeline-activity">{item.activity}</div>
              </div>
            ))}
          </div>

          {/* What's included */}
          <h3 style={{ fontSize: '1.3rem', margin: '2rem 0 0.75rem', color: 'var(--color-primary)' }}>
            🎁 ราคานี้รวมอะไรบ้าง
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem', marginBottom: '2rem' }}>
            {tour.included.map((inc, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" />
                <span>{inc}</span>
              </div>
            ))}
          </div>

          {/* Modal Bottom Call to Action */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid var(--border-color)',
            paddingTop: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>ราคาแพ็กเกจรวมทุกอย่าง</div>
              <div style={{ fontSize: '1.9rem', fontWeight: '700', color: 'var(--color-primary)', fontFamily: 'var(--font-family-display)' }}>
                {formatPrice(tour.price)}
                <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'var(--color-text-muted)' }}> /ท่าน</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn-outline" onClick={onClose}>
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '0.85rem 2rem', fontSize: '1.15rem' }}
                onClick={() => {
                  onClose();
                  onStartBooking(tour);
                }}
              >
                จองที่นั่งทริปนี้
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
