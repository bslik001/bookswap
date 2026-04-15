import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { generateOtp, isOtpExpired } from '../../utils/otp';
import { sendSms } from '../../config/africastalking';
import { AppError } from '../../middleware/errorHandler';
import type { RegisterInput, LoginInput, VerifyOtpInput, ResendOtpInput } from './auth.schema';

// ── Register ──
export const register = async (data: RegisterInput) => {
  // Verifier unicite email + phone
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });

  if (existing) {
    const field = existing.email === data.email ? 'email' : 'phone';
    throw new AppError(409, 'CONFLICT', `Ce ${field} est deja utilise`);
  }

  const hashed = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashed,
      phone: data.phone,
      address: data.address,
      gradeInterests: data.gradeInterests,
      isActive: false,
      isPhoneVerified: false,
    },
  });

  // Generer et stocker l'OTP
  const code = generateOtp();
  await prisma.otpVerification.create({
    data: {
      phone: data.phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  // Envoyer le SMS (en dev, log en console)
  await sendSms(data.phone, `BookSwap: Votre code de verification est ${code}`);

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
  };
};

// ── Verify OTP ──
export const verifyOtp = async (data: VerifyOtpInput) => {
  const otp = await prisma.otpVerification.findFirst({
    where: { phone: data.phone },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    throw new AppError(400, 'INVALID_OTP', 'Aucun code OTP trouve pour ce numero');
  }

  if (isOtpExpired(otp.expiresAt)) {
    throw new AppError(400, 'OTP_EXPIRED', 'Le code OTP a expire, demandez-en un nouveau');
  }

  if (otp.attempts >= 5) {
    throw new AppError(429, 'TOO_MANY_ATTEMPTS', 'Trop de tentatives, demandez un nouveau code');
  }

  if (otp.code !== data.code) {
    // Incrementer les tentatives
    await prisma.otpVerification.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError(400, 'INVALID_OTP', 'Code OTP incorrect');
  }

  // OTP valide → activer le compte
  const user = await prisma.user.update({
    where: { phone: data.phone },
    data: { isActive: true, isPhoneVerified: true },
  });

  // Nettoyer les OTP de ce numero
  await prisma.otpVerification.deleteMany({ where: { phone: data.phone } });

  // Generer les tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

// ── Resend OTP ──
export const resendOtp = async (data: ResendOtpInput) => {
  const user = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Aucun compte avec ce numero');
  }

  if (user.isPhoneVerified) {
    throw new AppError(400, 'ALREADY_VERIFIED', 'Ce numero est deja verifie');
  }

  // Cooldown : verifier le dernier OTP envoye (60 secondes)
  const lastOtp = await prisma.otpVerification.findFirst({
    where: { phone: data.phone },
    orderBy: { createdAt: 'desc' },
  });

  if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < 60 * 1000) {
    throw new AppError(429, 'COOLDOWN', 'Veuillez attendre 60 secondes avant de renvoyer un code');
  }

  // Max 3 OTP par heure
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.otpVerification.count({
    where: { phone: data.phone, createdAt: { gte: oneHourAgo } },
  });

  if (recentCount >= 3) {
    throw new AppError(429, 'RATE_LIMITED', 'Maximum 3 codes par heure, reessayez plus tard');
  }

  // Supprimer les anciens OTP et creer un nouveau
  await prisma.otpVerification.deleteMany({ where: { phone: data.phone } });

  const code = generateOtp();
  await prisma.otpVerification.create({
    data: {
      phone: data.phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  await sendSms(data.phone, `BookSwap: Votre code de verification est ${code}`);

  return { message: 'Code OTP renvoye avec succes' };
};

// ── Login ──
export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !(await comparePassword(data.password, user.password))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect');
  }

  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Compte non active, verifiez votre numero de telephone');
  }

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

// ── Refresh Token ──
export const refreshToken = async (token: string) => {
  const payload = verifyRefreshToken(token);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || !user.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'Utilisateur introuvable ou inactif');
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new AppError(401, 'TOKEN_REVOKED', 'Token revoque, veuillez vous reconnecter');
  }

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const newRefreshToken = generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

  return { accessToken, refreshToken: newRefreshToken };
};
