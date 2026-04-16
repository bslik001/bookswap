/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription
 *     description: Cree un compte inactif et envoie un code OTP par SMS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, phone, address, gradeInterests]
 *             properties:
 *               firstName: { type: string, minLength: 2, maxLength: 100 }
 *               lastName: { type: string, minLength: 2, maxLength: 100 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, description: "Majuscule + minuscule + chiffre" }
 *               phone: { type: string, minLength: 8, maxLength: 20 }
 *               address: { type: string, minLength: 5, maxLength: 500 }
 *               gradeInterests: { type: array, items: { type: string }, minItems: 1 }
 *     responses:
 *       201:
 *         description: Compte cree, OTP envoye
 *       409:
 *         description: Email ou telephone deja utilise
 *
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verifier le code OTP
 *     description: Active le compte et retourne les tokens JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone: { type: string }
 *               code: { type: string, minLength: 4, maxLength: 4 }
 *     responses:
 *       200:
 *         description: Compte active, tokens retournes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Tokens' }
 *       400:
 *         description: Code incorrect ou expire
 *
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Renvoyer le code OTP
 *     description: Cooldown 60s, max 3/heure
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Code renvoye
 *       429:
 *         description: Cooldown actif ou limite atteinte
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Tokens retournes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Tokens' }
 *       401:
 *         description: Identifiants incorrects
 *       403:
 *         description: Compte inactif
 *
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Renouveler les tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nouvelle paire de tokens
 *       401:
 *         description: Token invalide ou revoque
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Deconnexion
 *     description: Invalide tous les refresh tokens de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deconnexion reussie
 *
 * /auth/change-password:
 *   put:
 *     tags: [Auth]
 *     summary: Changer le mot de passe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Mot de passe modifie
 *       400:
 *         description: Mot de passe actuel incorrect
 *
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Mot de passe oublie
 *     description: Envoie un OTP par SMS (reponse opaque)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Code envoye si le numero est associe a un compte
 *
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reinitialiser le mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code, newPassword]
 *             properties:
 *               phone: { type: string }
 *               code: { type: string, minLength: 4, maxLength: 4 }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Mot de passe reinitialise
 *       400:
 *         description: Code incorrect ou expire
 */
