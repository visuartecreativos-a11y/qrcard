const express = require('express');
const router = express.Router();
const CardRenderer = require('../../core/engine/CardRenderer');
const TemplateManager = require('../../core/templates/TemplateManager');
const QRGenerator = require('../../core/engine/QRGenerator');

// POST /api/v1/render/preview - Renderizar preview en tiempo real
router.post('/preview', async (req, res, next) => {
  try {
    const { 
      name, 
      phone, 
      company, 
      position,
      template: templateId = 'minimalista',
      logo
    } = req.body;

    // Validar teléfono
    try {
      QRGenerator.validateAndFormatPhone(phone);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Cargar template
    let template;
    try {
      template = await TemplateManager.loadTemplate(templateId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `Plantilla '${templateId}' no encontrada`
      });
    }

    const cardData = {
      name: name || '',
      phone: phone || '',
      company: company || '',
      position: position || '',
      logo: logo || null
    };

    // Generar preview (96 DPI para velocidad)
    const buffer = await CardRenderer.generatePreview(cardData, template);
    
    // Enviar como imagen directa
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=300'); // Cache 5 min
    res.send(buffer);

  } catch (error) {
    next(error);
  }
});

// POST /api/v1/render/print - Renderizar alta calidad
router.post('/print', async (req, res, next) => {
  try {
    const { 
      name, 
      phone, 
      company, 
      position,
      email,
      template: templateId = 'minimalista',
      logo,
      format = 'png',
      dpi = 300
    } = req.body;

    // Validar teléfono
    try {
      QRGenerator.validateAndFormatPhone(phone);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Cargar template
    let template;
    try {
      template = await TemplateManager.loadTemplate(templateId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `Plantilla '${templateId}' no encontrada`
      });
    }

    const cardData = {
      name: name || '',
      phone: phone || '',
      company: company || '',
      position: position || '',
      email: email || '',
      logo: logo || null
    };

    // Generar a alta calidad
    const buffer = await CardRenderer.generatePrint(cardData, template, format, dpi);
    
    // Set headers según formato
    const mimeTypes = {
      'png': 'image/png',
      'jpeg': 'image/jpeg',
      'pdf': 'application/pdf',
      'svg': 'image/svg+xml'
    };

    res.set('Content-Type', mimeTypes[format] || 'image/png');
    res.set('Content-Disposition', `attachment; filename="tarjeta-${name.replace(/\s+/g, '-').toLowerCase()}.${format}"`);
    res.send(buffer);

  } catch (error) {
    next(error);
  }
});

module.exports = router;
