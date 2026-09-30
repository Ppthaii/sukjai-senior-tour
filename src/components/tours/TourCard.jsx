import React from 'react';
import { Star, HeartPulse, Accessibility, Clock, Calendar } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

export default function TourCard({ tour, onSelectTour, onStartBooking }) {
  const displayDate = tour.travelDate || tour.departureDate || (Array.isArray(tour.departureDates) && tour.departureDates[0]) || '18 เมษายน 2569';

  return (
    <article className="tour-card" aria-label={tour.title}>
      <div className="tour-img-container" onClick={() => onSelectTour(tour)} style={{ cursor: 'pointer' }}>
        <img
          src={tour.image}
          alt={tour.title}
          className="tour-img"
          loading="lazy"
        />
        <div className="tour-badge-duration">
          <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          {tour.duration}
        </div>
      </div>

      <div className="tour-card-body">
        <h3 className="tour-title" onClick={() => onSelectTour(tour)} style={{ cursor: 'pointer', marginBottom: '0.4rem' }}>
          {tour.title}
        </h3>

        {/* Travel Date Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: '#fdf2f8',
          color: 'var(--color-primary, #9c3858)',
          border: '1px solid #fbcfe8',
          padding: '0.3rem 0.65rem',
          borderRadius: '8px',
          fontSize: '0.86rem',
          fontWeight: 700,
          marginBottom: '0.65rem',
          width: 'fit-content'
        }}>
          <Calendar size={14} color="var(--color-primary, #9c3858)" />
          <span>วันเดินทาง: {displayDate}</span>
        </div>

        {/* Minimal Badges */}
        <div className="tour-care-badges">
          {tour.hasNurse && (
            <span className="care-tag" title="มีพยาบาลวิชาชีพดูแล">
              <HeartPulse size={14} /> มีพยาบาล
            </span>
          )}
          {tour.wheelchairFriendly && (
            <span className="care-tag" style={{ background: '#fdf0f5', color: 'var(--color-primary)' }} title="รองรับวีลแชร์">
              <Accessibility size={14} /> รองรับวีลแชร์
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            <Star size={15} fill="#f59e0b" color="#f59e0b" />
            <strong>{tour.rating}</strong>
          </span>
        </div>

        <div className="tour-card-footer">
          <div className="tour-price-box">
            <div className="tour-final-price">
              {formatPrice(tour.price)}
              <span className="tour-price-unit" style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}> /ท่าน</span>
            </div>
          </div>

          <div className="tour-card-actions">
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '0.55rem 0.9rem', fontSize: '0.9rem' }}
              onClick={() => onSelectTour(tour)}
            >
              รายละเอียด
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.95rem' }}
              onClick={() => onStartBooking(tour)}
            >
              จองตั๋ว
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
