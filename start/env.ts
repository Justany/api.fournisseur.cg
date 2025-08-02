/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  /*
  |----------------------------------------------------------
  | Variables de base de l'application
  |----------------------------------------------------------
  */
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables pour la configuration de la base de données
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables pour l'authentification et la sécurité
  |----------------------------------------------------------
  */
  JWT_SECRET: Env.schema.string.optional(),
  // SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables pour Appwrite (Backend principal)
  |----------------------------------------------------------
  */
  APPWRITE_ENDPOINT: Env.schema.string(),
  APPWRITE_PROJECT_ID: Env.schema.string(),
  APPWRITE_API_KEY: Env.schema.string(),
  APPWRITE_DATABASE_ID: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables pour les services externes
  |----------------------------------------------------------
  */
  // Configuration email
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  MAIL_FROM_ADDRESS: Env.schema.string.optional(),
  MAIL_FROM_NAME: Env.schema.string.optional(),

  // Configuration Redis (pour cache/sessions)
  REDIS_HOST: Env.schema.string.optional(),
  REDIS_PORT: Env.schema.number.optional(),
  REDIS_PASSWORD: Env.schema.string.optional(),

  // Configuration AWS S3 (pour stockage de fichiers)
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  AWS_REGION: Env.schema.string.optional(),
  AWS_BUCKET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables pour l'API et les intégrations
  |----------------------------------------------------------
  */
  API_VERSION: Env.schema.string.optional(),
  API_PREFIX: Env.schema.string.optional(),
  CORS_ORIGIN: Env.schema.string.optional(),

  // Configuration pour les services de paiement
  PAYMENT_GATEWAY_KEY: Env.schema.string.optional(),
  PAYMENT_GATEWAY_SECRET: Env.schema.string.optional(),

  // Configuration pour les notifications
  NOTIFICATION_SERVICE_URL: Env.schema.string.optional(),
  NOTIFICATION_API_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables pour Spaark Pay API
  |----------------------------------------------------------
  */
  SPAARK_PAY_BASE_URL: Env.schema.string.optional(),
  SPAARK_PAY_TEST_API_KEY: Env.schema.string.optional(),
  SPAARK_PAY_LIVE_API_KEY: Env.schema.string.optional(),
  SPAARK_PAY_TOKEN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables pour le monitoring et les logs
  |----------------------------------------------------------
  */
  SENTRY_DSN: Env.schema.string.optional(),
  MONITORING_ENABLED: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables spécifiques à l'application fournisseur
  |----------------------------------------------------------
  */
  // Limites et quotas
  MAX_FILE_SIZE: Env.schema.number.optional(),
  MAX_SUPPLIERS_PER_USER: Env.schema.number.optional(),

  // Configuration géographique
  DEFAULT_COUNTRY: Env.schema.string.optional(),
  DEFAULT_CURRENCY: Env.schema.string.optional(),
  DEFAULT_TIMEZONE: Env.schema.string.optional(),

  // URLs externes
  EXTERNAL_API_BASE_URL: Env.schema.string.optional(),
  WEBHOOK_URL: Env.schema.string.optional(),
})
