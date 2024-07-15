const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['mafia', 'police', 'civilian'], default: 'civilian' },
  status: { type: String, enum: ['alive', 'dead', 'spectator'], default: 'alive' },
  isAlive: { type: Boolean, default: true },
  canVote: { type: Boolean, default: true }
});

const gameSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  phase: { type: String, enum: ['night', 'day'], default: 'night' },
  nightActions: {
    mafiaTarget: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    policeGuess: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }
  },
  dayActions: {
    votes: [{ voter: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }, target: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' } }]
  }
});

const roomSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  code: { type: String, required: true, unique: true },
  players: [playerSchema], // Embedding playerSchema here
  gameStarted: { type: Boolean, default: false },
  phase: { type: String, enum: ['waiting', 'night', 'day', 'gameOver'], default: 'waiting' },
  nominations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  game: gameSchema // Embedding gameSchema here
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;

