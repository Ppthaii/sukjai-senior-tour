import React from 'react';
import { Ticket, User, ShieldCheck, LogOut } from 'lucide-react';
import './navbar.css';

export default function Navbar({ 
  currentUser, 
  onOpenLogin, 
  onOpenProfile, 
  onOpenLookup, 
  onOpenAdmin,
  onLogout 
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a href="#hero" className="brand-logo" title="หน้าแรก สุขใจวัยเกษียณทัวร์">
          <div className="brand-icon-box">
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🌸</span>
          </div>
          <div>
            <h1 className="brand-title">สุขใจวัยเกษียณทัวร์</h1>
            <p className="brand-subtitle">เที่ยวสบาย ไร้กังวล</p>
          </div>
        </a>

        <div className="nav-actions">
          {currentUser ? (
            isAdmin ? (
              <>
                <button
                  type="button"
                  className="btn-lookup-ticket"
                  onClick={onOpenAdmin}
                  style={{ background: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }}
                  title="เปิดแผงควบคุมระบบ (Admin Dashboard)"
                >
                  <ShieldCheck size={16} />
                  <span>จัดการระบบ Admin</span>
                </button>

                <button
                  type="button"
                  className="btn-admin-logout"
                  onClick={onLogout}
                  title="ออกจากระบบแอดมิน"
                >
                  <LogOut size={16} />
                  <span>ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-user-profile"
                  onClick={onOpenProfile}
                  title="ดูและแก้ไขข้อมูลส่วนตัวของคุณ"
                >
                  {currentUser.avatar ? (
                    currentUser.avatar.startsWith('data:image') || currentUser.avatar.startsWith('http') ? (
                      <span className="navbar-avatar-circle">
                        <img src={currentUser.avatar} alt="avatar" />
                      </span>
                    ) : (
                      <span className="navbar-avatar-circle">
                        {currentUser.avatar}
                      </span>
                    )
                  ) : (
                    <User size={16} />
                  )}
                  <span className="user-name-text">{currentUser.name?.split(' ')[0] || 'ข้อมูลฉัน'}</span>
                </button>

                <button
                  type="button"
                  className="btn-lookup-ticket"
                  onClick={onOpenLookup}
                  title="ดูตั๋วการเดินทางของคุณ"
                >
                  <Ticket size={16} />
                  <span>ตั๋วของฉัน</span>
                </button>
              </>
            )
          ) : (
            <button
              type="button"
              className="btn-user-profile"
              onClick={onOpenLogin}
              title="เข้าสู่ระบบ เพื่อบันทึกข้อมูลส่วนตัว ไม่ต้องกรอกซ้ำ"
            >
              <User size={16} />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

