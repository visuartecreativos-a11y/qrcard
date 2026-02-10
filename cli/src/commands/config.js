const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Dynamic import for ESM module
async function loadChalk() {
  return (await import('chalk')).default;
}

const CONFIG_DIR = path.join(os.homedir(), '.qrcard');

const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:3000',
  defaultTemplate: 'minimalista',
  defaultFormat: 'png',
  defaultDpi: 300,
  language: 'es',
  timeout: 30000
};

async function config(options) {
  const chalk = await loadChalk();
  
  try {
    // Ensure config directory exists
    await fs.ensureDir(CONFIG_DIR);

    
    // Load current config
    let currentConfig = await loadConfig();
    
    if (options.reset) {
      await fs.writeJson(CONFIG_FILE, DEFAULT_CONFIG, { spaces: 2 });
      console.log(chalk.green('✅ Configuración restaurada a valores por defecto'));
      return;
    }
    
    if (options.list) {
      console.log(chalk.cyan('Configuración actual:'));
      console.log('');
      Object.entries(currentConfig).forEach(([key, value]) => {
        const isDefault = value === DEFAULT_CONFIG[key];
        const marker = isDefault ? chalk.gray('(default)') : chalk.yellow('(custom)');
        console.log(`  ${chalk.white(key.padEnd(20))} = ${chalk.cyan(value)} ${marker}`);
      });
      console.log('');
      console.log(chalk.gray(`Archivo: ${CONFIG_FILE}`));
      return;
    }
    
    if (options.get) {
      const value = currentConfig[options.get];
      if (value === undefined) {
        console.log(chalk.red(`Configuración '${options.get}' no existe`));
        console.log(chalk.yellow('Configuraciones disponibles:'));
        Object.keys(DEFAULT_CONFIG).forEach(key => console.log(`  - ${key}`));
      } else {
        console.log(chalk.cyan(`${options.get} = ${value}`));
      }
      return;
    }
    
    if (options.set) {
      const [key, value] = options.set.split('=');
      
      if (!key || value === undefined) {
        console.log(chalk.red('Formato inválido. Use: --set key=value'));
        process.exit(1);
      }
      
      if (!(key in DEFAULT_CONFIG)) {
        console.log(chalk.red(`Configuración '${key}' no válida`));
        console.log(chalk.yellow('Configuraciones disponibles:'));
        Object.keys(DEFAULT_CONFIG).forEach(k => console.log(`  - ${k}`));
        process.exit(1);
      }
      
      // Type conversion
      let typedValue = value;
      if (typeof DEFAULT_CONFIG[key] === 'number') {
        typedValue = parseInt(value, 10);
        if (isNaN(typedValue)) {
          console.log(chalk.red(`Valor numérico inválido: ${value}`));
          process.exit(1);
        }
      } else if (value === 'true') {
        typedValue = true;
      } else if (value === 'false') {
        typedValue = false;
      }
      
      currentConfig[key] = typedValue;
      await fs.writeJson(CONFIG_FILE, currentConfig, { spaces: 2 });
      
      console.log(chalk.green(`✅ ${key} = ${typedValue}`));
      return;
    }
    
    // No options provided, show help
    console.log(chalk.cyan('Uso: qrcard config [opciones]'));
    console.log('');
    console.log('Opciones:');
    console.log('  --list              Listar toda la configuración');
    console.log('  --get <key>         Obtener valor de configuración');
    console.log('  --set <key=value>   Establecer configuración');
    console.log('  --reset             Restaurar configuración por defecto');
    console.log('');
    console.log('Ejemplos:');
    console.log('  qrcard config --list');
    console.log('  qrcard config --get apiUrl');
    console.log('  qrcard config --set apiUrl=http://api.example.com');
    console.log('  qrcard config --set defaultTemplate=moderno');
    
  } catch (error) {
    const chalk = await loadChalk();
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}


async function loadConfig() {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const saved = await fs.readJson(CONFIG_FILE);
      return { ...DEFAULT_CONFIG, ...saved };
    }
  } catch (error) {
    // Ignore read errors, use defaults
  }
  return { ...DEFAULT_CONFIG };
}

async function getConfig() {
  return await loadConfig();
}

module.exports = config;
module.exports.getConfig = getConfig;
