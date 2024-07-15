const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const playerController = require('../controllers/playerController');

// Route to create a new room
router.post('/create', roomController.createRoom);

// Route to join an existing room
router.post('/join', (req, res, next) => {
    console.log(`Received room code: ${req.body.roomCode}, player name: ${req.body.name}`);
    next();
  }, playerController.createPlayer);

// Route to get room details by code
router.get('/lobby/:roomId/:id', (req, res, next) => {
  console.log(`Received request for room code: ${req.params.code}, player id: ${req.params.id}`);
  next();
}, playerController.getAllPlayers);

router.delete('/endgame/:roomId',  (req, res, next) => {
  console.log(`Received request to delete room code: ${req.params.roomId}`);
  next();
}, roomController.deleteRoomById)


// Route to start the game
router.post('/start/:code/:id', roomController.startGame);


module.exports = router;






// const express = require('express');
// const router = express.Router();
// const Room = require('./models/Room');
// const Player = require('./models/Player');

// // Create Room
// router.post('/create-room', async (req, res) => {
//   const { host } = req.body;
//   try {
//     const newPlayer = new Player({
//       name: host,
//       role: 'civilian'
//     });
//     const savedPlayer = await newPlayer.save();
    
//     const newRoom = new Room({
//       host: savedPlayer._id,
//       code: generateRoomCode(), // Implement generateRoomCode function
//       players: [savedPlayer._id]
//     });
//     await newRoom.save();

//     res.json({ code: newRoom.code, host: savedPlayer });
//   } catch (error) {
//     console.error('Error creating room:', error);
//     res.status(500).json({ message: 'Failed to create room' });
//   }
// });

// // Join Room
// router.post('/join-room', async (req, res) => {
//   const { code, name } = req.body;
//   try {
//     const room = await Room.findOne({ code });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     const newPlayer = new Player({
//       name,
//       role: 'civilian'
//     });
//     const savedPlayer = await newPlayer.save();

//     room.players.push(savedPlayer._id);
//     await room.save();

//     res.json({ code: room.code, userId: savedPlayer._id });
//   } catch (error) {
//     console.error('Error joining room:', error);
//     res.status(500).json({ message: 'Failed to join room' });
//   }
// });

// // Start Game
// router.post('/start-game/:code', async (req, res) => {
//   const { code } = req.params;
//   try {
//     const room = await Room.findOne({ code }).populate('players');
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }
//     if (room.gameStarted) {
//       return res.status(400).json({ message: 'Game already started' });
//     }
//     if (room.players.length < 4) {
//       return res.status(400).json({ message: 'Not enough players to start the game' });
//     }

//     // Assign roles randomly
//     const roles = assignRoles(room.players.length);
//     room.players.forEach((player, index) => {
//       player.role = roles[index];
//     });

//     room.gameStarted = true;
//     room.phase = 'night';
//     await room.save();

//     res.json(room);
//   } catch (error) {
//     console.error('Error starting game:', error);
//     res.status(500).json({ message: 'Failed to start game' });
//   }
// });

// // Night Action
// router.post('/night-action/:code/:userId', async (req, res) => {
//   const { code, userId } = req.params;
//   const { mafiaTarget, policeGuess } = req.body;
//   try {
//     const room = await Room.findOne({ code }).populate('players');
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     // Check if it's the correct phase and user is authorized to perform action
//     if (room.phase !== 'night') {
//       return res.status(400).json({ message: 'It is not night phase' });
//     }
//     const currentPlayer = room.players.find(player => player._id.toString() === userId);
//     if (!currentPlayer) {
//       return res.status(403).json({ message: 'Unauthorized' });
//     }

//     // Process night actions based on roles (mafia, police)
//     if (currentPlayer.role === 'mafia') {
//       // Mafia selects a target to kill
//       const target = room.players.find(player => player.name === mafiaTarget);
//       if (target) {
//         target.alive = false;
//       }
//     } else if (currentPlayer.role === 'police') {
//       // Police makes a guess
//       const guessedPlayer = room.players.find(player => player.name === policeGuess);
//       if (guessedPlayer && guessedPlayer.role === 'mafia') {
//         // Police guessed correctly
//         guessedPlayer.alive = false;
//       }
//     }

//     // Update room phase and save
//     room.phase = 'day';
//     await room.save();

//     // Emit updated room to all clients
//     io.to(room.code).emit('updateRoom', room);

//     // Determine if game over conditions are met
//     let gameOver = false;
//     let policeCorrect = false;
//     if (!room.players.some(player => player.role === 'mafia' && player.alive)) {
//       gameOver = true;
//       policeCorrect = true;
//     } else if (room.players.filter(player => player.role === 'mafia' && player.alive).length >= room.players.filter(player => player.role !== 'mafia' && player.alive).length) {
//       gameOver = true;
//     }

//     res.json({ room, gameOver, policeCorrect });
//   } catch (error) {
//     console.error('Error performing night action:', error);
//     res.status(500).json({ message: 'Failed to perform night action' });
//   }
// });

// // Voting
// router.post('/vote/:code/:userId', async (req, res) => {
//   const { code, userId } = req.params;
//   const { playerName } = req.body;
//   try {
//     const room = await Room.findOne({ code }).populate('players');
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     // Check if it's the correct phase and user is authorized to vote
//     if (room.phase !== 'day') {
//       return res.status(400).json({ message: 'It is not day phase' });
//     }
//     const currentPlayer = room.players.find(player => player._id.toString() === userId);
//     if (!currentPlayer) {
//       return res.status(403).json({ message: 'Unauthorized' });
//     }

//     // Process voting logic
//     const votedPlayer = room.players.find(player => player.name === playerName);
//     if (votedPlayer) {
//       votedPlayer.alive = false;
//     }

//     // Check win conditions after voting
//     const mafiaAlive = room.players.some(player => player.role === 'mafia' && player.alive);
//     if (!mafiaAlive) {
//       room.phase = 'gameOver';
//       await room.save();
//       io.to(room.code).emit('updateRoom', room);
//       return res.json({ room, message: 'Citizens and police win!' });
//     }

//     const civiliansAlive = room.players.filter(player => player.role !== 'mafia' && player.alive).length;
//     const mafiaCount = room.players.filter(player => player.role === 'mafia' && player.alive).length;
//     if (mafiaCount >= civiliansAlive) {
//       room.phase = 'gameOver';
//       await room.save();
//       io.to(room.code).emit('updateRoom', room);
//       return res.json({ room, message: 'Mafia win!' });
//     }

//     // If no win condition met, proceed to night phase
//     room.phase = 'night';
//     await room.save();
//     io.to(room.code).emit('updateRoom', room);

//     res.json(room);
//   } catch (error) {
//     console.error('Error performing vote:', error);
//     res.status(500).json({ message: 'Failed to perform vote' });
//   }
// });

// module.exports = router;
