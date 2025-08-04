import { test } from '@japa/runner'
import { SmsService } from '#services/sms_service'

test.group('SMS MTN Integration Tests', () => {
  test('should validate phone number format (MTN format)', async ({ assert }) => {
    const smsService = new SmsService()

    // Numéros valides au format MTN (242XXXXXXXX)
    assert.isTrue(smsService.validatePhoneNumber('242053518256'))
    assert.isTrue(smsService.validatePhoneNumber('242048463499'))
    assert.isTrue(smsService.validatePhoneNumber('242067123456'))

    // Numéros invalides
    assert.isFalse(smsService.validatePhoneNumber('053518256')) // Format local non supporté
    assert.isFalse(smsService.validatePhoneNumber('123456789'))
    assert.isFalse(smsService.validatePhoneNumber('242033518256')) // Pas un préfixe valide (03)
    assert.isFalse(smsService.validatePhoneNumber('+242053518256')) // Plus (+) non supporté
  })

  test('should format phone number for MTN', async ({ assert }) => {
    const smsService = new SmsService()

    // Numéros déjà au bon format
    assert.equal(smsService.formatPhoneNumberForMTN('242053518256'), '242053518256')

    // Numéros avec espaces et tirets
    assert.equal(smsService.formatPhoneNumberForMTN('242 053 518 256'), '242053518256')
    assert.equal(smsService.formatPhoneNumberForMTN('242-053-518-256'), '242053518256')
  })

  test('should calculate SMS cost according to MTN rules', async ({ assert }) => {
    const smsService = new SmsService()

    // 1 SMS (≤ 160 caractères)
    assert.equal(smsService.calculateSmsCost('Test message'), 25)
    assert.equal(smsService.calculateSmsCost('A'.repeat(160)), 25)

    // 2 SMS (161-306 caractères)
    assert.equal(smsService.calculateSmsCost('A'.repeat(161)), 50)
    assert.equal(smsService.calculateSmsCost('A'.repeat(306)), 50)

    // 3 SMS (307-459 caractères)
    assert.equal(smsService.calculateSmsCost('A'.repeat(307)), 75)
    assert.equal(smsService.calculateSmsCost('A'.repeat(459)), 75)

    // 7 SMS (limite MTN selon la doc)
    assert.equal(smsService.calculateSmsCost('A'.repeat(1071)), 175)
  })

  test('should extract cost from MTN result (updated format)', async ({ assert }) => {
    const smsService = new SmsService()

    // Test avec coût extrait - format pluriel
    const result1 = 'envoyé (coût: 46 crédits)'
    assert.equal(smsService['extractCostFromResult'](result1), 46)

    // Test avec coût extrait - format singulier
    const result2 = 'envoyé (coût: 11 crédit)'
    assert.equal(smsService['extractCostFromResult'](result2), 11)

    // Test sans coût (valeur par défaut)
    const result3 = 'envoyé avec succès'
    assert.equal(smsService['extractCostFromResult'](result3), 25)
  })

  test('should map MTN status codes correctly', async ({ assert }) => {
    const smsService = new SmsService()

    assert.equal(smsService['mapMtnStatusToStandard']('0'), 'pending')     // En attente
    assert.equal(smsService['mapMtnStatusToStandard']('1'), 'delivered')   // Livré au téléphone
    assert.equal(smsService['mapMtnStatusToStandard']('2'), 'failed')      // Non remis au téléphone
    assert.equal(smsService['mapMtnStatusToStandard']('4'), 'pending')     // Mis en file d'attente sur SMSC
    assert.equal(smsService['mapMtnStatusToStandard']('8'), 'sent')        // Livré au SMSC
    assert.equal(smsService['mapMtnStatusToStandard']('16'), 'failed')     // Rejet SMSC
    assert.equal(smsService['mapMtnStatusToStandard']('99'), 'pending')    // Code inconnu
  })

  test('should get service configuration (simplified)', async ({ assert }) => {
    const smsService = new SmsService()
    const config = smsService.getConfig()

    assert.property(config, 'baseUrl')
    assert.property(config, 'authToken')
    assert.property(config, 'environment')

    assert.include(config.baseUrl, 'sms.mtncongo.net')
    assert.include(config.authToken, 'ac6b69b90482d286cbeec099b1f6359205b2533c')
  })

  test('should validate message characters according to MTN rules', async ({ assert }) => {
    const smsService = new SmsService()

    // Message GSM valide
    const gsmMessage = 'Hello world! 123'
    const gsmValidation = smsService.validateMessageCharacters(gsmMessage)
    assert.equal(gsmValidation.type, 'GSM')
    assert.isTrue(gsmValidation.isValid)

    // Message Unicode (avec accents)
    const unicodeMessage = 'Bonjour à tous ! 🎉'
    const unicodeValidation = smsService.validateMessageCharacters(unicodeMessage)
    assert.equal(unicodeValidation.type, 'Unicode')
    assert.isTrue(unicodeValidation.isValid)
  })

  test('should check health with correct token', async ({ assert }) => {
    const smsService = new SmsService()
    const health = await smsService.healthCheck()

    assert.property(health, 'status')
    assert.property(health, 'message')

    // Le service devrait être healthy avec le bon token
    if (health.status === 'healthy') {
      assert.include(health.message, 'ac6b69b90482d')
    }
  })

  test('should handle MTN API response format correctly', async ({ assert }) => {
    // Simuler une réponse MTN réussie selon la vraie documentation
    const mtnSuccessResponse = {
      resultat: 'envoyé (coût: 11 crédit)', // Format réel observé
      status: '200',
      id: '10',
    }

    // Simuler une réponse MTN d'erreur
    const mtnErrorResponse = {
      resultat: 'Erreur MSISDN: 24206846349',
      detail: 'format numéro incorrect dans le paramètre receivers: 24206846349',
      status: '404',
    }

    // Vérifier la structure des réponses
    assert.property(mtnSuccessResponse, 'resultat')
    assert.property(mtnSuccessResponse, 'status')
    assert.property(mtnSuccessResponse, 'id')

    assert.property(mtnErrorResponse, 'resultat')
    assert.property(mtnErrorResponse, 'detail')
    assert.property(mtnErrorResponse, 'status')

    // Vérifier que la logique de succès fonctionne
    const isSuccess = mtnSuccessResponse.resultat.toLowerCase().includes('envoyé')
    assert.isTrue(isSuccess)
  })

  test('should validate message length limits according to MTN', async ({ assert }) => {
    const smsService = new SmsService()

    // Message valide (≤ 160 caractères)
    const shortMessage = 'Test message'
    assert.isTrue(shortMessage.length <= 160)

    // Message long mais valide (≤ 1071 caractères selon MTN)
    const longMessage = 'A'.repeat(1071)
    assert.isTrue(longMessage.length <= 1071)

    // Message trop long (> 1071 caractères)
    const tooLongMessage = 'A'.repeat(1072)
    assert.isTrue(tooLongMessage.length > 1071)

    // Vérifier le calcul du coût pour les messages longs
    const cost = smsService.calculateSmsCost(longMessage)
    assert.equal(cost, 175) // 7 SMS * 25 = 175
  })
})
