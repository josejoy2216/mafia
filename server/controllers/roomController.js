// Import Room and Player models
const Room = require('../models/Room');
//const Player = require('../models/Player');
const mongoose = require('mongoose');
const generateRoomCode = require('../utils/generateRoomCode');

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};


// Controller methods
const roomController = {
  //create room -----------------------------------
  createRoom: async (req, res) => {
    try {
      const { hostName } = req.body;
      
      if (!hostName) {
        throw new Error('Host name is required');
      }
      // Generate a unique room code
      const roomCode = generateRoomCode();
      console.log(`Generated room code: ${roomCode}`);

      // Create a new ObjectId for the host/player
      const hostPlayerId = new mongoose.Types.ObjectId();
      
      // Create a new room with the host and room code
      const newRoom = new Room({
        host: hostPlayerId, // Embedded host player
        code: roomCode,
        players: [{ _id: hostPlayerId, name: hostName }], // Add host to players array
        game: {room: null} // Initialize an empty game object
      });

       // Update the game room reference
       newRoom.game.room = newRoom._id;

      await newRoom.save();

      res.status(201).json(newRoom);
    } catch (err) {
      console.error('Error creating room:', err);
      res.status(500).json({ error: 'Failed to create room', details: err.message });
    }
  },

   // Delete room by ID ------------------------------------
   deleteRoomById: async (req, res) => {
    try {
      const roomId = req.params.roomId;
      console.log(`Received request to delete room ID: ${roomId}`);
      const deletedRoom = await Room.findByIdAndDelete(roomId);
      if (!deletedRoom) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.status(200).send('Game ended and room deleted');
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: 'Failed to delete room' });
    }
  },

  // Remove player from the list  ---------------------
  removePlayerFromRoom: async (req, res) => {
    try {
      const { roomId, playerId } = req.params;
      console.log(`Removing player ${playerId} from room ${roomId}`);
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      room.players = room.players.filter(player => player._id.toString() !== playerId);
      await room.save();

      res.status(200).send('Player removed');
    } catch (err) {
      console.error('Error removing player:', err);
      res.status(500).json({ error: 'Failed to remove player' });
    }
  },

  
  // Start the game
  startGame: async (req, res) => {
    try {
      const { roomId, playerId } = req.params;
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const playerCount = room.players.length;

      // Calculate the number of roles
      const numMafia = Math.floor(playerCount / 4);
      const numPolice = Math.floor(playerCount / 4);
      const numCivilians = playerCount - numMafia - numPolice;

      // Create an array with the role distribution
      let roles = Array(numMafia).fill('mafia')
        .concat(Array(numPolice).fill('police'))
        .concat(Array(numCivilians).fill('civilian'));

      // Shuffle the roles array
      roles = shuffleArray(roles);

      // Assign roles to players
      room.players.forEach((player, index) => {
        player.role = roles[index];
      });

      // Set game status
      room.gameStarted = true;
      room.phase = 'night';

      await room.save();

      //io.to(roomId).emit('gameStarted', { message: 'Game has started', room });

      res.json({ message: 'Game started' });
    } catch (err) {
      console.error('Error starting game:', err);
      res.status(500).json({ error: 'Failed to start game' });
    }
  },















  
  //get room details 
  getRoomDetails : async (req, res) => {
    try {
      const { roomId } = req.params;
  
      // Populate room details including host, players, and game actions
      const room = await Room.findById(roomId).exec();
  
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
  
      res.json(room); // Return the entire room details
    } catch (err) {
      console.error('Error fetching room details:', err);
      res.status(500).json({ error: 'Failed to fetch room details' });
    }
  },













  // Get all rooms
  getAllRooms: async (req, res) => {
    try {
      const rooms = await Room.find().populate('players', 'name role'); // Populate players' details
      res.json(rooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      res.status(500).json({ error: 'Failed to fetch rooms' });
    }
  },

  // Get room details by code
  getRoomByCode: async (req, res) => {
    try {
      const { code, id } = req.params;
      const room = await Room.findOne({ code }).populate('players', 'name role isAlive');
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      const player = room.players.find(player => player._id.toString() === id);
      if (!player) {
        return res.status(404).json({ error: 'Player not found in this room' });
      }
      res.json(room);
    } catch (err) {
      console.error('Error fetching room:', err);
      res.status(500).json({ error: 'Failed to fetch room' });
    }
  },

  // Get room by ID
  getRoomById: async (req, res) => {
    try {
      const roomId = req.params.id;
      const room = await Room.findById(roomId).populate('players', 'name role'); // Populate players' details
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (err) {
      console.error('Error fetching room:', err);
      res.status(500).json({ error: 'Failed to fetch room' });
    }
  },

  // Update room by ID
  updateRoomById: async (req, res) => {
    try {
      const roomId = req.params.id;
      const { code } = req.body;
      const updatedRoom = await Room.findByIdAndUpdate(roomId, { code }, { new: true });
      if (!updatedRoom) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(updatedRoom);
    } catch (err) {
      console.error('Error updating room:', err);
      res.status(500).json({ error: 'Failed to update room' });
    }
  }

 
  

};




module.exports = roomController;



// const Room = require('../models/Room');
// const User = require('../models/Player');
// const { generateRoomCode } = require('../utils/generateRoomCode');

// exports.createRoom = async (req, res) => {
//   const { hostName } = req.body;

//   try {
//     const host = new User({ name: hostName });
//     await host.save();

//     const roomCode = generateRoomCode();
//     const room = new Room({
//       code: roomCode,
//       players: [{ _id: host._id, name: hostName, role: 'host', alive: true }],
//     });

//     await room.save();
//     res.status(201).json(room);
//   } catch (error) {
//     console.error('Error creating room:', error);
//     res.status(500).json({ message: 'Failed to create room' });
//   }
// };

// exports.joinRoom = async (req, res) => {
//   const { roomCode, playerName } = req.body;

//   try {
//     const room = await Room.findOne({ code: roomCode });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     const player = new User({ name: playerName });
//     await player.save();

//     room.players.push({ _id: player._id, name: playerName, role: 'player', alive: true });
//     await room.save();

//     res.status(200).json(room);
//   } catch (error) {
//     console.error('Error joining room:', error);
//     res.status(500).json({ message: 'Failed to join room' });
//   }
// };

// exports.getRoom = async (req, res) => {
//   const { roomCode } = req.params;

//   try {
//     const room = await Room.findOne({ code: roomCode });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     res.status(200).json(room);
//   } catch (error) {
//     console.error('Error fetching room:', error);
//     res.status(500).json({ message: 'Failed to fetch room details' });
//   }
// };
