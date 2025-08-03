import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import swagger from '#config/swagger'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import AutoSwagger from 'adonis-autoswagger'
import router from '@adonisjs/core/services/router'

export default class GenerateDocs extends BaseCommand {
  static commandName = 'docs:generate'
  static description = "Génère la documentation OpenAPI/Swagger pour l'API Fournisseur CG"

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @flags.boolean({
    description: 'Générer en format JSON',
    alias: 'j',
  })
  declare json: boolean

  @flags.boolean({
    description: 'Générer en format YAML',
    alias: 'y',
  })
  declare yaml: boolean

  @flags.string({
    description: 'Dossier de sortie pour les fichiers',
    alias: 'o',
  })
  declare output: string

  @flags.boolean({
    description: 'Inclure les exemples de code',
    alias: 'e',
  })
  declare examples: boolean

  @flags.boolean({
    description: 'Mode verbose avec plus de détails',
    alias: 'v',
  })
  declare verbose: boolean

  async run() {
    const outputDir = this.output || './docs'
    const format = this.json ? 'json' : this.yaml ? 'yaml' : 'both'

    this.logger.info('📚 Génération de la documentation API Fournisseur CG')

    try {
      // Créer le dossier de sortie s'il n'existe pas
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
        this.logger.info(`📁 Dossier créé: ${outputDir}`) // ...
      }

      // Générer la documentation OpenAPI en combinant AutoSwagger + notre config
      this.logger.info('📝 Génération de la documentation avec AutoSwagger + Configuration Scalar')

      let autoSwaggerDoc: any = {}

      try {
        // Essayer d'utiliser AutoSwagger directement (sans middlewares)
        autoSwaggerDoc = await AutoSwagger.default.docs(router.toJSON(), swagger)
        if (this.verbose) {
          this.logger.info('✅ AutoSwagger a généré la documentation avec succès')
        }
      } catch (error) {
        this.logger.warning(`⚠️  Erreur AutoSwagger: ${error.message}`)
        this.logger.info('🔄 Génération avec configuration de base...')

        // Fallback: créer une structure OpenAPI de base
        autoSwaggerDoc = {
          openapi: '3.0.0',
          info: swagger.info,
          paths: await this.generatePathsFromRoutes(),
          components: {
            schemas: {},
          },
        }
      }

      // Créer notre spécification OpenAPI en combinant AutoSwagger + notre config
      const openApiSpec = {
        openapi: '3.0.0',
        info: autoSwaggerDoc.info || swagger.info,
        // Nos configurations spécifiques (prioritaires)
        servers: swagger.servers || [
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
        security: swagger.security || [{ bearerAuth: [] }, { apiKeyAuth: [] }, { basicAuth: [] }],
        tags: swagger.tags || [],
        paths: autoSwaggerDoc.paths || {},
        components: {
          ...(autoSwaggerDoc.components || {}),
          securitySchemes: swagger.securitySchemes || {
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
        },
      }

      if (this.verbose) {
        this.logger.info('🔍 Analyse des routes...')
        this.logger.info(`📊 Total des routes: ${Object.keys(openApiSpec.paths || {}).length}`)
      }

      // Sauvegarder en JSON
      if (format === 'json' || format === 'both') {
        const jsonPath = path.join(outputDir, 'openapi.json')
        fs.writeFileSync(jsonPath, JSON.stringify(openApiSpec, null, 2))
        this.logger.success(`✅ Documentation JSON générée: ${jsonPath}`)
      }

      // Sauvegarder en YAML
      if (format === 'yaml' || format === 'both') {
        const yamlPath = path.join(outputDir, 'openapi.yaml')
        const yamlContent = this.convertToYaml(openApiSpec)
        fs.writeFileSync(yamlPath, yamlContent)
        this.logger.success(`✅ Documentation YAML générée: ${yamlPath}`)
      }

      // Générer la configuration Scalar Galaxy
      if (format === 'yaml' || format === 'both') {
        const scalarPath = path.join(outputDir, 'scalar-galaxy-config.yaml')
        const scalarConfig = this.generateScalarConfig(openApiSpec)
        fs.writeFileSync(scalarPath, scalarConfig)
        this.logger.success(`✅ Configuration Scalar Galaxy générée: ${scalarPath}`)
      }

      // Générer un fichier de métadonnées
      const metadataPath = path.join(outputDir, 'api-metadata.json')
      const metadata = this.generateMetadata(openApiSpec)
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
      this.logger.success(`✅ Métadonnées générées: ${metadataPath}`)

      // Afficher un résumé
      this.logger.info('\n📋 Résumé de la documentation:')
      this.logger.info(`📊 Endpoints: ${Object.keys(openApiSpec.paths || {}).length}`)
      this.logger.info(`🏷️  Tags: ${openApiSpec.tags?.length || 0}`)
      this.logger.info(
        `🔐 Méthodes d'authentification: ${Object.keys(openApiSpec.components?.securitySchemes || {}).length}`
      )
      this.logger.info(`🌐 Serveurs: ${openApiSpec.servers?.length || 0}`)

      this.logger.success('\n🎉 Documentation générée avec succès!')
      this.logger.info(`📁 Fichiers disponibles dans: ${outputDir}`)
    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération de la documentation')
      this.logger.error(error.message)
      process.exit(1)
    }
  }

  private convertToYaml(obj: any): string {
    return yaml.dump(obj, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    })
  }

