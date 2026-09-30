import React from 'react';
import './accessibility.css';

export default function AccessibilityBar({ fontSize, setFontSize, onSetFontSize }) {
  const handleSetFontSize = setFontSize || onSetFontSize;

  return (
    <div className="accessibility-bar" role="region" aria-label="แถบปรับแต่งการแสดงผลสำหรับผู้สูงอายุ">
      <div className="container accessibility-inner">
        <div className="accessibility-center">
          <div className="font-scaler">
            <span className="font-scaler-label">🔍 ขนาดตัวหนังสือ:</span>
            <button
              type="button"
              className={`font-btn ${fontSize === 'normal' ? 'active' : ''}`}
              onClick={() => handleSetFontSize && handleSetFontSize('normal')}
              title="ขนาดตัวหนังสือปกติ"
            >
              ปกติ
            </button>
            <button
              type="button"
              className={`font-btn ${fontSize === 'large' ? 'active' : ''}`}
              onClick={() => handleSetFontSize && handleSetFontSize('large')}
              title="ขนาดตัวหนังสือใหญ่ สบายตา"
            >
              ใหญ่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
