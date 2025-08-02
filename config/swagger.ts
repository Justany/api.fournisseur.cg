import path from 'node:path'
import url from 'node:url'

const swaggerConfig = {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'API Fournisseur CG - Orchestrateur Logistique',
  version: '3.0.0',
  description:
    "API REST centrale servant de wrapper et orchestrateur pour la plateforme logistique Fournisseur Congo. Intègre Appwrite (backend), MailerSend (emails), SMTP (notifications) et Spark Pay (paiements mobiles). Permet aux applications web Vue.js et mobiles d'accéder aux services complexes de transport international, gestion des commandes, et paiements mobiles (MTN Money, Airtel Money) depuis la République du Congo.",
  tagIndex: 2,
  productionEnv: 'production',
  info: {
    title: 'API Fournisseur CG - Orchestrateur Logistique',
    version: '3.0.0',
    description:
      "API REST centrale servant de wrapper pour l'écosystème Fournisseur Congo. Orchestrateur entre applications clientes (web Vue.js, mobile) et services backend (Appwrite, MailerSend, SMTP, Spark Pay). Gère l'authentification, les commandes internationales, les paiements mobiles congolais, le suivi logistique et les notifications multi-canaux.",
    contact: {
      name: 'Équipe Technique Fournisseur CG',
      email: 'dev@fournisseur-cg.com',
      url: 'https://fournisseur-cg.com',
    },
    license: {
      name: 'Propriétaire - Fournisseur CG',
      url: 'https://fournisseur-cg.com/license',
    },
    termsOfService: 'https://fournisseur-cg.com/terms',
  },
  snakeCase: true,
  debug: true,
  ignore: ['/swagger', '/docs', '/'],
  preferredPutPatch: 'PUT',
  tags: [
    {
      name: 'Authentication',
      description: 'Authentification utilisateurs et gestion des tokens JWT',
    },
    {
      name: 'Appwrite Integration',
      description: 'Wrapper pour les opérations Appwrite (collections, documents, utilisateurs)',
    },
    {
      name: 'Orders Management',
      description: 'Gestion des commandes internationales et suivi logistique',
    },
    {
      name: 'Payments',
      description: 'Intégration Spark Pay - Paiements mobiles (MTN Money, Airtel Money)',
    },
    {
      name: 'Shipping Services',
      description: 'Services de transport (DHL, FedEx, UPS) et estimation des coûts',
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
