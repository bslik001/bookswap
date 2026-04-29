import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { accessTokenFor, createTestUser } from '../../test/helpers';

describe('DELETE /api/admin/users/:id', () => {
  it('lets an admin delete a regular user (cascade removes their data)', async () => {
    const { user: admin } = await createTestUser({ role: Role.ADMIN });
    const { user: target } = await createTestUser();

    const res = await request(app)
      .delete(`/api/admin/users/${target.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`);

    expect(res.status).toBe(200);
    const stored = await prisma.user.findUnique({ where: { id: target.id } });
    expect(stored).toBeNull();
  });

  it('rejects deletion of the admin themselves with 400', async () => {
    const { user: admin } = await createTestUser({ role: Role.ADMIN });

    const res = await request(app)
      .delete(`/api/admin/users/${admin.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FORBIDDEN_SELF');
  });

  it('rejects deletion of another admin with 403', async () => {
    const { user: admin1 } = await createTestUser({ role: Role.ADMIN });
    const { user: admin2 } = await createTestUser({ role: Role.ADMIN });

    const res = await request(app)
      .delete(`/api/admin/users/${admin2.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(admin1)}`);

    expect(res.status).toBe(403);
  });

  it('rejects non-admin caller with 403', async () => {
    const { user } = await createTestUser();
    const { user: other } = await createTestUser();

    const res = await request(app)
      .delete(`/api/admin/users/${other.id}`)
      .set('Authorization', `Bearer ${accessTokenFor(user)}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown id', async () => {
    const { user: admin } = await createTestUser({ role: Role.ADMIN });

    const res = await request(app)
      .delete('/api/admin/users/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${accessTokenFor(admin)}`);

    expect(res.status).toBe(404);
  });
});
