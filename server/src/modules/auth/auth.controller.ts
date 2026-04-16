import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './auth.service';
import type { RegisterInput, VerifyOtpInput, ResendOtpInput, LoginInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as RegisterInput;
  const result = await authService.register(data);
  res.status(201).json({ success: true, data: result });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as VerifyOtpInput;
  const result = await authService.verifyOtp(data);
  res.json({ success: true, data: result });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ResendOtpInput;
  const result = await authService.resendOtp(data);
  res.json({ success: true, data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as LoginInput;
  const result = await authService.login(data);
  res.json({ success: true, data: result });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const result = await authService.refreshToken(token);
  res.json({ success: true, data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.id);
  res.json({ success: true, data: { message: 'Deconnexion reussie' } });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ChangePasswordInput;
  await authService.changePassword(req.user!.id, data);
  res.json({ success: true, data: { message: 'Mot de passe modifie avec succes' } });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ForgotPasswordInput;
  const result = await authService.forgotPassword(data);
  res.json({ success: true, data: result });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ResetPasswordInput;
  await authService.resetPassword(data);
  res.json({ success: true, data: { message: 'Mot de passe reinitialise avec succes' } });
});
