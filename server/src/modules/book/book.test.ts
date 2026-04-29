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
  it('creates a book and uploads the image (book starts unapproved)', async () => {
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
    expect(res.body.data.isApproved).toBe(false);
    expect(uploadImage).toHaveBeenCalledOnce();

    const stored = await prisma.book.findUnique({ where: { id: res.body.data.id } });
    expect(stored!.ownerId).toBe(user.id);
    expect(stored!.isApproved).toBe(false);
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

describe('Book approval (admin)', () => {
  it('hides unapproved books from public list', async () => {
    const { user: owner } = await createTestUser();
    const { user: viewer } = await createTestUser();
    await createTestBook(owner.id, { title: 'Approved' });
    await createTestBook(owner.id, { title: 'Pending', isApproved: false });

    const res = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${accessTokenFor(viewer)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Approved');
  });

  it('shows unapproved books to admin', async () => {
    const { user: owner } = await createTestUser();
    const { user: admin } = await createTestUser({ role: Role.ADMIN });
    await createTestBook(owner.id, { title: 'Approved' });
    await createTestBook(owner.id, { title: 'Pending', isApproved: false });

    const res = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('hides unapproved book detail from non-owner non-admin', async () => {
    const { user: owner } = await createTestUser();
    const { user: outsider } = await createTestUser();
    const book = await createTestBook(owner.id, { isApproved: false });

    const res = await request(app)
      .get(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(outsider)}`);

    expect(res.status).toBe(404);
  });

  it('lets the owner see their own pending book', async () => {
    const { user: owner } = await createTestUser();
    const book = await createTestBook(owner.id, { isApproved: false });

    const res = await request(app)
      .get(`/api/books/${book.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(owner)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isApproved).toBe(false);
  });

  it('GET /api/admin/books/pending lists only unapproved books', async () => {
    const { user: owner } = await createTestUser();
    const { user: admin } = await createTestUser({ role: Role.ADMIN });
    await createTestBook(owner.id, { title: 'Approved' });
    await createTestBook(owner.id, { title: 'Pending 1', isApproved: false });
    await createTestBook(owner.id, { title: 'Pending 2', isApproved: false });

    const res = await request(app)
      .get('/api/admin/books/pending')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((b: { title: string }) => b.title.startsWith('Pending'))).toBe(true);
  });

  it('rejects /api/admin/books/pending for non-admin with 403', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .get('/api/admin/books/pending')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(403);
  });

  it('PUT /api/admin/books/:id/approval with approve=true marks book approved and notifies owner', async () => {
    const { user: owner } = await createTestUser();
    const { user: admin } = await createTestUser({ role: Role.ADMIN });
    const book = await createTestBook(owner.id, { title: 'A valider', isApproved: false });

    const res = await request(app)
      .put(`/api/admin/books/${book.id}/approval`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ approve: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isApproved).toBe(true);

    const notif = await prisma.notification.findFirst({
      where: { userId: owner.id, type: 'SYSTEM' },
    });
    expect(notif!.content).toContain('approuve');
  });

  it('approving a book notifies users with matching gradeInterests (except the owner)', async () => {
    const { user: owner } = await createTestUser({ firstName: 'Owner' });
    const { user: admin } = await createTestUser({ role: Role.ADMIN, firstName: 'Admin' });
    const { user: interested } = await createTestUser({ firstName: 'Interested' });
    const { user: notInterested } = await createTestUser({ firstName: 'Other' });

    // L'utilisateur interesse a "6e" dans ses interets, pas l'autre.
    await prisma.user.update({
      where: { id: interested.id },
      data: { gradeInterests: ['6e', '5e'] },
    });
    await prisma.user.update({
      where: { id: notInterested.id },
      data: { gradeInterests: ['Tle'] },
    });
    // L'owner aussi a "6e" mais ne doit pas se notifier lui-meme.
    await prisma.user.update({ where: { id: owner.id }, data: { gradeInterests: ['6e'] } });

    const book = await createTestBook(owner.id, {
      title: 'Maths 6e',
      grade: '6e',
      isApproved: false,
    });

    await request(app)
      .put(`/api/admin/books/${book.id}/approval`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ approve: true });

    const interestedNotif = await prisma.notification.findFirst({
      where: { userId: interested.id, type: 'SYSTEM', content: { contains: 'Maths 6e' } },
    });
    expect(interestedNotif).toBeTruthy();

    const otherNotif = await prisma.notification.findFirst({
      where: { userId: notInterested.id, content: { contains: 'Maths 6e' } },
    });
    expect(otherNotif).toBeNull();

    const ownerSelfNotif = await prisma.notification.findFirst({
      where: { userId: owner.id, content: { contains: 'Nouveau livre pour le niveau' } },
    });
    expect(ownerSelfNotif).toBeNull();
  });

  it('PUT /api/admin/books/:id/approval with approve=false deletes book and notifies owner', async () => {
    const { user: owner } = await createTestUser();
    const { user: admin } = await createTestUser({ role: Role.ADMIN });
    const book = await createTestBook(owner.id, { title: 'A refuser', isApproved: false });

    const res = await request(app)
      .put(`/api/admin/books/${book.id}/approval`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ approve: false });

    expect(res.status).toBe(200);

    const stored = await prisma.book.findUnique({ where: { id: book.id } });
    expect(stored).toBeNull();

    const notif = await prisma.notification.findFirst({
      where: { userId: owner.id, type: 'SYSTEM' },
    });
    expect(notif!.content).toContain("n'a pas ete valide");
  });
});
