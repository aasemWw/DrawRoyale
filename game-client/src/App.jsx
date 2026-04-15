import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// استبدل هذا الرابط برابط Render لاحقاً
const socket = io('http://localhost:3001');

function App() {
  const [phase, setPhase] = useState('login'); // login, lobby, drawing, voting
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    socket.on('update_players', (playersList) => setPlayers(playersList));
    socket.on('game_started', () => setPhase('drawing'));
    socket.on('start_voting', (drawings) => {
      console.log('بدأ التصويت على:', drawings);
      setPhase('voting');
    });

    return () => socket.off();
  }, []);

  const joinRoom = () => {
    socket.emit('join_room', { roomId: room, playerName: name });
    setPhase('lobby');
  };

  const startGame = () => socket.emit('start_game', room);

  const submitDrawing = () => {
    // هنا ترسل الصورة كـ Base64 من لوحة الرسم
    socket.emit('submit_drawing', { roomId: room, drawingData: 'BASE_64_IMAGE_STRING' });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>لعبة الرسم 🎨</h1>

      {phase === 'login' && (
        <div>
          <input placeholder="اسمك" onChange={(e) => setName(e.target.value)} />
          <input placeholder="رمز الغرفة" onChange={(e) => setRoom(e.target.value)} />
          <button onClick={joinRoom}>دخول</button>
        </div>
      )}

      {phase === 'lobby' && (
        <div>
          <h2>الغرفة: {room}</h2>
          <ul>{players.map((p, i) => <li key={i}>{p.name}</li>)}</ul>
          <button onClick={startGame}>بدأ اللعبة</button>
        </div>
      )}

      {phase === 'drawing' && (
        <div>
          <h2>وقت الرسم! ⏳</h2>
          {/* هنا تضع مكون <ReactSketchCanvas /> */}
          <div style={{ width: '300px', height: '300px', border: '1px solid black', margin: '10px 0' }}>
            مساحة الرسم
          </div>
          <button onClick={submitDrawing}>إرسال الرسمة</button>
        </div>
      )}

      {phase === 'voting' && (
        <h2>مرحلة التصويت قيد التطوير...</h2>
      )}
    </div>
  );
}

export default App;