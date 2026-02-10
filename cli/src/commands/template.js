const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Dynamic imports for ESM modules
async function loadChalk() {
  return (await import('chalk')).default;
}

async function loadOra() {
  return (await import('ora')).default;
}

async function template(action, options, command) {
  const chalk = await loadChalk();
  const ora = await loadOra();
  const spinner = ora().start();

  
  try {
    const globalOpts = command.optsWithGlobals ? command.optsWithGlobals() : {};
    const apiUrl = globalOpts.apiUrl || 'http://localhost:3000';
    
    switch (action) {
      case 'list':
        await listTemplates(spinner, apiUrl);
        break;
      case 'get':
        await getTemplate(spinner, apiUrl, options.id);
        break;
      case 'create':
        await createTemplate(spinner, apiUrl, options.file);
        break;
      case 'validate':
        await validateTemplate(spinner, options.file);
        break;
      default:
        spinner.fail(chalk.red(`Acción desconocida: ${action}`));
        console.log(chalk.yellow('Acciones disponibles: list, get, create, validate'));
        process.exit(1);
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Error'));
    console.error(chalk.red(`  ${error.message}`));
    process.exit(1);
  }
}

async function listTemplates(spinner, apiUrl) {
  const chalk = await loadChalk();
  spinner.text = 'Obteniendo plantillas...';

  
  const response = await axios.get(`${apiUrl}/api/v1/templates`, {
    timeout: 10000
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error);
  }
  
  const templates = response.data.data;
  
  spinner.succeed(chalk.green(`${templates.length} plantillas disponibles`));
  
  console.log('');
  console.log(chalk.cyan('Plantillas del sistema:'));
  console.log('');
  
  templates.forEach(t => {
    const type = t.type === 'system' ? chalk.blue('[SISTEMA]') : chalk.green('[CUSTOM]');
    console.log(`  ${type} ${chalk.white(t.id.padEnd(15))} ${chalk.gray(t.name)}`);
    if (t.description) {
      console.log(`      ${chalk.gray(t.description)}`);
    }
  });
}

async function getTemplate(spinner, apiUrl, id) {
  const chalk = await loadChalk();
  if (!id) {
    throw new Error('ID de plantilla requerido. Use -i, --id <id>');
  }
  
  spinner.text = `Obteniendo plantilla ${id}...`;

  
  const response = await axios.get(`${apiUrl}/api/v1/templates/${id}`, {
    timeout: 10000
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error);
  }
  
  const template = response.data.data;
  
  spinner.succeed(chalk.green(`Plantilla: ${template.name}`));
  
  console.log('');
  console.log(chalk.cyan('Detalles:'));
  console.log(`  ID: ${chalk.white(template.id)}`);
  console.log(`  Nombre: ${chalk.white(template.name)}`);
  console.log(`  Versión: ${chalk.white(template.version)}`);
  console.log(`  Autor: ${chalk.white(template.author || 'N/A')}`);
  console.log(`  Descripción: ${chalk.white(template.description || 'N/A')}`);
  console.log('');
  console.log(chalk.cyan('Layout:'));
  console.log(`  Tamaño: ${chalk.white(`${template.layout.width} x ${template.layout.height}`)}`);
  console.log(`  Bleed: ${chalk.white(template.layout.bleed)}`);
  console.log('');
  console.log(chalk.cyan(`Elementos (${template.elements.length}):`));
  template.elements.forEach((el, i) => {
    console.log(`  ${i + 1}. ${chalk.white(el.type.padEnd(10))} ${el.field || ''}`);
  });
}

async function createTemplate(spinner, apiUrl, filePath) {
  const chalk = await loadChalk();
  if (!filePath) {
    throw new Error('Archivo de plantilla requerido. Use -f, --file <path>');
  }
  
  if (!await fs.pathExists(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }
  
  spinner.text = 'Leyendo plantilla...';

  
  const template = await fs.readJson(filePath);
  
  spinner.text = 'Creando plantilla en el servidor...';
  
  const response = await axios.post(`${apiUrl}/api/v1/templates`, template, {
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error);
  }
  
  spinner.succeed(chalk.green(`Plantilla '${template.id}' creada exitosamente`));
}

async function validateTemplate(spinner, filePath) {
  const chalk = await loadChalk();
  if (!filePath) {
    throw new Error('Archivo de plantilla requerido. Use -f, --file <path>');
  }
  
  if (!await fs.pathExists(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }
  
  spinner.text = 'Validando estructura de plantilla...';

  
  const template = await fs.readJson(filePath);
  
  // Basic validation
  const required = ['id', 'name', 'layout', 'elements'];
  const missing = required.filter(field => !template[field]);
  
  if (missing.length > 0) {
    spinner.fail(chalk.red('Estructura inválida'));
    console.log(chalk.red(`  Campos faltantes: ${missing.join(', ')}`));
    process.exit(1);
  }
  
  // Validate layout
  if (!template.layout.width || !template.layout.height) {
    spinner.fail(chalk.red('Layout inválido: width y height requeridos'));
    process.exit(1);
  }
  
  // Validate elements
  if (!Array.isArray(template.elements) || template.elements.length === 0) {
    spinner.fail(chalk.red('Elements debe ser un array no vacío'));
    process.exit(1);
  }
  
  const validTypes = ['qr', 'text', 'image', 'line'];
  const invalidElements = template.elements.filter(el => !validTypes.includes(el.type));
  
  if (invalidElements.length > 0) {
    spinner.fail(chalk.red('Tipos de elemento inválidos'));
    console.log(chalk.red(`  Tipos válidos: ${validTypes.join(', ')}`));
    process.exit(1);
  }
  
  spinner.succeed(chalk.green('Estructura de plantilla válida'));
  
  console.log('');
  console.log(chalk.cyan('Resumen:'));
  console.log(`  ID: ${chalk.white(template.id)}`);
  console.log(`  Elementos: ${chalk.white(template.elements.length)}`);
  console.log(`  Tipos: ${chalk.white(template.elements.map(e => e.type).join(', '))}`);
}

module.exports = template;
