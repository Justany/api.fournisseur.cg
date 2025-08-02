// import 'dotenv/config'
// import { createAppwriteClient } from '@/config/appwrite.js'
// import { ATTRIBUTES, INDEXES, PERMISSIONS } from '@/config/database.js'
// import { logService, logError } from '@/utils/logger.js'
// import type { CollectionAction } from '@/types/database.js'

// /**
//  * Script de gestion des collections Appwrite
//  * Permet de créer, mettre à jour, recréer ou supprimer des collections spécifiques
//  */

// // Configuration des actions à effectuer
// const COLLECTION_ACTIONS: CollectionAction[] = [
//     // Exemples d'actions - décommentez et modifiez selon vos besoins

//     // Créer une nouvelle collection
//     // { action: 'create', collection: 'QUOTES' },

//     // Mettre à jour une collection existante (permissions uniquement)
//     // { action: 'update', collection: 'PRODUCTS' },

//     // Recréer complètement une collection (supprime puis recrée)
//     // { action: 'recreate', collection: 'CONTACTS' },

//     // Supprimer une collection
//     // { action: 'delete', collection: 'OLD_COLLECTION' },

//     // Ignorer une collection
//     // { action: 'skip', collection: 'PARTNERS' },

//     // Mettre à jour uniquement les attributs et index (sans recréer)
//     // { action: 'update-rows', collection: 'QUOTES' }
// ]

// async function manageCollections() {
//     const startTime = Date.now()
//     logService('Appwrite', '🔧 Gestion des collections Appwrite...', 0)

//     if (COLLECTION_ACTIONS.length === 0) {
//         logService('Appwrite', '⚠️ Aucune action configurée. Modifiez COLLECTION_ACTIONS dans le script.', 0)
//         return
//     }

//     try {
//         const { databases, config } = createAppwriteClient()

//         logService('Appwrite', `📊 Connexion à la base de données: ${config.databaseId}`, 0)

//         for (const action of COLLECTION_ACTIONS) {
//             const collectionName = action.collection
//             const collectionId = collectionName.toLowerCase() // Ou utiliser une mapping si nécessaire

//             try {
//                 switch (action.action) {
//                     case 'create':
//                         await createCollection(databases, config.databaseId, collectionId, collectionName)
//                         break

//                     case 'update':
//                         await updateCollection(databases, config.databaseId, collectionId, collectionName)
//                         break

//                     case 'recreate':
//                         await recreateCollection(databases, config.databaseId, collectionId, collectionName)
//                         break

//                     case 'delete':
//                         await deleteCollection(databases, config.databaseId, collectionId, collectionName)
//                         break

//                     case 'update-rows':
//                         await updateCollectionStructure(databases, config.databaseId, collectionId, collectionName)
//                         break

//                     case 'skip':
//                         logService('Appwrite', `⏭️ Collection ${collectionName} ignorée`, 0)
//                         break

//                     default:
//                         logError(new Error(`Action inconnue: ${action.action}`), {
//                             service: 'Appwrite',
//                             context: `Action sur collection ${collectionName}`
//                         })
//                 }
//             } catch (error) {
//                 logError(error instanceof Error ? error : new Error(`Erreur avec collection ${collectionName}`), {
//                     service: 'Appwrite',
//                     context: `${action.action} collection ${collectionName}`
//                 })
//                 // Continue avec les autres collections au lieu de s'arrêter
//                 continue
//             }
//         }

//         const duration = Date.now() - startTime
//         logService('Appwrite', '🎉 Gestion des collections terminée avec succès!', duration)
//     } catch (error) {
//         logError(error instanceof Error ? error : new Error('Erreur lors de la gestion des collections'), {
//             service: 'Appwrite',
//             context: 'Gestion collections'
//         })
//         process.exit(1)
//     }
// }

// async function createCollection(databases: any, databaseId: string, collectionId: string, collectionName: string) {
//     try {
//         await databases.getCollection(databaseId, collectionId)
//         logService('Appwrite', `ℹ️ Collection ${collectionName} existe déjà`, 0)
//         return
//     } catch (error: any) {
//         if (error.code !== 404) {
//             throw error
//         }
//     }

//     logService('Appwrite', `📝 Création de la collection ${collectionName}...`, 0)

//     // Récupération des permissions
//     const permissions = PERMISSIONS[collectionName as keyof typeof PERMISSIONS]
//     const collectionPermissions = permissions
//         ? [...permissions.create, ...permissions.read, ...permissions.update, ...permissions.delete]
//         : []

//     // Création de la collection
//     await databases.createCollection(
//         databaseId,
//         collectionId,
//         collectionName,
//         collectionPermissions
//     )
//     logService('Appwrite', `✅ Collection ${collectionName} créée`, 0)

//     // Ajout des attributs et index
//     await addAttributesAndIndexes(databases, databaseId, collectionId, collectionName)
// }

// async function updateCollection(databases: any, databaseId: string, collectionId: string, collectionName: string) {
//     logService('Appwrite', `🔄 Mise à jour de la collection ${collectionName}...`, 0)

//     // Mise à jour des permissions uniquement
//     const permissions = PERMISSIONS[collectionName as keyof typeof PERMISSIONS]
//     if (permissions) {
//         await databases.updateCollection(
//             databaseId,
//             collectionId,
//             collectionName,
//             [...permissions.create, ...permissions.read, ...permissions.update, ...permissions.delete]
//         )
//         logService('Appwrite', `✅ Permissions de ${collectionName} mises à jour`, 0)
//     }
// }

