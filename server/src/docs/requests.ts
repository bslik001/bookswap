/**
 * @swagger
 * /requests:
 *   post:
 *     tags: [Requests]
 *     summary: Demander un livre
 *     description: "Regles: livre AVAILABLE, pas son propre livre, une seule demande active par livre"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId]
 *             properties:
 *               bookId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Demande creee
 *       403:
 *         description: Ne peut pas demander son propre livre
 *       409:
 *         description: Demande deja existante
 *
 * /requests/me:
 *   get:
 *     tags: [Requests]
 *     summary: Mes demandes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de mes demandes avec infos livre
 */
