const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
// إعداد Socket.io للسماح بالاتصال من أي مكان (مهم لـ Render لاحقاً)
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// قاعدة بيانات مؤقتة لحفظ حالة الغرف
const rooms = {};

io.on('connection', (socket) => {
  console.log('لاعب متصل:', socket.id);

  // الانضمام لغرفة
  socket.on('join_room', ({ roomId, playerName }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], phase: 'lobby', drawings: [] };
    }
    
    rooms[roomId].players.push({ id: socket.id, name: playerName, score: 0 });
    
    // تحديث كل من في الغرفة بقائمة اللاعبين
    io.to(roomId).emit('update_players', rooms[roomId].players);
  });

  // بدء اللعبة والانتقال لمرحلة الرسم
  socket.on('start_game', (roomId) => {
    rooms[roomId].phase = 'drawing';
    io.to(roomId).emit('game_started', { timeLimit: 120 }); // دقيقتين
  });

  // استلام الرسمة من اللاعب
  socket.on('submit_drawing', ({ roomId, drawingData }) => {
    rooms[roomId].drawings.push({ playerId: socket.id, image: drawingData, votes: 0 });
    
    // إذا أرسل الجميع رسوماتهم، ننتقل لمرحلة التصويت
    if (rooms[roomId].drawings.length === rooms[roomId].players.length) {
      rooms[roomId].phase = 'voting';
      // إرسال الرسومات بدون أسماء أصحابها
      io.to(roomId).emit('start_voting', rooms[roomId].drawings.map(d => ({ image: d.image, id: d.playerId })));
    }
  });

  socket.on('disconnect', () => {
    console.log('لاعب قطع الاتصال:', socket.id);
    // هنا يمكنك إضافة منطق لحذف اللاعب من الغرفة عند خروجه
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`السيرفر يعمل على منفذ ${PORT}`);
});
