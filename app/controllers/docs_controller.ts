import type { HttpContext } from '@adonisjs/core/http'

/**
 * Contrôleur pour la documentation Scalar
 * Améliore l'expérience utilisateur et l'authentification
 */
export default class DocsController {
  /**
   * @getDocsInfo
   * @summary Get documentation information
   * @description Get API documentation information and authentication details
   * @tag Documentation
   * @responseBody 200 - {"title": "API Fournisseur CG", "version": "3.0.0", "authentication": {...}}
   */
  async getDocsInfo({ response }: HttpContext) {
    return response.ok({
      title: 'API Fournisseur CG - Orchestrateur Logistique',
      version: '3.0.0',
      description: "API REST centrale servant de wrapper pour l'écosystème Fournisseur Congo",
      authentication: {
        methods: [
          {
            name: 'Bearer Token',
            type: 'http',
            scheme: 'bearer',
            description: 'JWT token obtenu via /auth/login',
            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            steps: [
              '1. Appelez POST /v3/auth/login avec vos identifiants',
              '2. Copiez le token depuis la réponse',
              '3. Cliquez sur "Authorize" en haut à droite',
              '4. Entrez le token avec le préfixe "Bearer "',
              '5. Cliquez sur "Authorize" pour valider',
            ],
          },
          {
            name: 'API Key',
            type: 'apiKey',
            in: 'header',
            // name: 'X-API-Key',
            description: "Clé API pour l'authentification service-à-service",
            example: 'api_key_123456789abcdef',
            steps: [
              "1. Contactez l'équipe technique pour obtenir une clé API",
              '2. Cliquez sur "Authorize" en haut à droite',
              '3. Entrez votre clé API dans le champ X-API-Key',
              '4. Cliquez sur "Authorize" pour valider',
            ],
          },
        ],
        endpoints: {
          login: '/v3/auth/login',
          register: '/v3/auth/register',
          refresh: '/v3/auth/refresh-token',
          profile: '/v3/auth/profile',
        },
      },
      servers: [
        {
          url: 'https://api.arkelys.cloud',
          description: 'Production - API officielle',
        },
        {
          url: 'https://staging-api.arkelys.cloud',
          description: 'Staging - Tests et validation',
        },
        {
          url: 'http://localhost:3333',
          description: 'Développement local',
        },
      ],
      features: {
        codegen: true,
        search: true,
        examples: true,
        tryIt: true,
        authentication: true,
      },
      contact: {
        name: 'Équipe Technique Fournisseur CG',
        email: 'dev@fournisseur.cg',
        url: 'https://fournisseur.cg',
      },
    })
  }

  /**
   * @getAuthExamples
   * @summary Get authentication examples
   * @description Get detailed authentication examples and test credentials
   * @tag Documentation
   * @responseBody 200 - {"examples": {...}}
   */
  async getAuthExamples({ response }: HttpContext) {
    return response.ok({
      examples: {
        login: {
          url: '/v3/auth/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
          response: {
            success: true,
            message: 'Login successful',
            data: {
              user: {
                id: 1,
                fullName: 'John Doe',
                email: 'test@example.com',
                createdAt: '2024-01-01T00:00:00.000Z',
              },
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              tokenBearer: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        protectedRequest: {
          url: '/v3/auth/profile',
          method: 'GET',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'Content-Type': 'application/json',
          },
          response: {
            success: true,
            data: {
              user: {
                id: 1,
                fullName: 'John Doe',
                email: 'test@example.com',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      testCredentials: {
        email: 'test@example.com',
        password: 'password123',
        note: 'Ces identifiants sont pour les tests uniquement',
      },
    })
  }

  /**
   * @getApiStatus
   * @summary Get API status
   * @description Get current API status and health information
   * @tag Documentation
   * @responseBody 200 - {"status": "healthy", "services": {...}}
   */
  async getApiStatus({ response }: HttpContext) {
    return response.ok({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '3.0.0',
      services: {
        appwrite: {
          status: 'intégré',
          description: 'Backend principal (collections, documents, utilisateurs)',
        },
        mailersend: {
          status: 'en attente',
          description: 'Emails marketing et notifications',
        },
        smtp: {
          status: 'en attente',
          description: 'Messages système et bienvenue',
        },
        spaarkpay: {
          status: 'intégré',
          description: 'Paiements mobiles MTN Money, Airtel Money',
        },
        sms: {
          status: 'intégré',
          description: 'Notifications SMS',
        },
      },
      endpoints: {
        documentation: '/v3/docs',
        swagger: '/v3/swagger',
        health: '/v3/health',
        auth: '/v3/auth',
      },
    })
  }
}
