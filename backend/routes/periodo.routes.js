const express = require('express');
const router = express.Router();
const periodoController = require('../controllers/periodo.controller');

// ========== RUTAS DE PERÍODOS DE LECTURA ==========

/**
 * @route   GET /api/club/:clubId/estado-actual
 * @desc    Obtener estado actual del club (VOTACION, LEYENDO, INACTIVO)
 * @access  Miembros del club
 */
router.get('/club/:clubId/estado-actual', periodoController.obtenerEstadoActual);

/**
 * @route   POST /api/club/:clubId/periodos
 * @desc    Crear nuevo período de lectura con votación
 * @access  OWNER/MODERADOR
 */
router.post('/club/:clubId/periodos', periodoController.crearPeriodo);

/**
 * @route   POST /api/periodo/:periodoId/votar
 * @desc    Votar por una opción en un período
 * @access  Miembros del club
 */
router.post('/periodo/:periodoId/votar', periodoController.votar);

/**
 * @route   PUT /api/periodo/:periodoId/cerrar-votacion
 * @desc    Cerrar votación y determinar libro ganador
 * @access  OWNER/MODERADOR
 */
router.put('/periodo/:periodoId/cerrar-votacion', periodoController.cerrarVotacion);

/**
 * @route   PUT /api/periodo/:periodoId/concluir-lectura
 * @desc    Concluir período de lectura
 * @access  OWNER/MODERADOR
 */
router.put('/periodo/:periodoId/concluir-lectura', periodoController.concluirLectura);

/**
 * @route   GET /api/club/:clubId/periodos/historial
 * @desc    Obtener historial de períodos completados
 * @access  Miembros del club
 */
router.get('/club/:clubId/periodos/historial', periodoController.obtenerHistorial);

module.exports = router;