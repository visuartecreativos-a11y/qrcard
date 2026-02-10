const Joi = require('joi');

const positionSchema = Joi.object({
  x: Joi.string().pattern(/^\d+(\.\d+)?(mm|px|%)?$/).required(),
  y: Joi.string().pattern(/^\d+(\.\d+)?(mm|px|%)?$/).required()
});

const styleSchema = Joi.object({
  font: Joi.string(),
  size: Joi.string().pattern(/^\d+(pt|px|mm)?$/),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  bgColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  align: Joi.string().valid('left', 'center', 'right', 'start', 'end'),
  baseline: Joi.string().valid('top', 'middle', 'bottom', 'alphabetic'),
  weight: Joi.string().valid('normal', 'bold', 'lighter', 'bolder')
}).unknown(true);

const elementSchema = Joi.object({
  type: Joi.string().valid('qr', 'text', 'image', 'line').required(),
  field: Joi.string().when('type', {
    is: Joi.valid('text', 'image'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  position: positionSchema.required(),
  size: Joi.string().pattern(/^\d+(\.\d+)?(mm|px)?$/),
  width: Joi.string().pattern(/^\d+(\.\d+)?(mm|px)?$/),
  height: Joi.string().pattern(/^\d+(\.\d+)?(mm|px)?$/),
  length: Joi.number(),
  orientation: Joi.string().valid('horizontal', 'vertical'),
  fallback: Joi.string(),
  style: styleSchema,
  link: Joi.string()
});

const layoutSchema = Joi.object({
  type: Joi.string().valid('grid', 'absolute', 'flex').default('absolute'),
  width: Joi.string().pattern(/^\d+(\.\d+)?mm$/).required(),
  height: Joi.string().pattern(/^\d+(\.\d+)?mm$/).required(),
  bleed: Joi.string().pattern(/^\d+(\.\d+)?mm$/).default('3mm'),
  get totalWidth() { return this.width; },
  get totalHeight() { return this.height; }
});

const typographySchema = Joi.object({
  primary: Joi.string().default('Arial'),
  secondary: Joi.string(),
  fallback: Joi.array().items(Joi.string()).default(['Arial', 'sans-serif'])
});

const templateSchema = Joi.object({
  id: Joi.string().alphanum().min(3).max(50).required(),
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).default('1.0.0'),
  author: Joi.string().optional(),
  layout: layoutSchema.required(),
  elements: Joi.array().items(elementSchema).min(1).required(),
  styles: Joi.object({
    background: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    textColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    gradient: Joi.object({
      type: Joi.string().valid('linear', 'radial'),
      colors: Joi.array().items(Joi.string()).min(2),
      angle: Joi.number()
    }),
    pattern: Joi.object({
      type: Joi.string(),
      color: Joi.string()
    }),
    typography: typographySchema
  }).unknown(true)
}).unknown(true);

const validateTemplate = (req, res, next) => {
  const { error, value } = templateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Estructura de plantilla inválida',
      errors
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateTemplate,
  templateSchema
};
