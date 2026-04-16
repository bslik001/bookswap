/**
 * @swagger
 * /admin/users/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Statistiques globales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques users, books, requests, supplies
 *       403:
 *         description: Admin requis
 *
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Lister les utilisateurs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [USER, ADMIN, SUPPLIER] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste paginee des utilisateurs
 *
 * /admin/users/{id}/block:
 *   put:
 *     tags: [Admin]
 *     summary: Bloquer/debloquer un utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [block]
 *             properties:
 *               block: { type: boolean }
 *     responses:
 *       200:
 *         description: Utilisateur bloque/debloque
 *       403:
 *         description: Impossible de bloquer un admin
 *
 * /admin/requests:
 *   get:
 *     tags: [Admin]
 *     summary: Toutes les demandes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, IN_PROGRESS, ACCEPTED, REFUSED, COMPLETED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste avec coordonnees completes
 *
 * /admin/requests/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Changer le statut d'une demande
 *     description: "Transitions: PENDING→IN_PROGRESS, IN_PROGRESS→ACCEPTED/REFUSED, ACCEPTED→COMPLETED/REFUSED. ACCEPTED→livre RESERVED, COMPLETED→livre EXCHANGED."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [IN_PROGRESS, ACCEPTED, REFUSED, COMPLETED] }
 *               adminNotes: { type: string }
 *     responses:
 *       200:
 *         description: Statut mis a jour
 *       400:
 *         description: Transition illegale
 */
