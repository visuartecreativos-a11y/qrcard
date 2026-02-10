const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const config = require('../../config/server');


class QRGenerator {
  /**
   * Genera un código QR para WhatsApp
   * @param {string} phone - Número de teléfono internacional (ej: +34600123456)
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Buffer>} - Buffer PNG del QR
   */
  async generateWhatsAppQR(phone, options = {}) {
    // Validar y formatear teléfono
    const cleanPhone = this.validateAndFormatPhone(phone);
    const whatsappUrl = `https://wa.me/${cleanPhone}`;

    const qrOptions = {
      type: 'png',
      width: options.size || 500,
      margin: 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // Alta corrección para mejor legibilidad
    };

    try {
      const buffer = await QRCode.toBuffer(whatsappUrl, qrOptions);
      return {
        buffer,
        url: whatsappUrl,
        phone: cleanPhone,
        size: qrOptions.width
      };
    } catch (error) {
      throw new Error(`Error generando QR: ${error.message}`);
    }
  }

  /**
   * Genera QR con logo central (overlay)
   * @param {string} phone - Número de teléfono
   * @param {Buffer} logoBuffer - Buffer de imagen del logo
   * @param {Object} options - Opciones
   * @returns {Promise<Buffer>}
   */
  async generateQRWithLogo(phone, logoBuffer, options = {}) {
    const qrResult = await this.generateWhatsAppQR(phone, {

      ...options,
      size: 600 // Más grande para acomodar logo
    });

    const qrImage = await loadImage(qrResult.buffer);
    const canvas = createCanvas(qrImage.width, qrImage.height);
    const ctx = canvas.getContext('2d');

    // Dibujar QR
    ctx.drawImage(qrImage, 0, 0);

    // Dibujar logo centrado si se proporciona
    if (logoBuffer) {
      const logo = await loadImage(logoBuffer);
      const logoSize = Math.floor(qrImage.width * 0.2); // 20% del QR
      const x = (qrImage.width - logoSize) / 2;
      const y = (qrImage.height - logoSize) / 2;

      // Fondo blanco para el logo
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);

      // Dibujar logo
      ctx.drawImage(logo, x, y, logoSize, logoSize);
    }

    return canvas.toBuffer('image/png');
  }

  /**
   * Valida y formatea número de teléfono internacional
   * @param {string} phone - Número de teléfono
   * @returns {string} - Número limpio sin +
   */
  validateAndFormatPhone(phone) {
    // Remover espacios y caracteres no numéricos excepto +
    let clean = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
    
    // Asegurar que empieza con +
    if (!clean.startsWith('+')) {
      clean = '+' + clean;
    }

    // Validar formato internacional
    const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
    if (!phoneRegex.test(clean) || clean.length < 8 || clean.length > 16) {
      throw new Error('Número de teléfono inválido. Use formato internacional: +34600123456');
    }

    // Retornar sin el + para la URL de WhatsApp
    return clean.substring(1);
  }

  /**
   * Genera QR en formato SVG (vectorial)
   * @param {string} phone - Número de teléfono
   * @param {Object} options - Opciones
   * @returns {Promise<string>} - SVG string
   */
  async generateSVG(phone, options = {}) {
    const cleanPhone = this.validateAndFormatPhone(phone);
    const whatsappUrl = `https://wa.me/${cleanPhone}`;

    const svgOptions = {
      type: 'svg',
      width: options.width || 500,
      margin: 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      }
    };

    return await QRCode.toString(whatsappUrl, svgOptions);
  }
}

module.exports = new QRGenerator();
