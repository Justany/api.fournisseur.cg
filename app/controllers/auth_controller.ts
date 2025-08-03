import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import User from '#models/user'

@inject()
export default class AuthController {
  /**
   * @register
   * @summary Register new user
   * @description Create new user account
   * @tag Auth
   * @requestBody {"fullName": "John Doe", "email": "test@example.com", "password": "password123"}
   * @responseBody 201 - {"success": true, "message": "Compte créé avec succès", "data": {"user": {...}, "token": "..."}}
   * @responseBody 400 - {"error": "Données invalides"}
   * @responseBody 409 - {"error": "Email déjà utilisé"}
   */
  async register({ request, response }: HttpContext) {
    try {
      const data = request.only(['fullName', 'email', 'password'])

      // Validation des données
      if (!data.email || !data.password) {
        return response.badRequest({
          success: false,
          error: 'Données manquantes',
          details: 'email et password sont requis',
        })
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findBy('email', data.email)
      if (existingUser) {
        return response.conflict({
          success: false,
          error: 'Email déjà utilisé',
          details: 'Un compte avec cet email existe déjà',
        })
      }

      // Créer l'utilisateur
      const user = await User.create({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      })

      // Générer un token d'accès
      const token = await User.accessTokens.create(user)

      return response.created({
        success: true,
        message: 'Compte créé avec succès',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            createdAt: user.createdAt,
          },
          token: token.value,
        },
      })
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      return response.internalServerError({
        success: false,
        error: "Erreur lors de l'inscription",
        details: error.message,
      })
    }
  }

  /**
   * @login
   * @summary User login
   * @description Authenticate user and generate token
   * @tag Auth
   * @requestBody {"email": "test@example.com", "password": "password123"}
   * @responseBody 200 - {"success": true, "message": "Connexion réussie", "data": {"user": {...}, "token": "..."}}
   * @responseBody 401 - {"error": "Identifiants invalides"}
   */
  async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      // Validation des données
      if (!email || !password) {
        return response.badRequest({
          success: false,
          error: 'Données manquantes',
          details: 'email et password sont requis',
        })
      }

      // Authentifier l'utilisateur
      const user = await User.verifyCredentials(email, password)
      if (!user) {
        return response.unauthorized({
          success: false,
          error: 'Identifiants invalides',
          details: 'Email ou mot de passe incorrect',
        })
      }

      // Générer un token d'accès
      const token = await User.accessTokens.create(user)

      return response.ok({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            createdAt: user.createdAt,
          },
          token: token.value!.release(),
          tokenBearer: `Bearer ${token.value!.release()}`,
        },
      })
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la connexion',
        details: error.message,
      })
    }
  }

  /**
   * @logout
   * @summary User logout
   * @description Invalidate current access token
   * @tag Auth
   * @responseBody 200 - {"success": true, "message": "Déconnexion réussie"}
   * @responseBody 401 - {"error": "Token invalide"}
   */
  async logout({ auth, response }: HttpContext) {
    try {
      const token = auth.use('api')
      await token.invalidateToken()

      return response.ok({
        success: true,
        message: 'Déconnexion réussie',
      })
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la déconnexion',
        details: error.message,
      })
    }
  }

  /**
   * @profile
   * @summary User profile
   * @description Get authenticated user profile information
   * @tag Auth
   * @responseBody 200 - {"success": true, "data": {"user": {...}}}
   * @responseBody 401 - {"error": "Non authentifié"}
   */
  async profile({ auth, response }: HttpContext) {
    try {
      const user = auth.use('api').user!

      return response.ok({
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      })
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la récupération du profil',
        details: error.message,
      })
    }
  }

  /**
   * @refreshToken
   * @summary Refresh token
   * @description Generate new access token
   * @tag Auth
   * @responseBody 200 - {"success": true, "data": {"token": "..."}}
   * @responseBody 401 - {"error": "Token invalide"}
   */
  async refreshToken({ auth, response }: HttpContext) {
    try {
      const user = auth.use('api').user!
      const token = await User.accessTokens.create(user)

      return response.ok({
        success: true,
        message: 'Token rafraîchi avec succès',
        data: {
          token: token.value,
        },
      })
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error)
      return response.internalServerError({
        success: false,
        error: 'Erreur lors du rafraîchissement du token',
        details: error.message,
      })
    }
  }

  /**
   * @getToken
   * @summary Get clear token (for testing)
   * @description Temporary route to get complete token
   * @tag Auth
   * @requestBody {"email": "test@example.com", "password": "password123"}
   * @responseBody 200 - {"token": "Bearer ..."}
   */
  async getToken({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      // Authentifier l'utilisateur
      const user = await User.verifyCredentials(email, password)
      if (!user) {
        return response.unauthorized({
          success: false,
          error: 'Identifiants invalides',
        })
      }

      // Générer un token d'accès
      const token = await User.accessTokens.create(user)

      return response.ok({
        success: true,
        token: `Bearer ${token.value}`,
        tokenValue: token.value,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: 'Erreur lors de la génération du token',
        details: error.message,
      })
    }
  }
}
