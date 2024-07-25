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
        return res.status(200).send('Game ended and room deleted');
      }
      res.status(200).send('Game ended and room deleted');
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: 'Failed to delete room' });
    }
  },

  // Remove player from the list(exit room button for player)  ---------------------
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

  // Start the game ------------------
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

  //get room details ----------------
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


};




module.exports = roomController;
