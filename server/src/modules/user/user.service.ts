import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';
import type { UpdateProfileInput, ListUsersInput } from './user.schema';
import type { Role } from '@prisma/client';

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  gradeInterests: true,
  role: true,
  isActive: true,
  isPhoneVerified: true,
  createdAt: true,
};

// ── Mon profil ──
export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Utilisateur introuvable');
  }

  return user;
};

// ── Modifier mon profil ──
export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  // Si le phone change, verifier unicite
  if (data.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: data.phone, id: { not: userId } },
    });
    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Ce numero de telephone est deja utilise');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: publicUserSelect,
  });

  return user;
};

// ── Profil public (nom tronque RG-09) ──
export const getPublicProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gradeInterests: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Utilisateur introuvable');
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName.charAt(0) + '.',
    gradeInterests: user.gradeInterests,
    createdAt: user.createdAt,
  };
};

// ── Admin : lister les utilisateurs ──
export const listUsers = async (query: ListUsersInput) => {
  const { page, limit, role, search } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { ...publicUserSelect, fcmToken: false },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, meta: buildMeta(total, page, limit) };
};

// ── Admin : bloquer/debloquer un utilisateur ──
export const blockUser = async (userId: string, block: boolean) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Utilisateur introuvable');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'Impossible de bloquer un administrateur');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: !block,
      // Incrementer tokenVersion pour invalider les tokens existants
      tokenVersion: { increment: 1 },
    },
    select: publicUserSelect,
  });

  return updated;
};
