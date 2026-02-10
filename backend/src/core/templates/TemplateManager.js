const fs = require('fs').promises;
const path = require('path');
const config = require('../../config/server');

class TemplateManager {
  constructor() {
    this.templatesPath = config.templatesPath;
    this.systemTemplatesPath = path.join(this.templatesPath, 'system');
    this.customTemplatesPath = path.join(this.templatesPath, 'custom');
    this.cache = new Map();
  }

  async loadTemplate(id) {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    // Try system templates first
    let templatePath = path.join(this.systemTemplatesPath, `${id}.json`);
    
    try {
      const data = await fs.readFile(templatePath, 'utf8');
      const template = JSON.parse(data);
      this.cache.set(id, template);
      return template;
    } catch (err) {
      // Try custom templates
      templatePath = path.join(this.customTemplatesPath, `${id}.json`);
      const data = await fs.readFile(templatePath, 'utf8');
      const template = JSON.parse(data);
      this.cache.set(id, template);
      return template;
    }
  }

  async listTemplates() {
    const templates = [];
    
    // Load system templates
    try {
      const systemFiles = await fs.readdir(this.systemTemplatesPath);
      for (const file of systemFiles.filter(f => f.endsWith('.json'))) {
        const id = path.basename(file, '.json');
        const template = await this.loadTemplate(id);
        templates.push({
          id,
          name: template.name,
          type: 'system',
          version: template.version,
          description: template.description
        });
      }
    } catch (err) {
      console.error('Error loading system templates:', err);
    }

    // Load custom templates
    try {
      const customFiles = await fs.readdir(this.customTemplatesPath);
      for (const file of customFiles.filter(f => f.endsWith('.json'))) {
        const id = path.basename(file, '.json');
        const template = await this.loadTemplate(id);
        templates.push({
          id,
          name: template.name,
          type: 'custom',
          version: template.version,
          description: template.description
        });
      }
    } catch (err) {
      // Custom folder might not exist yet
    }

    return templates;
  }

  async saveTemplate(id, templateData) {
    await fs.mkdir(this.customTemplatesPath, { recursive: true });
    
    const templatePath = path.join(this.customTemplatesPath, `${id}.json`);
    const data = JSON.stringify(templateData, null, 2);
    
    await fs.writeFile(templatePath, data, 'utf8');
    this.cache.set(id, templateData);
    
    return { id, ...templateData };
  }

  async deleteTemplate(id) {
    const templatePath = path.join(this.customTemplatesPath, `${id}.json`);
    await fs.unlink(templatePath);
    this.cache.delete(id);
    return { deleted: true, id };
  }

  validateTemplate(template) {
    const required = ['id', 'name', 'version', 'layout', 'elements'];
    const missing = required.filter(field => !template[field]);
    
    if (missing.length > 0) {
      throw new Error(`Template inválido. Campos faltantes: ${missing.join(', ')}`);
    }

    // Validate layout
    if (!template.layout.width || !template.layout.height) {
      throw new Error('Template debe especificar layout.width y layout.height');
    }

    // Validate elements
    if (!Array.isArray(template.elements) || template.elements.length === 0) {
      throw new Error('Template debe tener al menos un elemento');
    }

    return true;
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new TemplateManager();
