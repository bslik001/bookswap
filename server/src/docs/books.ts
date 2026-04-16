/**
 * @swagger
 * /books:
 *   get:
 *     tags: [Books]
 *     summary: Lister les livres
 *     description: Filtres par grade, condition, status. Recherche full-text avec ?search=
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: grade
 *         schema: { type: string }
 *         description: "Ex: 6eme, 5eme, Terminale"
 *       - in: query
 *         name: condition
 *         schema: { type: string, enum: [NEW, USED] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [AVAILABLE, RESERVED, EXCHANGED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche full-text (titre, auteur) en francais
 *     responses:
 *       200:
 *         description: Liste paginee
 *   post:
 *     tags: [Books]
 *     summary: Ajouter un livre
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, grade, condition, image]
 *             properties:
 *               title: { type: string }
 *               author: { type: string }
 *               grade: { type: string }
 *               className: { type: string }
 *               condition: { type: string, enum: [NEW, USED] }
 *               description: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Livre cree
 *
 * /books/me:
 *   get:
 *     tags: [Books]
 *     summary: Mes livres
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de mes livres (max 100)
 *
 * /books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Detail d'un livre
 *     description: Inclut hasRequested et owner avec nom tronque
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail du livre
 *       404:
 *         description: Livre introuvable
 *   put:
 *     tags: [Books]
 *     summary: Modifier un livre (proprietaire)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               author: { type: string }
 *               grade: { type: string }
 *               className: { type: string }
 *               condition: { type: string, enum: [NEW, USED] }
 *               description: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Livre modifie
 *       403:
 *         description: Non proprietaire
 *   delete:
 *     tags: [Books]
 *     summary: Supprimer un livre (proprietaire ou admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Livre supprime
 *       403:
 *         description: Non autorise
 */
