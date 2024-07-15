const socketIo = require('socket.io');

const socket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*', // Allow any origin for CORS (consider tightening this in production)
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle player joining a room
    socket.on('joinRoom', (roomCode) => {
      socket.join(roomCode);
      io.to(roomCode).emit('newPlayer', socket.id);
    });

    // Handle starting the game
    socket.on('startGame', (roomCode) => {
      io.to(roomCode).emit('gameStarted');
    });

    // Handle ending the game
    socket.on('endGame', (roomId) => {
      console.log(`Ending game for room: ${roomId}`);
      io.to(roomId).emit('gameEnded');
    });

    // Handle night phase actions
    socket.on('nightAction', (data) => {
      io.to(data.roomCode).emit('nightAction', data);
    });

    // Handle day phase actions
    socket.on('dayAction', (data) => {
      io.to(data.roomCode).emit('dayAction', data);
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

module.exports = socket;
