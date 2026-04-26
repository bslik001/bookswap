import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, SupplyType } from '@prisma/client';

vi.mock('../../utils/cloudinary', () => ({
  uploadImage: vi.fn(async () => ({ url: 'https://test.local/img.jpg', publicId: 'test/abc' })),
  deleteImage: vi.fn(async () => undefined),
}));

import app from '../../app';
import { prisma } from '../../lib/prisma';
import { accessTokenFor, createTestUser } from '../../test/helpers';
import { uploadImage } from '../../utils/cloudinary';

beforeEach(() => {
  vi.mocked(uploadImage).mockClear();
});

async function createTestSupply(
  supplierId: string,
  overrides: Partial<{ name: string; type: SupplyType }> = {},
) {
  return prisma.supply.create({
    data: {
      name: overrides.name ?? 'Cahier 96p',
      type: overrides.type ?? SupplyType.NOTEBOOK,
      price: 5000,
      supplierId,
    },
  });
}

describe('GET /api/supplies', () => {
  it('lists all supplies with pagination meta', async () => {
    const { user: supplier } = await createTestUser({ role: Role.SUPPLIER });
    const { user: viewer } = await createTestUser();
    await createTestSupply(supplier.id, { name: 'A' });
    await createTestSupply(supplier.id, { name: 'B' });

    const res = await request(app)
      .get('/api/supplies')
      .set('Authorization', `Bearer ${accessTokenFor(viewer)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, total: 2, totalPages: 1 });
  });

  it('filters by type', async () => {
    const { user: supplier } = await createTestUser({ role: Role.SUPPLIER });
    const { user: viewer } = await createTestUser();
    await createTestSupply(supplier.id, { type: SupplyType.NOTEBOOK });
    await createTestSupply(supplier.id, { type: SupplyType.PEN });

    const res = await request(app)
      .get('/api/supplies?type=PEN')
      .set('Authorization', `Bearer ${accessTokenFor(viewer)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe('PEN');
  });

  it('rejects invalid type with 400', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .get('/api/supplies?type=BOGUS')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/supplies');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/supplies/:id', () => {
  it('returns the supply with supplier info', async () => {
    const { user: supplier } = await createTestUser({ role: Role.SUPPLIER });
    const { user: viewer } = await createTestUser();
    const supply = await createTestSupply(supplier.id, { name: 'Sac' });

    const res = await request(app)
      .get(`/api/supplies/${supply.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(viewer)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(supply.id);
    expect(res.body.data.supplier.id).toBe(supplier.id);
  });

  it('returns 404 for unknown id', async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .get('/api/supplies/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/supplies', () => {
  it('lets a SUPPLIER create a supply', async () => {
    const { user: supplier } = await createTestUser({ role: Role.SUPPLIER });

    const res = await request(app)
      .post('/api/supplies')
      .set('Authorization', `Bearer ${accessTokenFor(supplier)}`)
      .field('name', 'Cahier 96p')
      .field('type', 'NOTEBOOK')
      .field('price', '5000')
      .attach('image', Buffer.from('fake'), 'cover.png');

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Cahier 96p');
    expect(res.body.data.imageUrl).toBe('https://test.local/img.jpg');
    expect(uploadImage).toHaveBeenCalledOnce();
  });

  it('lets an ADMIN create a supply (without image too)', async () => {
    const { user: admin } = await createTestUser({ role: Role.ADMIN });

    const res = await request(app)
      .post('/api/supplies')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .field('name', 'Stylos lot')
      .field('type', 'PEN');

    expect(res.status).toBe(201);
    expect(res.body.data.imageUrl).toBeFalsy();
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('rejects regular USER with 403', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .post('/api/supplies')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .field('name', 'Cahier')
      .field('type', 'NOTEBOOK');

    expect(res.status).toBe(403);
  });

  it('rejects invalid type with 400', async () => {
    const { user: supplier } = await createTestUser({ role: Role.SUPPLIER });

    const res = await request(app)
      .post('/api/supplies')
      .set('Authorization', `Bearer ${accessTokenFor(supplier)}`)
      .field('name', 'Cahier')
      .field('type', 'BOGUS');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/supplies/:id/contact', () => {
  it('creates a contact request and notifies the supplier', async () => {
    const { user: supplier } = await createTestUser({ role: Role.SUPPLIER });
    const { user: requester } = await createTestUser();
    const supply = await createTestSupply(supplier.id, { name: 'Cahier 96p' });

    const res = await request(app)
      .post(`/api/supplies/${supply.id}/contact`)
      .set('Authorization', `Bearer ${accessTokenFor(requester)}`)
      .send({ message: 'Bonjour, est-ce dispo ?' });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTypeOf('string');

    const stored = await prisma.contactRequest.findFirst({ where: { supplyId: supply.id } });
    expect(stored).toBeTruthy();
    expect(stored!.requesterId).toBe(requester.id);

    const notif = await prisma.notification.findFirst({
      where: { userId: supplier.id, type: 'SUPPLIER_CONTACT' },
    });
    expect(notif).toBeTruthy();
    expect(notif!.content).toContain('Cahier 96p');
  });

  it('returns 404 when supply does not exist', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .post('/api/supplies/11111111-1111-1111-1111-111111111111/contact')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ message: 'Hello' });

    expect(res.status).toBe(404);
  });

  it('rejects empty message with 400', async () => {
    const { user: supplier } = await createTestUser({ role: Role.SUPPLIER });
    const { user: requester } = await createTestUser();
    const supply = await createTestSupply(supplier.id);

    const res = await request(app)
      .post(`/api/supplies/${supply.id}/contact`)
      .set('Authorization', `Bearer ${accessTokenFor(requester)}`)
      .send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication', async () => {
    const { user: supplier } = await createTestUser({ role: Role.SUPPLIER });
    const supply = await createTestSupply(supplier.id);

    const res = await request(app)
      .post(`/api/supplies/${supply.id}/contact`)
      .send({ message: 'Hi' });
    expect(res.status).toBe(401);
  });
});
