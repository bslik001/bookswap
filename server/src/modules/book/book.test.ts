import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role } from '@prisma/client';

vi.mock('../../utils/cloudinary', () => ({
  uploadImage: vi.fn(async () => ({ url: 'https://test.local/img.jpg', publicId: 'test/abc' })),
  deleteImage: vi.fn(async () => undefined),
}));

import app from '../../app';
import { prisma } from '../../lib/prisma';
import { accessTokenFor, createTestBook, createTestUser } from '../../test/helpers';
import { uploadImage, deleteImage } from '../../utils/cloudinary';

beforeEach(() => {
  vi.mocked(uploadImage).mockClear();
  vi.mocked(deleteImage).mockClear();
});

describe('GET /api/books', () => {
  it('returns only AVAILABLE books by default with pagination meta', async () => {
    const { user } = await createTestUser();
    await createTestBook(user.id, { title: 'Available' });
    await createTestBook(user.id, { title: 'Reserved', status: 'RESERVED' });
    await createTestBook(user.id, { title: 'Exchanged', status: 'EXCHANGED' });

    const res = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Available');
    expect(res.body.meta).toMatchObject({ page: 1, total: 1, totalPages: 1 });
  });

  it('filters by exact grade', async () => {
    const { user } = await createTestUser();
    await createTestBook(user.id, { title: 'A', grade: '6e' });
    await createTestBook(user.id, { title: 'B', grade: '5e' });

    const res = await request(app)
      .get('/api/books?grade=6e')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('A');
  });

  it('filters by condition', async () => {
    const { user } = await createTestUser();
    await createTestBook(user.id, { title: 'New', condition: 'NEW' });
    await createTestBook(user.id, { title: 'Used', condition: 'USED' });

    const res = await request(app)
      .get('/api/books?condition=NEW')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('New');
  });

  it('returns only non-standard grades when grade=__other__ is passed', async () => {
    const { user } = await createTestUser();
    await createTestBook(user.id, { title: 'Standard', grade: '6e' });
    await createTestBook(user.id, { title: 'Other 1', grade: 'CM1' });
    await createTestBook(user.id, { title: 'Other 2', grade: 'CM2' });

    const res = await request(app)
      .get('/api/books?grade=__other__')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((b: { title: string }) => b.title).sort()).toEqual([
      'Other 1',
      'Other 2',
    ]);
  });

  it('honours pagination params', async () => {
    const { user } = await createTestUser();
    for (let i = 0; i < 5; i++) {
      await createTestBook(user.id, { title: `Book ${i}` });
    }

    const res = await request(app)
      .get('/api/books?page=2&limit=2')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/books/:id', () => {
  it('returns the book with hasRequested=false when current user has not requested it', async () => {
    const { user: owner } = await createTestUser();
    const { user: viewer } = await createTestUser();
    const book = await createTestBook(owner.id, { title: 'Book A' });

    const res = await request(app)
      .get(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(viewer)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(book.id);
    expect(res.body.data.hasRequested).toBe(false);
    expect(res.body.data.owner.lastName).toMatch(/\.$/);
  });

  it('returns hasRequested=true when current user has an existing request', async () => {
    const { user: owner } = await createTestUser();
    const { user: requester } = await createTestUser();
    const book = await createTestBook(owner.id);
    await prisma.request.create({ data: { bookId: book.id, requesterId: requester.id } });

    const res = await request(app)
      .get(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(requester)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.hasRequested).toBe(true);
  });

  it('returns 404 for unknown id', async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .get('/api/books/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/books/me', () => {
  it('lists only the current user books', async () => {
    const { user: a } = await createTestUser();
    const { user: b } = await createTestUser();
    await createTestBook(a.id, { title: 'A1' });
    await createTestBook(a.id, { title: 'A2' });
    await createTestBook(b.id, { title: 'B1' });

    const res = await request(app)
      .get('/api/books/me')
      .set('Authorization', `Bearer ${accessTokenFor(a)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((bk: { title: string }) => bk.title).sort()).toEqual(['A1', 'A2']);
  });
});

describe('POST /api/books', () => {
  it('creates a book and uploads the image', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .field('title', 'Nouveau livre')
      .field('grade', '6e')
      .field('condition', 'USED')
      .attach('image', Buffer.from('fake-png'), 'cover.png');

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Nouveau livre');
    expect(res.body.data.imageUrl).toBe('https://test.local/img.jpg');
    expect(uploadImage).toHaveBeenCalledOnce();

    const stored = await prisma.book.findUnique({ where: { id: res.body.data.id } });
    expect(stored!.ownerId).toBe(user.id);
  });

  it('rejects creation without an image with 400', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .field('title', 'Nouveau livre')
      .field('grade', '6e')
      .field('condition', 'USED');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid payload with 400', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .field('title', 'A') // trop court
      .field('grade', '6e')
      .field('condition', 'USED')
      .attach('image', Buffer.from('fake'), 'cover.png');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PUT /api/books/:id', () => {
  it('lets the owner update their book', async () => {
    const { user } = await createTestUser();
    const book = await createTestBook(user.id, { title: 'Old title' });

    const res = await request(app)
      .put(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New title');
  });

  it('rejects update by a non-owner with 403', async () => {
    const { user: owner } = await createTestUser();
    const { user: outsider } = await createTestUser();
    const book = await createTestBook(owner.id);

    const res = await request(app)
      .put(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(outsider)}`)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/books/:id', () => {
  it('lets the owner delete their book', async () => {
    const { user } = await createTestUser();
    const book = await createTestBook(user.id);

    const res = await request(app)
      .delete(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(200);
    const stored = await prisma.book.findUnique({ where: { id: book.id } });
    expect(stored).toBeNull();
  });

  it('lets an admin delete any book', async () => {
    const { user: owner } = await createTestUser();
    const { user: admin } = await createTestUser({ role: Role.ADMIN });
    const book = await createTestBook(owner.id);

    const res = await request(app)
      .delete(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`);

    expect(res.status).toBe(200);
  });

  it('rejects delete by non-owner non-admin with 403', async () => {
    const { user: owner } = await createTestUser();
    const { user: outsider } = await createTestUser();
    const book = await createTestBook(owner.id);

    const res = await request(app)
      .delete(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(outsider)}`);

    expect(res.status).toBe(403);
  });
});
