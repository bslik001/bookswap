import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { comparePassword } from '../../utils/password';
import { paginate, buildMeta } from '../../utils/pagination';
import type { UpdateProfileInput, ListUsersInput } from './user.schema';

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

  const where: Record<string, unknown> = {};
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

// ── Supprimer mon compte ──
export const deleteAccount = async (userId: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Utilisateur introuvable');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Mot de passe incorrect');
  }

  // Suppression en cascade (les relations ont onDelete: Cascade)
  await prisma.user.delete({ where: { id: userId } });
};

// ── Admin : supprimer un utilisateur ──
export const adminDeleteUser = async (targetUserId: string, currentAdminId: string) => {
  if (targetUserId === currentAdminId) {
    throw new AppError(
      400,
      'FORBIDDEN_SELF',
      'Utilisez "Supprimer mon compte" pour supprimer votre propre compte.',
    );
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Utilisateur introuvable');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'Impossible de supprimer un autre administrateur');
  }

  // Suppression en cascade (les relations ont onDelete: Cascade)
  await prisma.user.delete({ where: { id: targetUserId } });
};

// ── Admin : statistiques globales ──
export const getStats = async () => {
  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    availableBooks,
    reservedBooks,
    exchangedBooks,
    pendingRequests,
    inProgressRequests,
    completedRequests,
    totalSupplies,
    totalContactRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false, isPhoneVerified: true } }),
    prisma.book.count({ where: { status: 'AVAILABLE' } }),
    prisma.book.count({ where: { status: 'RESERVED' } }),
    prisma.book.count({ where: { status: 'EXCHANGED' } }),
    prisma.request.count({ where: { status: 'PENDING' } }),
    prisma.request.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.request.count({ where: { status: 'COMPLETED' } }),
    prisma.supply.count(),
    prisma.contactRequest.count(),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers,
    },
    books: {
      available: availableBooks,
      reserved: reservedBooks,
      exchanged: exchangedBooks,
      total: availableBooks + reservedBooks + exchangedBooks,
    },
    requests: {
      pending: pendingRequests,
      inProgress: inProgressRequests,
      completed: completedRequests,
    },
    supplies: {
      total: totalSupplies,
      contactRequests: totalContactRequests,
    },
  };
};