  private generateScalarConfig(openApiSpec: any): string {
    // Créer une info enrichie avec description Markdown complète
    const enrichedInfo = {
      ...openApiSpec.info,
      title: 'API Fournisseur CG - Orchestrateur Logistique',
      description: `API REST centrale pour l'écosystème logistique du Congo. Orchestre les services backend pour une expérience e-commerce unifiée.

## Mission
Connecter fournisseurs locaux et clients internationaux via une plateforme spécialisée pour l'écosystème congolais.

## Services Intégrés
- **Appwrite** - Backend principal (DB, Auth, Storage)
- **Spaark Pay** - Paiements mobiles (MTN Money, Airtel Money)
- **SMS API** - Notifications et codes OTP
- **MailerSend** - Emails marketing
- **SMTP** - Notifications système

## Collections Principales
- **QUOTES** - Demandes de devis
- **CONTACTS** - Messages de contact clients
- **PRODUCTS** - Catalogue multi-plateformes
- **ORDERS** - Commandes (FC-ORD-XXXX-YYYY)
- **PAYMENTS** - Transactions de paiement

## Fonctionnalités Clés
- **Paiements Mobiles** : Support natif MTN Money et Airtel Money
- **SMS Avancé** : Codes OTP sécurisés et notifications personnalisées
- **Collections Auto-Configurées** : Création automatique d'attributs et d'index

## Authentification
1. **Bearer Token** - JWT pour utilisateurs connectés
2. **API Key** - Authentification service-à-service
3. **Basic Auth** - Endpoints administrateur

## Spécificités Congo
- Numéros congolais : +243 format
- Devise : XAF (Franc CFA)
- Opérateurs : MTN Money (053/054), Airtel Money (097/098)

## Health Checks
- /v3 - État général
- /v3/spaark-pay/health - Connexion Spaark Pay
- /v3/sms/health - Connexion SMS API
- /v3/appwrite/health - Connexion Appwrite

## Ressources
- Documentation : https://docs.fournisseur.cg
- Support : dev@fournisseur.cg
- Status : https://status.fournisseur.cg`,
    }

    // Générer un fichier YAML OpenAPI complet compatible avec Scalar
    // qui inclut les paths générés par AutoSwagger
    const yamlContent = this.convertToYaml({
      'openapi': '3.0.0',
      'info': enrichedInfo,
      'servers': openApiSpec.servers,
      'security': openApiSpec.security,
      'components': openApiSpec.components,
      'tags': openApiSpec.tags,
      'paths': openApiSpec.paths,
      // Configuration Scalar spécifique
      'x-scalar': {
        ui: {
          theme: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
          },
          navigation: {
            showServers: true,
            showSecurity: true,
            showExamples: true,
            showResponses: true,
          },
          examples: {
            showRequestExamples: true,
            showResponseExamples: true,
            defaultLanguage: 'curl',
          },
          documentation: {
            showDescription: true,
            showContact: true,
            showLicense: true,
            showTermsOfService: true,
          },
        },
        features: {
          auth: {
            enabled: true,
            persistAuthorization: true,
            showSecuritySchemes: true,
          },
          testing: {
            enabled: true,
            allowCustomHeaders: true,
            allowCustomBody: true,
          },
          docs: {
            enabled: true,
            showCodeSamples: true,
            showSchemaExamples: true,
          },
          analytics: {
            enabled: true,
            trackUsage: true,
            trackErrors: true,
          },
        },
        webhooks: {
          enabled: true,
          allowCustomWebhooks: true,
          defaultTimeout: 30000,
        },
        codeSamples: {
          languages: ['curl', 'javascript', 'python', 'php', 'java', 'csharp'],
          defaultLanguage: 'curl',
          showLineNumbers: true,
          showCopyButton: true,
        },
        responses: {
          showSchema: true,
          showExamples: true,
          showHeaders: true,
          showStatusCodes: true,
        },
        search: {
          enabled: true,
          searchInDescriptions: true,
          searchInExamples: true,
          searchInSchemas: true,
        },
        metadata: {
          showVersion: true,
          showLastModified: true,
          showGeneratedBy: true,
          generatedBy: 'API Fournisseur CG - AutoSwagger + Scalar',
          generatedAt: new Date().toISOString(),
        },
      },
    })

