import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { accessTokenFor, createTestUser } from '../../test/helpers';

describe('POST /api/admin/notifications/broadcast', () => {
  it('creates a SYSTEM notification for every active user', async () => {
    const { user: admin } = await createTestUser({ role: Role.ADMIN });
    const { user: u1 } = await createTestUser();
    const { user: u2 } = await createTestUser();
    // Un utilisateur inactif ne doit pas recevoir l'annonce.
    const { user: inactive } = await createTestUser({ isActive: false });

    const res = await request(app)
      .post('/api/admin/notifications/broadcast')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ content: 'Maintenance prevue ce dimanche.' });

    expect(res.status).toBe(201);
    expect(res.body.data.recipients).toBeGreaterThanOrEqual(3); // admin + u1 + u2

    const notifs = await prisma.notification.findMany({
      where: { type: 'SYSTEM', content: 'Maintenance prevue ce dimanche.' },
      select: { userId: true },
    });
    const recipients = notifs.map((n) => n.userId);
    expect(recipients).toContain(u1.id);
    expect(recipients).toContain(u2.id);
    expect(recipients).not.toContain(inactive.id);
  });

  it('rejects non-admin caller with 403', async () => {
    const { user } = await createTestUser();

    const res = await request(app)
      .post('/api/admin/notifications/broadcast')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ content: 'Hello' });

    expect(res.status).toBe(403);
  });

  it('rejects empty content with 400', async () => {
    const { user: admin } = await createTestUser({ role: Role.ADMIN });

    const res = await request(app)
      .post('/api/admin/notifications/broadcast')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
