import React, { useState } from 'react';
import { ChevronDown, PhoneCall, MessageCircle, HelpCircle } from 'lucide-react';
import { FAQ_DATA } from '../../data/toursData';
import './faq.css';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleItem = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faq" className="faq-section">
      <div className="container faq-container">
        <div className="section-title-wrap">
          <span className="section-badge">💬 คลายข้อสงสัย</span>
          <h2 className="section-title">คำถามที่พบบ่อยจากคุณตาคุณยายและลูกหลาน</h2>
          <p className="section-subtitle">
            รวบรวมคำถามที่หลายท่านสอบถามเข้ามาบ่อยที่สุด เพื่อความมั่นใจก่อนออกเดินทาง
          </p>
        </div>

        <div className="faq-accordion">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleItem(idx)}
                  aria-expanded={isOpen}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <HelpCircle size={20} color="var(--color-primary)" />
                    {item.q}
                  </span>
                  <div className="faq-chevron">
                    <ChevronDown size={18} />
                  </div>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Help Box */}
        <div className="faq-help-box">
          <div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              ยังมีข้อสงสัยเรื่องสุขภาพหรือเส้นทาง?
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              โทรปรึกษาพยาบาลวิชาชีพหรือเจ้าหน้าที่ผู้เชี่ยวชาญได้ฟรีทุกวัน เวลา 08:00 - 20:00 น.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="tel:029998888" className="btn-primary" style={{ fontSize: '1rem', padding: '0.65rem 1.25rem' }}>
              <PhoneCall size={18} /> โทร 02-999-8888
            </a>
            <a
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ fontSize: '1rem', padding: '0.65rem 1.25rem', borderColor: '#06c755', color: '#05a847', background: '#f0fbf4' }}
            >
              <MessageCircle size={18} /> คุยทาง LINE
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
