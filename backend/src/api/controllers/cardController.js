const CardRenderer = require('../../core/engine/CardRenderer');
const TemplateManager = require('../../core/templates/TemplateManager');
const QRGenerator = require('../../core/engine/QRGenerator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class CardController {
  async generate(req, res, next) {
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
        options = {}
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

      // Preparar datos
      const cardData = {
        name: name || '',
        phone: phone || '',
        company: company || '',
        position: position || '',
        email: email || '',
        logo: logo || null
      };

      // Generar tarjeta
      console.log('[CardController] Generating card...');
      const buffer = await CardRenderer.generatePrint(cardData, template, format);
      console.log(`[CardController] Buffer generated: ${buffer.length} bytes`);
      
      // Guardar temporalmente
      const fileId = uuidv4();
      const fileName = `card-${fileId}.${format}`;
      const exportsPath = path.join(__dirname, '../../../public/exports');
      
      console.log(`[CardController] Saving to: ${exportsPath}/${fileName}`);
      
      try {
        await fs.mkdir(exportsPath, { recursive: true });
        console.log('[CardController] Directory created/verified');
      } catch (err) {
        console.error('[CardController] Error creating directory:', err);
      }
      
      try {
        await fs.writeFile(path.join(exportsPath, fileName), buffer);
        console.log('[CardController] File written successfully');
      } catch (err) {
        console.error('[CardController] Error writing file:', err);
        throw err;
      }


      // Generar URL de descarga
      const downloadUrl = `/public/exports/${fileName}`;

      res.json({
        success: true,
        data: {
          id: fileId,
          downloadUrl,
          format,
          dimensions: {
            width: template.layout.width,
            height: template.layout.height,
            unit: 'mm'
          },
          fileSize: buffer.length,
          expiresIn: '24h'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async preview(req, res, next) {
    try {
      const { 
        name, 
        phone, 
        company, 
        position,
        template: templateId = 'minimalista',
        logo
      } = req.body;

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

      // Generar preview (96 DPI)
      const buffer = await CardRenderer.generatePreview(cardData, template);
      
      // Convertir a base64 para mostrar directamente
      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      res.json({
        success: true,
        data: {
          preview: dataUrl,
          template: templateId,
          dimensions: {
            width: template.layout.width,
            height: template.layout.height,
            unit: 'mm'
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async validate(req, res, next) {
    try {
      const { phone, name, template: templateId } = req.body;
      const errors = [];

      // Validar nombre
      if (!name || name.trim().length < 2) {
        errors.push({
          field: 'name',
          message: 'El nombre debe tener al menos 2 caracteres'
        });
      }

      // Validar teléfono
      if (!phone) {
        errors.push({
          field: 'phone',
          message: 'El teléfono es obligatorio'
        });
      } else {
        try {
          QRGenerator.validateAndFormatPhone(phone);
        } catch (error) {
          errors.push({
            field: 'phone',
            message: error.message
          });
        }
      }

      // Validar template si se proporciona
      if (templateId) {
        try {
          await TemplateManager.loadTemplate(templateId);
        } catch (error) {
          errors.push({
            field: 'template',
            message: `Plantilla '${templateId}' no encontrada`
          });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          valid: false,
          errors
        });
      }

      res.json({
        success: true,
        valid: true,
        message: 'Datos válidos'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CardController();
