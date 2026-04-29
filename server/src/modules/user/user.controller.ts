import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as userService from './user.service';
import type { UpdateProfileInput, ListUsersInput } from './user.schema';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getProfile(req.user!.id);
  res.json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateProfileInput;
  const user = await userService.updateProfile(req.user!.id, data);
  res.json({ success: true, data: user });
});

export const getPublicProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getPublicProfile(req.params.id as string);
  res.json({ success: true, data: user });
});

// ── Admin ──
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListUsersInput;
  const result = await userService.listUsers(query);
  res.json({ success: true, data: result.users, meta: result.meta });
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const { block } = req.body;
  const user = await userService.blockUser(req.params.id as string, block);
  res.json({ success: true, data: user });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  await userService.deleteAccount(req.user!.id, password);
  res.json({ success: true, data: { message: 'Compte supprime avec succes' } });
});

export const adminDeleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.adminDeleteUser(req.params.id as string, req.user!.id);
  res.json({ success: true, data: { message: 'Utilisateur supprime avec succes' } });
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await userService.getStats();
  res.json({ success: true, data: stats });
});
