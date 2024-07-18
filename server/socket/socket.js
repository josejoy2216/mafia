const socketIo = require('socket.io');

const socket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*', // Allow any origin for CORS (consider tightening this in production)
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinRoom', (roomCode) => {
      socket.join(roomCode);
      io.to(roomCode).emit('newPlayer', socket.id);
    });

    socket.on('startGame', (roomCode) => {
      io.to(roomCode).emit('gameStarted');
    });

    socket.on('endGame', (roomCode) => {
      console.log(`Ending game for room: ${roomCode}`);
      io.to(roomCode).emit('gameEnded');
    });

    socket.on('exitGame', (roomCode, playerId) => {
      io.to(roomCode).emit('playerExited', playerId);
    });

    socket.on('gameStateUpdate', (roomId, playerId) => {
      io.to(roomId).emit('gameStateUpdate', playerId);
    });

    socket.on('nightAction', (data) => {
      io.to(data.roomCode).emit('nightAction', data);
    });

    socket.on('vote', (data) => {
      io.to(data.roomCode).emit('vote', data);
    });

    // Handle police win message
    socket.on('policeWinMessage', (message) => {
      io.to(roomId).emit('policeWinMessage', message);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};


module.exports = socket;
