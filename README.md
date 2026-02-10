# QRCard Engine 🚀

Motor profesional de generación de tarjetas de visita con QR de WhatsApp. Arquitectura completa con API backend, CLI y frontend.

## Características

- ✅ **5 Estilos de Tarjeta**: Minimalista, Moderno, Elegante, Creativo, Profesional
- ✅ **Exportación Profesional**: PNG, JPEG, PDF, SVG a 300 DPI
- ✅ **Sistema de Plantillas JSON**: Configurable como PrestaShop
- ✅ **CLI Completo**: Generación individual y batch desde CSV/JSON
- ✅ **API REST**: Endpoints para integración con cualquier frontend
- ✅ **Validación Internacional**: Soporte para España, LATAM, USA (+34, +52, +1)
- ✅ **Logo Overlay**: Soporta logos personalizados en QR
- ✅ **Seguridad**: Helmet, CORS, Rate Limiting, CSP

## Arquitectura

```
qrcard/
├── backend/           # API Node.js + Express
│   ├── src/
│   │   ├── api/      # Routes, Controllers, Validators
│   │   ├── core/     # Engine (QR, Renderer, Templates)
│   │   └── config/   # Configuración
│   └── package.json
├── cli/              # CLI para generación batch
│   ├── src/commands/ # generate, batch, template, config
│   └── package.json
├── frontend/         # (Pendiente implementación)
├── templates/        # Plantillas del sistema
│   └── system/       # 5 plantillas predefinidas
└── public/           # Archivos generados
```

## Instalación Rápida

```bash
# Instalar todas las dependencias
npm run setup

# O manualmente:
npm install
cd backend && npm install
cd ../cli && npm install
```

## Uso

### 1. Iniciar Backend

```bash
npm run dev:backend
# o
cd backend && npm run dev
```

API disponible en: `http://localhost:3001`

### 2. Usar CLI

```bash
# Generar tarjeta individual
npm run cli -- generate -n "Juan Pérez" -p "+34600123456" -c "Mi Empresa"

# O desde el directorio cli
cd cli && node bin/qrcard.js generate -n "Ana García" -p "+521234567890" --template moderno -f pdf

# Batch desde CSV
qrcard batch contactos.csv -o ./tarjetas/

# Listar plantillas
qrcard template list

# Validar plantilla personalizada
qrcard template validate -f mi-plantilla.json
```

### 3. API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/cards/generate` | Generar tarjeta completa |
| POST | `/api/v1/cards/preview` | Generar preview (baja res) |
| POST | `/api/v1/cards/validate` | Validar datos sin generar |
| GET | `/api/v1/templates` | Listar plantillas |
| GET | `/api/v1/templates/:id` | Obtener plantilla específica |
| POST | `/api/v1/templates` | Crear plantilla personalizada |
| POST | `/api/v1/render/preview` | Renderizar preview directo |
| POST | `/api/v1/render/print` | Renderizar alta calidad |

### Ejemplo API Request

```bash
curl -X POST http://localhost:3001/api/v1/cards/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos López",
    "phone": "+34600123456",
    "company": "Consultora ABC",
    "position": "Director",
    "template": "profesional",
    "format": "png"
  }'
```

## Sistema de Plantillas

Las plantillas son archivos JSON con estructura definida:

```json
{
  "id": "mi-plantilla",
  "name": "Mi Plantilla",
  "layout": {
    "width": "85mm",
    "height": "55mm",
    "bleed": "3mm"
  },
  "elements": [
    {
      "type": "text",
      "field": "name",
      "position": { "x": "5mm", "y": "10mm" },
      "style": { "font": "Arial", "size": "16pt", "color": "#000000" }
    },
    {
      "type": "qr",
      "position": { "x": "60mm", "y": "12mm" },
      "size": "28mm"
    }
  ]
}
```

### Tipos de Elementos

- `text`: Campos de texto (name, company, position, phone, email)
- `qr`: Código QR de WhatsApp
- `image`: Logo personalizado
- `line`: Líneas decorativas

## Formato CSV para Batch

```csv
name,phone,company,position,template
Juan Pérez,+34600123456,Empresa A,Gerente,minimalista
Ana García,+521234567890,Empresa B,Diseñadora,moderno
Carlos López,+15551234567,Empresa C,Consultor,elegante
```

## Configuración CLI

```bash
# Ver configuración
qrcard config --list

# Cambiar API URL
qrcard config --set apiUrl=http://api.produccion.com

# Cambiar plantilla por defecto
qrcard config --set defaultTemplate=moderno
```

## Especificaciones Técnicas

- **Dimensiones Tarjeta**: 85mm x 55mm (estándar EU)
- **Bleed Area**: 3mm en cada lado (91mm x 61mm total)
- **Resolución**: 300 DPI para impresión profesional
- **Formatos**: PNG, JPEG, PDF, SVG
- **Validación Teléfono**: E.164 internacional
- **Máximo Logo**: 2MB base64

## Seguridad

- ✅ Helmet.js para headers de seguridad
- ✅ CSP (Content Security Policy)
- ✅ Rate limiting: 100 req/15min por IP
- ✅ CORS configurado
- ✅ Validación Joi en todos los inputs
- ✅ Sanitización XSS
- ✅ Sin almacenamiento de datos personales

## Desarrollo

```bash
# Modo desarrollo (backend + frontend)
npm run dev

# Tests
npm run test

# Linting
cd backend && npm run lint
cd ../cli && npm run lint
```

## Roadmap

- [ ] Frontend React/Vue
- [ ] Más plantillas premium
- [ ] Analytics de escaneos QR
- [ ] Integración con servicios de impresión
- [ ] App móvil
- [ ] Webhooks para notificaciones

## Licencia

MIT © QRCard Team
