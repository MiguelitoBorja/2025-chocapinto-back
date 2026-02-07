const express = require("express");
const router = express.Router();
const sesionController = require("../controllers/sesion.controller");
const { authenticateUser } = require('../middleware/userAuth.middleware');

// Crear sesión (solo moderadores/owner)
router.post("/", authenticateUser, sesionController.crearSesion);

// Obtener sesiones de un club
router.get("/club/:clubId", authenticateUser, sesionController.obtenerSesionesClub);

// Obtener sesión específica
router.get("/:sesionId", authenticateUser, sesionController.obtenerSesion);

// Confirmar asistencia
router.post("/:sesionId/confirmar", authenticateUser, sesionController.confirmarAsistencia);

// Registrar asistencia real (solo moderadores/owner)
router.post("/:sesionId/asistencia", authenticateUser, sesionController.registrarAsistenciaReal);

// Obtener próximas sesiones del usuario
router.get("/usuario/proximas", authenticateUser, sesionController.obtenerProximasSesionesUsuario);

// Actualizar sesión (solo moderadores/owner)
router.put("/:sesionId", authenticateUser, sesionController.actualizarSesion);

// Eliminar sesión (solo moderadores/owner)
router.delete("/:sesionId", authenticateUser, sesionController.eliminarSesion);

module.exports = router;
