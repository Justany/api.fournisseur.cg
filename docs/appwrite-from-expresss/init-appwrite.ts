// import 'dotenv/config'
// import { createAppwriteClient, COLLECTIONS, BUCKETS } from '@/config/appwrite.js'
// import { ATTRIBUTES, INDEXES, PERMISSIONS } from '@/config/database.js'
// import { Permission, Role } from 'node-appwrite'
// import { logService, logError } from '@/utils/logger.js'

// // Types pour les actions d'initialisation
// type ResourceType = 'collection' | 'bucket'
// type ActionType = 'create' | 'update' | 'recreate' | 'delete' | 'skip'

// interface InitAction {
//   type: ResourceType
//   id: string
//   name: string
//   action: ActionType
// }

// /**
//  * Script d'initialisation pour Appwrite
//  * - Vérifie la connexion
//  * - Crée les collections nécessaires si elles n'existent pas
//  * - Configure les attributs et index
//  * - Configure les permissions
//  *
//  * @param actions - Liste des actions à effectuer, si vide toutes les ressources seront créées
//  */
// async function initializeAppwrite(actions: InitAction[] = []) {
//   const startTime = Date.now()
//   logService('Appwrite', '🚀 Initialisation d\'Appwrite...', 0)

//   try {
//     // Récupération du client Appwrite
//     const { databases, config, storage } = createAppwriteClient()

//     logService('Appwrite', `📊 Connexion à la base de données: ${config.databaseId}`, 0)

//     // Vérification que la base de données existe
//     try {
//       await databases.get(config.databaseId)
//       logService('Appwrite', '✅ Base de données trouvée', 0)
//     } catch (error: any) {
//       if (error.code === 404) {
//         logService('Appwrite', '⚠️ Base de données non trouvée, création...', 0)
//         await databases.create(config.databaseId, 'fournisseur-cg', true)
//         logService('Appwrite', '✅ Base de données créée', 0)
//       } else {
//         throw error
//       }
//     }

//     // Si aucune action spécifiée, on crée toutes les ressources
//     if (actions.length === 0) {
//       // Ajouter les collections
//       const collectionActions: InitAction[] = Object.entries(COLLECTIONS).map(([key, id]) => ({
//         type: 'collection' as ResourceType,
//         id,
//         name: key,
//         action: 'create' as ActionType
//       }));

//       // Ajouter les buckets
//       const bucketActions: InitAction[] = Object.entries(BUCKETS).map(([key, id]) => ({
//         type: 'bucket' as ResourceType,
//         id,
//         name: key,
//         action: 'create' as ActionType
//       }));

//       actions = [...collectionActions, ...bucketActions];
//     }

//     // Traitement des actions
//     for (const action of actions) {
//       try {
//         switch (action.action) {
//           case 'skip':
//             logService('Appwrite', `⏭️ Skip de ${action.type} ${action.name}`, 0)
//             break

//           case 'delete':
//             if (action.type === 'collection') {
//               try {
//                 logService('Appwrite', `🗑️ Suppression de la collection ${action.name}...`, 0)
//                 await databases.deleteCollection(config.databaseId, action.id)
//                 logService('Appwrite', `✅ Collection ${action.name} supprimée avec succès`, 0)
//               } catch (error: any) {
//                 if (error.code !== 404) {
//                   throw error
//                 }
//               }
//             } else if (action.type === 'bucket') {
//               try {
//                 logService('Appwrite', `🗑️ Suppression du bucket ${action.name}...`, 0)
//                 await storage.deleteBucket(action.id)
//                 logService('Appwrite', `✅ Bucket ${action.name} supprimé avec succès`, 0)
//               } catch (error: any) {
//                 if (error.code !== 404) {
//                   throw error
//                 }
//               }
//             }
//             break

//           case 'recreate':
//             // Suppression puis création
//             if (action.type === 'collection') {
//               try {
//                 logService('Appwrite', `🗑️ Suppression de la collection ${action.name} pour recréation...`, 0)
//                 await databases.deleteCollection(config.databaseId, action.id)
//                 logService('Appwrite', `✅ Collection ${action.name} supprimée avec succès`, 0)
//               } catch (error: any) {
//                 if (error.code !== 404) {
//                   logService('Appwrite', `⚠️ Erreur lors de la suppression de ${action.name}: ${error.message}`, 0)
//                 }
//               }

//               // Création après suppression
//               await createCollection(databases, config.databaseId, action)
//             } else if (action.type === 'bucket') {
//               try {
//                 logService('Appwrite', `🗑️ Suppression du bucket ${action.name} pour recréation...`, 0)
//                 await storage.deleteBucket(action.id)
//                 logService('Appwrite', `✅ Bucket ${action.name} supprimé avec succès`, 0)
//               } catch (error: any) {
//                 if (error.code !== 404) {
//                   logService('Appwrite', `⚠️ Erreur lors de la suppression du bucket ${action.name}: ${error.message}`, 0)
//                 }
//               }

