const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Dynamic imports for ESM modules
async function loadChalk() {
  return (await import('chalk')).default;
}

async function loadOra() {
  return (await import('ora')).default;
}

async function generate(options, command) {
  const chalk = await loadChalk();
  const ora = await loadOra();
  const spinner = ora('Generando tarjeta...').start();

  
  try {
    // Get global options
    const globalOpts = command.optsWithGlobals ? command.optsWithGlobals() : {};
    const apiUrl = globalOpts.apiUrl || 'http://localhost:3000';
    
    // Validate phone format
    const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
    if (!phoneRegex.test(options.phone)) {
      spinner.fail(chalk.red('Teléfono inválido. Use formato internacional: +34600123456'));
      process.exit(1);
    }
    
    // Prepare card data
    const cardData = {
      name: options.name,
      phone: options.phone,
      company: options.company || '',
      position: options.position || '',
      email: options.email || '',
      template: options.template,
      format: options.format,
      options: {
        dpi: parseInt(options.dpi) || 300
      }
    };
    
    // Handle logo if provided
    if (options.logo) {
      if (!await fs.pathExists(options.logo)) {
        spinner.fail(chalk.red(`Logo no encontrado: ${options.logo}`));
        process.exit(1);
      }
      
      const logoBuffer = await fs.readFile(options.logo);
      const logoBase64 = logoBuffer.toString('base64');
      cardData.logo = `data:image/${path.extname(options.logo).slice(1)};base64,${logoBase64}`;
    }
    
    spinner.text = 'Enviando datos al servidor...';
    
    // Call API
    const response = await axios.post(`${apiUrl}/api/v1/cards/generate`, cardData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error desconocido del servidor');
    }
    
    const { downloadUrl, fileSize, dimensions } = response.data.data;
    
    spinner.text = 'Descargando archivo...';
    
    // Download the generated file
    const fileResponse = await axios.get(`${apiUrl}${downloadUrl}`, {
      responseType: 'arraybuffer',
      timeout: 60000
    });
    
    // Ensure output directory exists
    const outputDir = path.dirname(options.output);
    await fs.ensureDir(outputDir);
    
    // Write file
    await fs.writeFile(options.output, Buffer.from(fileResponse.data));
    
    spinner.succeed(chalk.green('¡Tarjeta generada exitosamente!'));
    
    // Output summary
    console.log('');
    console.log(chalk.cyan('Resumen:'));
    console.log(`  📄 Archivo: ${chalk.white(options.output)}`);
    console.log(`  📏 Dimensiones: ${chalk.white(`${dimensions.width}x${dimensions.height}${dimensions.unit}`)}`);
    console.log(`  💾 Tamaño: ${chalk.white(formatBytes(fileSize))}`);
    console.log(`  🎨 Plantilla: ${chalk.white(options.template)}`);
    console.log(`  📱 Teléfono: ${chalk.white(options.phone)}`);
    console.log('');
    
  } catch (error) {
    spinner.fail(chalk.red('Error generando tarjeta'));
    
    if (error.response) {
      // API error
      console.error(chalk.red(`  API Error: ${error.response.status}`));
      if (error.response.data && error.response.data.error) {
        console.error(chalk.red(`  Mensaje: ${error.response.data.error}`));
      }
      if (error.response.data && error.response.data.errors) {
        console.error(chalk.yellow('  Detalles:'));
        error.response.data.errors.forEach(err => {
          console.error(chalk.yellow(`    - ${err.field}: ${err.message}`));
        });
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error(chalk.red('  No se pudo conectar al servidor. ¿Está corriendo el backend?'));
      console.error(chalk.yellow(`  URL intentada: ${error.config?.url || 'desconocida'}`));
    } else {
      console.error(chalk.red(`  ${error.message}`));
    }
    
    process.exit(1);
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = generate;
