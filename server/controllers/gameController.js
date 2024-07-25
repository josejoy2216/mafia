// Import necessary models and utilities
const Room = require('../models/Room');

// // Helper function to check win conditions
// const checkWinConditions = async (roomId) => {
//   const room = await Room.findById(roomId).populate('players');
//   if (!room) {
//     throw new Error('Room not found');
//   }

//   const players = room.players;
//   const alivePlayers = players.filter(player => player.status === 'alive');

//   // Count mafia and civilian/police players
//   let mafiaCount = 0;
//   let civilianCount = 0;
//   let policeCount = 0;
//   alivePlayers.forEach(player => {
//     if (player.role === 'mafia') {
//       mafiaCount++;
//     } else if (player.role === 'civilian') {
//       civilianCount++;
//     } else if (player.role === 'police') {
//       policeCount++;
//     }
//   });

//   // Win conditions
//   if (mafiaCount >= alivePlayers.length / 2) {
//     // Mafia wins if they equal or outnumber civilians/police
//     return 'mafia';
//   } else if (mafiaCount === 0) {
//     // Citizens/police win if all mafia are dead
//     return 'citizens/police';
//   }

//   return null; // Game continues
// };

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

  // Mafia night action
  handleNightActionMafia: async (req, res) => {
    const { roomId, userId } = req.params;
    const { mafiaTarget } = req.body;
  
    try {
      const room = await Room.findById(roomId).populate('players');
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      const player = room.players.find(player => player._id.toString() === userId);
      if (!player || player.role !== 'mafia') {
        return res.status(403).json({ message: 'Not authorized to perform this action' });
      }
      
      const targetPlayer = room.players.id(mafiaTarget);
      if (targetPlayer) {
       targetPlayer.isAlive = false;
       targetPlayer.status = 'dead';
       room.game.nightActions.mafiaTarget = mafiaTarget;
     }

      await room.save();
      res.json({ room });
    } catch (error) {
      console.error('Error handling mafia night action:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  //police night action
  handleNightActionPolice: async (req, res) => {
    const { roomId, userId } = req.params;
    const { policeGuess } = req.body;
  
    try {
      const room = await Room.findById(roomId).populate('players');
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      const player = room.players.find(player => player._id.toString() === userId);

      if (!player || player.role !== 'police') {
        return res.status(403).json({ message: 'Not authorized to perform this action' });
      }
  
      room.game.nightActions.policeGuess = policeGuess;
  
      // Move to day phase if both actions are complete
      if (room.game.nightActions.mafiaTarget && room.game.nightActions.policeGuess) {
        room.phase = 'day';
        room.game.phase = 'day';
  
        const mafiaKilledPlayer = room.players.find(player => player._id.toString() === room.game.nightActions.mafiaTarget);
        if (mafiaKilledPlayer) {
          mafiaKilledPlayer.isAlive = false;
          mafiaKilledPlayer.status = 'dead';
        }
  
        const mafiaPlayer = room.players.find(player => player.role === 'mafia');
        if (policeGuess === mafiaPlayer._id.toString()) {
          const message = `Police won! The mafia player ${mafiaPlayer.name} was correctly identified.`;
          room.winner = 'police';
        }
  
        await room.save();
        // const io = req.app.get('io');
        // io.to(roomId).emit('gameStateUpdate', room);
      } else {
        await room.save();
      }
  
      res.json({ room });
    } catch (error) {
      console.error('Error handling police night action:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  //Nomination of players
  handleNomination: async (req, res) => {
    const { roomId } = req.params;
    const { nominatedPlayerId, voterId } = req.body;
  
    try {
      const room = await Room.findById(roomId);
  
      // Remove voter's ID from any previous nominations
      room.players.forEach(player => {
        const voteIndex = player.votes.indexOf(voterId);
        if (voteIndex !== -1) {
          player.votes.splice(voteIndex, 1);
        }
      });
  
      // Add voter's ID to the nominated player
      const nominatedPlayer = room.players.find(player => player._id.toString() === nominatedPlayerId);
      if (nominatedPlayer) {
        nominatedPlayer.votes.push(voterId);
      }
  
      await room.save();
      res.json({ room });
    } catch (error) {
      console.error('Error handling nomination:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  //voting of players 
  handleVote: async (req, res) => {
    const { roomId } = req.params;

    try {
      const room = await Room.findById(roomId);
  
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      // Calculate the player with the most votes
      let mostVotedPlayer = null;
      let maxVotes = 0;
  
      room.players.forEach(player => {
        if (player.votes.length > maxVotes) {
          maxVotes = player.votes.length;
          mostVotedPlayer = player;
        }
      });
  
      if (mostVotedPlayer) {
        // Update nominations with the player who has the most votes
        room.nominations.push({
          round: room.nominations.length + 1, // Increment the round number
          player: mostVotedPlayer._id,
          votes: maxVotes
        });
  
        // Check if the voted-out player is a Mafia member
        if (mostVotedPlayer.role === 'mafia') {
          room.winner = 'civilian';
          room.phase = 'gameOver'; // End the game if Mafia is eliminated
        } else {
          
          // Continue the game to the next phase
          room.phase = 'night'; // Or 'day' depending on your game logic
          room.game.nightActions.mafiaTarget = null;
          room.game.nightActions.policeGuess = null;
        }
  
        // Reset votes for the next round
        room.players.forEach(player => {
          player.votes = [];
        });
  
        await room.save();
  
        res.json(room);
      } else {
        res.status(400).json({ message: 'No player received votes' });
      }
    } catch (error) {
      console.error('Error handling voting:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },



};

module.exports = gameController;
