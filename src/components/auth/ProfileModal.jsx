import React, { useState } from 'react';
import { X, User, HeartPulse, LogOut, Save, ShieldAlert } from 'lucide-react';
import { saveUserProfile, clearUserProfile } from '../../utils/storage';
import { compressImage } from '../../utils/imageCompressor';
import './auth.css';

export default function ProfileModal({ user, onClose, onUpdateUser, onLogout }) {
  const [avatar, setAvatar] = useState(user?.avatar || (user?.gender === 'หญิง' ? '👵' : '👴'));
  const [gender, setGender] = useState(user?.gender || 'ชาย');
  const [firstName, setFirstName] = useState(user?.firstName || (user?.name ? user.name.split(' ')[0] : ''));
  const [lastName, setLastName] = useState(user?.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : ''));
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age || '');
  const [email, setEmail] = useState(user?.email || '');
  const [foodAllergy, setFoodAllergy] = useState(user?.foodAllergy || '');

  const [hasNoRelative, setHasNoRelative] = useState(user?.hasNoRelative || false);
  const [emergencyName, setEmergencyName] = useState(user?.emergencyName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyPhone || '');
  const [emergencyRelation, setEmergencyRelation] = useState(user?.emergencyRelation || '');

  const [needWheelchair, setNeedWheelchair] = useState(user?.needWheelchair || false);
  const [needNurseHelp, setNeedNurseHelp] = useState(user?.needNurseHelp ?? true);
  const [dietary, setDietary] = useState(user?.dietary || 'อาหารปกติ (หวาน-เค็มน้อย)');
  const [medicalNote, setMedicalNote] = useState(user?.medicalNote || '');

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

  const handleSave = (e) => {
    e?.preventDefault();
    if (!firstName.trim() || !phone.trim()) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์ครับ');
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const emergencyContactStr = hasNoRelative
      ? 'ไม่มีญาติ (มอบหมายทีมพยาบาลและไกด์ประจำทัวร์ดูแล)'
      : `${emergencyName.trim()} (${emergencyRelation.trim()}) โทร. ${emergencyPhone.trim()}`;

    const updatedProfile = {
      ...user,
      avatar: avatar || '👴',
      gender,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      phone: phone.trim(),
      age: age.trim() || '65',
      email: email.trim(),
      foodAllergy: foodAllergy.trim() || 'ไม่มี',
      hasNoRelative,
      emergencyName: hasNoRelative ? '' : emergencyName.trim(),
      emergencyPhone: hasNoRelative ? '' : emergencyPhone.trim(),
      emergencyRelation: hasNoRelative ? '' : emergencyRelation.trim(),
      emergencyContact: emergencyContactStr,
      needWheelchair,
      needNurseHelp,
      dietary,
      medicalNote: medicalNote.trim()
    };

    saveUserProfile(updatedProfile);
    onUpdateUser(updatedProfile);
    alert('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้วครับ');
    onClose();
  };

  const handleLogoutClick = () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      clearUserProfile();
      onLogout();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn lookup-close-btn"
          onClick={onClose}
          aria-label="ปิดหน้าต่างข้อมูลส่วนตัว"
        >
          <X size={18} />
        </button>

        <div className="auth-header">
          <div className="auth-icon-circle">
            <User size={28} />
          </div>
          <h2 className="auth-title">ข้อมูลส่วนตัวของคุณ</h2>
          <p className="auth-subtitle">
            แก้ไขข้อมูลส่วนตัวที่นี่ ข้อมูลจะถูกนำไปใช้อัตโนมัติเมื่อทำการจองทัวร์
          </p>
        </div>

        <form onSubmit={handleSave} className="auth-form">
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
                <span>📷 เปลี่ยนรูปภาพ...</span>
                <input type="file" accept="image/*" onChange={handleAvatarFile} hidden />
              </label>
            </div>
          </div>

          {/* Gender */}
          <div className="auth-field">
            <label className="auth-label">เพศ</label>
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

          {/* First Name & Last Name in same row */}
          <div className="auth-field">
            <label className="auth-label">ชื่อ - นามสกุล *</label>
            <div className="auth-grid-2">
              <input
                type="text"
                className="auth-input"
                placeholder="ชื่อจริง"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                className="auth-input"
                placeholder="นามสกุล"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-grid-2">
            <div className="auth-field">
              <label className="auth-label">อายุ (ปี)</label>
              <input
                type="number"
                className="auth-input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">เบอร์โทรศัพท์ *</label>
              <input
                type="tel"
                className="auth-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">อีเมล์ (ถ้ามี)</label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* อาหารที่แพ้ */}
          <div className="auth-field">
            <label className="auth-label">อาหารที่แพ้ / ข้อจำกัดเรื่องอาหาร (ถ้ามี)</label>
            <input
              type="text"
              className="auth-input"
              placeholder="เช่น แพ้กุ้ง, อาหารทะเล, ถั่ว หรือพิมพ์ 'ไม่มี'"
              value={foodAllergy}
              onChange={(e) => setFoodAllergy(e.target.value)}
            />
          </div>

          {/* Emergency Contact */}
          <div className="auth-emergency-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="auth-emergency-title">
                <ShieldAlert size={18} /> ข้อมูลผู้ติดต่อฉุกเฉิน
              </div>
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
                fontSize: '0.88rem'
              }}>
                ✓ ไม่มีญาติ (ทีมพยาบาลและเจ้าหน้าที่ทัวร์ดูแลเป็นพิเศษตลอดทริป)
              </div>
            ) : (
              <>
                <div className="auth-field">
                  <label className="auth-label" style={{ fontSize: '0.9rem' }}>ชื่อผู้ติดต่อฉุกเฉิน</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="เช่น คุณแอน"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                  />
                </div>
                <div className="auth-grid-2">
                  <div className="auth-field">
                    <label className="auth-label" style={{ fontSize: '0.9rem' }}>เบอร์ติดต่อ</label>
                    <input
                      type="tel"
                      className="auth-input"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label" style={{ fontSize: '0.9rem' }}>ความสัมพันธ์</label>
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

          {/* Health Needs */}
          <div className="special-needs-box" style={{ background: '#fdf5f8', padding: '1rem', borderRadius: '14px', border: '1px solid var(--color-primary-subtle)' }}>
            <div style={{ fontWeight: '700', color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HeartPulse size={18} />
              <span>ความต้องการพิเศษประจำตัว</span>
            </div>

            <label className="checkbox-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0' }}>
              <input
                type="checkbox"
                checked={needWheelchair}
                onChange={(e) => setNeedWheelchair(e.target.checked)}
              />
              <span>ต้องการใช้วีลแชร์</span>
            </label>

            <label className="checkbox-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0' }}>
              <input
                type="checkbox"
                checked={needNurseHelp}
                onChange={(e) => setNeedNurseHelp(e.target.checked)}
              />
              <span>ให้พยาบาลช่วยเตือนทานยา</span>
            </label>

            <div className="auth-field" style={{ marginTop: '0.5rem' }}>
              <label className="auth-label" style={{ fontSize: '0.85rem' }}>อาหารประจำตัว:</label>
              <select
                className="auth-input"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }}
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
              >
                <option value="อาหารปกติ (หวาน-เค็มน้อย)">ปกติ (หวาน-เค็มน้อย)</option>
                <option value="อาหารเบาหวาน (จำกัดน้ำตาล)">เบาหวาน (จำกัดน้ำตาล)</option>
                <option value="อาหารโรคไต (โซเดียมต่ำ)">โรคไต (โซเดียมต่ำ)</option>
                <option value="อาหารอ่อน ย่อยง่าย">อาหารอ่อน เคี้ยวง่าย</option>
                <option value="อาหารมังสวิรัติ / เจ">มังสวิรัติ / เจ</option>
              </select>
            </div>

            <div className="auth-field" style={{ marginTop: '0.5rem' }}>
              <label className="auth-label" style={{ fontSize: '0.85rem' }}>โรคประจำตัว / ข้อควรระวังทางการแพทย์ (ถ้ามี):</label>
              <input
                type="text"
                className="auth-input"
                placeholder="เช่น ความดันโลหิตสูง, เบาหวาน ทานยาเช้า"
                value={medicalNote}
                onChange={(e) => setMedicalNote(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2, padding: '0.75rem', fontSize: '1rem', justifyContent: 'center' }}
            >
              <Save size={18} />
              <span>บันทึกข้อมูล</span>
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center', color: 'var(--color-danger)', borderColor: '#fca5a5' }}
              onClick={handleLogoutClick}
            >
              <LogOut size={16} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
