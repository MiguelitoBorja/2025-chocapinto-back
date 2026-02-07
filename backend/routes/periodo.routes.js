const express = require('express');
const router = express.Router();
const periodoController = require('../controllers/periodo.controller');
const { authenticateUser } = require('../middleware/userAuth.middleware');

// ========== RUTAS DE PERÍODOS DE LECTURA ==========

/**
 * @route   GET /api/club/:clubId/estado-actual
 * @desc    Obtener estado actual del club (VOTACION, LEYENDO, INACTIVO)
 * @access  Miembros del club
 */
router.get('/club/:clubId/estado-actual', authenticateUser, periodoController.obtenerEstadoActual);

/**
 * @route   POST /api/club/:clubId/periodos
 * @desc    Crear nuevo período de lectura con votación
 * @access  OWNER/MODERADOR
 */
router.post('/club/:clubId/periodos', authenticateUser, periodoController.crearPeriodo);

/**
 * @route   POST /api/periodo/:periodoId/votar
 * @desc    Votar por una opción en un período
 * @access  Miembros del club
 */
router.post('/periodo/:periodoId/votar', authenticateUser, periodoController.votar);

/**
 * @route   PUT /api/periodo/:periodoId/cerrar-votacion
 * @desc    Cerrar votación y determinar libro ganador
 * @access  OWNER/MODERADOR
 */
router.put('/periodo/:periodoId/cerrar-votacion', authenticateUser, periodoController.cerrarVotacion);

/**
 * @route   PUT /api/periodo/:periodoId/concluir-lectura
 * @desc    Concluir período de lectura
 * @access  OWNER/MODERADOR
 */
router.put('/periodo/:periodoId/concluir-lectura', authenticateUser, periodoController.concluirLectura);

/**
 * @route   GET /api/club/:clubId/periodos/historial
 * @desc    Obtener historial de períodos completados
 * @access  Miembros del club
 */
router.get('/club/:clubId/periodos/historial', authenticateUser, periodoController.obtenerHistorial);

/**
 * @route   GET /api/club/:clubId/libros-debug
 * @desc    Debug: Ver libros disponibles en el club
 * @access  DEBUG
 */
router.get('/club/:clubId/libros-debug', authenticateUser, periodoController.debugLibrosClub);

module.exports = router;