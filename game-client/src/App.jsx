import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { ReactSketchCanvas } from 'react-sketch-canvas';

// ⚠️ تذكر: ضع رابط Render الخاص بك هنا بدل localhost لاحقاً
const socket = io('https://your-server-name.onrender.com');

function App() {
  const [phase, setPhase] = useState('login'); 
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [players, setPlayers] = useState([]);
  
  // إعدادات لوحة الرسم
  const canvasRef = useRef(null);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);

  useEffect(() => {
    socket.on('update_players', (playersList) => setPlayers(playersList));
    socket.on('game_started', () => setPhase('drawing'));
    socket.on('start_voting', (drawings) => {
      setPhase('voting');
    });

    return () => socket.off();
  }, []);

  const joinRoom = () => {
    socket.emit('join_room', { roomId: room, playerName: name });
    setPhase('lobby');
  };

  const startGame = () => socket.emit('start_game', room);

  // دالة إرسال الرسمة
  const submitDrawing = () => {
    if (!canvasRef.current) return;
    
    // تحويل الرسمة إلى صورة (Base64)
    canvasRef.current.exportImage("png")
      .then(data => {
        console.log("تم تحويل الرسمة بنجاح!");
        // إرسال الصورة للسيرفر
        socket.emit('submit_drawing', { roomId: room, drawingData: data });
        setPhase('waiting_others'); // تغيير الشاشة لينتظر باقي اللاعبين
      })
      .catch(e => console.error("حدث خطأ أثناء حفظ الرسمة", e));
  };

  // دوال مساعدة للوحة الرسم
  const clearCanvas = () => canvasRef.current?.clearCanvas();
  const undoCanvas = () => canvasRef.current?.undo();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>لعبة الرسم 🎨</h1>

      {phase === 'login' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input placeholder="اسمك" onChange={(e) => setName(e.target.value)} style={{ padding: '10px' }} />
          <input placeholder="رمز الغرفة" onChange={(e) => setRoom(e.target.value)} style={{ padding: '10px' }} />
          <button onClick={joinRoom} style={{ padding: '10px', cursor: 'pointer' }}>دخول</button>
        </div>
      )}

      {phase === 'lobby' && (
        <div style={{ textAlign: 'center' }}>
          <h2>الغرفة: {room}</h2>
          <h3>اللاعبون المتصلون:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.map((p, i) => <li key={i} style={{ fontSize: '20px', margin: '5px' }}>👤 {p.name}</li>)}
          </ul>
          <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}>بدأ اللعبة 🚀</button>
        </div>
      )}

      {phase === 'drawing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2>ارسم الآن! ⏳</h2>
          
          {/* شريط الأدوات */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
            <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} title="لون القلم" />
            
            <input 
              type="range" min="1" max="20" value={strokeWidth} 
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))} title="حجم القلم" 
            />
            
            <button onClick={undoCanvas}>تراجع ↩️</button>
            <button onClick={clearCanvas}>مسح الكل 🗑️</button>
          </div>

          {/* لوحة الرسم */}
          <div style={{ height: '400px', border: '3px solid #333', borderRadius: '10px', overflow: 'hidden' }}>
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={strokeWidth}
              strokeColor={strokeColor}
              canvasColor="#ffffff"
            />
          </div>

          <button onClick={submitDrawing} style={{ padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', cursor: 'pointer' }}>
            اعتمد الرسمة ✅
          </button>
        </div>
      )}

      {phase === 'waiting_others' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2>تم استلام رسمتك! 🖼️</h2>
          <p>ننتظر باقي اللاعبين لإنهاء رسوماتهم...</p>
        </div>
      )}

      {phase === 'voting' && (
        <div style={{ textAlign: 'center' }}>
          <h2>مرحلة التصويت ستبدأ قريباً! 🔥</h2>
        </div>
      )}
    </div>
  );
}

export default App;
