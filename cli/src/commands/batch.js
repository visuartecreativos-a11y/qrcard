const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const csv = require('csv-parser');
const { glob } = require('glob');

// Dynamic imports for ESM modules
async function loadChalk() {
  return (await import('chalk')).default;
}

async function loadOra() {
  return (await import('ora')).default;
}

async function batch(inputFile, options, command) {
  const chalk = await loadChalk();
  const ora = await loadOra();
  const spinner = ora('Procesando archivo batch...').start();

  
  try {
    // Get global options
    const globalOpts = command.optsWithGlobals ? command.optsWithGlobals() : {};
    const apiUrl = globalOpts.apiUrl || 'http://localhost:3000';
    
    // Validate input file exists
    if (!await fs.pathExists(inputFile)) {
      spinner.fail(chalk.red(`Archivo no encontrado: ${inputFile}`));
      process.exit(1);
    }
    
    // Detect format
    const ext = path.extname(inputFile).toLowerCase();
    const format = options.format || (ext === '.csv' ? 'csv' : ext === '.json' ? 'json' : null);
    
    if (!format) {
      spinner.fail(chalk.red('Formato de archivo no reconocido. Use --format csv|json'));
      process.exit(1);
    }
    
    // Parse input file
    let contacts = [];
    
    if (format === 'csv') {
      contacts = await parseCSV(inputFile);
    } else if (format === 'json') {
      const data = await fs.readJson(inputFile);
      contacts = Array.isArray(data) ? data : [data];
    }
    
    if (contacts.length === 0) {
      spinner.fail(chalk.red('No se encontraron contactos en el archivo'));
      process.exit(1);
    }
    
    spinner.succeed(chalk.green(`Encontrados ${contacts.length} contactos`));
    
    // Ensure output directory
    await fs.ensureDir(options.outputDir);
    
    // Process in parallel with concurrency limit
    const concurrency = parseInt(options.jobs) || 4;
    const results = { success: [], failed: [] };
    
    console.log(chalk.cyan(`\nProcesando con ${concurrency} trabajos paralelos...\n`));
    
    // Process batches
    for (let i = 0; i < contacts.length; i += concurrency) {
      const batch = contacts.slice(i, i + concurrency);
      const batchPromises = batch.map((contact, index) => 
        processContact(contact, i + index, contacts.length, apiUrl, options, results)
      );
      
      await Promise.all(batchPromises);
    }
    
    // Summary
    console.log('');
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.cyan('Resumen del procesamiento:'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(`  ✅ Exitosos: ${chalk.green(results.success.length)}`);
    console.log(`  ❌ Fallidos: ${chalk.red(results.failed.length)}`);
    console.log(`  📁 Directorio: ${chalk.white(options.outputDir)}`);
    console.log(chalk.cyan('═'.repeat(50)));
    
    // List failed if any
    if (results.failed.length > 0) {
      console.log(chalk.yellow('\nContactos fallidos:'));
      results.failed.forEach(f => {
        console.log(chalk.yellow(`  - ${f.name}: ${f.error}`));
      });
    }
    
    // Exit with error code if any failed
    if (results.failed.length > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Error en procesamiento batch'));
    console.error(chalk.red(`  ${error.message}`));
    process.exit(1);
  }
}

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function processContact(contact, index, total, apiUrl, options, results) {
  const chalk = await loadChalk();
  const num = index + 1;
  const name = contact.name || contact.nombre || `contacto-${num}`;
  
  try {

    // Validate required fields
    if (!contact.phone && !contact.telefono && !contact.movil) {
      throw new Error('Teléfono no proporcionado');
    }
    
    const phone = contact.phone || contact.telefono || contact.movil;
    
    // Validate phone format
    const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Formato de teléfono inválido');
    }
    
    // Prepare data
    const cardData = {
      name: name,
      phone: phone,
      company: contact.company || contact.empresa || '',
      position: contact.position || contact.cargo || '',
      email: contact.email || contact.correo || '',
      template: contact.template || options.template,
      format: contact.format || 'png',
      options: { dpi: 300 }
    };
    
    // Call API
    const response = await axios.post(`${apiUrl}/api/v1/cards/generate`, cardData, {
      timeout: 30000
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error del servidor');
    }
    
    const { downloadUrl } = response.data.data;
    
    // Download file
    const fileResponse = await axios.get(`${apiUrl}${downloadUrl}`, {
      responseType: 'arraybuffer',
      timeout: 60000
    });
    
    // Generate safe filename
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputPath = path.join(options.outputDir, `tarjeta-${safeName}-${num}.png`);
    
    await fs.writeFile(outputPath, Buffer.from(fileResponse.data));
    
    console.log(chalk.green(`  [${num}/${total}] ✅ ${name}`));
    results.success.push({ name, file: outputPath });
    
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.log(chalk.red(`  [${num}/${total}] ❌ ${name}: ${errorMsg}`));
    results.failed.push({ name, error: errorMsg });
  }
}

module.exports = batch;
