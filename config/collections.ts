import { Permission, Role } from 'node-appwrite'
import type { BaseAttribute, IndexConfig, CollectionPermissions } from '#types/database_types'

/**
 * Configuration des collections Appwrite pour Fournisseur CG
 * Basé sur la structure de l'ancienne API Express
 */

// Configuration des attributs des collections
export const ATTRIBUTES: Record<string, Record<string, BaseAttribute>> = {
  QUOTES: {
    // Identifiants
    quote_id: { type: 'string', size: 36, required: true }, // Format: FC-QMM-XXXX-YYYY
    user_id: { type: 'string', size: 50, required: false },

    // Informations personnelles
    first_name: { type: 'string', size: 255, required: true },
    last_name: { type: 'string', size: 255, required: true },
    email: { type: 'email', required: true },
    phone: { type: 'string', size: 50, required: true },
    company: { type: 'string', size: 255, required: false },

    // Détails du projet
    service_type: { type: 'string', size: 100, required: true },
    project_description: { type: 'string', size: 16384, required: true },
    estimated_budget: { type: 'string', size: 50, required: true },
    desired_timeline: { type: 'string', size: 100, required: true },

    // Détails du colis
    package_length: { type: 'string', size: 10, required: false },
    package_width: { type: 'string', size: 10, required: false },
    package_height: { type: 'string', size: 10, required: false },
    package_weight: { type: 'string', size: 10, required: false },

    // Liens et médias
    product_links: { type: 'string', size: 16384, required: false },
    photos_urls: { type: 'string', size: 16384, required: false },

    // Statut et métadonnées
    status: { type: 'string', size: 20, required: false, default: 'pending' },
    created_at: { type: 'datetime', required: false },
    updated_at: { type: 'datetime', required: false },
    viewed_at: { type: 'datetime', required: false },
  },

  CONTACTS: {
    first_name: { type: 'string', size: 255, required: true },
    last_name: { type: 'string', size: 255, required: true },
    email: { type: 'email', required: true },
    phone: { type: 'string', size: 50, required: true },
    subject: { type: 'string', size: 255, required: true },
    message: { type: 'string', size: 16384, required: true },
    status: { type: 'string', size: 20, required: false, default: 'new' },
    created_at: { type: 'datetime', required: false },
    updated_at: { type: 'datetime', required: false },
  },

  PRODUCTS: {
    // Identifiants et métadonnées
    product_id: { type: 'string', size: 36, required: true },
    platform: { type: 'string', size: 20, required: true },
    source_id: { type: 'string', size: 100, required: false },

    // Informations de base du produit
    title: { type: 'string', size: 1000, required: true },
    description: { type: 'string', size: 16384, required: false },
    url: { type: 'url', required: true },
    image_url: { type: 'url', required: false },

    // Prix et évaluations
    price: { type: 'double', required: true },
    price_currency: { type: 'string', size: 3, required: false, default: 'EUR' },
    original_price: { type: 'double', required: false },
    discount_percentage: { type: 'double', required: false },
    rating: { type: 'double', required: false },
    reviews_count: { type: 'integer', required: false },

    // Statut et métadonnées
    status: { type: 'string', size: 20, required: false, default: 'active' },
    imported_at: { type: 'datetime', required: true },
    updated_at: { type: 'datetime', required: false },
  },

  ORDERS: {
    order_id: { type: 'string', size: 36, required: true }, // Format: FC-ORD-XXXX-YYYY
    user_id: { type: 'string', size: 36, required: false },
    session_id: { type: 'string', size: 100, required: false }, // pour les commandes anonymes

    // Informations de livraison
    shipping_first_name: { type: 'string', size: 255, required: true },
    shipping_last_name: { type: 'string', size: 255, required: true },
    shipping_phone: { type: 'string', size: 50, required: true },
    shipping_email: { type: 'email', required: true },
    shipping_address_line1: { type: 'string', size: 255, required: true },
    shipping_address_line2: { type: 'string', size: 255, required: false },
    shipping_city: { type: 'string', size: 255, required: true },
    shipping_postal_code: { type: 'string', size: 20, required: false },
    shipping_country: { type: 'string', size: 100, required: true },

    // Informations de paiement
    payment_method: { type: 'string', size: 50, required: true }, // 'card', 'airtel', 'mtn', 'bank_transfer'
    payment_provider: { type: 'string', size: 100, required: false },
    payment_status: { type: 'string', size: 20, required: false, default: 'pending' },
    payment_reference: { type: 'string', size: 255, required: false },

    // Totaux
    subtotal: { type: 'double', required: true },
    shipping_cost: { type: 'double', required: false, default: 0 },
    tax_amount: { type: 'double', required: false, default: 0 },
    total_amount: { type: 'double', required: true },
    currency: { type: 'string', size: 3, required: false, default: 'EUR' },

    // Statut et suivi
    status: { type: 'string', size: 20, required: false, default: 'pending' },
    tracking_number: { type: 'string', size: 255, required: false },
    notes: { type: 'string', size: 16384, required: false },

    // Timestamps
    created_at: { type: 'datetime', required: false },
    updated_at: { type: 'datetime', required: false },
    shipped_at: { type: 'datetime', required: false },
    delivered_at: { type: 'datetime', required: false },
  },

  PAYMENTS: {
    // Identifiant unique Fournisseur CG
    fournisseur_payment_id: { type: 'string', size: 100, required: true }, // Format: "FCGPAY-{paymentId}"

    // Informations de paiement
    amount: { type: 'double', required: true },
    phone: { type: 'string', size: 20, required: true },
    mode: { type: 'string', size: 10, required: true }, // 'airtel' | 'momo'
    currency: { type: 'string', size: 10, required: false, default: 'XAF' },

    // Informations de réduction/promo
    promo_code: { type: 'string', size: 50, required: false },
    original_amount: { type: 'double', required: false },
    discount_amount: { type: 'double', required: false },

    // Statuts
    spaark_status: { type: 'string', size: 20, required: true }, // 'PENDING' | 'COMPLETED' | 'FAILED'
    internal_status: { type: 'string', size: 20, required: true }, // 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

    // Données Spaark Pay
    spaark_payment_id: { type: 'integer', required: true },
    spaark_token: { type: 'string', size: 255, required: false },
    spaark_trans_id: { type: 'string', size: 255, required: false },
    spaark_composition: { type: 'string', size: 500, required: false },
    spaark_response: { type: 'string', size: 16384, required: false }, // JSON de la réponse complète

    // Relations
    user_id: { type: 'string', size: 50, required: false },
    order_id: { type: 'string', size: 50, required: false },
    quote_id: { type: 'string', size: 50, required: false },

    // Timestamps
    initiated_at: { type: 'datetime', required: true },
    completed_at: { type: 'datetime', required: false },
    created_at: { type: 'datetime', required: true },
    updated_at: { type: 'datetime', required: true },
  },

  INSTALLATIONS: {
    // Champs minimums requis
    user_id: { type: 'string', size: 50, required: true },
    platform: { type: 'enum', required: true, elements: ['ios', 'android', 'web'] },
    timestamp: { type: 'datetime', required: true },

    // Champs recommandés pour analytics
    version: { type: 'string', size: 20, required: false },
    source: { type: 'string', size: 50, required: false }, // 'ads', 'organic', 'referral', 'direct'
    campaign: { type: 'string', size: 100, required: false },
    referrer: { type: 'string', size: 500, required: false },

    // Informations sur l'appareil (stockées comme JSON string)
    device_info: { type: 'string', size: 16384, required: false }, // JSON: {osVersion, deviceModel, screenResolution, userAgent}

    // Métadonnées
    created_at: { type: 'datetime', required: false },
    updated_at: { type: 'datetime', required: false },
  },

  EVENTS: {
    // Champs minimums requis
    timestamp: { type: 'datetime', required: true },
    user_id: { type: 'string', size: 50, required: true },
    installation_id: { type: 'string', size: 50, required: true },
    duration: { type: 'integer', required: false }, // secondes
    converted: { type: 'boolean', required: false },

    // Champs recommandés
    source: { type: 'string', size: 50, required: false },
    conversion_goal: { type: 'string', size: 100, required: false }, // 'signup', 'purchase', etc.
    type: { type: 'string', size: 50, required: false }, // 'first_open', 'session_start', 'session_end'

    // Actions (stockées comme JSON string)
    actions: { type: 'string', size: 16384, required: false }, // JSON array: [{type, target, timestamp, metadata}]

    // Métadonnées
    created_at: { type: 'datetime', required: false },
    updated_at: { type: 'datetime', required: false },
  },

  USERS: {
    // Champs de base
    email: { type: 'email', required: true },
    phone: { type: 'string', size: 20, required: false },
    name: { type: 'string', size: 255, required: false },

    // Démographie (stockée comme JSON string)
    demographics: { type: 'string', size: 1024, required: false }, // JSON: {age, gender, country}

    // Préférences (stockées comme JSON string)
    preferences: { type: 'string', size: 1024, required: false }, // JSON: {language, notifications}

    // Segmentation
    segments: { type: 'string', array: true, size: 50, required: false }, // array de strings

    // Timestamps
    created_at: { type: 'datetime', required: false },
    last_active_at: { type: 'datetime', required: false },
    updated_at: { type: 'datetime', required: false },
  },
}

