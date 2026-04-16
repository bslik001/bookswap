/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Mon profil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil complet
 *   put:
 *     tags: [Users]
 *     summary: Modifier mon profil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               gradeInterests: { type: array, items: { type: string } }
 *               fcmToken: { type: string }
 *     responses:
 *       200:
 *         description: Profil mis a jour
 *   delete:
 *     tags: [Users]
 *     summary: Supprimer mon compte
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Compte supprime
 *
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Profil public (nom tronque)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Profil public
 *       404:
 *         description: Utilisateur introuvable
 */
