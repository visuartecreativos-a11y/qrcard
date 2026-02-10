const path = require('path');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  templatesPath: path.join(__dirname, '../../../templates'),
  exportsPath: path.join(__dirname, '../../../public/exports'),
  maxLogoSize: 1024 * 1024, // 1MB
  defaultDPI: 300,
  cardDimensions: {
    width: 85, // mm
    height: 55, // mm
    bleed: 3, // mm
    get totalWidth() { return this.width + (this.bleed * 2); },
    get totalHeight() { return this.height + (this.bleed * 2); }
  },
  formats: ['png', 'pdf', 'svg'],
  qrSize: 25 // mm
};
