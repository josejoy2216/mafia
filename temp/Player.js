// ./models/Player.js

// const mongoose = require('mongoose');

// const playerSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['mafia', 'police', 'civilian'],
//     default: 'civilian'
//   },
//   status: {
//     type: String,
//     enum: ['alive', 'dead', 'spectator'],
//     default: 'alive'
//   },
//   isAlive: {
//     type: Boolean,
//     default: true
//   },
//   canVote: {
//     type: Boolean,
//     default: true
//   }
// });

// module.exports = mongoose.model('Player', playerSchema);




// const mongoose = require('mongoose');

// const playerSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['mafia', 'police', 'civilian'],
//     required: true
//   },
//   alive: {
//     type: Boolean,
//     default: true
//   }
// });

// const Player = mongoose.model('Player', playerSchema);

// module.exports = Player;
