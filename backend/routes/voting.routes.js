const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/voting.controller');

router.get('/clubs/:clubId/voting', ctrl.getCurrentVoting);

// Crear nueva votacion
router.post('/clubs/:clubId/voting', ctrl.createVoting);

// Votar o cambiar voto
router.put('/clubs/:clubId/voting/vote', ctrl.castVote);

// Cerrar votacion
router.patch('/clubs/:clubId/voting/close', ctrl.closeVoting);

// Historial
router.get('/clubs/:clubId/votings', ctrl.listVotings);

module.exports = router;
