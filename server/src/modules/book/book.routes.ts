import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { validateId } from '../../middleware/validateId';
import { uploadSingle } from '../../middleware/upload';
import { createBookSchema, updateBookSchema, listBooksSchema } from './book.schema';
import * as bookController from './book.controller';
import * as requestController from '../request/request.controller';

const router = Router();

// Toutes les routes livres necessitent une authentification
router.use(authenticate);

// IMPORTANT : /me avant /:id
router.get('/me', bookController.getMyBooks);

// Liste avec filtres, recherche, pagination
router.get('/', validate(listBooksSchema, 'query'), bookController.listBooks);

// Detail d'un livre
router.get('/:id', validateId, bookController.getBookById);

// Demandes recues sur un de mes livres (proprietaire uniquement)
router.get('/:id/requests', validateId, requestController.getRequestsForBook);

// Creer — Multer AVANT Zod (form-data doit etre parse avant validation)
router.post('/', uploadSingle('image'), validate(createBookSchema), bookController.createBook);

// Modifier
router.put('/:id', validateId, uploadSingle('image'), validate(updateBookSchema), bookController.updateBook);

// Supprimer
router.delete('/:id', validateId, bookController.deleteBook);

export default router;
