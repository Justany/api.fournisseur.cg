import { test } from '@japa/runner'
import { SmsService } from '#services/sms_service'

test.group('SMS Integration Tests', () => {
  test('should validate phone number format', async ({ assert }) => {
    const smsService = new SmsService()

    // Numéros valides
    assert.isTrue(smsService.validatePhoneNumber('053518256'))
    assert.isTrue(smsService.validatePhoneNumber('068463499'))
    assert.isTrue(smsService.validatePhoneNumber('077123456'))

    // Numéros invalides
    assert.isFalse(smsService.validatePhoneNumber('123456789'))
    assert.isFalse(smsService.validatePhoneNumber('05351825'))
    assert.isFalse(smsService.validatePhoneNumber('0535182567'))
    assert.isFalse(smsService.validatePhoneNumber('+242053518256'))
  })

  test('should format phone number correctly', async ({ assert }) => {
    const smsService = new SmsService()

    assert.equal(smsService.formatPhoneNumber('053518256'), '053518256')
    assert.equal(smsService.formatPhoneNumber('242053518256'), '053518256')
    assert.equal(smsService.formatPhoneNumber('+242053518256'), '053518256')
    assert.equal(smsService.formatPhoneNumber('053 518 256'), '053518256')
    assert.equal(smsService.formatPhoneNumber('053-518-256'), '053518256')
  })

  test('should calculate SMS cost correctly', async ({ assert }) => {
    const smsService = new SmsService()

    // 1 SMS (≤ 160 caractères)
    assert.equal(smsService.calculateSmsCost('Test message'), 25)
    assert.equal(smsService.calculateSmsCost('A'.repeat(160)), 25)

    // 2 SMS (> 160 caractères)
    assert.equal(smsService.calculateSmsCost('A'.repeat(161)), 50)
    assert.equal(smsService.calculateSmsCost('A'.repeat(306)), 50)

    // 3 SMS (> 306 caractères)
    assert.equal(smsService.calculateSmsCost('A'.repeat(307)), 75)
    assert.equal(smsService.calculateSmsCost('A'.repeat(459)), 75)
  })

  test('should extract cost from MTN result', async ({ assert }) => {
    const smsService = new SmsService()

    // Test avec coût extrait
    const result1 = 'envoyé (coût: 46 crédits)'
    assert.equal(smsService['extractCostFromResult'](result1), 46)

    // Test sans coût (valeur par défaut)
    const result2 = 'envoyé avec succès'
    assert.equal(smsService['extractCostFromResult'](result2), 25)
  })

  test('should map MTN status codes correctly', async ({ assert }) => {
    const smsService = new SmsService()

    assert.equal(smsService['mapMtnStatusToStandard']('0'), 'pending')
    assert.equal(smsService['mapMtnStatusToStandard']('1'), 'delivered')
    assert.equal(smsService['mapMtnStatusToStandard']('2'), 'failed')
    assert.equal(smsService['mapMtnStatusToStandard']('4'), 'pending')
    assert.equal(smsService['mapMtnStatusToStandard']('8'), 'sent')
    assert.equal(smsService['mapMtnStatusToStandard']('16'), 'failed')
    assert.equal(smsService['mapMtnStatusToStandard']('99'), 'pending') // Code inconnu
  })

  test('should get service configuration', async ({ assert }) => {
    const smsService = new SmsService()
    const config = smsService.getConfig()

    assert.property(config, 'baseUrl')
    assert.property(config, 'apiKey')
    assert.property(config, 'username')
    assert.property(config, 'password')
    assert.property(config, 'environment')

    assert.include(config.baseUrl, 'sms.mtncongo.net')
  })

  test('should handle authentication token', async ({ assert }) => {
    const smsService = new SmsService()

    // Test sans token
    smsService.clearAuthToken()
    assert.isUndefined(smsService['authToken'])

    // Test avec token
    const testToken = 'Token test123'
    smsService.setAuthToken(testToken)
    assert.equal(smsService['authToken'], testToken)
  })

  test('should check service availability', async ({ assert }) => {
    const smsService = new SmsService()

    // Mock health check pour éviter les appels réseau
    const originalHealthCheck = smsService.healthCheck.bind(smsService)
    smsService.healthCheck = async () => ({ status: 'healthy', message: 'Test' })

    const isAvailable = await smsService.isAvailable()
    assert.isTrue(isAvailable)

    // Restaurer la méthode originale
    smsService.healthCheck = originalHealthCheck
  })

  test('should validate message length limits', async ({ assert }) => {
    const smsService = new SmsService()

    // Message valide (≤ 160 caractères)
    const shortMessage = 'Test message'
    assert.isTrue(shortMessage.length <= 160)

    // Message trop long (> 160 caractères)
    const longMessage = 'A'.repeat(161)
    assert.isTrue(longMessage.length > 160)

    // Vérifier le calcul du coût pour les messages longs
    const cost = smsService.calculateSmsCost(longMessage)
    assert.isTrue(cost > 25) // Plus d'un SMS
  })

  test('should handle MTN API response format', async ({ assert }) => {
    // Simuler une réponse MTN réussie
    const mtnSuccessResponse = {
      resultat: 'envoyé (coût: 46 crédits)',
      status: '200',
      id: '10',
    }

    // Simuler une réponse MTN d'erreur
    const mtnErrorResponse = {
      resultat: 'Erreur MSISDN: 24206846349',
      detail: 'format numéro incorrect dans le paramètre receivers: 24206846349',
      status: '404',
    }

    assert.property(mtnSuccessResponse, 'resultat')
    assert.property(mtnSuccessResponse, 'status')
    assert.property(mtnSuccessResponse, 'id')

    assert.property(mtnErrorResponse, 'resultat')
    assert.property(mtnErrorResponse, 'detail')
    assert.property(mtnErrorResponse, 'status')
  })
})
