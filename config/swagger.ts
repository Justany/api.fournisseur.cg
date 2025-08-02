import path from 'node:path'
import url from 'node:url'

const swaggerConfig = {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'API Fournisseur CG',
  version: '3.0.0',
  description:
    "API REST pour la gestion des fournisseurs au Congo. Services de logistique, d'importation et de gestion des fournisseurs.",
  tagIndex: 2,
  productionEnv: 'production',
  info: {
    title: 'API Fournisseur CG',
    version: '3.0.0',
    description:
      "API REST complète pour la gestion des fournisseurs au Congo. Inclut l'authentification, la gestion des fournisseurs, les devis, le suivi des commandes et les services de logistique.",
  },
  snakeCase: true,
  debug: true,
  ignore: ['/swagger', '/docs'],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {
      sortable: [
        {
          in: 'query',
          name: 'sortBy',
          schema: { type: 'string', example: 'foo' },
        },
        {
          in: 'query',
          name: 'sortType',
          schema: { type: 'string', example: 'ASC' },
        },
      ],
    },
    headers: {
      paginated: {
        'X-Total-Pages': {
          description: 'Total amount of pages',
          schema: { type: 'integer', example: 5 },
        },
        'X-Total': {
          description: 'Total amount of results',
          schema: { type: 'integer', example: 100 },
        },
        'X-Per-Page': {
          description: 'Results per page',
          schema: { type: 'integer', example: 20 },
        },
      },
    },
  },
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    ApiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
    },
    BasicAuth: {
      type: 'http',
      scheme: 'basic',
    },
  },
  authMiddlewares: ['auth', 'auth:api'],
  defaultSecurityScheme: 'BearerAuth',
  persistAuthorization: true,
  showFullPath: true,
  scalar: {},
}

// Ajouter la méthode get pour compatibilité avec adonis-autoswagger
Object.defineProperty(swaggerConfig, 'get', {
  value: function (key: string) {
    return (this as any)[key]
  },
  enumerable: false,
  writable: false,
})

export default swaggerConfig
