const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { validateTemplate } = require('../validators/templateValidator');

// GET /api/v1/templates - Listar todas las plantillas
router.get('/', templateController.list);

// GET /api/v1/templates/:id - Obtener plantilla específica
router.get('/:id', templateController.get);

// POST /api/v1/templates - Crear nueva plantilla
router.post('/', validateTemplate, templateController.create);

// PUT /api/v1/templates/:id - Actualizar plantilla
router.put('/:id', validateTemplate, templateController.update);

// DELETE /api/v1/templates/:id - Eliminar plantilla
router.delete('/:id', templateController.remove);

module.exports = router;
