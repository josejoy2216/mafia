const mongoose = require('mongoose');
const Room = require('../models/Room');

// Controller methods
const playerController = {

  // Create a new player -----------------
  createPlayer: async (req, res) => {
    try {
      const {  roomCode, name } = req.body;
      console.log(`Joining room: playerName=${name}, roomCode=${ roomCode}`);

      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      if (room.gameStarted) {
        console.log(`Game has already started ${name} couldnt join in `)
        return res.status(400).json({ error: 'Game has already started' });
      }
      const newPlayer = {
        _id: new mongoose.Types.ObjectId(), 
        name: name, 
        role: 'civilian', 
        status: 'alive', 
        isAlive: true, 
        canVote: true 
      };

      room.players.push(newPlayer);
      await room.save();

      res.status(200).json({ roomId: room._id, playerId: newPlayer._id });

    } catch (err) {
      console.error('Error joining room:', err);  
      res.status(500).json({ error: 'Failed to join room' });
    }
  },

  //to get all players -----------------
  getAllPlayers: async (req, res) => {
    try {
      const { roomId, id } = req.params;
      console.log(`Received request for room code--: ${roomId}, player id: ${id}`);
  
      // Find the room by code
      const room = await Room.findOne({ _id: roomId }).populate('players');
      console.log(room)
  
      if (!room) {
        console.log('Room not found');
        return res.status(404).json({ error: 'Room not found' });
      }
  
      // Find the player by id in the room's players array
      const player = room.players.find(player => player._id.toString() === id);
  
      if (!player) {
        console.log('Player not found in this room');
        return res.status(404).json({ error: 'Player not found in this room' });
      }
  
      res.json({ players: room.players, roomCode: room.code, playerName: player.name, hostId: room.host });
    } catch (err) {
      console.error('Error fetching players:', err);
      res.status(500).json({ error: 'Failed to fetch players' });
    }
  },

  
  // Get player by ID
  getPlayerById: async (req, res) => {
    try {
      const { roomId, playerId } = req.params;
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const player = room.players.id(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      res.json(player);
    } catch (err) {
      console.error('Error fetching player:', err);
      res.status(500).json({ error: 'Failed to fetch player' });
    }
  },

  // Update player by ID
  updatePlayerById: async (req, res) => {
    try {
      const { roomId, playerId } = req.params;
      const { name } = req.body;
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const player = room.players.id(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      player.name = name;
      await room.save();
      res.json(player);
    } catch (err) {
      console.error('Error updating player:', err);
      res.status(500).json({ error: 'Failed to update player' });
    }
  },

  // Delete player by ID
  deletePlayerById: async (req, res) => {
    try {
      const { roomId, playerId } = req.params;
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const player = room.players.id(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      player.remove();
      await room.save();
      res.json({ message: 'Player deleted successfully' });
    } catch (err) {
      console.error('Error deleting player:', err);
      res.status(500).json({ error: 'Failed to delete player' });
    }
  },




};

module.exports = playerController;
