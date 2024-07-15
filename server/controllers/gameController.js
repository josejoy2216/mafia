// Import necessary models and utilities
const Room = require('../models/Room');
// const Player = require('../models/Player');
// const Game = require('../models/Game');
const generateRoomCode = require('../utils/generateRoomCode');

// Helper function to check win conditions
const checkWinConditions = async (roomId) => {
  const room = await Room.findById(roomId).populate('players');
  if (!room) {
    throw new Error('Room not found');
  }

  const players = room.players;
  const alivePlayers = players.filter(player => player.status === 'alive');

  // Count mafia and civilian/police players
  let mafiaCount = 0;
  let civilianCount = 0;
  let policeCount = 0;
  alivePlayers.forEach(player => {
    if (player.role === 'mafia') {
      mafiaCount++;
    } else if (player.role === 'civilian') {
      civilianCount++;
    } else if (player.role === 'police') {
      policeCount++;
    }
  });

  // Win conditions
  if (mafiaCount >= alivePlayers.length / 2) {
    // Mafia wins if they equal or outnumber civilians/police
    return 'mafia';
  } else if (mafiaCount === 0) {
    // Citizens/police win if all mafia are dead
    return 'citizens/police';
  }

  return null; // Game continues
};

// Controller methods
const gameController = {
  // Start the game (only host can start)
  startGame: async (req, res) => {
    const { roomCode } = req.body;

    try {
      // Find the room by room code
      const room = await Room.findOne({ code: roomCode }).populate('players');
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if the current user is the host
      // For simplicity, assuming the host can start the game by making a request
      // In a real scenario, you would validate the host identity and permissions
      // For now, we assume the host can start the game
      const host = room.players.find(player => player.role === 'host');
      if (!host) {
        return res.status(403).json({ error: 'Only the host can start the game' });
      }

      // Assign roles to players
      const totalPlayers = room.players.length;
      const mafiaCount = Math.floor(totalPlayers / 6); // 1 mafia per 6 players

      let roles = ['mafia'];
      for (let i = 1; i < totalPlayers; i++) {
        roles.push('civilian');
      }

      // Shuffle roles array to randomize role assignments
      roles = roles.sort(() => Math.random() - 0.5);

      // Update players with assigned roles
      for (let i = 0; i < totalPlayers; i++) {
        const player = room.players[i];
        player.role = roles[i];
        await player.save();
      }

      // Initialize game state
      const game = new Game({
        room: room._id
      });
      await game.save();

      // Update room state to indicate game started
      room.gameStarted = true;
      await room.save();

      res.status(200).json({ message: 'Game started successfully', room, game });
    } catch (err) {
      console.error('Error starting game:', err);
      res.status(500).json({ error: 'Failed to start game' });
    }
  },

  // Night actions (Mafia and Police actions)
  performNightActions: async (req, res) => {
    const { roomCode, playerId, targetId } = req.body;

    try {
      // Find the room by room code
      const room = await Room.findOne({ code: roomCode }).populate('players');
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if the player is alive and belongs to the room
      const player = room.players.find(p => p._id.equals(playerId) && p.status === 'alive');
      if (!player) {
        return res.status(403).json({ error: 'Player not authorized for actions' });
      }

      // Check game phase
      if (room.phase !== 'night') {
        return res.status(403).json({ error: 'Night phase actions not allowed at this time' });
      }

      // Perform Mafia actions (kill target)
      if (player.role === 'mafia') {
        const targetPlayer = room.players.find(p => p._id.equals(targetId) && p.status === 'alive');
        if (targetPlayer) {
          targetPlayer.status = 'dead'; // Mark target player as dead
          await targetPlayer.save();
        }
      }

      // Perform Police actions (guess mafia)
      if (player.role === 'police') {
        const guessedPlayer = room.players.find(p => p._id.equals(targetId) && p.status === 'alive');
        if (guessedPlayer && guessedPlayer.role === 'mafia') {
          guessedPlayer.status = 'dead'; // Mark guessed mafia as dead
          await guessedPlayer.save();
        }
      }

      // Update nominations in the room (for day phase)
      room.nominations.push(targetId);
      await room.save();

      // Check win conditions after night actions
      const winner = await checkWinConditions(room._id);
      if (winner) {
        // Game end conditions met
        const message = `Game over. ${winner} wins!`;
        res.status(200).json({ message });
        // Perform cleanup (delete game data, reset room, etc.)
        // This can be implemented as needed based on your requirements
        // For now, we assume game data deletion logic is handled separately
      } else {
        // Proceed to day phase
        room.phase = 'day';
        await room.save();
        res.status(200).json({ message: 'Night actions completed. Proceed to day phase.' });
      }
    } catch (err) {
      console.error('Error performing night actions:', err);
      res.status(500).json({ error: 'Failed to perform night actions' });
    }
  },

  // Day voting (players vote to eliminate a player)
  voteDay: async (req, res) => {
    const { roomCode, voterId, targetId } = req.body;

    try {
      // Find the room by room code
      const room = await Room.findOne({ code: roomCode }).populate('players');
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if the voter is alive and belongs to the room
      const voter = room.players.find(p => p._id.equals(voterId) && p.status === 'alive');
      if (!voter) {
        return res.status(403).json({ error: 'Player not authorized to vote' });
      }

      // Check game phase
      if (room.phase !== 'day') {
        return res.status(403).json({ error: 'Day phase voting not allowed at this time' });
      }

      // Check if target is alive and belongs to the room
      const targetPlayer = room.players.find(p => p._id.equals(targetId) && p.status === 'alive');
      if (!targetPlayer) {
        return res.status(403).json({ error: 'Target player not valid for voting' });
      }

      // Ensure voter can vote only once
      if (!voter.canVote) {
        return res.status(403).json({ error: 'Player has already voted' });
      }

      // Update voter's canVote status
      voter.canVote = false;
      await voter.save();

      // Update room with the vote
      room.nominations.push(targetId);
      await room.save();

      // Check win conditions after voting
      const winner = await checkWinConditions(room._id);
      if (winner) {
        // Game end conditions met
        const message = `Game over. ${winner} wins!`;
        res.status(200).json({ message });
        // Perform cleanup (delete game data, reset room, etc.)
        // This can be implemented as needed based on your requirements
        // For now, we assume game data deletion logic is handled separately
      } else {
        // Proceed to next night phase if game continues
        room.phase = 'night';
        await room.save();
        res.status(200).json({ message: 'Day voting completed. Proceed to night phase.' });
      }
    } catch (err) {
      console.error('Error during day voting:', err);
      res.status(500).json({ error: 'Failed during day voting' });
    }
  }
};