// async function recreateCollection(databases: any, databaseId: string, collectionId: string, collectionName: string) {
//     // Suppression
//     try {
//         logService('Appwrite', `🗑️ Suppression de la collection ${collectionName}...`, 0)
//         await databases.deleteCollection(databaseId, collectionId)
//         logService('Appwrite', `✅ Collection ${collectionName} supprimée`, 0)
//     } catch (error: any) {
//         if (error.code !== 404) {
//             throw error
//         }
//     }

//     // Recréation
//     await createCollection(databases, databaseId, collectionId, collectionName)
// }

// async function deleteCollection(databases: any, databaseId: string, collectionId: string, collectionName: string) {
//     try {
//         logService('Appwrite', `🗑️ Suppression de la collection ${collectionName}...`, 0)
//         await databases.deleteCollection(databaseId, collectionId)
//         logService('Appwrite', `✅ Collection ${collectionName} supprimée avec succès`, 0)
//     } catch (error: any) {
//         if (error.code === 404) {
//             logService('Appwrite', `ℹ️ Collection ${collectionName} n'existe pas`, 0)
//         } else {
//             throw error
//         }
//     }
// }

// async function updateCollectionStructure(databases: any, databaseId: string, collectionId: string, collectionName: string) {
//     logService('Appwrite', `🔧 Mise à jour de la structure de ${collectionName}...`, 0)

//     // Vérifier que la collection existe
//     try {
//         await databases.getCollection(databaseId, collectionId)
//     } catch (error: any) {
//         if (error.code === 404) {
//             logService('Appwrite', `⚠️ Collection ${collectionName} n'existe pas, création...`, 0)
//             await createCollection(databases, databaseId, collectionId, collectionName)
//             return
//         }
//         throw error
//     }

//     // Ajout des nouveaux attributs et index
//     await addAttributesAndIndexes(databases, databaseId, collectionId, collectionName)
// }

// async function addAttributesAndIndexes(databases: any, databaseId: string, collectionId: string, collectionName: string) {
//     // Création des attributs
//     const attributes = ATTRIBUTES[collectionName]
//     if (attributes) {
//         logService('Appwrite', `📋 Ajout des attributs pour ${collectionName}...`, 0)

//         for (const [attrName, attrConfig] of Object.entries(attributes)) {
//             try {
//                 await createAttribute(databases, databaseId, collectionId, attrName, attrConfig)
//                 logService('Appwrite', `  ✅ Attribut ${attrName} créé`, 0)
//             } catch (error: any) {
//                 if (error.code === 409) {
//                     logService('Appwrite', `  ℹ️ Attribut ${attrName} existe déjà`, 0)
//                 } else {
//                     logError(error, {
//                         service: 'Appwrite',
//                         context: `Création attribut ${attrName} pour ${collectionName}`
//                     })
//                     throw error
//                 }
//             }
//         }
//     }

//     // Création des index
//     const indexes = INDEXES[collectionName]
//     if (indexes) {
//         logService('Appwrite', `🔍 Ajout des index pour ${collectionName}...`, 0)

//         for (const indexConfig of indexes) {
//             try {
//                 await databases.createIndex(
//                     databaseId,
//                     collectionId,
//                     indexConfig.key,
//                     indexConfig.type,
//                     indexConfig.attributes
//                 )
//                 logService('Appwrite', `  ✅ Index ${indexConfig.key} créé`, 0)
//             } catch (error: any) {
//                 if (error.code === 409) {
//                     logService('Appwrite', `  ℹ️ Index ${indexConfig.key} existe déjà`, 0)
//                 } else {
//                     logError(error, {
//                         service: 'Appwrite',
//                         context: `Création index ${indexConfig.key} pour ${collectionName}`
//                     })
//                     throw error
//                 }
//             }
//         }
//     }
// }

// async function createAttribute(databases: any, databaseId: string, collectionId: string, attrName: string, attrConfig: any) {
//     const { type, required = false, array = false, size, elements, default: defaultValue, min, max } = attrConfig

//     switch (type) {
//         case 'string':
//             await databases.createStringAttribute(
//                 databaseId,
//                 collectionId,
//                 attrName,
//                 size,
//                 required,
//                 defaultValue,
//                 array
//             )
//             break

//         case 'integer':
//             await databases.createIntegerAttribute(
//                 databaseId,
//                 collectionId,
//                 attrName,
//                 required,
//                 min,
//                 max,
//                 defaultValue,
//                 array
//             )
//             break

//         case 'double':
//             await databases.createFloatAttribute(
//                 databaseId,
//                 collectionId,
//                 attrName,
//                 required,
//                 min,
//                 max,
//                 defaultValue,
//                 array
//             )
//             break

//         case 'boolean':
//             await databases.createBooleanAttribute(
//                 databaseId,
//                 collectionId,
//                 attrName,
//                 required,
//                 defaultValue,
//                 array
//             )
//             break

//         case 'email':
//             await databases.createEmailAttribute(
//                 databaseId,
//                 collectionId,
//                 attrName,
//                 required,
//                 defaultValue,
//                 array
//             )
//             break

//         case 'enum':
//             await databases.createEnumAttribute(
//                 databaseId,
//                 collectionId,
//                 attrName,
//                 elements,
//                 required,
//                 defaultValue,
//                 array
//             )
//             break

//         case 'url':
//             await databases.createUrlAttribute(
//                 databaseId,
//                 collectionId,
//                 attrName,
//                 required,
//                 defaultValue,
//                 array
//             )
//             break

//         case 'datetime':
//             await databases.createDatetimeAttribute(
//                 databaseId,
//                 collectionId,
//                 attrName,
//                 required,
//                 defaultValue,
//                 array
//             )
//             break

//         default:
//             throw new Error(`Type d'attribut non supporté: ${type}`)
//     }
// }

// // Exécution du script
// manageCollections()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error('❌ Erreur non gérée:', error)
//         process.exit(1)
//     })