// Configuration des index pour chaque collection
export const INDEXES: Record<string, IndexConfig[]> = {
  QUOTES: [
    {
      key: 'quote_id_unique',
      type: 'unique',
      attributes: ['quote_id'],
    },
    {
      key: 'status',
      type: 'key',
      attributes: ['status'],
    },
    {
      key: 'email_index',
      type: 'key',
      attributes: ['email'],
    },
    {
      key: 'user_quotes',
      type: 'key',
      attributes: ['user_id', 'created_at'],
    },
  ],

  CONTACTS: [
    {
      key: 'status',
      type: 'key',
      attributes: ['status'],
    },
    {
      key: 'email_index',
      type: 'key',
      attributes: ['email'],
    },
  ],

  PRODUCTS: [
    {
      key: 'product_id_unique',
      type: 'unique',
      attributes: ['product_id'],
    },
    {
      key: 'platform_index',
      type: 'key',
      attributes: ['platform'],
    },
    {
      key: 'price_index',
      type: 'key',
      attributes: ['price'],
    },
    {
      key: 'status_index',
      type: 'key',
      attributes: ['status'],
    },
  ],

  ORDERS: [
    {
      key: 'order_id_unique',
      type: 'unique',
      attributes: ['order_id'],
    },
    {
      key: 'user_orders',
      type: 'key',
      attributes: ['user_id', 'created_at'],
    },
    {
      key: 'status_index',
      type: 'key',
      attributes: ['status'],
    },
    {
      key: 'payment_status_index',
      type: 'key',
      attributes: ['payment_status'],
    },
  ],

  PAYMENTS: [
    {
      key: 'fournisseur_payment_id_unique',
      type: 'unique',
      attributes: ['fournisseur_payment_id'],
    },
    {
      key: 'spaark_payment_id_index',
      type: 'key',
      attributes: ['spaark_payment_id'],
    },
    {
      key: 'user_payments',
      type: 'key',
      attributes: ['user_id', 'created_at'],
    },
    {
      key: 'order_payments',
      type: 'key',
      attributes: ['order_id'],
    },
    {
      key: 'status_index',
      type: 'key',
      attributes: ['internal_status'],
    },
  ],

  INSTALLATIONS: [
    {
      key: 'user_id_index',
      type: 'key',
      attributes: ['user_id'],
    },
    {
      key: 'timestamp_index',
      type: 'key',
      attributes: ['timestamp'],
    },
    {
      key: 'platform_index',
      type: 'key',
      attributes: ['platform'],
    },
    {
      key: 'source_index',
      type: 'key',
      attributes: ['source'],
    },
    {
      key: 'user_platform',
      type: 'key',
      attributes: ['user_id', 'platform'],
    },
  ],

  EVENTS: [
    {
      key: 'user_id_index',
      type: 'key',
      attributes: ['user_id'],
    },
    {
      key: 'installation_id_index',
      type: 'key',
      attributes: ['installation_id'],
    },
    {
      key: 'timestamp_index',
      type: 'key',
      attributes: ['timestamp'],
    },
    {
      key: 'converted_index',
      type: 'key',
      attributes: ['converted'],
    },
    {
      key: 'user_installation',
      type: 'key',
      attributes: ['user_id', 'installation_id'],
    },
  ],

  USERS: [
    {
      key: 'email_index',
      type: 'unique',
      attributes: ['email'],
    },
    {
      key: 'phone_index',
      type: 'key',
      attributes: ['phone'],
    },
    {
      key: 'segments_index',
      type: 'key',
      attributes: ['segments'],
    },
    {
      key: 'created_at_index',
      type: 'key',
      attributes: ['created_at'],
    },
    {
      key: 'last_active_index',
      type: 'key',
      attributes: ['last_active_at'],
    },
  ],
}

