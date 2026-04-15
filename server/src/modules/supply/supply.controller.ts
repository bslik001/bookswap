import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as supplyService from './supply.service';
import type { CreateSupplyInput, ListSuppliesInput, ContactSupplierInput } from './supply.schema';

export const listSupplies = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListSuppliesInput;
  const result = await supplyService.listSupplies(query);
  res.json({ success: true, data: result.supplies, meta: result.meta });
});

export const getSupplyById = asyncHandler(async (req: Request, res: Response) => {
  const supply = await supplyService.getSupplyById(req.params.id as string);
  res.json({ success: true, data: supply });
});

export const createSupply = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateSupplyInput;
  const supply = await supplyService.createSupply(req.user!.id, data, req.file?.buffer);
  res.status(201).json({ success: true, data: supply });
});

export const contactSupplier = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ContactSupplierInput;
  const result = await supplyService.contactSupplier(req.user!.id, req.params.id as string, data);
  res.status(201).json({ success: true, data: result });
});
