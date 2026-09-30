import React from 'react';
import TourCard from './TourCard';
import './tours.css';

export default function TourList({
  tours = [],
  onViewDetails,
  onBook
}) {
  const safeTours = Array.isArray(tours) ? tours : [];

  return (
    <section id="tours" className="tours-section">
      <div className="container">
        <div className="section-title-wrap" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="section-title">โปรแกรมทัวร์</h2>
        </div>

        {safeTours.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: '#ffffff',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px dashed var(--border-color)'
          }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>
              ยังไม่มีโปรแกรมทัวร์ในขณะนี้
            </p>
          </div>
        ) : (
          <div className="tours-grid">
            {safeTours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                onSelectTour={onViewDetails}
                onStartBooking={onBook}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
