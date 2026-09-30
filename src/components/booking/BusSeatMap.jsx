import React from 'react';
import { Armchair, ShieldPlus } from 'lucide-react';
import './seat-map.css';

export default function BusSeatMap({ selectedSeats, onToggleSeat, maxSeats, occupiedSeats = [] }) {
  // Generate Seats: Rows A to G (4 seats), Row H (2 seats). Total 30 seats.
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  const nurseSeat = 'A3';
  const staffSeats = ['A4', 'H1', 'H2'];

  const handleSeatClick = (seatId) => {
    if (seatId === nurseSeat || staffSeats.includes(seatId) || occupiedSeats.includes(seatId)) return;
    
    if (selectedSeats.includes(seatId)) {
      onToggleSeat(seatId); // Deselect
    } else {
      if (selectedSeats.length < maxSeats) {
        onToggleSeat(seatId); // Select
      } else {
        alert(`คุณเลือกที่นั่งครบ ${maxSeats} ที่นั่งตามจำนวนผู้เดินทางแล้วครับ`);
      }
    }
  };

  return (
    <div className="bus-container">
      <div className="bus-layout">
        {/* Front of bus: Driver and Front Extinguisher (No dashed lines) */}
        <div className="bus-front">
          <div className="entrance-group">
            <div className="bus-entrance">ทางขึ้น-ลง</div>
            <span className="safety-icon-badge fire" title="ถังดับเพลิงหน้ารถ (ข้างประตูทางขึ้น-ลง)">🧯</span>
          </div>

          <div className="driver-area" title="คนขับรถ VIP">
            <span className="driver-emoji">👨‍✈️</span>
            <span className="driver-label">คนขับ</span>
          </div>
        </div>

        {/* Cabin Wrapper with Emergency Hammers along window walls */}
        <div className="bus-cabin-wrapper">
          {/* Left Window Wall Hammers: Between B1-C1 & Between F1-G1 */}
          <span 
            className="safety-hammer-wall left pos-bc" 
            title="ที่ทุบกระจกนิรภัย (ระหว่างแถว B1 - C1 ฝั่งซ้าย)"
          >
            🔨
          </span>
          <span 
            className="safety-hammer-wall left pos-fg" 
            title="ที่ทุบกระจกนิรภัย (ระหว่างแถว F1 - G1 ฝั่งซ้าย)"
          >
            🔨
          </span>

          {/* Right Window Wall Hammers: Between B4-C4 & Between F4-G4 */}
          <span 
            className="safety-hammer-wall right pos-bc" 
            title="ที่ทุบกระจกนิรภัย (ระหว่างแถว B4 - C4 ฝั่งขวา)"
          >
            🔨
          </span>
          <span 
            className="safety-hammer-wall right pos-fg" 
            title="ที่ทุบกระจกนิรภัย (ระหว่างแถว F4 - G4 ฝั่งขวา)"
          >
            🔨
          </span>

          {/* Bus Seats Grid */}
          <div className="bus-seats-grid">
            {rows.map((row) => {
              const seatsInRow = row === 'H' ? [1, 2] : [1, 2, 3, 4];
              const isMotionSafeRow = row === 'A' || row === 'B';
              
              return (
                <React.Fragment key={row}>
                  {/* Left Side: Seats 1 and 2 */}
                  {seatsInRow.includes(1) ? (
                    <Seat 
                      id={`${row}1`} 
                      isNurse={false} 
                      isStaff={staffSeats.includes(`${row}1`)} 
                      isOccupied={occupiedSeats.includes(`${row}1`)}
                      isMotionSafe={isMotionSafeRow}
                      isSelected={selectedSeats.includes(`${row}1`)} 
                      onClick={() => handleSeatClick(`${row}1`)} 
                    />
                  ) : <div />}
                  
                  {seatsInRow.includes(2) ? (
                    <Seat 
                      id={`${row}2`} 
                      isNurse={false} 
                      isStaff={staffSeats.includes(`${row}2`)} 
                      isOccupied={occupiedSeats.includes(`${row}2`)}
                      isMotionSafe={isMotionSafeRow}
                      isSelected={selectedSeats.includes(`${row}2`)} 
                      onClick={() => handleSeatClick(`${row}2`)} 
                    />
                  ) : <div />}

                  {/* Aisle */}
                  <div className="aisle" />

                  {/* Right Side: Seats 3 and 4 */}
                  {seatsInRow.includes(3) ? (
                    <Seat 
                      id={`${row}3`} 
                      isNurse={nurseSeat === `${row}3`} 
                      isStaff={staffSeats.includes(`${row}3`)} 
                      isOccupied={occupiedSeats.includes(`${row}3`)}
                      isMotionSafe={isMotionSafeRow && nurseSeat !== `${row}3`}
                      isSelected={selectedSeats.includes(`${row}3`)} 
                      onClick={() => handleSeatClick(`${row}3`)} 
                    />
                  ) : <div />}
                  
                  {seatsInRow.includes(4) ? (
                    <Seat 
                      id={`${row}4`} 
                      isNurse={false} 
                      isStaff={staffSeats.includes(`${row}4`)} 
                      isOccupied={occupiedSeats.includes(`${row}4`)}
                      isMotionSafe={isMotionSafeRow && !staffSeats.includes(`${row}4`)}
                      isSelected={selectedSeats.includes(`${row}4`)} 
                      onClick={() => handleSeatClick(`${row}4`)} 
                    />
                  ) : (
                    row === 'H' ? (
                      <div className="rear-extinguisher-slot" title="ถังดับเพลิงท้ายรถ (ชิดขวาหลังที่นั่ง G4)">
                        <span className="safety-icon-badge fire">🧯</span>
                      </div>
                    ) : <div />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend below bus layout */}
      <div className="seat-legend">
        <div className="legend-item">
          <span className="legend-box available" />
          <span>ที่นั่งว่าง</span>
        </div>
        <div className="legend-item">
          <span className="legend-box selected">✓</span>
          <span>ที่คุณเลือก</span>
        </div>
        <div className="legend-item">
          <span className="legend-box occupied">✕</span>
          <span>มีคนนั่งแล้ว</span>
        </div>
        <div className="legend-item">
          <span className="legend-box nurse">
            <ShieldPlus size={13} />
          </span>
          <span>พยาบาล</span>
        </div>
        <div className="legend-item">
          <span className="legend-box staff">
            <Armchair size={13} />
          </span>
          <span>เจ้าหน้าที่</span>
        </div>
        <div className="legend-item full-width">
          <span className="legend-box motion-safe" />
          <span>แถว A-B: นั่งสบาย (เมารถง่าย)</span>
        </div>
      </div>
    </div>
  );
}

const Seat = React.memo(function Seat({ id, isNurse, isStaff, isOccupied, isMotionSafe, isSelected, onClick }) {
  let className = 'seat-btn';
  let title = `ที่นั่ง ${id}`;

  if (isNurse) {
    className += ' locked nurse';
    title = 'ที่นั่งพยาบาลประจำทริป (ประจำตำแหน่ง)';
  } else if (isStaff) {
    className += ' locked staff';
    title = 'ที่นั่งเจ้าหน้าที่ (จองแล้ว)';
  } else if (isOccupied) {
    className += ' locked occupied';
    title = `ที่นั่ง ${id} (มีผู้โดยสารจองแล้ว)`;
  } else {
    if (isMotionSafe) {
      className += ' zone-motion-safe';
      title = `ที่นั่ง ${id} (แนะนำสำหรับคนเมารถง่าย นั่งนิ่ง ไม่โคลงเคลง)`;
    }
    if (isSelected) {
      className += ' selected';
      title = `เลือกที่นั่ง ${id} แล้ว`;
    }
  }

  return (
    <button 
      type="button" 
      className={className} 
      onClick={onClick}
      title={title}
      disabled={isNurse || isStaff || isOccupied}
    >
      {isNurse ? <ShieldPlus size={16} /> : (isStaff ? <Armchair size={16} /> : (isOccupied ? '✕' : id))}
    </button>
  );
});
