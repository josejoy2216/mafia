const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socket = require('./socket/socket');

const roomRoutes = require('./routes/roomRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api', roomRoutes);
app.use('/api/vote', roomRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/endgame', roomRoutes);
app.use('/api/startgame', roomRoutes);
app.use('/api/night-action', roomRoutes);

//app.use('/api/games', gameRoutes);

const server = http.createServer(app);
socket(server);

mongoose.connect('mongodb+srv://root:root@cluster0.8ft6z9g.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
  });



// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const Room = require('./models/Room');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// mongoose.connect('mongodb+srv://root:root@cluster0.8ft6z9g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// mongoose.connection.on('connected', () => {
//   console.log('Connected to MongoDB');
// });

// mongoose.connection.on('error', (err) => {
//   console.log('Failed to connect to MongoDB', err);
// });

// const generateRoomCode = () => {
//   return Math.random().toString(36).substr(2, 5).toUpperCase();
// };

// const assignRoles = (numPlayers) => {
//   const roles = ['mafia', 'police'];
//   for (let i = 2; i < numPlayers; i++) {
//     roles.push('civilian');
//   }
//   return roles.sort(() => Math.random() - 0.5);
// };

// // Middleware to validate playerId
// const validatePlayer = async (req, res, next) => {
//   const { playerId, code } = req.params;
//   const room = await Room.findOne({ code });
//   if (room && room.players.some(player => player._id.toString() === playerId)) {
//     req.room = room;
//     next();
//   } else {
//     res.status(403).json({ message: 'Unauthorized' });
//   }
// };

// app.post('/api/create-room', async (req, res) => {
//   const { host } = req.body;
//   try {
//     const room = new Room({
//       host,
//       code: generateRoomCode(),
//       players: [{ name: host, role: 'civilian', alive: true }],
//       gameStarted: false,
//       phase: 'waiting',
//       nominations: []
//     });
//     await room.save();
//     const populatedRoom = await Room.findOne({ _id: room._id }).populate('host');
//     res.json({ code: room.code, host: populatedRoom.host }); // Return host with _id
//   } catch (error) {
//     console.error('Error creating room:', error);
//     res.status(500).json({ message: 'Failed to create room' });
//   }
// });

// app.post('/api/join-room', async (req, res) => {
//   const { code, name } = req.body;
//   try {
//     const room = await Room.findOne({ code });
//     if (room) {
//       const newPlayer = { name, role: 'civilian', alive: true };
//       room.players.push(newPlayer);
//       await room.save();
//       const savedPlayer = room.players.find(player => player.name === name); // Get the new player with _id
//       io.to(room.code).emit('updateRoom', room);
//       res.json({ code: room.code, userId: savedPlayer._id }); // Return userId along with room code
//     } else {
//       res.status(404).json({ message: 'Room not found' });
//     }
//   } catch (error) {
//     console.error('Error joining room:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.get('/api/room/:code', async (req, res) => {
//   try {
//     const room = await Room.findOne({ code: req.params.code });
//     if (room) {
//       res.json(room);
//     } else {
//       res.status(404).json({ message: 'Room not found' });
//     }
//   } catch (error) {
//     console.error('Error fetching room:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.post('/api/start-game/:code', async (req, res) => {
//   const { code } = req.params;
//   try {
//     const room = await Room.findOne({ code });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }
//     if (room.gameStarted) {
//       return res.status(400).json({ message: 'Game already started' });
//     }
//     if (room.players.length < 4) {
//       return res.status(400).json({ message: 'Not enough players to start the game' });
//     }
//     const roles = assignRoles(room.players.length);
//     room.players = room.players.map((player, index) => ({
//       ...player,
//       role: roles[index],
//     }));
//     room.gameStarted = true;
//     room.phase = 'night';
//     await room.save();
//     io.to(room.code).emit('updateRoom', room);
//     res.json(room);
//   } catch (error) {
//     console.error('Error starting game:', error);
//     res.status(500).json({ message: 'Failed to start game' });
//   }
// });

// app.post('/api/night-action/:code/:playerId', validatePlayer, async (req, res) => {
//   const { mafiaTarget, policeGuess } = req.body;
//   try {
//     const room = req.room;

//     const mafia = room.players.find(player => player.role === 'mafia');
//     const police = room.players.find(player => player.role === 'police');

//     if (mafiaTarget) {
//       const target = room.players.find(player => player.name === mafiaTarget);
//       if (target) {
//         target.alive = false;
//       }
//     }

//     let policeCorrect = false;
//     if (policeGuess) {
//       const guessedPlayer = room.players.find(player => player.name === policeGuess);
//       if (guessedPlayer && guessedPlayer.role === 'mafia') {
//         policeCorrect = true;
//       }
//     }

//     let gameOver = false;
//     if (!mafia.alive || policeCorrect) {
//       gameOver = true;
//     }

//     room.phase = 'day';
//     await room.save();
//     io.to(room.code).emit('updateRoom', room);
//     res.json({ room, gameOver, policeCorrect });
//   } catch (error) {
//     console.error('Error performing night action:', error);
//     res.status(500).json({ message: 'Failed to perform night action' });
//   }
// });

// app.post('/api/vote/:code/:playerId', validatePlayer, async (req, res) => {
//   const { playerName } = req.body;
//   try {
//     const room = req.room;

//     const player = room.players.find(p => p.name === playerName);
//     if (player) {
//       player.alive = false;
//     }

//     const mafiaAlive = room.players.some(player => player.role === 'mafia' && player.alive);
//     if (!mafiaAlive) {
//       room.phase = 'gameOver';
//       await room.save();
//       io.to(room.code).emit('updateRoom', room);
//       return res.json({ room, message: 'Citizens and police win!' });
//     }

//     const civiliansAlive = room.players.filter(player => player.role === 'civilian' && player.alive).length;
//     const mafiaCount = room.players.filter(player => player.role === 'mafia' && player.alive).length;
//     if (mafiaCount >= civiliansAlive) {
//       room.phase = 'gameOver';
//       await room.save();
//       io.to(room.code).emit('updateRoom', room);
//       return res.json({ room, message: 'Mafia win!' });
//     }

//     room.phase = 'night';
//     await room.save();
//     io.to(room.code).emit('updateRoom', room);
//     res.json(room);
//   } catch (error) {
//     console.error('Error performing vote:', error);
//     res.status(500).json({ message: 'Failed to perform vote' });
//   }
// });

// io.on('connection', (socket) => {
//   console.log('New client connected');

//   socket.on('joinRoom', ({ code, userId }) => {
//     socket.join(code);
//     // Associate the socket with the user's ID
//     socket.userId = userId; // Assuming userId is passed from frontend
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
