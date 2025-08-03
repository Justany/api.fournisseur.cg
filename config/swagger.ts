const swaggerConfig = {
  path: process.cwd(),
  title: 'API Fournisseur CG - Orchestrateur Logistique',
  version: '3.0.0',
  description:
    'API REST centrale servant de wrapper et orchestrateur pour la plateforme logistique Fournisseur Congo. Intègre Appwrite (backend), MailerSend (emails), SMTP (notifications) et Spark Pay (paiements mobiles).',
  tagIndex: 4,
  productionEnv: 'production',
  info: {
    title: 'API Fournisseur CG - Orchestrateur Logistique',
    version: '3.0.0',
    description:
      "API REST centrale servant de wrapper pour l'écosystème Fournisseur Congo. Orchestrateur entre applications clientes (web Vue.js, mobile) et services backend (Appwrite, MailerSend, SMTP, Spark Pay).",
    contact: {
      name: 'Équipe Technique Fournisseur CG',
      email: 'dev@fournisseur.cg',
      url: 'https://fournisseur.cg',
    },
    license: {
      name: 'Propriétaire - Fournisseur CG',
      url: 'https://fournisseur.cg/license',
    },
    termsOfService: 'https://fournisseur.cg/terms',
  },
  snakeCase: true,
  debug: true,
  ignore: [
    '/swagger',
    '/docs',
    '/',
    '/swagger/yaml-only',
    '/swagger/scalar-config',
    '/swagger/metadata',
  ],
  preferredPutPatch: 'PUT',
  // Configuration pour améliorer la génération automatique
  writeFileSync: false, // Ne pas essayer d'écrire un fichier swagger.yml
  mode: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'RUNTIME',
  tags: [
    {
      name: 'Authentication',
      description: 'Authentification utilisateurs et gestion des tokens JWT',
    },
    {
      name: 'Database Management',
      description: 'Wrapper pour les opérations Appwrite (collections, documents, utilisateurs)',
    },
    {
      name: 'Collection Management',
      description: 'Gestion des collections et initialisation des structures de données',
    },
    {
      name: 'Payment Processing',
      description: 'Intégration Spaark Pay - Paiements mobiles (MTN Money, Airtel Money)',
    },
    {
      name: 'SMS Notifications',
      description: 'Envoi de SMS et notifications via API SMS',
    },
    {
      name: 'Email Services',
      description: 'MailerSend (marketing) et SMTP (notifications système)',
    },
    {
      name: 'User Management',
      description: 'Gestion des utilisateurs (visiteurs, clients, professionnels, admins)',
    },
    {
      name: 'Webhooks',
      description: 'Endpoints pour webhooks entrants (Spark Pay, partenaires transport)',
    },
    {
      name: 'Analytics',
      description: 'Métriques, rapports et données analytiques de la plateforme',
    },
  ],
  // Configuration des serveurs au niveau racine (comme Scalar Galaxy)
  servers: [
    {
      url: 'https://api.fournisseur.cg',
      description: 'Production - API officielle',
    },
    {
      url: 'https://staging.api.fournisseur.cg',
      description: 'Staging - Tests et validation',
    },
    {
      url: 'http://localhost:3333',
      description: 'Développement local',
    },
  ],
  // Configuration de sécurité simplifiée (comme Scalar Galaxy)
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }, { basicAuth: [] }],
  common: {
    parameters: {
      sortable: [
        {
          in: 'query',
          name: 'sortBy',
          schema: { type: 'string', example: 'createdAt' },
          description: 'Field to sort by',
        },
        {
          in: 'query',
          name: 'sortType',
          schema: { type: 'string', enum: ['ASC', 'DESC'], example: 'DESC' },
          description: 'Sort direction',
        },
      ],
      pagination: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, example: 1 },
          description: 'Page number',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, example: 20 },
          description: 'Items per page',
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
        'X-Current-Page': {
          description: 'Current page number',
          schema: { type: 'integer', example: 1 },
        },
      },
      security: {
        'X-Request-ID': {
          description: 'Unique request identifier for tracking',
          schema: { type: 'string', example: 'req_123456789' },
        },
        'X-API-Version': {
          description: 'API version being used',
          schema: { type: 'string', example: 'v3' },
        },
      },
    },
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token obtenu depuis /v3/auth/login',
    },
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      description: "Clé API pour l'authentification service-à-service",
    },
    basicAuth: {
      type: 'http',
      scheme: 'basic',
      description: 'Authentification basique pour les endpoints admin',
    },
  },
  authMiddlewares: ['auth', 'auth:api'],
  defaultSecurityScheme: 'bearerAuth',
  persistAuthorization: true,
  showFullPath: true,
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
