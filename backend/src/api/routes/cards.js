const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { validateCardData } = require('../validators/cardValidator');

// POST /api/v1/cards/generate - Generar tarjeta completa
router.post('/generate', validateCardData, cardController.generate);

// POST /api/v1/cards/preview - Generar preview (baja resolución)
router.post('/preview', validateCardData, cardController.preview);

// POST /api/v1/cards/validate - Validar datos sin generar
router.post('/validate', cardController.validate);

module.exports = router;
