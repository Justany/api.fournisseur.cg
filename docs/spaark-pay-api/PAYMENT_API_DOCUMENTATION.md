# API de Paiement - v3-fournisseur-cg

Documentation complète pour l'intégration du système de paiement avec l'API Spaark Pay.

## Vue d'ensemble

Le système de paiement intègre l'API Spaark Pay pour traiter les paiements mobile money (MTN Mobile Money et Airtel Money) au Congo. Il offre une interface sécurisée et robuste pour initier, suivre et gérer les transactions de paiement.

## Architecture

```
Frontend/Client → Server API → Spaark Pay API
                ↓
           Base de données Appwrite
                ↓
           Webhooks de notification
```

### Composants principaux

1. **PaymentService** : Service principal pour l'intégration Spaark Pay
2. **PaymentController** : Contrôleur avec validation et gestion d'erreurs
3. **Routes sécurisées** : Endpoints avec rate limiting et validation
4. **Base de données** : Collection Appwrite pour le stockage des transactions

## Configuration

### Variables d'environnement

```env
# API Spaark Pay
SPAARK_PAY_BASE_URL=https://spaark-payapi.vercel.app/api
SPAARK_PAY_TEST_API_KEY=tk_test_E7rQ4wTKuOtMBylBC-vfjIxJJGRwSCGk
SPAARK_PAY_LIVE_API_KEY=tk_live_7Grd6sQR8H7wBJK-_vCJyxIMdYMDQ3Pt
SPAARK_PAY_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Appwrite (pour le stockage des transactions)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=votre_project_id
APPWRITE_API_KEY=votre_api_key
APPWRITE_DATABASE_ID=v3_fournisseur_cg
```

### Numéros de test

En mode développement, utilisez ces numéros de test :

- **MTN Mobile Money** : `068242912`
- **Airtel Money** : `053518256`

## API Endpoints

### Base URL
```
https://votre-domaine.com/api/payments
```

### 1. Initier un paiement

**POST** `/initiate`

Initie un nouveau paiement mobile money.

#### Paramètres de requête

