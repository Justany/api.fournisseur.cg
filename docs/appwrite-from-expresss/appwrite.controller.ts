// import { Request, Response } from 'express'
// import { createAppwriteClient, COLLECTIONS, BUCKETS } from '@/config/appwrite.js'
// import { quotesService } from '@/services/quotes.service.js'
// import { productsService } from '@/services/products.service.js'
// import { RequestWithId } from '@/types/api.js'
// import { logError } from '@/utils/logger.js'

// /**
//  * Contrôleur pour les opérations liées à Appwrite
//  */
// export class AppwriteController {
//   /**
//    * Récupère les informations de configuration d'Appwrite
//    */
//   getConfig(req: Request, res: Response) {
//     try {
//       const requestWithId = req as RequestWithId
//       const { config } = createAppwriteClient()

//       // Ne pas exposer la clé API
//       const safeConfig = {
//         endpoint: config.endpoint,
//         projectId: config.projectId,
//         databaseId: config.databaseId,
//         collections: COLLECTIONS,
//         buckets: BUCKETS
//       }

//       res.json({
//         success: true,
//         data: safeConfig,
//         timestamp: new Date().toISOString(),
//         requestId: requestWithId.id
//       })
//     } catch (error) {
//       const requestWithId = req as RequestWithId
//       logError(error as Error, {
//         requestId: requestWithId.id,
//         method: 'getConfig',
//         controller: 'AppwriteController'
//       })

//       res.status(500).json({
//         success: false,
//         error: 'Erreur lors de la récupération de la configuration Appwrite',
//         timestamp: new Date().toISOString(),
//         requestId: requestWithId.id
//       })
//     }
//   }

//   /**
//    * Récupère les statistiques des collections
//    */
//   getStats(req: Request, res: Response) {
//     const requestWithId = req as RequestWithId

//     Promise.all([
//       quotesService.count(),
//       productsService.count()
//     ])
//       .then(([quotesCount, productsCount]) => {
//         res.json({
//           success: true,
//           data: {
//             quotes: quotesCount,
//             products: productsCount,
//             timestamp: new Date().toISOString()
//           },
//           timestamp: new Date().toISOString(),
//           requestId: requestWithId.id
//         })
//       })
//       .catch(error => {
//         logError(error as Error, {
//           requestId: requestWithId.id,
//           method: 'getStats',
//           controller: 'AppwriteController'
//         })

//         res.status(500).json({
//           success: false,
//           error: 'Erreur lors de la récupération des statistiques',
//           timestamp: new Date().toISOString(),
//           requestId: requestWithId.id
//         })
//       })
//   }

//   /**
//    * Vérifie la santé de la connexion Appwrite
//    */
//   healthCheck(req: Request, res: Response) {
//     const requestWithId = req as RequestWithId

//     try {
//       const { databases, config } = createAppwriteClient()

//       // Tentative de récupération d'un document pour vérifier la connexion
//       databases.listCollections(config.databaseId)
//         .then(() => {
//           res.json({
//             success: true,
//             data: {
//               status: 'healthy',
//               message: 'Connexion à Appwrite établie avec succès',
//               timestamp: new Date().toISOString()
//             },
//             timestamp: new Date().toISOString(),
//             requestId: requestWithId.id
//           })
//         })
//         .catch(error => {
//           const err = error as Error
//           logError(err, {
//             requestId: requestWithId.id,
//             method: 'healthCheck',
//             controller: 'AppwriteController'
//           })

//           res.status(500).json({
//             success: false,
//             error: 'Erreur de connexion à Appwrite',
//             details: err.message,
//             timestamp: new Date().toISOString(),
//             requestId: requestWithId.id
//           })
//         })
//     } catch (error) {
//       const err = error as Error
//       logError(err, {
//         requestId: requestWithId.id,
//         method: 'healthCheck',
//         controller: 'AppwriteController'
//       })

//       res.status(500).json({
//         success: false,
//         error: 'Erreur de connexion à Appwrite',
//         details: err.message,
//         timestamp: new Date().toISOString(),
//         requestId: requestWithId.id
//       })
//     }
//   }
// }