// Configuration des permissions pour chaque collection
export const PERMISSIONS: Record<string, CollectionPermissions> = {
  QUOTES: {
    create: [Permission.create(Role.any())],
    read: [Permission.read(Role.any())],
    update: [Permission.update(Role.any())],
    delete: [Permission.delete(Role.team('administrators'))],
  },
  CONTACTS: {
    create: [Permission.create(Role.any())],
    read: [Permission.read(Role.any())],
    update: [Permission.update(Role.any())],
    delete: [Permission.delete(Role.team('administrators'))],
  },
  PRODUCTS: {
    create: [Permission.create(Role.team('administrators'))],
    read: [Permission.read(Role.any())],
    update: [Permission.update(Role.team('administrators'))],
    delete: [Permission.delete(Role.team('administrators'))],
  },
  ORDERS: {
    create: [Permission.create(Role.any())],
    read: [Permission.read(Role.any())],
    update: [Permission.update(Role.any())],
    delete: [Permission.delete(Role.any())],
  },
  PAYMENTS: {
    create: [Permission.create(Role.any())],
    read: [Permission.read(Role.any())],
    update: [Permission.update(Role.any())],
    delete: [Permission.delete(Role.team('administrators'))],
  },
  INSTALLATIONS: {
    create: [Permission.create(Role.any())],
    read: [Permission.read(Role.any())],
    update: [Permission.update(Role.any())],
    delete: [Permission.delete(Role.team('administrators'))],
  },
  EVENTS: {
    create: [Permission.create(Role.any())],
    read: [Permission.read(Role.any())],
    update: [Permission.update(Role.any())],
    delete: [Permission.delete(Role.team('administrators'))],
  },
  USERS: {
    create: [Permission.create(Role.any())],
    read: [Permission.read(Role.any())],
    update: [Permission.update(Role.any())],
    delete: [Permission.delete(Role.team('administrators'))],
  },
}

// IDs des collections (utilisés par Appwrite)
export const COLLECTIONS = {
  QUOTES: 'quotes',
  CONTACTS: 'contacts',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  INSTALLATIONS: 'installations',
  EVENTS: 'events',
  USERS: 'users',
  PAWA_PAY_DEPOSIT_CALLBACKS: 'pawapay_deposit_callbacks',
  PAWA_PAY_PAYOUT_CALLBACKS: 'pawapay_payout_callbacks',
  PAWA_PAY_REFUND_CALLBACKS: 'pawapay_refund_callbacks',
} as const

// IDs des buckets de stockage
export const BUCKETS = {
  QUOTES: 'quotes-files',
  PRODUCTS: 'product-images',
  ORDERS: 'order-documents',
} as const
