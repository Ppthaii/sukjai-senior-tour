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

              {tour.included && (
                <div className="info-card">
                  <h3 className="card-title">
                    <ShieldCheck size={20} color="var(--color-primary)" /> สิ่งที่รวมในแพ็กเกจ
                  </h3>
                  <ul className="info-list">
                    {tour.included.map((item, idx) => (
                      <li key={idx}>
                        <span className="bullet-check">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Trip Type Info - Single Day Trip */}
            <div className="detail-section" style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: 'var(--color-primary-light, #e0f2fe)', padding: '0.65rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} color="var(--color-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary)', margin: 0, fontWeight: '700' }}>
                    รูปแบบการเดินทาง: ทริป 1 วัน (ไปเช้า-เย็นกลับ)
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
                    ทริปพิเศษครั้งเดียวตามรายงานแผนการตลาด พร้อมจุดพักผ่อนและดูแลสุขภาพตลอดเส้นทาง
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
