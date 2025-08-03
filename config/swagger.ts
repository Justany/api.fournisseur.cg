const swaggerConfig = {
  path: process.cwd(),
  title: 'API Fournisseur CG - Orchestrateur Logistique',
  version: '3.0.0',
  description:
    'API REST centrale servant de wrapper et orchestrateur pour la plateforme logistique Fournisseur Congo. Intègre Appwrite (backend), MailerSend (emails), SMTP (notifications) et Spark Pay (paiements mobiles).',
  tagIndex: 4,
  productionEnv: 'production',
  info: {
    title: 'API Fournisseur CG - Orchestrateur Logistique',
    version: '3.0.0',
    description: `# API Fournisseur CG - Orchestrateur Logistique

L'API Fournisseur CG est la **plateforme centrale** qui orchestre l'écosystème logistique du Congo. Elle sert de pont intelligent entre les applications clientes et les services backend, offrant une expérience unifiée pour la gestion des fournisseurs, commandes, paiements et livraisons.

## 🎯 Mission

Connecter les **fournisseurs locaux** aux **clients internationaux** en simplifiant la logistique, les paiements et la communication dans l'écosystème e-commerce congolais.

## 🏗️ Architecture

### **Services Intégrés**

| Service | Rôle | Statut |
|---------|------|--------|
| **Appwrite** | Backend principal (DB, Auth, Storage) | ✅ Intégré |
| **Spaark Pay** | Paiements mobiles (MTN Money, Airtel) | ✅ Intégré |
| **SMS API** | Notifications et codes OTP | ✅ Intégré |
| **MailerSend** | Emails marketing | 🔄 En cours |
| **SMTP** | Notifications système | 🔄 En cours |

### **Collections Principales**

- **📋 QUOTES** - Demandes de devis (FC-QMM-XXXX-YYYY)
- **📞 CONTACTS** - Messages de contact clients
- **🛍️ PRODUCTS** - Catalogue multi-plateformes
- **📦 ORDERS** - Commandes (FC-ORD-XXXX-YYYY)
- **💳 PAYMENTS** - Transactions de paiement

## 🚀 Fonctionnalités Clés

### **Paiements Mobiles Intelligents**
- Support natif **MTN Money** et **Airtel Money**
- Vérification automatique des transactions
- Gestion des webhooks en temps réel
- Retry automatique pour les erreurs temporaires

### **Gestion SMS Avancée**
- Envoi de codes OTP sécurisés
- Notifications personnalisées
- Calcul automatique des coûts
- Historique et statistiques détaillées

### **Collections Auto-Configurées**
- Définition déclarative des structures
- Création automatique d'attributs et d'index
- Permissions granulaires par collection
- Migration et mise à jour automatiques

## 🔐 Authentification

L'API supporte **3 méthodes d'authentification** :

1. **Bearer Token** - JWT pour les utilisateurs connectés
2. **API Key** - Pour l'authentification service-à-service
3. **Basic Auth** - Pour les endpoints administrateur

<details>
  <summary>Exemples d'utilisation</summary>

  **Authentification Bearer**
  \`\`\`bash
  curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
       https://api.fournisseur.cg/v3/auth/profile
  \`\`\`

  **Authentification API Key**
  \`\`\`bash
  curl -H "X-API-Key: YOUR_API_KEY" \\
       https://api.fournisseur.cg/v3/appwrite/health
  \`\`\`

  **Paiement Mobile**
  \`\`\`bash
  curl -X POST https://api.fournisseur.cg/v3/spaark-pay/initiate \\
       -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
       -H "Content-Type: application/json" \\
       -d '{"phone":"053518256","amount":150,"mode":"airtel"}'
  \`\`\`
</details>

## 🌍 Spécificités Congo

### **Validation Locale**
- Numéros de téléphone congolais (0XXXXXXXX)
- Devise XAF (Franc CFA)
- Adresses et codes postaux locaux
- Gestion géographique spécifique

### **Paiements Locaux**
- **Airtel Money** : 04/05XXXXXXXX
- **MTN Mobile Money** : 06XXXXXXXX
- Intégration native avec les opérateurs locaux

## 📊 Monitoring et Logs

### **Health Checks**
- \`/v3\` - État général de l'API
- \`/v3/spaark-pay/health\` - Connexion Spaark Pay
- \`/v3/sms/health\` - Connexion SMS API
- \`/v3/appwrite/health\` - Connexion Appwrite

### **Logs Détaillés**
- Logs structurés pour chaque service
- Suivi des tentatives de retry
- Métriques de performance
- Alertes automatiques

## 🔗 Ressources

* [Documentation complète](https://fournisseur.cg/docs)
* [Interface d'administration](https://admin.fournisseur.cg)
* [Support technique](mailto:support@fournisseur.cg)
* [Statut des services](https://status.fournisseur.cg)

## 📝 Support Markdown

Cette documentation supporte le **Markdown complet** :

> [!tip]
> **Conseil** : Utilisez les endpoints de test pour vérifier la connectivité avant les appels de production.

> [!warning]
> **Attention** : Les paiements mobiles peuvent avoir des délais de traitement variables selon l'opérateur.

| Fonctionnalité | Disponibilité | Documentation |
|----------------|---------------|---------------|
| Paiements mobiles | ✅ Production | [Guide complet](#tag/Payment-Processing) |
| SMS notifications | ✅ Production | [API SMS](#tag/SMS-Notifications) |
| Gestion collections | ✅ Production | [Appwrite](#tag/Database-Management) |
| Authentification | ✅ Production | [Auth](#tag/Authentication) |

<details>
  <summary>Exemples de réponses</summary>

  **Paiement réussi**
  \`\`\`json
  {
    "success": true,
    "data": {
      "paymentId": 28,
      "token": "28257ddbaf7a11ef86feac1f6be4442c",
      "composition": "*128*128*1159*PIN#",
      "transID": "JKUCJDFLIKDGDGD-328"
    }
  }
  \`\`\`

  **SMS envoyé**
  \`\`\`json
  {
    "success": true,
    "data": {
      "messageId": "msg_123",
      "status": "sent",
      "to": "053518256",
      "cost": 25
    }
  }
  \`\`\`
</details>`,
    contact: {
      name: 'Équipe Technique Fournisseur CG',
      email: 'dev@fournisseur.cg',
      url: 'https://fournisseur.cg',
    },
    license: {
      name: 'Propriétaire - Fournisseur CG',
      url: 'https://fournisseur.cg/license',
    },
    termsOfService: 'https://fournisseur.cg/terms',
  },
  snakeCase: true,
  debug: true,
  ignore: [
    '/swagger',
    '/docs',
    '/',
    '/swagger/yaml-only',
    '/swagger/scalar-config',
    '/swagger/metadata',
  ],
  preferredPutPatch: 'PUT',
  // Configuration pour améliorer la génération automatique
  writeFileSync: false, // Ne pas essayer d'écrire un fichier swagger.yml
  mode: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'RUNTIME',
  tags: [
    {
      name: 'Authentication',
      description: 'Authentification utilisateurs et gestion des tokens JWT',
    },
    {
      name: 'Database Management',
      description: 'Wrapper pour les opérations Appwrite (collections, documents, utilisateurs)',
    },
    {
      name: 'Collection Management',
      description: 'Gestion des collections et initialisation des structures de données',
    },
    {
      name: 'Payment Processing',
      description: 'Intégration Spaark Pay - Paiements mobiles (MTN Money, Airtel Money)',
    },
    {
      name: 'SMS Notifications',
      description: 'Envoi de SMS et notifications via API SMS',
    },
    {
      name: 'Email Services',
      description: 'MailerSend (marketing) et SMTP (notifications système)',
    },
    {
      name: 'User Management',
      description: 'Gestion des utilisateurs (visiteurs, clients, professionnels, admins)',
    },
    {
      name: 'Webhooks',
      description: 'Endpoints pour webhooks entrants (Spark Pay, partenaires transport)',
    },
    {
      name: 'Analytics',
      description: 'Métriques, rapports et données analytiques de la plateforme',
    },
  ],
  // Configuration des serveurs au niveau racine (comme Scalar Galaxy)
  servers: [
    {
      url: 'https://api.fournisseur.cg',
      description: 'Production - API officielle',
    },
    {
      url: 'https://staging-api.fournisseur.cg',
      description: 'Staging - Tests et validation',
    },
    {
      url: 'http://localhost:3333',
      description: 'Développement local',
    },
  ],
  // Configuration de sécurité simplifiée (comme Scalar Galaxy)
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }, { basicAuth: [] }],
  common: {
    parameters: {
      sortable: [
        {
          in: 'query',
          name: 'sortBy',
          schema: { type: 'string', example: 'createdAt' },
          description: 'Field to sort by',
        },
        {
          in: 'query',
          name: 'sortType',
          schema: { type: 'string', enum: ['ASC', 'DESC'], example: 'DESC' },
          description: 'Sort direction',
        },
      ],
      pagination: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, example: 1 },
          description: 'Page number',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, example: 20 },
          description: 'Items per page',
        },
      ],
    },
    headers: {
      paginated: {
        'X-Total-Pages': {
          description: 'Total amount of pages',
          schema: { type: 'integer', example: 5 },
        },
        'X-Total': {
          description: 'Total amount of results',
          schema: { type: 'integer', example: 100 },
        },
        'X-Per-Page': {
          description: 'Results per page',
          schema: { type: 'integer', example: 20 },
        },
        'X-Current-Page': {
          description: 'Current page number',
          schema: { type: 'integer', example: 1 },
        },
      },
      security: {
        'X-Request-ID': {
          description: 'Unique request identifier for tracking',
          schema: { type: 'string', example: 'req_123456789' },
        },
        'X-API-Version': {
          description: 'API version being used',
          schema: { type: 'string', example: 'v3' },
        },
      },
    },
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token obtenu depuis /v3/auth/login',
    },
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      description: "Clé API pour l'authentification service-à-service",
    },
    basicAuth: {
      type: 'http',
      scheme: 'basic',
      description: 'Authentification basique pour les endpoints admin',
    },
  },
  authMiddlewares: ['auth', 'auth:api'],
  defaultSecurityScheme: 'bearerAuth',
  persistAuthorization: true,
  showFullPath: true,
}

// Ajouter la méthode get pour compatibilité avec adonis-autoswagger
Object.defineProperty(swaggerConfig, 'get', {
  value: function (key: string) {
    return (this as any)[key]
  },
  enumerable: false,
  writable: false,
})

export default swaggerConfig
