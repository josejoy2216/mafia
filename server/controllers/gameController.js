// Import necessary models and utilities
const Room = require('../models/Room');

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

  handleNightAction: async (req, res) => {
    const { roomId, userId } = req.params;
    const { mafiaTarget, policeGuess } = req.body;

    try {
      // Ensure roomId is defined
      if (!roomId) {
        return res.status(400).json({ message: 'Room ID is required' });
      }

      const room = await Room.findById(roomId).populate('players');
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const player = room.players.find(player => player._id.toString() === userId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      if (player.role === 'mafia' && mafiaTarget) {
        // Assign mafiaTarget if player is mafia
        room.game.nightActions.mafiaTarget = mafiaTarget;
      } else if (player.role === 'police' && policeGuess) {
        // Assign policeGuess if player is police
        room.game.nightActions.policeGuess = policeGuess;
      } else {
        return res.status(400).json({ message: 'Invalid action for current role or missing selection' });
      }

      // Check if both mafia and police actions are complete
      const mafiaActionComplete = room.game.nightActions.mafiaTarget;
      const policeActionComplete = room.game.nightActions.policeGuess;

      if (mafiaActionComplete && policeActionComplete) {
        // Move to day phase
        room.phase = 'day';
        room.game.phase = 'day';

        // Resolve night actions
        const mafiaKilledPlayer = room.players.find(player => player._id.toString() === mafiaActionComplete);
        if (mafiaKilledPlayer) {
          mafiaKilledPlayer.isAlive = false;
          mafiaKilledPlayer.status = 'dead';
          console.log("Mafia killed:", mafiaKilledPlayer.name);
        }

        // Check if policeGuess matches mafia player's ID
        const mafiaPlayer = room.players.find(player => player.role === 'mafia');
        if (policeGuess === mafiaPlayer._id.toString()) {
          // Send message to all players that police won
          const message = `Police won! The mafia player ${mafiaPlayer.name} was correctly identified.`;
          const io = req.app.get('io');
          io.to(roomId).emit('policeWinMessage', message);
        }

        await room.save();
        // Emit updated room state to all clients in the room
        const io = req.app.get('io');
        io.to(roomId).emit('gameStateUpdate', room);

        res.json({ room });
      } else {
        await room.save();
        res.json({ room });
      }
    } catch (error) {
      console.error('Error handling night action:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },


  // Day voting (players vote to eliminate a player)
  voteDay: async (req, res) => {
    const { roomCode, voterId, targetId } = req.body;

    try {
      const room = await Room.findById(roomId).populate('players');
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      const player = room.players.id(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
  
      if (room.phase !== 'day') {
        return res.status(400).json({ message: 'Voting is not allowed in the current phase' });
      }
  
      // Handle voting logic
      const vote = { voter: req.body.voterId, target: playerId };
      room.game.dayActions.votes.push(vote);
  
      // Check if all players have voted
      if (room.game.dayActions.votes.length === room.players.filter(player => player.isAlive).length) {
        // Calculate the most voted player
        const voteCount = room.game.dayActions.votes.reduce((acc, { target }) => {
          acc[target] = (acc[target] || 0) + 1;
          return acc;
        }, {});
  
        const mostVotedPlayerId = Object.keys(voteCount).reduce((a, b) => (voteCount[a] > voteCount[b] ? a : b));
        const mostVotedPlayer = room.players.id(mostVotedPlayerId);
  
        if (mostVotedPlayer) {
          mostVotedPlayer.isAlive = false;
          mostVotedPlayer.status = 'dead';
        }
  
        room.phase = 'night';
        room.game.phase = 'night';
        room.game.nightActions = {}; // Reset night actions for the next round
        room.game.dayActions.votes = []; // Reset day actions for the next round
  
        await room.save();
        const io = req.app.get('io');
        io.to(roomId).emit('gameStateUpdate', room);
      } else {
        await room.save();
      }
  
      res.json(room);
    } catch (error) {
      console.error('Error during voting:', error);
      res.status(500).json({ message: 'Server error' });
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
