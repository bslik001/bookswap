import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { accessTokenFor, createTestBook, createTestUser } from '../../test/helpers';

describe('POST /api/requests', () => {
  it('creates a PENDING request and notifies the owner', async () => {
    const { user: owner } = await createTestUser();
    const { user: requester } = await createTestUser();
    const book = await createTestBook(owner.id);

    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${accessTokenFor(requester)}`)
      .send({ bookId: book.id });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.bookId).toBe(book.id);

    const stored = await prisma.request.findFirst({ where: { bookId: book.id } });
    expect(stored).toBeTruthy();
    expect(stored!.requesterId).toBe(requester.id);

    const notif = await prisma.notification.findFirst({
      where: { userId: owner.id, type: 'BOOK_REQUEST' },
    });
    expect(notif).toBeTruthy();
  });

  it('rejects requesting your own book (RG-05)', async () => {
    const { user: owner } = await createTestUser();
    const book = await createTestBook(owner.id);

    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${accessTokenFor(owner)}`)
      .send({ bookId: book.id });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects duplicate request from the same user for the same book (RG-04)', async () => {
    const { user: owner } = await createTestUser();
    const { user: requester } = await createTestUser();
    const book = await createTestBook(owner.id);
    const token = accessTokenFor(requester);

    await request(app).post('/api/requests').set('Authorization', `Bearer ${token}`).send({ bookId: book.id });

    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book.id });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects request on unavailable book with 400', async () => {
    const { user: owner } = await createTestUser();
    const { user: requester } = await createTestUser();
    const book = await createTestBook(owner.id, { status: 'RESERVED' });

    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${accessTokenFor(requester)}`)
      .send({ bookId: book.id });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BOOK_UNAVAILABLE');
  });

  it('requires authentication', async () => {
    const { user: owner } = await createTestUser();
    const book = await createTestBook(owner.id);

    const res = await request(app).post('/api/requests').send({ bookId: book.id });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/requests/:id', () => {
  async function setupScenario() {
    const { user: admin } = await createTestUser({ role: Role.ADMIN });
    const { user: owner } = await createTestUser();
    const { user: requester } = await createTestUser();
    const book = await createTestBook(owner.id);
    const req = await prisma.request.create({
      data: { bookId: book.id, requesterId: requester.id },
    });
    return { admin, owner, requester, book, request: req };
  }

  it('accepts a valid transition PENDING -> IN_PROGRESS', async () => {
    const { admin, request: req } = await setupScenario();

    const res = await request(app)
      .put(`/api/admin/requests/${req.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('rejects an invalid transition PENDING -> COMPLETED with 400', async () => {
    const { admin, request: req } = await setupScenario();

    const res = await request(app)
      .put(`/api/admin/requests/${req.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('sets the book to RESERVED when the request is ACCEPTED', async () => {
    const { admin, book, request: req } = await setupScenario();
    const token = accessTokenFor(admin);

    await request(app)
      .put(`/api/admin/requests/${req.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' });

    await request(app)
      .put(`/api/admin/requests/${req.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACCEPTED' });

    const updated = await prisma.book.findUnique({ where: { id: book.id } });
    expect(updated!.status).toBe('RESERVED');
  });

  it('sets the book to EXCHANGED when the request is COMPLETED', async () => {
    const { admin, book, request: req } = await setupScenario();
    const token = accessTokenFor(admin);

    for (const status of ['IN_PROGRESS', 'ACCEPTED', 'COMPLETED']) {
      await request(app)
        .put(`/api/admin/requests/${req.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status });
    }

    const updated = await prisma.book.findUnique({ where: { id: book.id } });
    expect(updated!.status).toBe('EXCHANGED');
  });

  it('notifies the requester on each status change', async () => {
    const { admin, requester, request: req } = await setupScenario();

    await request(app)
      .put(`/api/admin/requests/${req.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ status: 'IN_PROGRESS' });

    const notifs = await prisma.notification.findMany({
      where: { userId: requester.id, type: 'REQUEST_UPDATE' },
    });
    expect(notifs).toHaveLength(1);
  });

  it('rejects non-admin user with 403', async () => {
    const { request: req } = await setupScenario();
    const { user: normalUser } = await createTestUser();

    const res = await request(app)
      .put(`/api/admin/requests/${req.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(normalUser)}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 for an unknown request id', async () => {
    const { admin } = await setupScenario();
    const randomUuid = '11111111-1111-1111-1111-111111111111';

    const res = await request(app)
      .put(`/api/admin/requests/${randomUuid}`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(404);
  });
});
