import React from 'react';
import { Flower2, Phone, Mail } from 'lucide-react';
import './footer.css';

export default function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--color-peony-pink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Flower2 size={20} />
          </div>
          <h3 className="footer-brand-title" style={{ margin: 0 }}>สุขใจวัยเกษียณทัวร์</h3>
        </div>

        <p style={{ color: '#c9b3bc', fontSize: '0.95rem', margin: '0.5rem 0 1.25rem' }}>
          ทัวร์เพื่อผู้สูงวัยและครอบครัว เที่ยวสบาย ไร้กังวล
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f1e2e7' }}>
            <Phone size={16} color="var(--color-peony-pink)" />
            โทร: <strong>02-999-8888</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f1e2e7' }}>
            <Mail size={16} color="var(--color-peony-pink)" />
            contact@sukjaitour.com
          </span>
          <span className="tat-license-badge">
            ใบอนุญาต ททท. 11/08976
          </span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem', color: '#a8949d', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} สุขใจวัยเกษียณทัวร์ จำกัด
        </div>
      </div>
    </footer>
  );
}
