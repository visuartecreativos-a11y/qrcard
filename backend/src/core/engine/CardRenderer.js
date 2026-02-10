const { createCanvas, loadImage } = require('@napi-rs/canvas');

const path = require('path');
const QRGenerator = require('./QRGenerator');
const config = require('../../config/server');

class CardRenderer {
  constructor() {
    this.dpi = config.defaultDPI;
    this.mmToPxFactor = this.dpi / 25.4; // 1 inch = 25.4mm
  }

  /**
   * Convierte milímetros a píxeles
   * @param {number} mm - Valor en milímetros
   * @returns {number} - Valor en píxeles
   */
  mmToPx(mm) {
    return Math.round(mm * this.mmToPxFactor);
  }


  /**
   * Parsea un valor de dimensión (puede incluir unidad como "mm")
   * @param {string|number} value - Valor a parsear
   * @returns {number} - Valor numérico en mm
   */
  parseDimension(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/^([\d.]+)\s*(mm|cm|px)?$/i);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = (match[2] || 'mm').toLowerCase();
        switch (unit) {
          case 'cm': return num * 10;
          case 'px': return num / (this.dpi / 25.4);
          default: return num; // mm
        }
      }
    }
    return parseFloat(value) || 0;
  }

  /**
   * Renderiza una tarjeta completa
   * @param {Object} data - Datos de la tarjeta
   * @param {Object} template - Template JSON
   * @param {Object} options - Opciones de renderizado
   * @returns {Promise<Buffer>} - Buffer PNG
   */
  async render(data, template, options = {}) {
    const { format = 'png', dpi = this.dpi } = options;
    
    // Calcular factor de conversión para el DPI solicitado
    const mmToPxFactor = dpi / 25.4;
    const mmToPx = (mm) => Math.round(this.parseDimension(mm) * mmToPxFactor);
    
    // Calcular dimensiones en píxeles
    const widthPx = mmToPx(template.layout.totalWidth);
    const heightPx = mmToPx(template.layout.totalHeight);
    
    console.log(`[CardRenderer] Rendering card: ${widthPx}x${heightPx}px at ${dpi}DPI`);
    console.log(`[CardRenderer] Template: ${template.id}, Elements: ${template.elements?.length || 0}`);





    // Crear canvas
    const canvas = createCanvas(widthPx, heightPx);
    const ctx = canvas.getContext('2d');

    // Fondo
    await this.renderBackground(ctx, template, widthPx, heightPx);

    // Renderizar cada elemento (pasar mmToPx function)
    let renderedCount = 0;
    for (const element of template.elements) {
      try {
        await this.renderElement(ctx, element, data, template, mmToPx);
        renderedCount++;
      } catch (err) {
        console.error(`[CardRenderer] Error rendering element ${element.type}:`, err.message);
      }
    }
    
    console.log(`[CardRenderer] Rendered ${renderedCount}/${template.elements?.length || 0} elements`);

    // Exportar según formato
    let buffer;
    switch (format) {
      case 'png':
        buffer = canvas.toBuffer('image/png');
        break;
      case 'jpeg':
        buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
        break;
      default:
        throw new Error(`Formato no soportado: ${format}`);
    }
    
    console.log(`[CardRenderer] Generated buffer: ${buffer.length} bytes`);
    return buffer;
  }


  /**
   * Renderiza el fondo de la tarjeta
   */
  async renderBackground(ctx, template, width, height) {
    const { layout, styles } = template;

    // Color de fondo
    ctx.fillStyle = styles?.background || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Gradiente si está definido
    if (styles?.gradient) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      styles.gradient.colors.forEach((color, index) => {
        gradient.addColorStop(index / (styles.gradient.colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Patrón de fondo si está definido
    if (styles?.pattern) {
      // Implementación básica de patrones
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = styles.pattern.color || '#000000';
      
      for (let x = 0; x < width; x += 20) {
        for (let y = 0; y < height; y += 20) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  /**
   * Renderiza un elemento individual
   */
  async renderElement(ctx, element, data, template, mmToPx = this.mmToPx.bind(this)) {
    const { type, position, style = {} } = element;
    
    // Convertir posición mm a píxeles
    const x = position.x ? mmToPx(position.x) : 0;
    const y = position.y ? mmToPx(position.y) : 0;


    switch (type) {
      case 'qr':
        await this.renderQR(ctx, element, data, x, y);
        break;
      case 'text':
        this.renderText(ctx, element, data, x, y, template);
        break;
      case 'image':
        await this.renderImage(ctx, element, data, x, y);
        break;
      case 'line':
        this.renderLine(ctx, element, x, y);
        break;
      default:
        console.warn(`Tipo de elemento desconocido: ${type}`);
    }
  }

  /**
   * Renderiza código QR
   */
  async renderQR(ctx, element, data, x, y, mmToPx = this.mmToPx.bind(this)) {
    const phone = data.phone;
    if (!phone) return;

    const size = element.size ? mmToPx(element.size) : mmToPx(25);

    
    try {
      const qrBuffer = await QRGenerator.generateWhatsAppQR(phone, {
        size: Math.round(size),
        darkColor: element.style?.color || '#000000',
        lightColor: element.style?.bgColor || '#FFFFFF'
      });

      const qrImage = await loadImage(qrBuffer.buffer);
      ctx.drawImage(qrImage, x, y, size, size);
    } catch (error) {
      console.error('Error renderizando QR:', error);
      // Dibujar placeholder
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(x, y, size, size);
    }
  }

  /**
   * Renderiza texto
   */
  renderText(ctx, element, data, x, y, template) {
    const { field, fallback, style = {} } = element;
    const text = data[field] || fallback || '';

    if (!text) return;

    // Configurar fuente
    const fontFamily = style.font || template.styles?.typography?.primary || 'Arial';
    const fontSize = style.size ? parseInt(style.size) : 14;
    const fontWeight = style.weight || 'normal';
    ctx.font = `${fontWeight} ${fontSize}pt "${fontFamily}"`;
    
    // Color
    ctx.fillStyle = style.color || template.styles?.textColor || '#333333';
    
    // Alineación
    ctx.textAlign = style.align || 'left';
    ctx.textBaseline = style.baseline || 'top';

    // Dibujar texto
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    
    lines.forEach((line, index) => {
      const offsetY = y + (index * lineHeight);
      ctx.fillText(line, x, offsetY);
    });
  }

  /**
   * Renderiza imagen (logo)
   */
  async renderImage(ctx, element, data, x, y, mmToPx = this.mmToPx.bind(this)) {
    const imageData = data[element.field];
    if (!imageData) return;

    const width = element.width ? mmToPx(element.width) : 50;
    const height = element.height ? mmToPx(element.height) : 50;


    try {
      const image = await loadImage(imageData);
      ctx.drawImage(image, x, y, width, height);
    } catch (error) {
      console.error('Error cargando imagen:', error);
    }
  }

  /**
   * Renderiza línea decorativa
   */
  renderLine(ctx, element, x, y, mmToPx = this.mmToPx.bind(this)) {
    const { length = 50, style = {} } = element;
    const lengthPx = mmToPx(length);

    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (element.orientation === 'vertical') {
      ctx.lineTo(x, y + lengthPx);
    } else {
      ctx.lineTo(x + lengthPx, y);
    }
    
    ctx.strokeStyle = style.color || '#000000';
    ctx.lineWidth = style.width || 1;
    ctx.stroke();
  }

  /**
   * Genera preview de baja resolución
   */
  async generatePreview(data, template) {
    return this.render(data, template, { dpi: 96, format: 'png' });
  }

  /**
   * Genera impresión de alta calidad
   */
  async generatePrint(data, template, format = 'png') {
    return this.render(data, template, { dpi: 300, format });
  }
}

module.exports = new CardRenderer();
