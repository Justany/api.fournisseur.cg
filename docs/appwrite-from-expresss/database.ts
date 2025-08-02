// import { Permission, Role } from 'node-appwrite'
// import type { IndexType } from 'node-appwrite'
// import type { BaseAttribute, IndexConfig } from '@/types/database.js'

// // Configuration des attributs des collections
// export const ATTRIBUTES: Record<string, Record<string, BaseAttribute>> = {
//   QUOTES: {
//     // Identifiants
//     quote_id: { type: 'string', size: 36, required: true }, // Format: FC-QMM-XXXX-YYYY
//     user_id: { type: 'string', size: 50, required: false },

//     // Informations personnelles
//     first_name: { type: 'string', size: 255, required: true },
//     last_name: { type: 'string', size: 255, required: true },
//     email: { type: 'string', size: 255, required: true },
//     phone: { type: 'string', size: 50, required: true },
//     company: { type: 'string', size: 255, required: false },

//     // Détails du projet
//     service_type: { type: 'string', size: 100, required: true },
//     project_description: { type: 'string', size: 16384, required: true }, // Using TEXT
//     estimated_budget: { type: 'string', size: 50, required: true },
//     desired_timeline: { type: 'string', size: 100, required: true },

//     // Détails du colis
//     package_length: { type: 'string', size: 10, required: false },
//     package_width: { type: 'string', size: 10, required: false },
//     package_height: { type: 'string', size: 10, required: false },
//     package_weight: { type: 'string', size: 10, required: false },

//     // Liens et médias
//     product_links: { type: 'string', size: 16384, required: false }, // Using TEXT
//     photos_urls: { type: 'string', size: 16384, required: false }, // Using TEXT

//     // Statut et métadonnées
//     status: { type: 'string', size: 20, required: false, default: 'pending' },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false },
//     viewed_at: { type: 'string', size: 30, required: false }
//   },

//   CONTACTS: {
//     first_name: { type: 'string', size: 255, required: true },
//     last_name: { type: 'string', size: 255, required: true },
//     email: { type: 'string', size: 255, required: true },
//     phone: { type: 'string', size: 50, required: true },
//     subject: { type: 'string', size: 255, required: true },
//     message: { type: 'string', size: 16384, required: true },
//     status: { type: 'string', size: 20, required: false, default: 'new' },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   CONTACTS_PRO: {
//     // Informations entreprise
//     company: { type: 'string', size: 255, required: true },
//     industry: { type: 'string', size: 255, required: false },
//     employee_count: { type: 'string', size: 100, required: false },

//     // Informations contact
//     first_name: { type: 'string', size: 255, required: true },
//     last_name: { type: 'string', size: 255, required: true },
//     email: { type: 'string', size: 255, required: true },
//     phone: { type: 'string', size: 50, required: false },
//     role: { type: 'string', size: 255, required: false },

//     // Projet et besoins
//     needs: { type: 'string', size: 16384, required: false }, // JSON array stringifié
//     budget: { type: 'string', size: 100, required: false },
//     timeline: { type: 'string', size: 100, required: false },
//     message: { type: 'string', size: 16384, required: false },

//     // Préférences
//     newsletter: { type: 'boolean', required: false, default: false, array: false },

//     // Statut et suivi
//     status: { type: 'string', size: 20, required: false, default: 'new' },
//     priority: { type: 'string', size: 20, required: false, default: 'medium' },
//     assigned_to: { type: 'string', size: 36, required: false },

//     // Métadonnées
//     source: { type: 'string', size: 50, required: false, default: 'website' },
//     tags: { type: 'string', size: 16384, required: false }, // JSON array stringifié
//     notes: { type: 'string', size: 16384, required: false },

//     // Timestamps
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false },
//     contacted_at: { type: 'string', size: 30, required: false },
//     last_activity: { type: 'string', size: 30, required: false }
//   },