//               // Création après suppression
//               await createBucket(storage, action)
//             }
//             break

//           case 'create':
//             if (action.type === 'collection') {
//               try {
//                 await databases.getCollection(config.databaseId, action.id)
//                 logService('Appwrite', `ℹ️ Collection ${action.name} existe déjà`, 0)
//               } catch (error: any) {
//                 if (error.code === 404) {
//                   await createCollection(databases, config.databaseId, action)
//                 } else {
//                   throw error
//                 }
//               }
//             } else if (action.type === 'bucket') {
//               try {
//                 await storage.getBucket(action.id)
//                 logService('Appwrite', `ℹ️ Bucket ${action.name} existe déjà`, 0)
//               } catch (error: any) {
//                 if (error.code === 404) {
//                   await createBucket(storage, action)
//                 } else {
//                   throw error
//                 }
//               }
//             }
//             break

//           case 'update':
//             if (action.type === 'collection') {
//               logService('Appwrite', `🔄 Mise à jour de la collection ${action.name}...`, 0)
//               // Mise à jour des permissions
//               const permissions = PERMISSIONS[action.name as keyof typeof PERMISSIONS]
//               if (permissions) {
//                 await databases.updateCollection(
//                   config.databaseId,
//                   action.id,
//                   action.name,
//                   [...permissions.create, ...permissions.read, ...permissions.update, ...permissions.delete]
//                 )
//               }
//               logService('Appwrite', `✅ Collection ${action.name} mise à jour avec succès`, 0)
//             } else if (action.type === 'bucket') {
//               logService('Appwrite', `🔄 Mise à jour du bucket ${action.name}...`, 0)
//               // Mise à jour des permissions
//               await storage.updateBucket(
//                 action.id,
//                 action.name,
//                 getBucketPermissions(),
//                 true,
//                 true
//               )
//               logService('Appwrite', `✅ Bucket ${action.name} mis à jour avec succès`, 0)
//             }
//             break
//         }
//       } catch (error) {
//         logError(error instanceof Error ? error : new Error(`Erreur avec ${action.type} ${action.name}`), {
//           service: 'Appwrite',
//           context: `${action.action} ${action.type} ${action.name}`
//         })
//         throw error
//       }
//     }

//     const duration = Date.now() - startTime
//     logService('Appwrite', '🎉 Initialisation d\'Appwrite terminée avec succès!', duration)
//   } catch (error) {
//     logError(error instanceof Error ? error : new Error('Erreur inconnue'), {
//       service: 'Appwrite',
//       context: 'Initialisation'
//     })
//     process.exit(1)
//   }
// }

// /**
//  * Crée une collection avec les attributs, index et permissions
//  */
// async function createCollection(databases: any, databaseId: string, action: InitAction) {
//   logService('Appwrite', `📝 Création de la collection ${action.name}...`, 0)

//   // Récupération des permissions pour cette collection
//   const permissions = PERMISSIONS[action.name as keyof typeof PERMISSIONS]
//   const collectionPermissions = permissions
//     ? [...permissions.create, ...permissions.read, ...permissions.update, ...permissions.delete]
//     : getCollectionPermissions()

//   // Création de la collection
//   await databases.createCollection(
//     databaseId,
//     action.id,
//     action.name,
//     collectionPermissions
//   )
//   logService('Appwrite', `✅ Collection ${action.name} créée avec succès`, 0)

//   // Création des attributs
//   const attributes = ATTRIBUTES[action.name]
//   if (attributes) {
//     logService('Appwrite', `📋 Création des attributs pour ${action.name}...`, 0)

//     for (const [attrName, attrConfig] of Object.entries(attributes)) {
//       try {
//         await createAttribute(databases, databaseId, action.id, attrName, attrConfig)
//         logService('Appwrite', `  ✅ Attribut ${attrName} créé`, 0)
//       } catch (error: any) {
//         if (error.code !== 409) { // 409 = attribut existe déjà
//           logError(error, {
//             service: 'Appwrite',
//             context: `Création attribut ${attrName} pour ${action.name}`
//           })
//           throw error
//         } else {
//           logService('Appwrite', `  ℹ️ Attribut ${attrName} existe déjà`, 0)
//         }
//       }
//     }
//   }

//   // Création des index
//   const indexes = INDEXES[action.name]
//   if (indexes) {
//     logService('Appwrite', `🔍 Création des index pour ${action.name}...`, 0)

