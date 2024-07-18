const express = require('express');
//const { startGame, processNightActions, processDayActions } = require('../controllers/gameController');
const { handleNightAction } = require('../controllers/gameController');
const router = express.Router();

//router.post('/start/:roomId', startGame);
//router.post('/night/:roomId', processNightActions);
//router.post('/day/:roomId', processDayActions);

router.post('/night-action/:roomId/:userId',(req, res, next) => {
    console.log(`Received request for room code: ${req.params.code}, player id: ${req.params.id}`);
    next();
  }, handleNightAction);

module.exports = router;

