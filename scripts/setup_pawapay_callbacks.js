// Create dedicated Appwrite collections for PawaPay callbacks (deposit/payout/refund)
// Usage:
//   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... APPWRITE_DATABASE_ID=... \
//   node scripts/setup_pawapay_callbacks.js

import { Client, Databases } from 'node-appwrite'

const REQUIRED_ENV = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
]

function ensureEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k] || String(process.env[k]).trim() === '')
  if (missing.length) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }
}

function makeClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
  return client
}

async function safeCall(fn, description) {
  try {
    const res = await fn()
    console.log(`✅ ${description}`)
    return res
  } catch (err) {
    const msg = err?.message || String(err)
    if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
      console.log(`ℹ️  ${description} already exists`)
      return null
    }
    console.error(`❌ Failed: ${description}`)
    console.error(msg)
    throw err
  }
}

async function ensureCollection(databases, databaseId, collectionId, name) {
  try {
    const existing = await databases.getCollection(databaseId, collectionId)
    console.log(`ℹ️  Collection '${collectionId}' exists`)
    return existing
  } catch {
    // createCollection(databaseId, collectionId, name, permissions?, documentSecurity?, enabled?)
    // We want permissions array, documentSecurity=false, enabled=true
    const permissions = [
      'create("any")',
      'read("any")',
      'update("any")',
      'delete("team:administrators")',
    ]
    return await safeCall(
      () => databases.createCollection(databaseId, collectionId, name, permissions, false, true),
      `Create collection '${collectionId}'`
    )
  }
}

async function ensureStringAttr(databases, databaseId, collectionId, key, size, required = false) {
  return safeCall(
    () => databases.createStringAttribute(databaseId, collectionId, key, size, required, undefined, undefined, false),
    `Attr '${collectionId}.${key}'`
  )
}

async function ensureDatetimeAttr(databases, databaseId, collectionId, key, required = false) {
  return safeCall(
    () => databases.createDatetimeAttribute(databaseId, collectionId, key, required, undefined),
    `Attr '${collectionId}.${key}'`
  )
}

async function ensureDoubleAttr(databases, databaseId, collectionId, key, required = false) {
  return safeCall(
    () => databases.createFloatAttribute(databaseId, collectionId, key, required, undefined, undefined, undefined),
    `Attr '${collectionId}.${key}'`
  )
}

async function ensureIndex(databases, databaseId, collectionId, key, attributes, orders) {
  return safeCall(
    () => databases.createIndex(databaseId, collectionId, key, 'key', attributes, orders),
    `Index '${collectionId}.${key}'`
  )
}

async function setupDeposit(databases, databaseId) {
  const cid = 'pawapay_deposit_callbacks'
  await ensureCollection(databases, databaseId, cid, 'pawapay_deposit_callbacks')

  // core fields
  await ensureStringAttr(databases, databaseId, cid, 'deposit_id', 36)
  await ensureStringAttr(databases, databaseId, cid, 'status', 20)
  await ensureStringAttr(databases, databaseId, cid, 'amount', 23)
  await ensureStringAttr(databases, databaseId, cid, 'currency', 3)
  await ensureStringAttr(databases, databaseId, cid, 'country', 3)
  await ensureDatetimeAttr(databases, databaseId, cid, 'created_at')
  await ensureStringAttr(databases, databaseId, cid, 'customer_message', 22)
  await ensureStringAttr(databases, databaseId, cid, 'provider_transaction_id', 100)

  // payer details
  await ensureStringAttr(databases, databaseId, cid, 'payer_type', 10)
  await ensureStringAttr(databases, databaseId, cid, 'payer_provider', 50)
  await ensureStringAttr(databases, databaseId, cid, 'payer_phone', 30)

  // failure + metadata
  await ensureStringAttr(databases, databaseId, cid, 'failure_reason', 1000)
  await ensureStringAttr(databases, databaseId, cid, 'metadata_json', 16384)
  await ensureStringAttr(databases, databaseId, cid, 'raw_payload', 16384)

  // housekeeping
  await ensureDatetimeAttr(databases, databaseId, cid, 'received_at')
  await ensureStringAttr(databases, databaseId, cid, 'source', 50)

  // indexes
  await ensureIndex(databases, databaseId, cid, 'deposit_id_index', ['deposit_id'], ['ASC'])
  await ensureIndex(databases, databaseId, cid, 'status_index', ['status'], ['ASC'])
  await ensureIndex(databases, databaseId, cid, 'provider_tx_index', ['provider_transaction_id'], ['ASC'])
}

