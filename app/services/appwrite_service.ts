import { Client, Databases, Account, Users, Storage, Functions } from 'node-appwrite'
import env from '#start/env'

/**
 * Service Appwrite - Wrapper pour les opérations serveur
 * Permet d'effectuer des opérations CRUD avancées impossibles côté client
 */
export class AppwriteService {
  private client: Client
  public databases: Databases
  public account: Account
  public users: Users
  public storage: Storage
  public functions: Functions

  constructor() {
    this.client = new Client()

    // Configuration du client Appwrite
    this.client
      .setEndpoint(env.get('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
      .setProject(env.get('APPWRITE_PROJECT_ID'))
      .setKey(env.get('APPWRITE_API_KEY'))

    // Initialisation des services
    this.databases = new Databases(this.client)
    this.account = new Account(this.client)
    this.users = new Users(this.client)
    this.storage = new Storage(this.client)
    this.functions = new Functions(this.client)
  }

  /**
   * Créer une collection avec attributs
   */
  async createCollection(
    databaseId: string,
    collectionId: string,
    name: string,
    permissions: string[] = [],
    documentSecurity: boolean = false
  ) {
    try {
      return await this.databases.createCollection(
        databaseId,
        collectionId,
        name,
        permissions,
        documentSecurity
      )
    } catch (error) {
      console.error('Erreur création collection:', error)
      throw error
    }
  }

  /**
   * Créer un document avec validation serveur
   */
  async createDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Record<string, any>,
    permissions: string[] = []
  ) {
    try {
      return await this.databases.createDocument(
        databaseId,
        collectionId,
        documentId,
        data,
        permissions
      )
    } catch (error) {
      console.error('Erreur création document:', error)
      throw error
    }
  }

  /**
   * Mettre à jour un document avec validation métier
   */
  async updateDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Record<string, any>,
    permissions?: string[]
  ) {
    try {
      return await this.databases.updateDocument(
        databaseId,
        collectionId,
        documentId,
        data,
        permissions
      )
    } catch (error) {
      console.error('Erreur mise à jour document:', error)
      throw error
    }
  }

  /**
   * Supprimer un document avec vérifications
   */
  async deleteDocument(databaseId: string, collectionId: string, documentId: string) {
    try {
      return await this.databases.deleteDocument(databaseId, collectionId, documentId)
    } catch (error) {
      console.error('Erreur suppression document:', error)
      throw error
    }
  }

  /**
   * Lister des documents avec filtres avancés
   */
  async listDocuments(databaseId: string, collectionId: string, queries: string[] = []) {
    try {
      return await this.databases.listDocuments(databaseId, collectionId, queries)
    } catch (error) {
      console.error('Erreur liste documents:', error)
      throw error
    }
  }

  /**
   * Obtenir un document par ID
   */
  async getDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    queries: string[] = []
  ) {
    try {
      return await this.databases.getDocument(databaseId, collectionId, documentId, queries)
    } catch (error) {
      console.error('Erreur récupération document:', error)
      throw error
    }
  }

  /**
   * Créer un utilisateur avec données personnalisées
   */
  async createUser(
    userId: string,
    email: string,
    phone?: string,
    password?: string,
    name?: string
  ) {
    try {
      return await this.users.create(userId, email, phone, password, name)
    } catch (error) {
      console.error('Erreur création utilisateur:', error)
      throw error
    }
  }

  /**
   * Mettre à jour les préférences utilisateur
   */
  async updateUserPrefs(userId: string, prefs: Record<string, any>) {
    try {
      return await this.users.updatePrefs(userId, prefs)
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error)
      throw error
    }
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getDatabaseUsage(databaseId: string, range: string = '30d') {
    try {
      return await this.databases.getUsage(databaseId, range)
    } catch (error) {
      console.error('Erreur statistiques base:', error)
      throw error
    }
  }

  /**
   * Créer un attribut pour une collection
   */
  async createStringAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    size: number,
    required: boolean = false,
    defaultValue?: string
  ) {
    try {
      return await this.databases.createStringAttribute(
        databaseId,
        collectionId,
        key,
        size,
        required,
        defaultValue
      )
    } catch (error) {
      console.error('Erreur création attribut string:', error)
      throw error
    }
  }

  /**
   * Créer un attribut entier
   */
  async createIntegerAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean = false,
    min?: number,
    max?: number,
    defaultValue?: number
  ) {
    try {
      return await this.databases.createIntegerAttribute(
        databaseId,
        collectionId,
        key,
        required,
        min,
        max,
        defaultValue
      )
    } catch (error) {
      console.error('Erreur création attribut integer:', error)
      throw error
    }
  }

  /**
   * Créer un attribut booléen
   */
  async createBooleanAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean = false,
    defaultValue?: boolean
  ) {
    try {
      return await this.databases.createBooleanAttribute(
        databaseId,
        collectionId,
        key,
        required,
        defaultValue
      )
    } catch (error) {
      console.error('Erreur création attribut boolean:', error)
      throw error
    }
  }

  /**
   * Créer un attribut datetime
   */
  async createDatetimeAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean = false,
    defaultValue?: string
  ) {
    try {
      return await this.databases.createDatetimeAttribute(
        databaseId,
        collectionId,
        key,
        required,
        defaultValue
      )
    } catch (error) {
      console.error('Erreur création attribut datetime:', error)
      throw error
    }
  }

  /**
   * Vérifier la santé de la connexion Appwrite
   */
  async healthCheck() {
    try {
      // Test simple de connexion
      const result = await this.databases.list()
      return {
        status: 'healthy',
        databases: result.total,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }
}
