const Joi = require('joi');

const cardSchema = Joi.object({
  name: Joi.string().min(2).max(100).required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre es obligatorio'
    }),
  
  phone: Joi.string().pattern(/^\+\d{1,3}\d{6,14}$/).required()
    .messages({
      'string.pattern.base': 'Teléfono inválido. Use formato internacional: +34600123456',
      'any.required': 'El teléfono es obligatorio'
    }),
  
  company: Joi.string().max(100).allow('').optional(),
  
  position: Joi.string().max(100).allow('').optional(),
  
  email: Joi.string().email().allow('').optional()
    .messages({
      'string.email': 'Email inválido'
    }),
  
  template: Joi.string().max(50).default('minimalista'),
  
  logo: Joi.string().base64().max(2 * 1024 * 1024).allow(null).optional()
    .messages({
      'string.base64': 'Logo debe ser base64 válido',
      'string.max': 'Logo demasiado grande (máx 2MB)'
    }),
  
  format: Joi.string().valid('png', 'jpeg', 'pdf', 'svg').default('png'),
  
  options: Joi.object({
    dpi: Joi.number().integer().min(72).max(600).default(300),
    quality: Joi.number().min(0.1).max(1).default(0.95)
  }).default({})
});

const validateCardData = (req, res, next) => {
  const { error, value } = cardSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Datos de tarjeta inválidos',
      errors
    });
  }

  // Reemplazar body con valores validados
  req.body = value;
  next();
};

module.exports = {
  validateCardData,
  cardSchema
};
