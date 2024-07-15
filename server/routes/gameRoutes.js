const express = require('express');
const { startGame, processNightActions, processDayActions } = require('../controllers/gameController');

const router = express.Router();

router.post('/start/:roomId', startGame);
//router.post('/night/:roomId', processNightActions);
//router.post('/day/:roomId', processDayActions);

module.exports = router;

