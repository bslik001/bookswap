import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as requestService from './request.service';
import type { CreateRequestInput, ListRequestsInput, UpdateRequestStatusInput } from './request.schema';

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateRequestInput;
  const result = await requestService.createRequest(req.user!.id, data);
  res.status(201).json({ success: true, data: result });
});

export const getMyRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await requestService.getMyRequests(req.user!.id);
  res.json({ success: true, data: requests });
});

export const getRequestById = asyncHandler(async (req: Request, res: Response) => {
  const result = await requestService.getRequestById(req.params.id as string, req.user!.id);
  res.json({ success: true, data: result });
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  await requestService.cancelRequest(req.params.id as string, req.user!.id);
  res.json({ success: true, data: { message: 'Demande annulee' } });
});

export const getRequestsForBook = asyncHandler(async (req: Request, res: Response) => {
  const result = await requestService.getRequestsForBook(req.params.id as string, req.user!.id);
  res.json({ success: true, data: result });
});

// ── Admin ──
export const listAllRequests = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListRequestsInput;
  const result = await requestService.listAllRequests(query);
  res.json({ success: true, data: result.requests, meta: result.meta });
});

export const updateRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateRequestStatusInput;
  const result = await requestService.updateRequestStatus(req.params.id as string, data);
  res.json({ success: true, data: result });
});
