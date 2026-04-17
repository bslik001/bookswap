import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { createTestUser } from '../../test/helpers';

const baseRegisterPayload = {
  firstName: 'Aissatou',
  lastName: 'Ba',
  email: 'aissatou@test.sn',
  password: 'Password123!',
  phone: '+221770000100',
  address: 'Dakar, test',
  gradeInterests: ['6eme'],
};

describe('POST /api/auth/register', () => {
  it('creates an inactive user and an OTP record', async () => {
    const res = await request(app).post('/api/auth/register').send(baseRegisterPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(baseRegisterPayload.email);

    const user = await prisma.user.findUnique({ where: { email: baseRegisterPayload.email } });
    expect(user).toBeTruthy();
    expect(user!.isActive).toBe(false);
    expect(user!.isPhoneVerified).toBe(false);

    const otp = await prisma.otpVerification.findFirst({ where: { phone: baseRegisterPayload.phone } });
    expect(otp).toBeTruthy();
    expect(otp!.code).toHaveLength(4);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(baseRegisterPayload);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...baseRegisterPayload, phone: '+221770000999' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects invalid payload with 400 and Zod errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...baseRegisterPayload, email: 'not-an-email', password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('activates the account and returns tokens when OTP is valid', async () => {
    await request(app).post('/api/auth/register').send(baseRegisterPayload);
    const otp = await prisma.otpVerification.findFirst({ where: { phone: baseRegisterPayload.phone } });
    expect(otp).toBeTruthy();

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: baseRegisterPayload.phone, code: otp!.code });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.refreshToken).toBeTypeOf('string');

    const user = await prisma.user.findUnique({ where: { email: baseRegisterPayload.email } });
    expect(user!.isActive).toBe(true);
    expect(user!.isPhoneVerified).toBe(true);
  });

  it('rejects an incorrect code with 400', async () => {
    await request(app).post('/api/auth/register').send(baseRegisterPayload);

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: baseRegisterPayload.phone, code: '0000' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  it('rejects an expired OTP with 400', async () => {
    await request(app).post('/api/auth/register').send(baseRegisterPayload);
    const otp = await prisma.otpVerification.findFirst({ where: { phone: baseRegisterPayload.phone } });
    await prisma.otpVerification.update({
      where: { id: otp!.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: baseRegisterPayload.phone, code: otp!.code });

    expect(res.status).toBe(400);
    // Apres cleanup des OTP expires, on peut avoir INVALID_OTP ou OTP_EXPIRED
    expect(['OTP_EXPIRED', 'INVALID_OTP']).toContain(res.body.error.code);
  });
});

describe('POST /api/auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    const { user, password } = await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.refreshToken).toBeTypeOf('string');
    expect(res.body.data.user.id).toBe(user.id);
  });

  it('rejects wrong password with 401', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects inactive account with 403', async () => {
    const { user, password } = await createTestUser({ isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('rotates the refresh token on success', async () => {
    const { user, password } = await createTestUser();
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
    const firstRefresh = login.body.data.refreshToken;

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: firstRefresh });

    expect(res.status).toBe(200);
    expect(res.body.data.refreshToken).toBeTypeOf('string');
    expect(res.body.data.refreshToken).not.toBe(firstRefresh);

    const storedCount = await prisma.refreshToken.count({ where: { userId: user.id } });
    expect(storedCount).toBe(1);
  });

  it('revokes all tokens when an old refresh is reused (replay detection)', async () => {
    const { user, password } = await createTestUser();
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
    const oldRefresh = login.body.data.refreshToken;

    // Utilisation normale : rotation
    await request(app).post('/api/auth/refresh-token').send({ refreshToken: oldRefresh });

    // Replay : reutiliser l'ancien token doit revoquer toute la famille
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: oldRefresh });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_REVOKED');

    const storedCount = await prisma.refreshToken.count({ where: { userId: user.id } });
    expect(storedCount).toBe(0);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the specific refresh token when provided', async () => {
    const { user, password } = await createTestUser();
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
    const { accessToken, refreshToken } = login.body.data;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    const stored = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(stored).toHaveLength(0);
  });

  it('rejects unauthenticated logout with 401', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(401);
  });
});
