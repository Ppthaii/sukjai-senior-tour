import React from 'react';
import { HeartPulse, Accessibility, Utensils, ShieldCheck } from 'lucide-react';
import './care-services.css';

export default function CareServices() {
  const highlights = [
    {
      icon: <HeartPulse size={26} />,
      title: "พยาบาลร่วมดูแล",
      desc: "ช่วยดูแลสุขภาพและเตือนทานยาตลอดทริป"
    },
    {
      icon: <Accessibility size={26} />,
      title: "รองรับวีลแชร์",
      desc: "ทางลาด ลิฟต์ และมีทีมงานช่วยเข็นฟรี"
    },
    {
      icon: <Utensils size={26} />,
      title: "อาหารเพื่อสุขภาพ",
      desc: "หวานน้อย เค็มน้อย ย่อยง่าย อร่อยถูกปาก"
    },
    {
      icon: <ShieldCheck size={26} />,
      title: "ประกันภัยการเดินทาง VIP",
      desc: "ดูแลคุ้มครองอุบัติเหตุและสุขภาพเต็มที่ตลอดทริป"
    }
  ];

  return (
    <section id="care" className="care-section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="section-title">มาตรฐานความปลอดภัย</h2>
        </div>

        <div className="care-grid">
          {highlights.map((item, index) => (
            <div key={index} className="care-card">
              <div className="care-icon-wrap">
                {item.icon}
              </div>
              <h3 className="care-title">{item.title}</h3>
              <p className="care-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