//     for (const indexConfig of indexes) {
//       try {
//         await databases.createIndex(
//           databaseId,
//           action.id,
//           indexConfig.key,
//           indexConfig.type,
//           indexConfig.attributes
//         )
//         logService('Appwrite', `  ✅ Index ${indexConfig.key} créé`, 0)
//       } catch (error: any) {
//         if (error.code !== 409) { // 409 = index existe déjà
//           logError(error, {
//             service: 'Appwrite',
//             context: `Création index ${indexConfig.key} pour ${action.name}`
//           })
//           throw error
//         } else {
//           logService('Appwrite', `  ℹ️ Index ${indexConfig.key} existe déjà`, 0)
//         }
//       }
//     }
//   }
// }

// /**
//  * Crée un attribut selon son type
//  */
// async function createAttribute(databases: any, databaseId: string, collectionId: string, attrName: string, attrConfig: any) {
//   const { type, required = false, array = false, size, elements, default: defaultValue, min, max } = attrConfig

//   switch (type) {
//     case 'string':
//       await databases.createStringAttribute(
//         databaseId,
//         collectionId,
//         attrName,
//         size,
//         required,
//         defaultValue,
//         array
//       )
//       break

//     case 'integer':
//       await databases.createIntegerAttribute(
//         databaseId,
//         collectionId,
//         attrName,
//         required,
//         min,
//         max,
//         defaultValue,
//         array
//       )
//       break

//     case 'double':
//       await databases.createFloatAttribute(
//         databaseId,
//         collectionId,
//         attrName,
//         required,
//         min,
//         max,
//         defaultValue,
//         array
//       )
//       break

//     case 'boolean':
//       await databases.createBooleanAttribute(
//         databaseId,
//         collectionId,
//         attrName,
//         required,
//         defaultValue,
//         array
//       )
//       break

//     case 'email':
//       await databases.createEmailAttribute(
//         databaseId,
//         collectionId,
//         attrName,
//         required,
//         defaultValue,
//         array
//       )
//       break

//     case 'enum':
//       await databases.createEnumAttribute(
//         databaseId,
//         collectionId,
//         attrName,
//         elements,
//         required,
//         defaultValue,
//         array
//       )
//       break

//     case 'url':
//       await databases.createUrlAttribute(
//         databaseId,
//         collectionId,
//         attrName,
//         required,
//         defaultValue,
//         array
//       )
//       break

//     case 'datetime':
//       await databases.createDatetimeAttribute(
//         databaseId,
//         collectionId,
//         attrName,
//         required,
//         defaultValue,
//         array
//       )
//       break

//     default:
//       throw new Error(`Type d'attribut non supporté: ${type}`)
//   }
// }

// /**
//  * Crée un bucket avec les permissions standard
//  */
// async function createBucket(storage: any, action: InitAction) {
//   logService('Appwrite', `📝 Création du bucket ${action.name}...`, 0)

//   // Configuration par défaut pour les buckets
//   const fileSizeLimit = action.name === 'QUOTES' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
//   const allowedFileExtensions = action.name === 'QUOTES'
//     ? ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']
//     : ['jpg', 'jpeg', 'png', 'webp']

//   await storage.createBucket(
//     action.id,
//     action.name,
//     getBucketPermissions(),
//     true, // enabled
//     true, // maximumFileSize
//     fileSizeLimit,
//     allowedFileExtensions
//   )
//   logService('Appwrite', `✅ Bucket ${action.name} créé avec succès`, 0)
// }

// /**
//  * Retourne les permissions standard pour les collections
//  */
// function getCollectionPermissions() {
//   return [
//     Permission.read(Role.any()),
//     Permission.create(Role.any()),
//     Permission.update(Role.team('administrators')),
//     Permission.delete(Role.team('administrators'))
//   ]
// }

// /**
//  * Retourne les permissions standard pour les buckets
//  */
// function getBucketPermissions() {
//   return [
//     Permission.read(Role.any()),
//     Permission.create(Role.any()),
//     Permission.update(Role.team('administrators')),
//     Permission.delete(Role.team('administrators'))
//   ]
// }

// // Exemple d'utilisation pour des actions spécifiques
// const specificActions: InitAction[] = [
//   // { type: 'collection', id: 'quotes', name: 'QUOTES', action: 'recreate' },
//   // { type: 'collection', id: 'products', name: 'PRODUCTS', action: 'update' },
//   // { type: 'bucket', id: 'quotes', name: 'QUOTES', action: 'create' },
// ]

// // Exécution du script avec les actions par défaut (création de toutes les ressources)
// initializeAppwrite(specificActions)
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error('❌ Erreur non gérée:', error)
//     process.exit(1)
//   })
