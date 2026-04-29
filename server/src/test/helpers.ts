import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { BookCondition, BookStatus, Role } from '@prisma/client';
import { generateAccessToken } from '../utils/jwt';

type CreateUserOverrides = Partial<{
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  firstName: string;
  lastName: string;
  password: string;
}>;

export async function createTestUser(overrides: CreateUserOverrides = {}) {
  const password = overrides.password ?? 'Password123!';
  const hashed = await bcrypt.hash(password, 4);
  const user = await prisma.user.create({
    data: {
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
      email:
        overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.sn`,
      password: hashed,
      phone: overrides.phone ?? `+2217${Math.floor(10000000 + Math.random() * 89999999)}`,
      address: 'Dakar, test',
      gradeInterests: ['6eme'],
      role: overrides.role ?? Role.USER,
      isActive: overrides.isActive ?? true,
      isPhoneVerified: overrides.isActive ?? true,
    },
  });
  return { user, password };
}

export function accessTokenFor(user: { id: string; role: Role }): string {
  return generateAccessToken({ userId: user.id, role: user.role });
}

type CreateBookOverrides = Partial<{
  title: string;
  grade: string;
  condition: BookCondition;
  status: BookStatus;
  isApproved: boolean;
}>;

export async function createTestBook(ownerId: string, overrides: CreateBookOverrides = {}) {
  return prisma.book.create({
    data: {
      title: overrides.title ?? 'Test Book',
      author: 'Test Author',
      grade: overrides.grade ?? '6eme',
      condition: overrides.condition ?? BookCondition.USED,
      status: overrides.status ?? BookStatus.AVAILABLE,
      isApproved: overrides.isApproved ?? true,
      imageUrl: 'https://example.com/placeholder.jpg',
      ownerId,
    },
  });
}
