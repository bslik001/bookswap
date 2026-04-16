/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Mes notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste paginee (DESC)
 *
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Nombre de notifications non lues
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compteur
 *
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Tout marquer comme lu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les notifications marquees comme lues
 *
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Marquer une notification comme lue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification marquee comme lue
 */
