// import { ID, Query, Models } from 'node-appwrite'
// import { createAppwriteClient, COLLECTIONS } from '@/config/appwrite.js'
// import { AppwriteDocument } from '@/types/appwrite.js'
// import { logError, logService } from '@/utils/logger.js'

// /**
//  * Service de base pour les opérations Appwrite
//  * Fournit les méthodes CRUD communes à tous les services
//  */
// export class BaseAppwriteService<T extends AppwriteDocument> {
//   protected collectionId: string
//   private appwrite = createAppwriteClient()
//   protected databases = this.appwrite.databases
//   protected storage = this.appwrite.storage
//   protected users = this.appwrite.users
//   protected teams = this.appwrite.teams
//   protected databaseId = this.appwrite.config.databaseId

//   /**
//    * @param collectionId - ID de la collection Appwrite
//    */
//   constructor(collectionId: string) {
//     this.collectionId = collectionId
//   }

//   /**
//    * Crée un document dans la collection
//    * @param data - Données du document à créer
//    * @returns Document créé
//    */
//   async create(data: Omit<Partial<T>, keyof Models.Document>): Promise<T> {
//     const start = Date.now()
//     try {
//       const document = await this.databases.createDocument(
//         this.databaseId,
//         this.collectionId,
//         ID.unique(),
//         data
//       ) as T

//       const duration = Date.now() - start
//       logService('appwrite', `Document créé dans ${this.collectionId}`, duration)
//       return document
//     } catch (error) {
//       logError(error as Error, {
//         service: 'appwrite',
//         method: 'create',
//         collection: this.collectionId
//       })
//       throw error
//     }
//   }

//   /**
//    * Récupère un document par son ID
//    * @param id - ID du document
//    * @returns Document trouvé
//    */
//   async getById(id: string): Promise<T> {
//     const start = Date.now()
//     try {
//       const document = await this.databases.getDocument(
//         this.databaseId,
//         this.collectionId,
//         id
//       ) as T

//       const duration = Date.now() - start
//       logService('appwrite', `Document récupéré dans ${this.collectionId}`, duration)
//       return document
//     } catch (error) {
//       logError(error as Error, {
//         service: 'appwrite',
//         method: 'getById',
//         collection: this.collectionId,
//         documentId: id
//       })
//       throw error
//     }
//   }

//   /**
//    * Liste les documents de la collection
//    * @param queries - Requêtes pour filtrer, trier, etc.
//    * @returns Liste de documents
//    */
//   async list(queries: string[] = []): Promise<Models.DocumentList<T>> {
//     const start = Date.now()
//     try {
//       const documents = await this.databases.listDocuments(
//         this.databaseId,
//         this.collectionId,
//         queries
//       ) as Models.DocumentList<T>

//       const duration = Date.now() - start
//       logService('appwrite', `Liste de documents récupérée dans ${this.collectionId}`, duration)
//       return documents
//     } catch (error) {
//       logError(error as Error, {
//         service: 'appwrite',
//         method: 'list',
//         collection: this.collectionId
//       })
//       throw error
//     }
//   }

//   /**
//    * Met à jour un document
//    * @param id - ID du document
//    * @param data - Données à mettre à jour
//    * @returns Document mis à jour
//    */
//   async update(id: string, data: Partial<Omit<T, keyof Models.Document>>): Promise<T> {
//     const start = Date.now()
//     try {
//       const document = await this.databases.updateDocument(
//         this.databaseId,
//         this.collectionId,
//         id,
//         data as any
//       ) as T

//       const duration = Date.now() - start
//       logService('appwrite', `Document mis à jour dans ${this.collectionId}`, duration)
//       return document
//     } catch (error) {
//       logError(error as Error, {
//         service: 'appwrite',
//         method: 'update',
//         collection: this.collectionId,
//         documentId: id
//       })
//       throw error
//     }
//   }

//   /**
//    * Supprime un document
//    * @param id - ID du document
//    * @returns Promesse résolue si suppression réussie
//    */
//   async delete(id: string): Promise<void> {
//     const start = Date.now()
//     try {
//       await this.databases.deleteDocument(
//         this.databaseId,
//         this.collectionId,
//         id
//       )

//       const duration = Date.now() - start
//       logService('appwrite', `Document supprimé dans ${this.collectionId}`, duration)
//     } catch (error) {
//       logError(error as Error, {
//         service: 'appwrite',
//         method: 'delete',
//         collection: this.collectionId,
//         documentId: id
//       })
//       throw error
//     }
//   }

//   /**
//    * Compte le nombre de documents dans la collection
//    * @param queries - Requêtes pour filtrer
//    * @returns Nombre de documents
//    */
//   async count(queries: string[] = []): Promise<number> {
//     try {
//       const result = await this.list([...queries, Query.limit(1)]);
//       return result.total;
//     } catch (error) {
//       logError(error as Error, {
//         service: 'appwrite',
//         method: 'count',
//         collection: this.collectionId
//       });
//       throw error;
//     }
//   }
// }
