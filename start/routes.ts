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
        message: 'API Fournisseur CG v3',
        version: '3.0.0',
        status: 'active',
        timestamp: new Date().toISOString(),
      }
    })

    // Route de santé de l'API
    router.get('/health', async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }
    })

    // ============================================================================
    // ROUTES D'AUTHENTIFICATION
    // ============================================================================
    router
      .group(() => {
        router.post('/register', async () => {
          return { message: 'Register endpoint - à implémenter' }
        })

        router.post('/login', async () => {
          return { message: 'Login endpoint - à implémenter' }
        })

        router.post('/logout', async () => {
          return { message: 'Logout endpoint - à implémenter' }
        })

        router.post('/refresh', async () => {
          return { message: 'Refresh token endpoint - à implémenter' }
        })
      })
      .prefix('/auth')

    // ============================================================================
    // ROUTES UTILISATEURS
    // ============================================================================
    router
      .group(() => {
        router.get('/profile', async () => {
          return { message: 'Profile endpoint - à implémenter' }
        })

        router.put('/profile', async () => {
          return { message: 'Update profile endpoint - à implémenter' }
        })

        router.get('/dashboard', async () => {
          return { message: 'Dashboard endpoint - à implémenter' }
        })
      })
      .prefix('/users')

    // ============================================================================
    // ROUTES FOURNISSEURS
    // ============================================================================
    router
      .group(() => {
        router.get('/', async () => {
          return { message: 'Liste des fournisseurs - à implémenter' }
        })

        router.get('/:id', async () => {
          return { message: 'Détails fournisseur - à implémenter' }
        })

        router.post('/', async () => {
          return { message: 'Créer fournisseur - à implémenter' }
        })

        router.put('/:id', async () => {
          return { message: 'Modifier fournisseur - à implémenter' }
        })

        router.delete('/:id', async () => {
          return { message: 'Supprimer fournisseur - à implémenter' }
        })
      })
      .prefix('/fournisseurs')

    // ============================================================================
    // ROUTES COMMANDES
    // ============================================================================
    router
      .group(() => {
        router.get('/', async () => {
          return { message: 'Liste des commandes - à implémenter' }
        })

        router.get('/:id', async () => {
          return { message: 'Détails commande - à implémenter' }
        })

        router.post('/', async () => {
          return { message: 'Créer commande - à implémenter' }
        })

        router.put('/:id/status', async () => {
          return { message: 'Mettre à jour statut commande - à implémenter' }
        })
      })
      .prefix('/commandes')

    // ============================================================================
    // ROUTES DEVIS
    // ============================================================================
    router
      .group(() => {
        router.get('/', async () => {
          return { message: 'Liste des devis - à implémenter' }
        })

        router.get('/:id', async () => {
          return { message: 'Détails devis - à implémenter' }
        })

        router.post('/', async () => {
          return { message: 'Créer devis - à implémenter' }
        })

        router.put('/:id', async () => {
          return { message: 'Modifier devis - à implémenter' }
        })
      })
      .prefix('/devis')

    // ============================================================================
    // ROUTES LOGISTIQUE
    // ============================================================================
    router
      .group(() => {
        router.get('/tracking/:id', async () => {
          return { message: 'Suivi logistique - à implémenter' }
        })

        router.post('/expedition', async () => {
          return { message: 'Créer expédition - à implémenter' }
        })

        router.get('/tarifs', async () => {
          return { message: 'Tarifs logistiques - à implémenter' }
        })
      })
      .prefix('/logistique')

    // ============================================================================
    // ROUTES PAIEMENT
    // ============================================================================
    router
      .group(() => {
        router.post('/create-payment', async () => {
          return { message: 'Créer paiement - à implémenter' }
        })

        router.post('/webhook', async () => {
          return { message: 'Webhook paiement - à implémenter' }
        })

        router.get('/transactions', async () => {
          return { message: 'Historique transactions - à implémenter' }
        })
      })
      .prefix('/paiement')

    // ============================================================================
    // ROUTES NOTIFICATIONS
    // ============================================================================
    router
      .group(() => {
        router.post('/email', async () => {
          return { message: 'Envoi email - à implémenter' }
        })

        router.post('/whatsapp', async () => {
          return { message: 'Envoi WhatsApp - à implémenter' }
        })

        router.get('/webhook', async () => {
          return { message: 'WhatsApp verification - à implémenter' }
        })

        router.post('/webhook', async () => {
          return { message: 'WhatsApp webhook - à implémenter' }
        })
      })
      .prefix('/notifications')

    // ============================================================================
    // ROUTES APPRITE
    // ============================================================================
    router
      .group(() => {
        router.get('/collections', async () => {
          return { message: 'Liste collections Appwrite - à implémenter' }
        })

        router.post('/collections', async () => {
          return { message: 'Créer collection Appwrite - à implémenter' }
        })

        router.get('/documents/:collectionId', async () => {
          return { message: 'Liste documents Appwrite - à implémenter' }
        })

        router.post('/documents/:collectionId', async () => {
          return { message: 'Créer document Appwrite - à implémenter' }
        })
      })
      .prefix('/appwrite')

    // ============================================================================
    // ROUTES SERVICES FOURNISSEUR CG
    // ============================================================================
    router
      .group(() => {
        // Fournisseur Direct
        router.get('/direct', async () => {
          return { message: 'Service Fournisseur Direct - à implémenter' }
        })

        // Fournisseur Express
        router.get('/express', async () => {
          return { message: 'Service Fournisseur Express - à implémenter' }
        })

        // Fournisseur Pro
        router.get('/pro', async () => {
          return { message: 'Service Fournisseur Pro - à implémenter' }
        })

        // Fournisseur Max
        router.get('/max', async () => {
          return { message: 'Service Fournisseur Max - à implémenter' }
        })

        // Fournisseur Academy
        router.get('/academy', async () => {
          return { message: 'Service Fournisseur Academy - à implémenter' }
        })

        // Fournisseur Compare
        router.get('/compare', async () => {
          return { message: 'Service Fournisseur Compare - à implémenter' }
        })

        // Fournisseur IA
        router.get('/ia', async () => {
          return { message: 'Service Fournisseur IA - à implémenter' }
        })
      })
      .prefix('/services')
  })
  .prefix('/v3')

export default router
