const TemplateManager = require('../../core/templates/TemplateManager');

class TemplateController {
  async list(req, res, next) {
    try {
      const templates = await TemplateManager.listTemplates();
      res.json({
        success: true,
        count: templates.length,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const template = await TemplateManager.loadTemplate(id);
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada'
        });
      }
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { id, ...templateData } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID de plantilla requerido'
        });
      }

      // Validar estructura
      TemplateManager.validateTemplate({ id, ...templateData });

      const template = await TemplateManager.saveTemplate(id, {
        id,
        ...templateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Plantilla creada exitosamente',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const templateData = req.body;

      // Verificar que existe
      await TemplateManager.loadTemplate(id);

      // Validar nueva estructura
      TemplateManager.validateTemplate({ id, ...templateData });

      const template = await TemplateManager.saveTemplate(id, {
        ...templateData,
        id,
        updatedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Plantilla actualizada exitosamente',
        data: template
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada'
        });
      }
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;

      // Solo permitir eliminar plantillas custom
      const templates = await TemplateManager.listTemplates();
      const template = templates.find(t => t.id === id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada'
        });
      }

      if (template.type === 'system') {
        return res.status(403).json({
          success: false,
          error: 'No se pueden eliminar plantillas del sistema'
        });
      }

      await TemplateManager.deleteTemplate(id);

      res.json({
        success: true,
        message: 'Plantilla eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TemplateController();
