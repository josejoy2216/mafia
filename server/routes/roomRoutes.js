const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const playerController = require('../controllers/playerController');
const gameController = require('../controllers/gameController');


// Route to create a new room
router.post('/create', roomController.createRoom);

// Route to join an existing room
router.post('/join', (req, res, next) => {
    console.log(`Received room code: ${req.body.roomCode}, player name: ${req.body.name}`);
    next();
  }, playerController.createPlayer);

// Route to get room details by code
router.get('/lobby/:roomId/:id', (req, res, next) => {
  console.log(`Received request for room code: ${req.params.code}, player id: ${req.params.id}`);
  next();
}, playerController.getAllPlayers);

// GET room by roomId and userId
router.get('/room/:roomId/:userId', roomController.getRoomDetails)

// Delete a room by id 
router.delete('/endgame/:roomId',  (req, res, next) => {
  console.log(`Received request to delete room with code: ${req.params.roomId}`);
  next();
}, roomController.deleteRoomById)

// Delete player from the room using its id 
router.delete('/exitgame/:roomId/:playerId', (req, res, next) => {
  console.log(`Received request to remove player ${req.params.playerId} from room ${req.params.roomId}`);
  next();
}, roomController.removePlayerFromRoom);

// Route to start the game
router.post('/startgame/:roomId/:playerId',  (req, res, next) => {
  console.log(`Received request to start game by player ${req.params.playerId} from room ${req.params.roomId}`);
  next();
}, roomController.startGame);

//Route to set a target set by mafia 
router.post('/night-action/mafia/:roomId/:userId',(req, res, next) => {
  console.log(`Received Mafia request for room code: ${req.params.roomId}, player id: ${req.params.userId}`);
  next();
}, gameController.handleNightActionMafia);

//Route to get the guess of the police 
router.post('/night-action/police/:roomId/:userId',(req, res, next) => {
  console.log(`Received police request for room code: ${req.params.roomId}, player id: ${req.params.userId}`);
  next();
}, gameController.handleNightActionPolice);

// New routes for nomination and voting
 router.post('/nominate/:roomId', gameController.handleNomination);

 router.post('/vote/:roomId',  (req, res, next) => {
  console.log(`Received request to start vote room with code: ${req.params.roomId}`);
  next();
}, gameController.handleVote);



module.exports = router;