```json
{
  "amount": 5000,
  "phone": "068242912",
  "mode": "momo",
  "orderId": "FC-ORD-2024-001",
  "userId": "user_123"
}
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `amount` | number | ✅ | Montant en XAF (max: 1,000,000) |
| `phone` | string | ✅ | Numéro de téléphone (format: 9 chiffres avec 0 initial) |
| `mode` | string | ✅ | Mode de paiement : `"momo"` ou `"airtel"` |
| `orderId` | string | ❌ | ID de la commande associée |
| `userId` | string | ❌ | ID de l'utilisateur |

#### Réponse de succès (201)

```json
{
  "success": true,
  "message": "Paiement initié avec succès",
  "transaction": {
    "fournisseur_payment_id": "FCGPAY-12345",
    "amount": 5000,
    "phone": "068242912",
    "mode": "momo",
    "currency": "XAF",
    "spaark_status": "PENDING",
    "internal_status": "pending",
    "spaark_payment_id": 12345,
    "spaark_token": "token_xyz",
    "spaark_trans_id": "trans_123",
    "spaark_composition": "composition_abc",
    "user_id": "user_123",
    "order_id": "FC-ORD-2024-001",
    "initiated_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Réponse d'erreur (400)

```json
{
  "success": false,
  "message": "Données de paiement invalides",
  "errors": [
    "Le montant doit être supérieur à 0",
    "Le mode de paiement doit être \"momo\" ou \"airtel\""
  ]
}
```

#### Rate Limiting
- **Limite** : 10 tentatives par IP toutes les 15 minutes
- **Headers de réponse** : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 2. Vérifier le statut d'un paiement

**GET** `/status/:fournisseurPaymentId`

Vérifie le statut actuel d'un paiement.

#### Paramètres d'URL

| Paramètre | Type | Description |
|-----------|------|-------------|
| `fournisseurPaymentId` | string | ID unique du paiement (format: `FCGPAY-{id}`) |

#### Réponse de succès (200)

```json
{
  "success": true,
  "transaction": {
    "fournisseur_payment_id": "FCGPAY-12345",
    "amount": 5000,
    "phone": "068242912",
    "mode": "momo",
    "currency": "XAF",
    "spaark_status": "COMPLETED",
    "internal_status": "completed",
    "completed_at": "2024-01-15T10:35:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

#### Rate Limiting
- **Limite** : 30 vérifications par IP toutes les 5 minutes

### 3. Webhook de paiement

**POST** `/webhook`

Endpoint pour recevoir les notifications de statut de Spaark Pay.

#### Paramètres de requête

```json
{
  "reference": "FCGPAY-12345",
  "status": "COMPLETED",
  "transactionId": "trans_123"
}
```

#### Réponse de succès (200)

```json
{
  "success": true,
  "message": "Webhook traité avec succès",
  "received": true,
  "transactionId": "FCGPAY-12345",
  "status": "completed"
}
```

#### Rate Limiting
- **Limite** : 100 webhooks par IP par minute

### 4. Transactions d'un utilisateur

**GET** `/user/:userId`

Récupère toutes les transactions d'un utilisateur.

#### Réponse de succès (200)

```json
{
  "success": true,
  "transactions": [
    {
      "fournisseur_payment_id": "FCGPAY-12345",
      "amount": 5000,
      "phone": "068242912",
      "mode": "momo",
      "spaark_status": "COMPLETED",
      "internal_status": "completed",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 5. Transactions d'une commande

**GET** `/order/:orderId`

Récupère toutes les transactions associées à une commande.

### 6. Health Check

**GET** `/health`

Vérifie l'état du service de paiement.

#### Réponse (200)

```json
{
  "success": true,
  "service": "Payment Service",
  "status": "operational",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Statuts des transactions

### Statuts Spaark Pay (`spaark_status`)

- **PENDING** : Transaction en attente de traitement
- **COMPLETED** : Transaction complétée avec succès
- **FAILED** : Transaction échouée

### Statuts internes (`internal_status`)

- **pending** : Transaction initiée, en attente
- **processing** : Transaction en cours de traitement
- **completed** : Transaction terminée avec succès
- **failed** : Transaction échouée
- **cancelled** : Transaction annulée

## Gestion des erreurs

### Codes d'erreur HTTP

- **400 Bad Request** : Données invalides ou manquantes
- **404 Not Found** : Transaction non trouvée
- **429 Too Many Requests** : Rate limit dépassé
- **500 Internal Server Error** : Erreur interne du serveur

### Format des erreurs

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Détails techniques (en développement uniquement)",
  "errors": ["Liste des erreurs de validation"]
}
```

## Sécurité

### Mesures de sécurité implémentées

1. **Rate Limiting** : Limitation du nombre de requêtes par IP
2. **Validation des données** : Validation stricte de tous les paramètres
3. **Logging de sécurité** : Enregistrement des tentatives suspectes
4. **Headers de sécurité** : Validation des headers HTTP
5. **Prévention Path Traversal** : Protection contre les attaques de chemin
6. **Limitation de payload** : Taille maximale des requêtes (1MB)

### Bonnes pratiques

1. **Validation côté client** : Validez les données avant envoi
2. **Gestion des erreurs** : Implémentez une gestion d'erreur robuste
3. **Retry logic** : Implémentez une logique de retry pour les échecs temporaires
4. **Monitoring** : Surveillez les logs pour détecter les anomalies
5. **Test en développement** : Utilisez les numéros de test fournis

## Exemples d'intégration

### JavaScript/TypeScript

```typescript
// Initier un paiement
const initiatePayment = async (paymentData: {
  amount: number
  phone: string
  mode: 'momo' | 'airtel'
  orderId?: string
  userId?: string
}) => {
  try {
    const response = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Paiement initié:', result.transaction.fournisseur_payment_id)
      return result.transaction
    } else {
      console.error('Erreur:', result.message)
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('Erreur réseau:', error)
    throw error
  }
}

// Vérifier le statut
const checkPaymentStatus = async (paymentId: string) => {
  try {
    const response = await fetch(`/api/payments/status/${paymentId}`)
    const result = await response.json()
    
    return result.transaction
  } catch (error) {
    console.error('Erreur vérification statut:', error)
    throw error
  }
}

// Polling pour vérifier le statut
const pollPaymentStatus = async (
  paymentId: string, 
  maxAttempts: number = 30,
  interval: number = 2000
) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const transaction = await checkPaymentStatus(paymentId)
    
    if (transaction.spaark_status === 'COMPLETED') {
      return { success: true, transaction }
    } else if (transaction.spaark_status === 'FAILED') {
      return { success: false, transaction }
    }
    
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error('Timeout: Le paiement n\'a pas été complété dans les temps')
}
```

### Vue.js/Nuxt.js

```vue
<template>
  <div class="payment-form">
    <form @submit.prevent="initiatePayment">
      <input 
        v-model="paymentData.amount" 
        type="number" 
        placeholder="Montant (XAF)"
        required
      >
      <input 
        v-model="paymentData.phone" 
        type="tel" 
        placeholder="Numéro de téléphone"
        required
      >
      <select v-model="paymentData.mode" required>
        <option value="">Choisir le mode</option>
        <option value="momo">MTN Mobile Money</option>
        <option value="airtel">Airtel Money</option>
      </select>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Traitement...' : 'Payer' }}
      </button>
    </form>
    
    <div v-if="paymentStatus" class="status">
      <p>Statut: {{ paymentStatus }}</p>
      <p v-if="transactionId">ID: {{ transactionId }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const isLoading = ref(false)
const paymentStatus = ref('')
const transactionId = ref('')

const paymentData = reactive({
  amount: 0,
  phone: '',
  mode: ''
})

const initiatePayment = async () => {
  isLoading.value = true
  paymentStatus.value = 'Initiation...'
  
  try {
    const response = await $fetch('/api/payments/initiate', {
      method: 'POST',
      body: paymentData
    })
    
    if (response.success) {
      transactionId.value = response.transaction.fournisseur_payment_id
      paymentStatus.value = 'En attente de paiement...'
      
      // Commencer le polling
      await pollPaymentStatus(transactionId.value)
    }
  } catch (error) {
    paymentStatus.value = 'Erreur: ' + error.message
  } finally {
    isLoading.value = false
  }
}

const pollPaymentStatus = async (paymentId: string) => {
  const maxAttempts = 30
  const interval = 2000
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await $fetch(`/api/payments/status/${paymentId}`)
      
      if (response.transaction.spaark_status === 'COMPLETED') {
        paymentStatus.value = 'Paiement réussi ✅'
        return
      } else if (response.transaction.spaark_status === 'FAILED') {
        paymentStatus.value = 'Paiement échoué ❌'
        return
      }
      
      await new Promise(resolve => setTimeout(resolve, interval))
    } catch (error) {
      console.error('Erreur polling:', error)
    }
  }
  
  paymentStatus.value = 'Timeout: Vérifiez manuellement le statut'
}
</script>
```

## Monitoring et Logs

### Logs disponibles

Le système génère des logs détaillés pour :

- **Initiation de paiement** : Tentatives et résultats
- **Vérification de statut** : Requêtes et réponses
- **Webhooks** : Réception et traitement
- **Erreurs de sécurité** : Tentatives suspectes
- **Performance** : Temps de réponse des opérations

### Métriques recommandées

- Taux de succès des paiements
- Temps moyen de traitement
- Nombre d'erreurs par type
- Utilisation du rate limiting
- Volume de transactions par mode de paiement

## Support et Contact

Pour toute question ou problème technique :

1. Consultez les logs du serveur
2. Vérifiez la configuration des variables d'environnement
3. Testez avec les numéros de test en développement
4. Contactez l'équipe technique de Spaark Pay pour les problèmes API

---

*Cette documentation est maintenue à jour avec les évolutions de l'API. Dernière mise à jour : Janvier 2024* 