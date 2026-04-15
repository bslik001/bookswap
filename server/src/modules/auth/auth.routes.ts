import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { createRateLimiter } from '../../middleware/rateLimiter';
import { registerSchema, verifyOtpSchema, resendOtpSchema, loginSchema, refreshTokenSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

// Rate limiters specifiques par endpoint
const registerLimiter = createRateLimiter(10 * 60 * 1000, 3);   // 3 inscriptions / 10 min
const loginLimiter = createRateLimiter(60 * 1000, 5);            // 5 tentatives / min
const otpLimiter = createRateLimiter(15 * 60 * 1000, 5);         // 5 verifications / 15 min
const resendLimiter = createRateLimiter(60 * 1000, 2);           // 2 renvois / min

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', resendLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

export default router;
