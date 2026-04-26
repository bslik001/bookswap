import { describe, it, expect } from 'vitest';
import {
  changePasswordSchema,
  createBookSchema,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from './validation';

describe('loginSchema', () => {
  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'whatever' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    firstName: 'Aissatou',
    lastName: 'Ba',
    email: 'a@b.sn',
    password: 'Password1',
    phone: '+221770000000',
    address: 'Dakar, Plateau',
    gradeInterests: ['6e'],
  };

  it('accepts a valid payload', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a weak password (no uppercase or digit)', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'alllowercase' });
    expect(result.success).toBe(false);
  });

  it('requires at least one grade interest', () => {
    const result = registerSchema.safeParse({ ...valid, gradeInterests: [] });
    expect(result.success).toBe(false);
  });
});

describe('verifyOtpSchema', () => {
  it('accepts a 4-digit code', () => {
    expect(verifyOtpSchema.safeParse({ code: '1234' }).success).toBe(true);
  });

  it('rejects a code that is too short', () => {
    expect(verifyOtpSchema.safeParse({ code: '12' }).success).toBe(false);
  });
});

describe('createBookSchema', () => {
  it('accepts the minimal valid payload', () => {
    const result = createBookSchema.safeParse({
      title: 'Mon livre',
      grade: '6e',
      condition: 'USED',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty optional strings', () => {
    const result = createBookSchema.safeParse({
      title: 'Mon livre',
      grade: '6e',
      condition: 'NEW',
      author: '',
      className: '',
      description: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid condition', () => {
    const result = createBookSchema.safeParse({
      title: 'Mon livre',
      grade: '6e',
      condition: 'BROKEN',
    });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  const base = {
    currentPassword: 'Old1234!',
    newPassword: 'NewPass1',
    confirmPassword: 'NewPass1',
  };

  it('accepts matching new + confirm', () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it('rejects mismatched confirmation', () => {
    const result = changePasswordSchema.safeParse({ ...base, confirmPassword: 'Different1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
    }
  });
});