module.exports = gameController;



// const Room = require('../models/Room');
// const Player = require('../models/Player');
// const { assignRoles } = require('../utils/assignRoles');

// exports.startGame = async (req, res) => {
//   const { roomCode } = req.params;

//   try {
//     const room = await Room.findOne({ code: roomCode });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     // Assign roles to players
//     room.players = assignRoles(room.players);
//     room.phase = 'night';
//     room.gameStarted = true;

//     await room.save();
//     res.status(200).json(room);
//   } catch (error) {
//     console.error('Error starting game:', error);
//     res.status(500).json({ message: 'Failed to start game' });
//   }
// };

// exports.performNightAction = async (req, res) => {
//   const { roomCode, userId } = req.params;
//   const { mafiaTarget, policeGuess } = req.body;

//   try {
//     const room = await Room.findOne({ code: roomCode });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     let gameOver = false;
//     let policeCorrect = false;

//     if (mafiaTarget) {
//       const targetPlayer = room.players.find(player => player._id.equals(mafiaTarget));
//       if (targetPlayer) {
//         targetPlayer.alive = false;
//       }
//     }

//     if (policeGuess) {
//       const guessedPlayer = room.players.find(player => player._id.equals(policeGuess));
//       if (guessedPlayer && guessedPlayer.role === 'mafia') {
//         guessedPlayer.alive = false;
//         policeCorrect = true;
//       }
//     }

//     if (room.players.every(player => player.role !== 'mafia' || !player.alive)) {
//       gameOver = true;
//     } else if (room.players.filter(player => player.alive).length <= 3) {
//       gameOver = true;
//     }

//     room.phase = 'day';
//     await room.save();

//     res.status(200).json({ room, gameOver, policeCorrect });
//   } catch (error) {
//     console.error('Error performing night action:', error);
//     res.status(500).json({ message: 'Failed to perform night action' });
//   }
// };

// exports.votePlayer = async (req, res) => {
//   const { roomCode, userId } = req.params;
//   const { playerName } = req.body;

//   try {
//     const room = await Room.findOne({ code: roomCode });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     const player = room.players.find(player => player.name === playerName);
//     if (player) {
//       player.alive = false;
//     }

//     let gameOver = false;

//     if (room.players.every(player => player.role !== 'mafia' || !player.alive)) {
//       gameOver = true;
//     } else if (room.players.filter(player => player.alive).length <= 3) {
//       gameOver = true;
//     }

//     room.phase = 'night';
//     await room.save();

//     res.status(200).json(room);
//   } catch (error) {
//     console.error('Error during voting:', error);
//     res.status(500).json({ message: 'Failed to perform voting' });
//   }
// };