async function setupPayout(databases, databaseId) {
  const cid = 'pawapay_payout_callbacks'
  await ensureCollection(databases, databaseId, cid, 'pawapay_payout_callbacks')

  await ensureStringAttr(databases, databaseId, cid, 'payout_id', 36)
  await ensureStringAttr(databases, databaseId, cid, 'status', 20)
  await ensureStringAttr(databases, databaseId, cid, 'amount', 23)
  await ensureStringAttr(databases, databaseId, cid, 'currency', 3)
  await ensureStringAttr(databases, databaseId, cid, 'country', 3)
  await ensureDatetimeAttr(databases, databaseId, cid, 'created_at')
  await ensureStringAttr(databases, databaseId, cid, 'customer_message', 22)
  await ensureStringAttr(databases, databaseId, cid, 'provider_transaction_id', 100)

  await ensureStringAttr(databases, databaseId, cid, 'recipient_type', 10)
  await ensureStringAttr(databases, databaseId, cid, 'recipient_provider', 50)
  await ensureStringAttr(databases, databaseId, cid, 'recipient_phone', 30)

  await ensureStringAttr(databases, databaseId, cid, 'failure_reason', 1000)
  await ensureStringAttr(databases, databaseId, cid, 'metadata_json', 16384)
  await ensureStringAttr(databases, databaseId, cid, 'raw_payload', 16384)

  await ensureDatetimeAttr(databases, databaseId, cid, 'received_at')
  await ensureStringAttr(databases, databaseId, cid, 'source', 50)

  await ensureIndex(databases, databaseId, cid, 'payout_id_index', ['payout_id'], ['ASC'])
  await ensureIndex(databases, databaseId, cid, 'status_index', ['status'], ['ASC'])
  await ensureIndex(databases, databaseId, cid, 'provider_tx_index', ['provider_transaction_id'], ['ASC'])
}

async function setupRefund(databases, databaseId) {
  const cid = 'pawapay_refund_callbacks'
  await ensureCollection(databases, databaseId, cid, 'pawapay_refund_callbacks')

  await ensureStringAttr(databases, databaseId, cid, 'refund_id', 36)
  await ensureStringAttr(databases, databaseId, cid, 'original_deposit_id', 36)
  await ensureStringAttr(databases, databaseId, cid, 'status', 20)
  await ensureStringAttr(databases, databaseId, cid, 'amount', 23)
  await ensureStringAttr(databases, databaseId, cid, 'currency', 3)
  await ensureDatetimeAttr(databases, databaseId, cid, 'created_at')
  await ensureStringAttr(databases, databaseId, cid, 'customer_message', 22)
  await ensureStringAttr(databases, databaseId, cid, 'provider_transaction_id', 100)

  await ensureStringAttr(databases, databaseId, cid, 'failure_reason', 1000)
  await ensureStringAttr(databases, databaseId, cid, 'metadata_json', 16384)
  await ensureStringAttr(databases, databaseId, cid, 'raw_payload', 16384)

  await ensureDatetimeAttr(databases, databaseId, cid, 'received_at')
  await ensureStringAttr(databases, databaseId, cid, 'source', 50)

  await ensureIndex(databases, databaseId, cid, 'refund_id_index', ['refund_id'], ['ASC'])
  await ensureIndex(databases, databaseId, cid, 'status_index', ['status'], ['ASC'])
  await ensureIndex(databases, databaseId, cid, 'original_deposit_index', ['original_deposit_id'], ['ASC'])
}

async function run() {
  ensureEnv()
  const client = makeClient()
  const databases = new Databases(client)
  const db = process.env.APPWRITE_DATABASE_ID

  await setupDeposit(databases, db)
  await setupPayout(databases, db)
  await setupRefund(databases, db)

  console.log('✅ PawaPay callback collections are ready')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