//   JOBS: {
//     job_id: { type: 'string', size: 36, required: true },
//     first_name: { type: 'string', size: 255, required: true },
//     last_name: { type: 'string', size: 255, required: true },
//     email: { type: 'string', size: 255, required: true },
//     phone: { type: 'string', size: 50, required: true },
//     cover_letter: { type: 'string', size: 16384, required: true }, // Using TEXT
//     resume_url: { type: 'string', size: 1024, required: true },
//     status: { type: 'string', size: 20, required: false, default: 'received' },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   USER_CONSENT: {
//     user_id: { type: 'string', size: 255, required: true },
//     email: { type: 'string', size: 255, required: true },
//     last_updated: { type: 'string', size: 255, required: true },
//     consent_source: { type: 'string', size: 255, required: true },
//     ip_address: { type: 'string', size: 255, required: false },
//     user_agent: { type: 'string', size: 1000, required: false },
//     transactional_emails: { type: 'boolean', required: false, default: false, array: false },
//     marketing_emails: { type: 'boolean', required: false, default: false, array: false }
//   },

//   CONSENT_LOG: {
//     user_id: { type: 'string', size: 255, required: true },
//     email: { type: 'string', size: 255, required: true },
//     consent_type: { type: 'string', size: 255, required: true },
//     action: { type: 'string', size: 255, required: true },
//     timestamp: { type: 'string', size: 255, required: true },
//     source: { type: 'string', size: 255, required: true },
//     ip_address: { type: 'ip', required: false },
//     user_agent: { type: 'string', size: 1000, required: false }
//   },