    return `# Configuration Scalar Galaxy pour API Fournisseur CG
# Généré automatiquement le ${new Date().toISOString()}
# Combine AutoSwagger (routes) + Configuration Scalar (UI/UX)

${yamlContent}`
  }

  private async generatePathsFromRoutes(): Promise<any> {
    try {
      if (this.verbose) {
        this.logger.info('🔍 Génération des routes avec adonis-autoswagger...')
      }

      // Essayer d'abord de récupérer depuis l'endpoint /swagger si le serveur est lancé
      try {
        const response = await fetch('http://localhost:3333/swagger')
        if (response.ok) {
          const yamlContent = await response.text()
          // Parser le YAML pour extraire les paths
          const parsedDoc = yaml.load(yamlContent) as any
          const paths = parsedDoc.paths || {}

          if (this.verbose) {
            this.logger.info(`📊 Routes récupérées depuis /swagger: ${Object.keys(paths).length}`)
          }

          if (Object.keys(paths).length > 0) {
            return paths
          }
        }
      } catch (fetchError) {
        if (this.verbose) {
          this.logger.info("📡 Serveur non accessible, utilisation directe d'AutoSwagger...")
        }
      }

      // Utiliser AutoSwagger directement
      const openApiDoc = await AutoSwagger.default.docs(router.toJSON(), swagger)
      const paths = openApiDoc.paths || {}

      if (this.verbose) {
        this.logger.info(`📊 Routes trouvées avec AutoSwagger: ${Object.keys(paths).length}`)
        if (Object.keys(paths).length > 0) {
          Object.keys(paths).forEach((routePath) => {
            const methods = Object.keys(paths[routePath])
            this.logger.info(`  ${methods.join(', ').toUpperCase()} ${routePath}`)
          })
        }
      }

      return paths
    } catch (error) {
      this.logger.warning(`⚠️  Erreur avec AutoSwagger: ${error.message}`)
      this.logger.info('🔄 Utilisation de la méthode alternative...')
      return await this.generatePathsManually()
    }
  }

  private async generatePathsManually(): Promise<any> {
    const routes = router.toJSON()
    const paths: any = {}

    if (this.verbose) {
      this.logger.info(`📊 Génération manuelle: ${Object.keys(routes).length} routes trouvées`)
    }

    // Convertir les routes en format OpenAPI
    for (const [routePath, routeArray] of Object.entries(routes)) {
      if (!Array.isArray(routeArray) || routeArray.length === 0) continue

      const route = routeArray[0]
      const methods = route.methods || []

      for (const httpMethod of methods) {
        const method = httpMethod.toLowerCase()
        if (!method || method === 'head') continue

        // Nettoyer le chemin de route (convertir les paramètres AdonisJS en OpenAPI)
        const cleanPath = routePath.replace(/:([^/]+)/g, '{$1}')

        // Déterminer le tag basé sur le chemin
        let tag = 'API Info'
        if (cleanPath.includes('/v3/auth')) tag = 'Authentication'
        else if (cleanPath.includes('/v3/appwrite')) tag = 'Database Management'
        else if (cleanPath.includes('/v3/collections')) tag = 'Collection Management'
        else if (cleanPath.includes('/v3/spaark-pay')) tag = 'Payment Processing'
        else if (cleanPath.includes('/v3/sms')) tag = 'SMS Notifications'
        else if (cleanPath.includes('/swagger') || cleanPath.includes('/docs'))
          tag = 'Documentation'

        // Créer l'objet de route OpenAPI
        const routeObject: any = {
          summary: this.generateSummary(method, cleanPath),
          description: this.generateDescription(method, cleanPath),
          tags: [tag],
          responses: {
            '200': {
              description: 'Succès',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
            '400': {
              description: 'Requête invalide',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Erreur interne du serveur',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                      details: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        }

        // Ajouter la sécurité si nécessaire
        if (this.requiresAuth(cleanPath)) {
          routeObject.security = [{ bearerAuth: [] }]
          routeObject.responses['401'] = {
            description: 'Non autorisé',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          }
        }

        // Ajouter le requestBody pour les méthodes POST/PUT/PATCH
        if (['post', 'put', 'patch'].includes(method)) {
          routeObject.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: this.generateRequestSchema(cleanPath),
              },
            },
          }
        }

        // Ajouter les paramètres de chemin
        const pathParams = cleanPath.match(/\{([^}]+)\}/g)
        if (pathParams) {
          routeObject.parameters = pathParams.map((param: string) => {
            const paramName = param.replace(/\{|\}/g, '')
            return {
              name: paramName,
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: `Identifiant ${paramName}`,
            }
          })
        }

        // Ajouter les paramètres de query pour GET
        if (method === 'get' && this.hasQueryParams(cleanPath)) {
          if (!routeObject.parameters) routeObject.parameters = []
          routeObject.parameters.push(...this.generateQueryParams(cleanPath))
        }

        // Initialiser le chemin s'il n'existe pas
        if (!paths[cleanPath]) {
          paths[cleanPath] = {}
        }

        // Ajouter la méthode
        paths[cleanPath][method] = routeObject

        if (this.verbose) {
          this.logger.info(`  ${method.toUpperCase()} ${cleanPath} [${tag}]`)
        }
      }
    }

    return paths
  }

  private generateSummary(method: string, routePath: string): string {
    const action = method.toUpperCase()

    if (routePath.includes('/health')) return `${action} Health Check`
    if (routePath.includes('/login')) return 'Connexion utilisateur'
    if (routePath.includes('/register')) return 'Inscription utilisateur'
    if (routePath.includes('/get-token')) return "Obtenir un token d'accès"
    if (routePath.includes('/logout')) return 'Déconnexion utilisateur'
    if (routePath.includes('/profile')) return 'Profil utilisateur'
    if (routePath.includes('/refresh-token')) return 'Renouveler le token'
    if (routePath.includes('/databases') && method === 'get') return 'Lister les bases de données'
    if (routePath.includes('/collections') && method === 'get') return 'Lister les collections'
    if (routePath.includes('/collections') && method === 'post') return 'Créer une collection'
    if (routePath.includes('/documents') && method === 'get') return 'Lister les documents'
    if (routePath.includes('/documents') && method === 'post') return 'Créer un document'
    if (routePath.includes('/initiate')) return 'Initier un paiement'
    if (routePath.includes('/verify')) return 'Vérifier un paiement'
    if (routePath.includes('/send')) return 'Envoyer un SMS'

    return `${action} ${routePath}`
  }

  private generateDescription(method: string, routePath: string): string {
    if (routePath.includes('/health')) return "Vérification de l'état de santé du service"
    if (routePath.includes('/login')) return 'Authentification avec email et mot de passe'
    if (routePath.includes('/register')) return "Création d'un nouveau compte utilisateur"
    if (routePath.includes('/get-token'))
      return 'Obtenir un token JWT pour authentification (route temporaire)'
    if (routePath.includes('/logout')) return 'Déconnexion et invalidation du token'
    if (routePath.includes('/profile')) return 'Récupérer les informations du profil utilisateur'
    if (routePath.includes('/refresh-token')) return 'Renouveler un token JWT expiré'
    if (routePath.includes('/databases')) return 'Opérations sur les bases de données Appwrite'
    if (routePath.includes('/collections')) return 'Gestion des collections Appwrite'
    if (routePath.includes('/documents')) return 'Gestion des documents dans les collections'
    if (routePath.includes('/spaark-pay')) return 'Opérations de paiement mobile via Spaark Pay'
    if (routePath.includes('/sms')) return 'Envoi et gestion des SMS'

    return `Endpoint ${method.toUpperCase()} pour ${routePath}`
  }

  private requiresAuth(routePath: string): boolean {
    const publicPaths = [
      '/health',
      '/test',
      '/v3/auth/login',
      '/v3/auth/register',
      '/v3/auth/get-token',
      '/swagger',
      '/docs',
      '/',
    ]

    return !publicPaths.some((publicPath) => routePath.includes(publicPath))
  }

  private generateRequestSchema(routePath: string): any {
    if (routePath.includes('/auth/login')) {
      return {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      }
    }

    if (routePath.includes('/auth/register')) {
      return {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          fullName: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      }
    }

    if (routePath.includes('/auth/get-token')) {
      return {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      }
    }

    if (routePath.includes('/spaark-pay/initiate')) {
      return {
        type: 'object',
        required: ['amount', 'currency', 'phone'],
        properties: {
          amount: { type: 'number', example: 5000 },
          currency: { type: 'string', example: 'XAF' },
          phone: { type: 'string', example: '+242069999999' },
          description: { type: 'string', example: 'Paiement commande #123' },
        },
      }
    }

    if (routePath.includes('/sms/send')) {
      return {
        type: 'object',
        required: ['to', 'message'],
        properties: {
          to: { type: 'string', example: '+242069999999' },
          message: { type: 'string', example: 'Votre code de vérification est: 123456' },
          from: { type: 'string', example: 'FournisseurCG' },
        },
      }
    }

    return { type: 'object' }
  }

  private hasQueryParams(routePath: string): boolean {
    return (
      routePath.includes('/documents') ||
      routePath.includes('/history') ||
      routePath.includes('/stats')
    )
  }

  private generateQueryParams(routePath: string): any[] {
    const params = []

    if (routePath.includes('/documents')) {
      params.push(
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          description: 'Nombre de documents à retourner',
        },
        {
          name: 'offset',
          in: 'query',
          schema: { type: 'integer', minimum: 0, default: 0 },
          description: 'Nombre de documents à ignorer',
        }
      )
    }

    return params
  }

  private generateMetadata(openApiSpec: any): any {
    return {
      generatedAt: new Date().toISOString(),
      generator: 'API Fournisseur CG - AutoSwagger + Scalar Generator',
      version: '3.0.0',
      apiInfo: {
        title: openApiSpec.info.title,
        version: openApiSpec.info.version,
        description: "API REST centrale pour l'écosystème logistique du Congo",
        contact: {
          name: 'Équipe Technique Fournisseur CG',
          email: 'dev@fournisseur.cg',
          url: 'https://fournisseur.cg',
        },
        license: {
          name: 'Propriétaire - Fournisseur CG',
          url: 'https://fournisseur.cg/license',
        },
      },
      ecosystem: {
        mission: 'Connecter fournisseurs locaux et clients internationaux',
        region: 'Congo',
        specialization: 'E-commerce et logistique africaine',
        services: [
          { name: 'Appwrite', role: 'Backend principal', status: 'active' },
          { name: 'Spaark Pay', role: 'Paiements mobiles', status: 'active' },
          { name: 'SMS API', role: 'Notifications', status: 'active' },
          { name: 'MailerSend', role: 'Emails marketing', status: 'planned' },
          { name: 'SMTP', role: 'Notifications système', status: 'planned' },
        ],
        collections: [
          { name: 'QUOTES', description: 'Demandes de devis', format: 'FC-QMM-XXXX-YYYY' },
          { name: 'CONTACTS', description: 'Messages de contact clients' },
          { name: 'PRODUCTS', description: 'Catalogue multi-plateformes' },
          { name: 'ORDERS', description: 'Commandes', format: 'FC-ORD-XXXX-YYYY' },
          { name: 'PAYMENTS', description: 'Transactions de paiement' },
        ],
        features: [
          'Paiements mobiles intelligents (MTN Money, Airtel Money)',
          'Gestion SMS avancée avec codes OTP',
          'Collections auto-configurées',
          'Validation locale congolaise',
          'Retry automatique pour erreurs temporaires',
          'Documentation interactive avec Scalar UI',
        ],
      },
      statistics: {
        totalEndpoints: Object.keys(openApiSpec.paths || {}).length,
        totalTags: openApiSpec.tags?.length || 0,
        totalSecuritySchemes: Object.keys(openApiSpec.components?.securitySchemes || {}).length,
        totalServers: openApiSpec.servers?.length || 0,
        authMethods: ['Bearer Token (JWT)', 'API Key', 'Basic Auth'],
        supportedFormats: ['JSON', 'YAML'],
        mainVersion: 'v3',
      },
      endpoints: Object.keys(openApiSpec.paths || {}).map((pathKey) => ({
        path: pathKey,
        methods: Object.keys(openApiSpec.paths[pathKey] || {}),
      })),
      tags:
        openApiSpec.tags?.map((tag: any) => ({
          name: tag.name,
          description: tag.description,
        })) || [],
      securitySchemes: Object.entries(openApiSpec.components?.securitySchemes || {}).map(
        ([key, scheme]: [string, any]) => ({
          name: key,
          type: scheme.type,
          description: scheme.description,
        })
      ),
      servers:
        openApiSpec.servers?.map((server: any) => ({
          url: server.url,
          description: server.description,
        })) || [],
    }
  }
}
