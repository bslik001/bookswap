import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './auth.service';
import type { RegisterInput, VerifyOtpInput, ResendOtpInput, LoginInput } from './auth.schema';

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
