import React from 'react';
import { HeartPulse, Accessibility, ShieldCheck, ArrowDown } from 'lucide-react';
import './hero.css';

export default function HeroSection() {
  return (
    <section id="hero" className="hero-section">
      <div className="container hero-grid">
        <div className="hero-content">
          <h1 className="hero-title">
            เที่ยวสบาย ไร้กังวล<br />
            <span className="highlight">สุขใจวัยเกษียณ</span>
          </h1>

          <p className="hero-desc">
            ทริปพักผ่อน ไม่เร่งรีบ พร้อมพยาบาลดูแลดุจครอบครัว
          </p>

          <div className="hero-trust-list">
            <div className="trust-item">
              <HeartPulse size={18} color="var(--color-primary)" />
              <span>พยาบาลดูแลตลอดทริป</span>
            </div>
            <div className="trust-item">
              <Accessibility size={18} color="var(--color-primary)" />
              <span>รองรับวีลแชร์</span>
            </div>
            <div className="trust-item">
              <ShieldCheck size={18} color="var(--color-primary)" />
              <span>ประกันอุบัติเหตุการเดินทาง VIP</span>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <a href="#tours" className="btn-primary" style={{ padding: '0.9rem 2.2rem', fontSize: '1.15rem' }}>
              <span>เลือกดูโปรแกรมทัวร์</span>
              <ArrowDown size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
