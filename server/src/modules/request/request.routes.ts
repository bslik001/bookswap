import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { validateId } from '../../middleware/validateId';
import { createRequestSchema, listRequestsSchema, updateRequestStatusSchema } from './request.schema';
import * as requestController from './request.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(createRequestSchema), requestController.createRequest);
router.get('/me', requestController.getMyRequests);

export default router;

// ── Routes admin ──
export const adminRequestRouter = Router();

adminRequestRouter.use(authenticate);
adminRequestRouter.use(authorize('ADMIN'));

adminRequestRouter.get('/', validate(listRequestsSchema, 'query'), requestController.listAllRequests);
adminRequestRouter.put('/:id', validateId, validate(updateRequestStatusSchema), requestController.updateRequestStatus);
