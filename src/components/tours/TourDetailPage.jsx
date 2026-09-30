import React from 'react';
import { Calendar, HeartPulse, Clock, Map, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Bus } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

export default function TourDetailPage({ tour, onBack, onBook }) {
  if (!tour) return null;

  return (
    <div className="tour-detail-page">
      <div className="container detail-container">
        
        <button type="button" className="btn-outline back-btn" onClick={onBack}>
          <ArrowLeft size={18} /> ย้อนกลับหน้าแรก
        </button>

        <article className="tour-detail-content">
          <div className="detail-hero">
            <img 
              src={tour.image} 
              alt={tour.title}
              className="detail-hero-img"
              loading="lazy"
            />
            <div className="detail-badge-duration">
              <Clock size={15} />
              <span>{tour.duration}</span>
            </div>
          </div>

          <div className="detail-body">
            <div className="detail-header">
              <div className="detail-title-group">
                <h1 className="detail-title">{tour.title}</h1>
                <p className="detail-tagline">{tour.tagline}</p>
                <div className="detail-meta">
                  <span className="meta-item" style={{ background: '#fdf2f8', color: 'var(--color-primary, #9c3858)', fontWeight: 700, border: '1px solid #fbcfe8' }}>
                    <Calendar size={17} color="var(--color-primary, #9c3858)" /> วันเดินทาง: {tour.travelDate || tour.departureDate || (Array.isArray(tour.departureDates) && tour.departureDates[0]) || '18 เมษายน 2569'}
                  </span>
                  <span className="meta-item">
                    <Map size={17} /> {tour.destination} ({tour.region})
                  </span>
                  <span className="meta-item">
                    <Clock size={17} /> {tour.duration}
                  </span>
                  {tour.vehicleType && (
                    <span className="meta-item">
                      <Bus size={17} /> {tour.vehicleType}
                    </span>
                  )}
                </div>
              </div>

              <div className="detail-price-card">
                <div className="detail-price-val">
                  {formatPrice(tour.price)}
                  <span className="detail-price-sub"> / ท่าน</span>
                </div>
                {tour.originalPrice && (
                  <div className="detail-price-orig">
                    ปกติ {formatPrice(tour.originalPrice)}
                  </div>
                )}
                <div className="detail-price-tag">
                  <ShieldCheck size={16} /> รวมค่าดูแลสุขภาพ & ประกันแล้ว
                </div>
              </div>
            </div>

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <div className="detail-section">
                <h2 className="detail-section-title">
                  🌟 จุดเด่นและกิจกรรมไฮไลท์
                </h2>
                <div className="highlights-grid">
                  {tour.highlights.map((highlight, idx) => (
                    <div key={idx} className="highlight-item">
                      <CheckCircle2 size={18} className="highlight-icon" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary Timeline */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div className="detail-section">
                <h2 className="detail-section-title">
                  🕒 กำหนดการเดินทาง (ท่องเที่ยวแบบไม่เร่งรีบ)
                </h2>
                <div className="itinerary-timeline">
                  {tour.itinerary.map((item, idx) => (
                    <div key={idx} className="timeline-step">
                      <div className="timeline-time">{item.time}</div>
                      <div className="timeline-activity">{item.activity}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical & Departure Grid */}
            <div className="detail-grid">
              {tour.medicalCare && (
                <div className="info-card">
                  <h3 className="card-title">
                    <HeartPulse size={20} color="var(--color-primary)" /> บริการดูแลสุขภาพผู้สูงอายุ
                  </h3>
                  <ul className="info-list">
                    {tour.medicalCare.map((item, idx) => (
                      <li key={idx}>
                        <span className="bullet-check">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Trip Date & Departure Schedule Banner */}
            <div className="detail-section" style={{ background: '#fdf2f8', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1.5px solid #fbcfe8', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: 'var(--color-primary, #9c3858)', color: '#fff', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-primary, #9c3858)', fontWeight: 700 }}>
                    กำหนดการออกเดินทาง (ทริปจัดครั้งเดียว)
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0.2rem 0 0', fontWeight: 800 }}>
                    {tour.travelDate || tour.departureDate || (Array.isArray(tour.departureDates) && tour.departureDates[0]) || 'วันเสาร์ที่ 18 เมษายน 2569'}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.92rem' }}>
                    เวลานัดหมาย 06:30 น. ณ จุดนัดหมายสถานีขนส่งหมอชิต (เดินทางกลับถึงกรุงเทพฯ ~17:00 น.)
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Book Action */}
            <div className="detail-action-footer">
              <button 
                type="button"
                className="btn-primary btn-book-large"
                onClick={() => onBook(tour)}
              >
                <span>จองทัวร์นี้ทันที ({formatPrice(tour.price)}/ท่าน)</span>
                <ArrowRight size={22} />
              </button>
            </div>

          </div>
        </article>
        
      </div>
    </div>
  );
}