//   TRANSPORT_PARTNERS: {
//     partner_id: { type: 'string', size: 36, required: true },
//     name: { type: 'string', size: 255, required: true },
//     contact_email: { type: 'string', size: 255, required: true },
//     contact_phone: { type: 'string', size: 50, required: true },
//     status: { type: 'string', size: 20, required: false, default: 'active' },
//     pricing_config: { type: 'string', size: 16384, required: false }, // JSON pour stocker la configuration des prix
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   TRANSPORT_PRICING: {
//     origin: { type: 'string', size: 100, required: true },
//     destination: { type: 'string', size: 100, required: true },
//     price_per_kg: { type: 'double', required: true },
//     price_per_kg_electronic: { type: 'double', required: true },
//     delivery_time_min: { type: 'double', required: true },
//     delivery_time_max: { type: 'double', required: true },
//     delivery_unit: { type: 'string', size: 10, required: false, default: 'days' },
//     transport_type: { type: 'string', size: 10, required: true },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   PRODUCTS: {
//     // Identifiants et métadonnées
//     product_id: { type: 'string', size: 36, required: true },
//     platform: { type: 'string', size: 20, required: true },
//     source_id: { type: 'string', size: 100, required: false },

//     // Informations de base du produit
//     title: { type: 'string', size: 1000, required: true },
//     description: { type: 'string', size: 16384, required: false },
//     url: { type: 'string', size: 1000, required: true },
//     image_url: { type: 'string', size: 1000, required: false },

//     // Prix et évaluations
//     price: { type: 'double', required: true },
//     price_currency: { type: 'string', size: 3, required: false, default: 'EUR' },
//     original_price: { type: 'double', required: false },
//     discount_percentage: { type: 'double', required: false },
//     rating: { type: 'double', required: false },
//     reviews_count: { type: 'double', required: false },

//     // Statut et métadonnées
//     status: { type: 'string', size: 20, required: false, default: 'active' },
//     imported_at: { type: 'string', size: 30, required: true },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   ADDRESSES: {
//     user_id: { type: 'string', size: 36, required: true },
//     type: { type: 'string', size: 20, required: true }, // 'billing' | 'shipping'
//     full_name: { type: 'string', size: 255, required: true },
//     address_line1: { type: 'string', size: 255, required: true },
//     address_line2: { type: 'string', size: 255, required: false },
//     city: { type: 'string', size: 255, required: true },
//     state: { type: 'string', size: 255, required: false },
//     postal_code: { type: 'string', size: 20, required: false },
//     country: { type: 'string', size: 100, required: true },
//     phone: { type: 'string', size: 50, required: false },
//     is_default: { type: 'boolean', required: false, default: false, array: false },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   PAYMENT_METHODS: {
//     user_id: { type: 'string', size: 36, required: true },
//     type: { type: 'string', size: 20, required: true }, // 'card', 'bank_account', 'mobile_money'
//     provider: { type: 'string', size: 50, required: true }, // 'visa', 'mastercard', 'airtel', 'mtn'
//     holder_name: { type: 'string', size: 255, required: true },
//     last_digits: { type: 'string', size: 4, required: true },
//     expiry_date: { type: 'string', size: 7, required: false }, // MM/YYYY
//     brand: { type: 'string', size: 50, required: false },
//     is_default: { type: 'boolean', required: false, default: false, array: false },
//     token: { type: 'string', size: 255, required: false }, // Token sécurisé pour les paiements
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   PAYMENTS: {
//     // Identifiant unique Fournisseur CG
//     fournisseur_payment_id: { type: 'string', size: 100, required: true }, // Format: "FCGPAY-{paymentId}"

//     // Informations de paiement
//     amount: { type: 'double', required: true },
//     phone: { type: 'string', size: 20, required: true },
//     mode: { type: 'string', size: 10, required: true }, // 'airtel' | 'momo'
//     currency: { type: 'string', size: 10, required: false, default: 'XAF' },

//     // Informations de réduction/promo
//     promo_code: { type: 'string', size: 50, required: false },
//     original_amount: { type: 'double', required: false },
//     discount_amount: { type: 'double', required: false },

//     // Statuts
//     spaark_status: { type: 'string', size: 20, required: true }, // 'PENDING' | 'COMPLETED' | 'FAILED'
//     internal_status: { type: 'string', size: 20, required: true }, // 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

//     // Données Spaark Pay
//     spaark_payment_id: { type: 'double', required: true },
//     spaark_token: { type: 'string', size: 255, required: false },
//     spaark_trans_id: { type: 'string', size: 255, required: false },
//     spaark_composition: { type: 'string', size: 500, required: false },
//     spaark_response: { type: 'string', size: 16384, required: false }, // JSON de la réponse complète

//     // Relations
//     user_id: { type: 'string', size: 50, required: false },
//     order_id: { type: 'string', size: 50, required: false },
//     quote_id: { type: 'string', size: 50, required: false },

//     // Timestamps
//     initiated_at: { type: 'string', size: 30, required: true },
//     completed_at: { type: 'string', size: 30, required: false },
//     created_at: { type: 'string', size: 30, required: true },
//     updated_at: { type: 'string', size: 30, required: true }
//   },

//   QUOTE_ORDERS: {
//     quote_order_id: { type: 'string', size: 36, required: true },
//     user_id: { type: 'string', size: 36, required: false },
//     full_name: { type: 'string', size: 255, required: true },
//     city: { type: 'string', size: 255, required: true },
//     phone: { type: 'string', size: 50, required: true },
//     whatsapp: { type: 'string', size: 50, required: true },
//     is_whatsapp: { type: 'boolean', required: false, default: false, array: false },
//     product_links: { type: 'string', size: 16384, required: true },
//     status: { type: 'string', size: 20, required: false, default: 'pending' },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false },
//     viewed_at: { type: 'string', size: 30, required: false }
//   },

//   ORDERS: {
//     order_id: { type: 'string', size: 36, required: true }, // Format: FC-ORD-XXXX-YYYY
//     user_id: { type: 'string', size: 36, required: false },
//     session_id: { type: 'string', size: 100, required: false }, // pour les commandes anonymes

//     // Informations de livraison
//     shipping_first_name: { type: 'string', size: 255, required: true },
//     shipping_last_name: { type: 'string', size: 255, required: true },
//     shipping_phone: { type: 'string', size: 50, required: true },
//     shipping_email: { type: 'string', size: 255, required: true },
//     shipping_address_line1: { type: 'string', size: 255, required: true },
//     shipping_address_line2: { type: 'string', size: 255, required: false },
//     shipping_city: { type: 'string', size: 255, required: true },
//     shipping_postal_code: { type: 'string', size: 20, required: false },
//     shipping_country: { type: 'string', size: 100, required: true },

//     // Informations de paiement
//     payment_method: { type: 'string', size: 50, required: true }, // 'card', 'airtel', 'mtn', 'bank_transfer'
//     payment_provider: { type: 'string', size: 100, required: false },
//     payment_status: { type: 'string', size: 20, required: false, default: 'pending' },
//     payment_reference: { type: 'string', size: 255, required: false },

//     // Totaux
//     subtotal: { type: 'double', required: true },
//     shipping_cost: { type: 'double', required: false, default: 0 },
//     tax_amount: { type: 'double', required: false, default: 0 },
//     total_amount: { type: 'double', required: true },
//     currency: { type: 'string', size: 3, required: false, default: 'EUR' },

//     // Statut et suivi
//     status: { type: 'string', size: 20, required: false, default: 'pending' },
//     tracking_number: { type: 'string', size: 255, required: false },
//     notes: { type: 'string', size: 16384, required: false },

//     // Timestamps
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false },
//     shipped_at: { type: 'string', size: 30, required: false },
//     delivered_at: { type: 'string', size: 30, required: false }
//   },

//   ORDER_ITEMS: {
//     order_id: { type: 'string', size: 36, required: true },
//     product_id: { type: 'string', size: 36, required: true },
//     product_title: { type: 'string', size: 1000, required: true },
//     product_image: { type: 'string', size: 1000, required: false },
//     quantity: { type: 'double', required: true },
//     unit_price: { type: 'double', required: true },
//     total_price: { type: 'double', required: true },
//     currency: { type: 'string', size: 3, required: false, default: 'EUR' },
//     created_at: { type: 'string', size: 30, required: false }
//   },

//   CART: {
//     user_id: { type: 'string', size: 36, required: false }, // null pour les sessions anonymes
//     session_id: { type: 'string', size: 100, required: false }, // pour les utilisateurs non connectés
//     product_id: { type: 'string', size: 36, required: true },
//     quantity: { type: 'double', required: true },
//     price: { type: 'double', required: true }, // Prix unitaire au moment de l'ajout
//     total: { type: 'double', required: true }, // Prix total (price * quantity)
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   QUOTES_EXPRESS: {
//     quote_id: { type: 'string', size: 36, required: true },
//     user_id: { type: 'string', size: 50, required: false },
//     first_name: { type: 'string', size: 255, required: true },
//     last_name: { type: 'string', size: 255, required: true },
//     email: { type: 'string', size: 255, required: true },
//     phone: { type: 'string', size: 50, required: true },
//     pickup_address: { type: 'string', size: 16384, required: true },
//     delivery_address: { type: 'string', size: 16384, required: true },
//     package_description: { type: 'string', size: 16384, required: true },
//     package_weight: { type: 'string', size: 10, required: true },
//     urgent_delivery: { type: 'boolean', required: false, default: true, array: false },
//     status: { type: 'string', size: 20, required: false, default: 'pending' },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   QUOTES_MAX: {
//     quote_id: { type: 'string', size: 36, required: true },
//     user_id: { type: 'string', size: 50, required: false },
//     first_name: { type: 'string', size: 255, required: true },
//     last_name: { type: 'string', size: 255, required: true },
//     email: { type: 'string', size: 255, required: true },
//     phone: { type: 'string', size: 50, required: true },
//     company: { type: 'string', size: 255, required: false },
//     container_type: { type: 'string', size: 50, required: true },
//     cargo_description: { type: 'string', size: 16384, required: true },
//     estimated_volume: { type: 'string', size: 50, required: true },
//     origin_port: { type: 'string', size: 255, required: true },
//     destination_port: { type: 'string', size: 255, required: true },
//     status: { type: 'string', size: 20, required: false, default: 'pending' },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   },

//   QUOTES_PRO: {
//     quote_id: { type: 'string', size: 36, required: true },
//     user_id: { type: 'string', size: 50, required: false },
//     company_name: { type: 'string', size: 255, required: true },
//     contact_first_name: { type: 'string', size: 255, required: true },
//     contact_last_name: { type: 'string', size: 255, required: true },
//     contact_email: { type: 'string', size: 255, required: true },
//     contact_phone: { type: 'string', size: 50, required: true },
//     sector: { type: 'string', size: 255, required: false },
//     shipment_frequency: { type: 'string', size: 50, required: true },
//     average_volume: { type: 'string', size: 50, required: true },
//     special_requirements: { type: 'string', size: 16384, required: false },
//     status: { type: 'string', size: 20, required: false, default: 'pending' },
//     created_at: { type: 'string', size: 30, required: false },
//     updated_at: { type: 'string', size: 30, required: false }
//   }
// }

// // Configuration des index pour chaque collection
// export const INDEXES: Record<string, IndexConfig[]> = {
//   QUOTES: [
//     {
//       key: 'quote_id_unique',
//       type: 'unique',
//       attributes: ['quote_id']
//     },
//     {
//       key: 'status',
//       type: 'key' as IndexType,
//       attributes: ['status']
//     },
//     {
//       key: 'email_index',
//       type: 'key' as IndexType,
//       attributes: ['email']
//     },
//     {
//       key: 'user_quotes',
//       type: 'key' as IndexType,
//       attributes: ['user_id', 'created_at']
//     }
//   ],

//   CONTACTS: [
//     {
//       key: 'status',
//       type: 'key' as IndexType,
//       attributes: ['status']
//     },
//     {
//       key: 'email_index',
//       type: 'key' as IndexType,
//       attributes: ['email']
//     }
//   ],

//   CONTACTS_PRO: [
//     {
//       key: 'status',
//       type: 'key' as IndexType,
//       attributes: ['status']
//     },
//     {
//       key: 'priority',
//       type: 'key' as IndexType,
//       attributes: ['priority']
//     },
//     {
//       key: 'email_index',
//       type: 'key' as IndexType,
//       attributes: ['email']
//     },
//     {
//       key: 'company_index',
//       type: 'key' as IndexType,
//       attributes: ['company']
//     }
//   ],

//   JOBS: [
//     {
//       key: 'job_status',
//       type: 'key' as IndexType,
//       attributes: ['job_id', 'status']
//     },
//     {
//       key: 'email_index',
//       type: 'key' as IndexType,
//       attributes: ['email']
//     }
//   ],

//   USER_CONSENT: [
//     {
//       key: 'email_unique',
//       type: 'unique' as const,
//       attributes: ['email']
//     },
//     {
//       key: 'user_id_index',
//       type: 'key' as const,
//       attributes: ['user_id']
//     }
//   ],

//   CONSENT_LOG: [
//     {
//       key: 'user_consent_log',
//       type: 'key' as IndexType,
//       attributes: ['user_id', 'timestamp']
//     },
//     {
//       key: 'email_consent_log',
//       type: 'key' as IndexType,
//       attributes: ['email', 'timestamp']
//     }
//   ],

//   TRANSPORT_PARTNERS: [
//     {
//       key: 'partner_id_unique',
//       type: 'unique' as const,
//       attributes: ['partner_id']
//     },
//     {
//       key: 'status_index',
//       type: 'key' as IndexType,
//       attributes: ['status']
//     }
//   ],

//   TRANSPORT_PRICING: [
//     {
//       key: 'route_transport',
//       type: 'key' as IndexType,
//       attributes: ['origin', 'destination', 'transport_type']
//     }
//   ],

//   PRODUCTS: [
//     {
//       key: 'product_id_unique',
//       type: 'unique' as const,
//       attributes: ['product_id']
//     },
//     {
//       key: 'platform_index',
//       type: 'key' as IndexType,
//       attributes: ['platform']
//     },
//     {
//       key: 'price_index',
//       type: 'key' as IndexType,
//       attributes: ['price']
//     },
//     {
//       key: 'status_index',
//       type: 'key' as IndexType,
//       attributes: ['status']
//     }
//   ],

//   ADDRESSES: [
//     {
//       key: 'user_addresses',
//       type: 'key',
//       attributes: ['user_id']
//     },
//     {
//       key: 'address_type',
//       type: 'key',
//       attributes: ['type']
//     }
//   ],

//   PAYMENT_METHODS: [
//     {
//       key: 'user_payment_methods',
//       type: 'key',
//       attributes: ['user_id']
//     },
//     {
//       key: 'payment_type',
//       type: 'key',
//       attributes: ['type']
//     }
//   ],

//   PAYMENTS: [
//     {
//       key: 'fournisseur_payment_id_unique',
//       type: 'unique',
//       attributes: ['fournisseur_payment_id']
//     },
//     {
//       key: 'spaark_payment_id_index',
//       type: 'key',
//       attributes: ['spaark_payment_id']
//     },
//     {
//       key: 'user_payments',
//       type: 'key',
//       attributes: ['user_id', 'created_at']
//     },
//     {
//       key: 'order_payments',
//       type: 'key',
//       attributes: ['order_id']
//     },
//     {
//       key: 'status_index',
//       type: 'key',
//       attributes: ['internal_status']
//     }
//   ],

//   QUOTE_ORDERS: [
//     {
//       key: 'quote_order_id_unique',
//       type: 'unique',
//       attributes: ['quote_order_id']
//     },
//     {
//       key: 'status_index',
//       type: 'key',
//       attributes: ['status']
//     }
//   ],

//   ORDERS: [
//     {
//       key: 'order_id_unique',
//       type: 'unique',
//       attributes: ['order_id']
//     },
//     {
//       key: 'user_orders',
//       type: 'key',
//       attributes: ['user_id', 'created_at']
//     },
//     {
//       key: 'status_index',
//       type: 'key',
//       attributes: ['status']
//     },
//     {
//       key: 'payment_status_index',
//       type: 'key',
//       attributes: ['payment_status']
//     }
//   ],

//   ORDER_ITEMS: [
//     {
//       key: 'order_items',
//       type: 'key',
//       attributes: ['order_id']
//     },
//     {
//       key: 'product_orders',
//       type: 'key',
//       attributes: ['product_id']
//     }
//   ],

//   CART: [
//     {
//       key: 'user_cart',
//       type: 'key',
//       attributes: ['user_id']
//     },
//     {
//       key: 'session_cart',
//       type: 'key',
//       attributes: ['session_id']
//     },
//     {
//       key: 'product_cart',
//       type: 'key',
//       attributes: ['product_id']
//     }
//   ],

//   QUOTES_EXPRESS: [
//     {
//       key: 'quote_id_unique',
//       type: 'unique',
//       attributes: ['quote_id']
//     },
//     {
//       key: 'status_index',
//       type: 'key',
//       attributes: ['status']
//     },
//     {
//       key: 'user_quotes_express',
//       type: 'key',
//       attributes: ['user_id', 'created_at']
//     }
//   ],

//   QUOTES_MAX: [
//     {
//       key: 'quote_id_unique',
//       type: 'unique',
//       attributes: ['quote_id']
//     },
//     {
//       key: 'status_index',
//       type: 'key',
//       attributes: ['status']
//     },
//     {
//       key: 'user_quotes_max',
//       type: 'key',
//       attributes: ['user_id', 'created_at']
//     }
//   ],

//   QUOTES_PRO: [
//     {
//       key: 'quote_id_unique',
//       type: 'unique',
//       attributes: ['quote_id']
//     },
//     {
//       key: 'status_index',
//       type: 'key',
//       attributes: ['status']
//     },
//     {
//       key: 'user_quotes_pro',
//       type: 'key',
//       attributes: ['user_id', 'created_at']
//     },
//     {
//       key: 'company_name_index',
//       type: 'key',
//       attributes: ['company_name']
//     }
//   ]
// }

// // Configuration des permissions pour chaque collection
// export const PERMISSIONS = {
//   QUOTES: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   CONTACTS: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   CONTACTS_PRO: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.team('administrators'))],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   JOBS: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   USER_CONSENT: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   CONSENT_LOG: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   TRANSPORT_PARTNERS: {
//     create: [Permission.create(Role.team('administrators'))],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   TRANSPORT_PRICING: {
//     create: [Permission.create(Role.team('administrators'))],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   PRODUCTS: {
//     create: [Permission.create(Role.team('administrators'))],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.team('administrators'))],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   ADDRESSES: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.user('user_id'))],
//     delete: [Permission.delete(Role.user('user_id'))]
//   },
//   PAYMENT_METHODS: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.user('user_id'))],
//     delete: [Permission.delete(Role.user('user_id'))]
//   },
//   PAYMENTS: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.any())],
//     delete: [Permission.delete(Role.team('administrators'))]
//   },
//   QUOTE_ORDERS: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.any())],
//     delete: [Permission.delete(Role.any())]
//   },
//   ORDERS: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.any())],
//     delete: [Permission.delete(Role.any())]
//   },
//   ORDER_ITEMS: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.any())],
//     delete: [Permission.delete(Role.any())]
//   },
//   CART: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.any())],
//     delete: [Permission.delete(Role.any())]
//   },
//   QUOTES_EXPRESS: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.any())],
//     delete: [Permission.delete(Role.any())]
//   },
//   QUOTES_MAX: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.any())],
//     delete: [Permission.delete(Role.any())]
//   },
//   QUOTES_PRO: {
//     create: [Permission.create(Role.any())],
//     read: [Permission.read(Role.any())],
//     update: [Permission.update(Role.any())],
//     delete: [Permission.delete(Role.any())]
//   }
// }
