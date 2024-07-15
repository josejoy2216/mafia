// models/Game.js
// const mongoose = require('mongoose');

// const gameSchema = new mongoose.Schema({
//   room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
//   phase: { type: String, enum: ['night', 'day'], default: 'night' },
//   nightActions: {
//     mafiaTarget: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
//     policeGuess: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }
//   },
//   dayActions: {
//     votes: [{ voter: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }, target: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' } }]
//   }
// });

// module.exports = mongoose.model('Game', gameSchema);


