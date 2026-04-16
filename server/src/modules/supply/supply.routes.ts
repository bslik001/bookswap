import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { validateId } from '../../middleware/validateId';
import { uploadSingle } from '../../middleware/upload';
import { createSupplySchema, listSuppliesSchema, contactSupplierSchema } from './supply.schema';
import * as supplyController from './supply.controller';

const router = Router();

router.use(authenticate);

// Liste et detail (tout utilisateur authentifie)
router.get('/', validate(listSuppliesSchema, 'query'), supplyController.listSupplies);
router.get('/:id', validateId, supplyController.getSupplyById);

// Creer (SUPPLIER ou ADMIN uniquement)
router.post('/',
  authorize('SUPPLIER', 'ADMIN'),
  uploadSingle('image'),
  validate(createSupplySchema),
  supplyController.createSupply
);

// Contacter le fournisseur
router.post('/:id/contact', validateId, validate(contactSupplierSchema), supplyController.contactSupplier);

export default router;
