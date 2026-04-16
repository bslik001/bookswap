/**
 * @swagger
 * /supplies:
 *   get:
 *     tags: [Supplies]
 *     summary: Lister les fournitures
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [NOTEBOOK, PEN, BAG, OTHER] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste paginee
 *   post:
 *     tags: [Supplies]
 *     summary: Ajouter une fourniture (Supplier/Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [NOTEBOOK, PEN, BAG, OTHER] }
 *               description: { type: string }
 *               price: { type: number }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Fourniture creee
 *       403:
 *         description: Role insuffisant
 *
 * /supplies/{id}:
 *   get:
 *     tags: [Supplies]
 *     summary: Detail d'une fourniture
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail fourniture
 *
 * /supplies/{id}/contact:
 *   post:
 *     tags: [Supplies]
 *     summary: Contacter le fournisseur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Demande de contact creee
 */
