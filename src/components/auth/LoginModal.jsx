import React, { useState } from 'react';
import { X, CheckCircle2, Heart, LogIn, UserPlus, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { findUserByPhone, findUserByPhoneAsync, registerUser, saveUserProfile, ADMIN_CREDENTIALS } from '../../utils/storage';
import { compressImage } from '../../utils/imageCompressor';
import './auth.css';

export default function LoginModal({ onClose, onLoginSuccess, bookingPrompt = false, initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' or 'register'

  // --- Login Tab State ---
  const [loginPhone, setLoginPhone] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- Register Tab State ---
  const [avatar, setAvatar] = useState('👴');
  const [gender, setGender] = useState('ชาย'); // 'ชาย', 'หญิง', 'อื่นๆ'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [foodAllergy, setFoodAllergy] = useState('');

  // Emergency contact states
  const [hasNoRelative, setHasNoRelative] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  const [isCheckingCloud, setIsCheckingCloud] = useState(false);

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 0.75);
        setAvatar(compressed);
      } catch (err) {
        console.warn('Avatar compression error:', err);
      }
    }
  };

  // Handle Login with Phone (รองรับ Cloud Sync ข้ามเครื่อง)
  const handlePhoneLogin = async (e) => {
    e?.preventDefault();
    setLoginError('');

    const clean = loginPhone.replace(/[^0-9]/g, '');
    const isSpecialAdmin = loginPhone.trim().toLowerCase() === 'admin' || clean === ADMIN_CREDENTIALS.phone.replace(/[^0-9]/g, '');

    if (!clean && !isSpecialAdmin) {
      setLoginError('กรุณากรอกเบอร์โทรศัพท์ครับ');
      return;
    }

    if (isSpecialAdmin) {
      if (!adminPin) {
        setLoginPhone(ADMIN_CREDENTIALS.phone);
        setLoginError('กรุณากรอกรหัสผ่านเจ้าหน้าที่ (PIN 4 หลัก) ด้านล่างครับ');
        return;
      }
      if (adminPin !== ADMIN_CREDENTIALS.pin) {
        setLoginError('รหัสผ่านเจ้าหน้าที่ไม่ถูกต้องครับ');
        return;
      }
      saveUserProfile(ADMIN_CREDENTIALS);
      onLoginSuccess(ADMIN_CREDENTIALS);
      onClose();
      return;
    }

    // 1. ตรวจสอบในเครื่องก่อน (รวดเร็วทันที)
    const localFound = findUserByPhone(clean);
    if (localFound) {
      saveUserProfile(localFound);
      onLoginSuccess(localFound);
      onClose();
      return;
    }

    // 2. ถ้าในเครื่องยังไม่มี ให้ค้นหาจากระบบ Cloud ทันที (แก้ปัญหาเข้าเครื่องอื่นไม่ได้)
    setIsCheckingCloud(true);
    try {
      const cloudUser = await findUserByPhoneAsync(clean);
      if (cloudUser) {
        saveUserProfile(cloudUser);
        onLoginSuccess(cloudUser);
        onClose();
        return;
      }
      setLoginError('ยังไม่พบบัญชีเบอร์โทรนี้ในระบบ (ตรวจสอบทั้งในเครื่องและคลาวด์แล้ว) หากยังไม่เคยเป็นสมาชิก กรุณากด "สมัครสมาชิก" ด้านบนครับ');
    } catch {
      setLoginError('ยังไม่พบบัญชีเบอร์โทรนี้ในระบบ หากยังไม่เคยเป็นสมาชิก กรุณากด "สมัครสมาชิก" ด้านบนครับ');
    } finally {
      setIsCheckingCloud(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e?.preventDefault();

    if (!gender) {
      alert('กรุณาเลือกเพศครับ');
      return;
    }
    if (!firstName.trim()) {
      alert('กรุณากรอกชื่อจริงครับ');
      return;
    }
    if (!lastName.trim()) {
      alert('กรุณากรอกนามสกุลครับ');
      return;
    }
    if (!age.trim()) {
      alert('กรุณากรอกอายุครับ');
      return;
    }
    if (!phone.trim()) {
      alert('กรุณากรอกเบอร์โทรศัพท์ครับ');
      return;
    }

    // Validate emergency contact if not having no relative
    if (!hasNoRelative) {
      if (!emergencyName.trim()) {
        alert('กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน หรือเลือก "กรณีไม่มีญาติ" ครับ');
        return;
      }
      if (!emergencyPhone.trim()) {
        alert('กรุณากรอกเบอร์โทรผู้ติดต่อฉุกเฉินครับ');
        return;
      }
      if (!emergencyRelation.trim()) {
        alert('กรุณากรอกความสัมพันธ์ของผู้ติดต่อฉุกเฉิน เช่น ลูกสาว, หลาน ครับ');
        return;
      }
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const emergencyContactStr = hasNoRelative
      ? 'ไม่มีญาติ (มอบหมายทีมพยาบาลและไกด์ประจำทัวร์ดูแล)'
      : `${emergencyName.trim()} (${emergencyRelation.trim()}) โทร. ${emergencyPhone.trim()}`;

    const newProfile = {
      id: 'usr-' + Date.now(),
      avatar: avatar || '👴',
      gender,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      age: age.trim(),
      phone: phone.trim(),
      email: email.trim(),
      foodAllergy: foodAllergy.trim() || 'ไม่มี',
      hasNoRelative,
      emergencyName: hasNoRelative ? '' : emergencyName.trim(),
      emergencyPhone: hasNoRelative ? '' : emergencyPhone.trim(),
      emergencyRelation: hasNoRelative ? '' : emergencyRelation.trim(),
      emergencyContact: emergencyContactStr,
      needWheelchair: false,
      needNurseHelp: true,
      dietary: 'อาหารปกติ (หวาน-เค็มน้อย)',
      medicalNote: ''
    };

    setIsCheckingCloud(true);
    try {
      await registerUser(newProfile);
    } finally {
      setIsCheckingCloud(false);
    }

    alert(`สมัครสมาชิกสำเร็จ ยินดีต้อนรับ ${fullName} ครับ!`);
    onLoginSuccess(newProfile);
    onClose();
  };

  const handleQuickDemoLogin = () => {
    const demoUser = findUserByPhone('0819876543') || {
      id: 'usr-001',
      gender: 'ชาย',
      firstName: 'ประสิทธิ์',
      lastName: 'มีสุข',
      name: 'คุณตาประสิทธิ์ มีสุข',
      age: '72',
      phone: '0819876543',
      email: '',
      emergencyName: 'คุณแอน',
      emergencyPhone: '0891234567',
      emergencyRelation: 'ลูกสาว',
      hasNoRelative: false,
      emergencyContact: 'คุณแอน (ลูกสาว) 0891234567',
      needWheelchair: true,
      needNurseHelp: true,
      dietary: 'อาหารปกติ (หวาน-เค็มน้อย)',
      medicalNote: 'ความดันโลหิตสูง'
    };

    saveUserProfile(demoUser);
    onLoginSuccess(demoUser);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn lookup-close-btn"
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
        >
          <X size={18} />
        </button>

        {bookingPrompt && (
          <div className="auth-prompt-banner">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อน เพื่อดำเนินการจองทริปท่องเที่ยวครับ</span>
          </div>
        )}

        {/* Tab Navigation: เข้าสู่ระบบ / สมัครสมาชิก */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setLoginError(''); }}
          >
            <LogIn size={18} /> เข้าสู่ระบบ
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setLoginError(''); }}
          >
            <UserPlus size={18} /> สมัครสมาชิก
          </button>
        </div>

        {/* ===================== TAB 1: เข้าสู่ระบบ ===================== */}
        {activeTab === 'login' && (
          <div>
            <div className="auth-header">
              <div className="auth-icon-circle">
                <LogIn size={26} />
              </div>
              <h2 className="auth-title">เข้าสู่ระบบด้วยเบอร์โทร</h2>
              <p className="auth-subtitle">
                สำหรับท่านที่เป็นสมาชิกอยู่แล้ว กรอกเบอร์โทรศัพท์เพื่อเข้าใช้งานได้ทันที
              </p>
            </div>

            <form onSubmit={handlePhoneLogin} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="08X-XXX-XXXX"
                  value={loginPhone}
                  onChange={(e) => { setLoginPhone(e.target.value); setLoginError(''); }}
                  autoFocus
                />
              </div>

              {(loginPhone.replace(/[^0-9]/g, '') === ADMIN_CREDENTIALS.phone.replace(/[^0-9]/g, '') || loginPhone.trim().toLowerCase() === 'admin') && (
                <div className="auth-field" style={{ animation: 'fadeIn 0.2s ease' }}>
                  <label className="auth-label" style={{ color: 'var(--color-primary, #9c3858)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🔒 รหัสผ่านผู้ดูแลระบบ (Admin PIN) *</span>
                  </label>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="กรอกรหัส PIN (ค่าเริ่มต้น: 8888)"
                    value={adminPin}
                    onChange={(e) => { setAdminPin(e.target.value); setLoginError(''); }}
                    maxLength={6}
                    autoFocus
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                    * รหัส PIN เริ่มต้นของผู้ดูแลระบบคือ <strong>8888</strong>
                  </span>
                </div>
              )}

              {loginError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={isCheckingCloud}
                style={{ padding: '0.85rem', width: '100%', fontSize: '1.05rem', justifyContent: 'center', opacity: isCheckingCloud ? 0.7 : 1 }}
              >
                {isCheckingCloud ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={18} className="animate-spin" /> กำลังตรวจสอบระบบคลาวด์...
                  </span>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>ยังไม่เป็นสมาชิกใช่ไหมครับ? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    if (loginPhone) setPhone(loginPhone);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    textDecoration: 'underline'
                  }}
                >
                  สมัครสมาชิกที่นี่
                </button>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="auth-quick-btn"
                  onClick={handleQuickDemoLogin}
                >
                  <Heart size={16} color="var(--color-primary)" />
                  <span>เข้าสู่ระบบตัวอย่าง (คุณตาประสิทธิ์ 081-987-6543)</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================== TAB 2: สมัครสมาชิก ===================== */}
        {activeTab === 'register' && (
          <div>
            <div className="auth-header">
              <div className="auth-icon-circle">
                <UserPlus size={26} />
              </div>
              <h2 className="auth-title">สมัครสมาชิกใหม่</h2>
              <p className="auth-subtitle">
                กรอกครั้งเดียว ข้อมูลจะถูกเก็บไว้ใช้จองทริปอัตโนมัติ ไม่ต้องพิมพ์ซ้ำ
              </p>
            </div>

            <form onSubmit={handleRegister} className="auth-form">
              {/* รูปโปรไฟล์ */}
              <div className="auth-field">
                <label className="auth-label">รูปโปรไฟล์ของคุณ</label>
                <div className="avatar-selection-box">
                  <div className="avatar-preview-wrap">
                    {avatar.startsWith('data:image') || avatar.startsWith('http') ? (
                      <img src={avatar} alt="โปรไฟล์" />
                    ) : (
                      <span className="avatar-preview-emoji">{avatar}</span>
                    )}
                  </div>

                  <div className="avatar-presets">
                    {['👴', '👵', '🌸', '👒', '🧑‍🦳', '🌺', '👓', '🍵'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`avatar-preset-btn ${avatar === emoji ? 'active' : ''}`}
                        onClick={() => setAvatar(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <label className="btn-upload-file">
                    <span>📷 อัปโหลดรูปภาพจากเครื่อง...</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFile} hidden />
                  </label>
                </div>
              </div>

              {/* 1. เพศ * */}
              <div className="auth-field">
                <label className="auth-label">เพศ *</label>
                <div className="gender-select-group">
                  {['ชาย', 'หญิง', 'ไม่ระบุ'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`gender-btn ${gender === g ? 'active' : ''}`}
                      onClick={() => {
                        setGender(g);
                        if (g === 'หญิง' && avatar === '👴') setAvatar('👵');
                        if (g === 'ชาย' && avatar === '👵') setAvatar('👴');
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. ชื่อ-นามสกุล คนละช่องแต่อยู่บรรทัดเดียวกัน * */}
              <div className="auth-field">
                <label className="auth-label">ชื่อ - นามสกุล *</label>
                <div className="auth-grid-2">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="ชื่อจริง *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="นามสกุล *"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* 3. อายุ * และ เบอร์ * */}
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label">อายุ (ปี) *</label>
                  <input
                    type="number"
                    className="auth-input"
                    placeholder="เช่น 68"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* 4. อีเมล์ (ไม่บังคับ) */}
              <div className="auth-field">
                <label className="auth-label">อีเมล์ (ถ้ามี / ไม่บังคับ)</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* อาหารที่แพ้ */}
              <div className="auth-field">
                <label className="auth-label">อาหารที่แพ้ / ข้อจำกัดด้านอาหาร (ถ้ามี)</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="เช่น แพ้กุ้ง, อาหารทะเล, ถั่ว หรือพิมพ์ 'ไม่มี'"
                  value={foodAllergy}
                  onChange={(e) => setFoodAllergy(e.target.value)}
                />
              </div>

              {/* 5. ข้อมูลผู้ติดต่อฉุกเฉิน */}
              <div className="auth-emergency-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div className="auth-emergency-title">
                    <ShieldAlert size={18} /> ข้อมูลผู้ติดต่อฉุกเฉิน
                  </div>
                  {/* [ ] กรณีไม่มีญาติ */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasNoRelative}
                      onChange={(e) => setHasNoRelative(e.target.checked)}
                      style={{ width: '17px', height: '17px', accentColor: 'var(--color-primary)' }}
                    />
                    <span>กรณีไม่มีญาติ</span>
                  </label>
                </div>

                {hasNoRelative ? (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    lineHeight: '1.4'
                  }}>
                    ✓ สำหรับท่านที่ไม่มีญาติ ทีมพยาบาลวิชาชีพและมัคคุเทศก์ของทัวร์จะรับหน้าที่ดูแลพิเศษและประสานงานฉุกเฉินให้ตลอดทริปครับ
                  </div>
                ) : (
                  <>
                    <div className="auth-field">
                      <label className="auth-label" style={{ fontSize: '0.9rem' }}>ชื่อผู้ติดต่อฉุกเฉิน *</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="เช่น คุณแอน (ลูกสาว)"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                      />
                    </div>

                    <div className="auth-grid-2">
                      <div className="auth-field">
                        <label className="auth-label" style={{ fontSize: '0.9rem' }}>เบอร์ติดต่อ *</label>
                        <input
                          type="tel"
                          className="auth-input"
                          placeholder="เบอร์โทรศัพท์"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                        />
                      </div>
                      <div className="auth-field">
                        <label className="auth-label" style={{ fontSize: '0.9rem' }}>ความสัมพันธ์ *</label>
                        <input
                          type="text"
                          className="auth-input"
                          placeholder="เช่น ลูกสาว, หลาน"
                          value={emergencyRelation}
                          onChange={(e) => setEmergencyRelation(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="auth-notice-box">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>ข้อมูลจะถูกบันทึกไว้ในเครื่องอย่างปลอดภัย ไม่ต้องกรอกซ้ำเวลาจองทัวร์</span>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '0.85rem', width: '100%', fontSize: '1.05rem', justifyContent: 'center' }}
              >
                ยืนยันสมัครสมาชิกและเข้าสู่ระบบ
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>เป็นสมาชิกอยู่แล้ว? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    textDecoration: 'underline'
                  }}
                >
                  เข้าสู่ระบบด้วยเบอร์โทร
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
