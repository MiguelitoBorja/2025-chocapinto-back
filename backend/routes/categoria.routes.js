// src/routes/categoria.routes.js
const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');
const { authenticateUser } = require('../middleware/userAuth.middleware');

// Rutas de categorías
router.get('/categorias', categoriaController.getCategorias);
router.post('/categorias', authenticateUser, categoriaController.createCategoria);
router.delete('/categorias/:id', authenticateUser, categoriaController.deleteCategoria);
router.put('/categorias/:id', authenticateUser, categoriaController.updateCategoria);

module.exports = router;