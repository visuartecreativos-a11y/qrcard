#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('../package.json');

// Import commands
const generateCommand = require('../src/commands/generate');
const batchCommand = require('../src/commands/batch');
const templateCommand = require('../src/commands/template');
const configCommand = require('../src/commands/config');

// Dynamic import for chalk (ESM module)
let chalk;
async function loadChalk() {
  if (!chalk) {
    chalk = (await import('chalk')).default;
  }
  return chalk;
}


program
  .name('qrcard')
  .description('CLI para generar tarjetas de visita con QR de WhatsApp')
  .version(pkg.version, '-v, --version', 'Muestra la versión')
  .option('-c, --config <path>', 'Ruta al archivo de configuración')
  .option('--api-url <url>', 'URL del API backend', 'http://localhost:3000')
  .option('--verbose', 'Modo verbose con logs detallados');

// Generate command
program
  .command('generate')
  .alias('gen')
  .description('Generar una tarjeta individual')
  .requiredOption('-n, --name <name>', 'Nombre completo')
  .requiredOption('-p, --phone <phone>', 'Teléfono WhatsApp (formato internacional: +34600123456)')
  .option('-c, --company <company>', 'Nombre de empresa')
  .option('-t, --position <position>', 'Cargo/Posición')
  .option('-e, --email <email>', 'Correo electrónico')
  .option('-l, --logo <path>', 'Ruta al archivo de logo')
  .option('--template <id>', 'ID de plantilla a usar', 'minimalista')
  .option('-f, --format <format>', 'Formato de salida', 'png')
  .option('-o, --output <path>', 'Ruta de salida', './tarjeta-qr.png')
  .option('--dpi <dpi>', 'DPI para impresión', '300')
  .action(generateCommand);

// Batch command
program
  .command('batch <file>')
  .description('Generar múltiples tarjetas desde CSV/JSON')
  .option('-f, --format <format>', 'Formato de archivo de entrada (auto-detectado por defecto)')
  .option('-o, --output-dir <dir>', 'Directorio de salida', './output')
  .option('-j, --jobs <n>', 'Número de trabajos paralelos', '4')
  .option('--template <id>', 'Plantilla por defecto', 'minimalista')
  .action(batchCommand);

// Template commands
program
  .command('template <action>')
  .description('Gestionar plantillas (list, get, create, validate)')
  .option('-i, --id <id>', 'ID de plantilla')
  .option('-f, --file <path>', 'Archivo de plantilla JSON')
  .action(templateCommand);

// Config command
program
  .command('config')
  .description('Configurar CLI (API URL, defaults, etc.)')
  .option('--set <key=value>', 'Establecer configuración')
  .option('--get <key>', 'Obtener configuración')
  .option('--list', 'Listar toda la configuración')
  .option('--reset', 'Restaurar configuración por defecto')
  .action(configCommand);

// Error handling
program.on('command:*', async (operands) => {
  const c = await loadChalk();
  console.error(c.red(`Comando desconocido: ${operands[0]}`));
  console.log(c.yellow('Usa --help para ver los comandos disponibles'));
  process.exit(1);
});

program.on('--help', async () => {
  const c = await loadChalk();
  console.log('');
  console.log(c.cyan('Ejemplos:'));
  console.log('  $ qrcard generate -n "Juan Pérez" -p "+34600123456" -c "Mi Empresa"');
  console.log('  $ qrcard batch contactos.csv -o ./tarjetas/');
  console.log('  $ qrcard template list');
  console.log('  $ qrcard generate -n "Ana García" -p "+521234567890" --template moderno -f pdf');
  console.log('');
  console.log(c.cyan('Documentación:'));
  console.log('  https://github.com/qrcard/cli#readme');
});


// Parse arguments
program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
