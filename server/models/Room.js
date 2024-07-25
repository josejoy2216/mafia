const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['mafia', 'police', 'civilian'], default: 'civilian' },
  status: { type: String, enum: ['alive', 'dead', 'spectator'], default: 'alive' },
  isAlive: { type: Boolean, default: true },
  canVote: { type: Boolean, default: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }] // IDs of players who voted for this player
});

const gameSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  phase: { type: String, enum: ['night', 'day'], default: 'night' },
  nightActions: {
    mafiaTarget: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' , default: null },
    policeGuess: { type: mongoose.Schema.Types.ObjectId, ref: 'Player',  default: null }
  },
  dayActions: {
    votes: [{ voter: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }, target: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' } }]
  }
});

const roomSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  code: { type: String, required: true, unique: true },
  winner: { type: String, enum: ['mafia', 'police', 'civilian','nowinner'], default: 'nowinner' },
  players: [playerSchema], // Embedding playerSchema here
  gameStarted: { type: Boolean, default: false },
  phase: { type: String, enum: ['waiting', 'night', 'day', 'gameOver'], default: 'waiting' },
  nominations: [{
    round: { type: Number, required: true },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    votes: { type: Number, required: true }
  }],
  game: gameSchema // Embedding gameSchema here
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;

