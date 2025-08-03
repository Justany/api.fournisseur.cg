import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

// Étendre le type HttpContext pour inclure appwriteAuthInfo
declare module '@adonisjs/core/http' {
  interface HttpContext {
    appwriteAuthInfo?: {
      apiKey: string | null
      projectId: string | null
      timestamp: string
    }
  }
}

/**
 * Middleware d'authentification spécifique pour Appwrite
 * Responsabilité unique : vérifier les clés API et tokens Appwrite
 */
export default class AppwriteAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    console.log('🗄️ [APPWRITE_AUTH] Middleware appelé pour:', ctx.request.url())

    // Routes publiques Appwrite
    const publicRoutes = [
      '/v3/appwrite/health',
    ]

    // Vérifier si la route actuelle est publique
    const currentPath = ctx.request.url()
    const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route))

    console.log('📍 [APPWRITE_AUTH] Route actuelle:', currentPath)
    console.log('✅ [APPWRITE_AUTH] Route publique:', isPublicRoute)

    // Si c'est une route publique, laisser passer sans authentification
    if (isPublicRoute) {
      console.log('✅ [APPWRITE_AUTH] Passage direct pour route publique')
      await next()
      return
    }

    console.log('🔒 [APPWRITE_AUTH] Route protégée, vérification authentification Appwrite')

    // Pour les routes protégées, vérifier l'authentification Appwrite
    const apiKey = ctx.request.header('x-appwrite-key')
    const projectId = ctx.request.header('x-appwrite-project-id')

    // Vérifier la présence d'une clé API et d'un project ID
    if (!apiKey || !projectId) {
      console.log('❌ [APPWRITE_AUTH] Authentification Appwrite incomplète')
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentification Appwrite requise',
        details: "Clé API et Project ID Appwrite manquants",
      })
    }

    // Vérifier la clé API Appwrite
    console.log('🔑 [APPWRITE_AUTH] Validation clé API Appwrite:', apiKey.substring(0, 10) + '...')
    const validApiKeys = [
      env.get('APPWRITE_API_KEY'),
      env.get('APPWRITE_SERVER_KEY'),
    ].filter(Boolean)

    if (!validApiKeys.includes(apiKey)) {
      console.log('❌ [APPWRITE_AUTH] Clé API Appwrite invalide')
      return ctx.response.unauthorized({
        success: false,
        error: 'Clé API Appwrite invalide',
        details: "La clé API Appwrite fournie n'est pas valide",
      })
    }
    console.log('✅ [APPWRITE_AUTH] Clé API Appwrite valide')

    // Vérifier le Project ID Appwrite
    console.log('🔑 [APPWRITE_AUTH] Validation Project ID Appwrite:', projectId)
    const validProjectId = env.get('APPWRITE_PROJECT_ID')

    if (projectId !== validProjectId) {
      console.log('❌ [APPWRITE_AUTH] Project ID Appwrite invalide')
      return ctx.response.unauthorized({
        success: false,
        error: 'Project ID Appwrite invalide',
        details: "Le Project ID Appwrite fourni n'est pas valide",
      })
    }
    console.log('✅ [APPWRITE_AUTH] Project ID Appwrite valide')

    console.log('✅ [APPWRITE_AUTH] Authentification Appwrite OK, passage au contrôleur')

    // Ajouter les informations d'authentification Appwrite au contexte
    ctx.appwriteAuthInfo = {
      apiKey,
      projectId,
      timestamp: new Date().toISOString(),
    }

    await next()
  }
}
