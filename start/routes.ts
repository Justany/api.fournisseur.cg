/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'

// Route de fallback pour les anciennes versions
router.get('/', async () => {
  return {
    message: 'API Fournisseur CG',
    currentVersion: 'v3',
    availableVersions: ['v3'],
    documentation: 'https://api.fournisseur.cg/v3/docs',
  }
})

// returns swagger in YAML
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

// Renders Swagger-UI and passes YAML-output of /swagger
router.get('/docs', async () => {
  return AutoSwagger.default.scalar('/swagger')
})

router
  .group(() => {
    // Route de base pour vérifier que l'API fonctionne
    router.get('/', async () => {
      return {
        message: 'API Fournisseur CG v3 - Orchestrateur Logistique',
        description: "Wrapper central pour l'écosystème Fournisseur Congo",
        version: '3.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
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
          sparkpay: {
            status: 'en attente (documentation requise)',
            description: 'Paiements mobiles MTN Money, Airtel Money',
          },
        },
        endpoints: {
          documentation: '/v3/docs',
          swagger: '/v3/swagger',
          appwrite: '/v3/appwrite',
          health: '/v3/health',
        },
      }
    })

    // =====================================
    // Routes Appwrite Integration (IMPLÉMENTÉES)
    // =====================================
    router
      .group(() => {
        const AppwritesController = () => import('#controllers/appwrites_controller')

        // Health check Appwrite
        router.get('/health', [AppwritesController, 'health'])

        // Gestion des bases de données
        router.get('/databases', [AppwritesController, 'listDatabases'])

        // Gestion des collections
        router.get('/databases/:databaseId/collections', [AppwritesController, 'listCollections'])
        router.post('/databases/:databaseId/collections', [AppwritesController, 'createCollection'])

        // Gestion des documents
        router.get('/databases/:databaseId/collections/:collectionId/documents', [
          AppwritesController,
          'listDocuments',
        ])
        router.post('/databases/:databaseId/collections/:collectionId/documents', [
          AppwritesController,
          'createDocument',
        ])
        router.get('/databases/:databaseId/collections/:collectionId/documents/:documentId', [
          AppwritesController,
          'getDocument',
        ])
        router.patch('/databases/:databaseId/collections/:collectionId/documents/:documentId', [
          AppwritesController,
          'updateDocument',
        ])
        router.delete('/databases/:databaseId/collections/:collectionId/documents/:documentId', [
          AppwritesController,
          'deleteDocument',
        ])

        // Gestion des attributs
        router.post('/databases/:databaseId/collections/:collectionId/attributes/string', [
          AppwritesController,
          'createStringAttribute',
        ])
        router.post('/databases/:databaseId/collections/:collectionId/attributes/integer', [
          AppwritesController,
          'createIntegerAttribute',
        ])
        router.post('/databases/:databaseId/collections/:collectionId/attributes/boolean', [
          AppwritesController,
          'createBooleanAttribute',
        ])
        router.post('/databases/:databaseId/collections/:collectionId/attributes/datetime', [
          AppwritesController,
          'createDatetimeAttribute',
        ])
      })
      .prefix('/appwrite')

    // =====================================
    // Routes Collection Management (NOUVELLES)
    // =====================================
    router
      .group(() => {
        const CollectionManagersController = () => import('#controllers/collection_managers_controller')

        // Initialisation complète des collections
        router.post('/initialize', [CollectionManagersController, 'initializeAllCollections'])

        // Exécution d'actions spécifiques
        router.post('/actions', [CollectionManagersController, 'executeCollectionActions'])

        // Status des collections
        router.get('/status', [CollectionManagersController, 'getCollectionStatus'])

        // Configuration des collections
        router.get('/configuration', [CollectionManagersController, 'getCollectionConfiguration'])
      })
      .prefix('/collections')
  })
  .prefix('/v3')

export default router
