import crypto from 'crypto';

export const generateOtp = (): string => {
  const code = crypto.randomInt(1000, 9999);
  return code.toString();
};

export const isOtpExpired = (expiresAt: Date): boolean =>
  new Date() > expiresAt;

export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length < 6) return phone;
  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-2);
  const masked = cleaned.slice(4, -2).replace(/./g, '*');
  return `${prefix} ${masked} ${suffix}`;
};
