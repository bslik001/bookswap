import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { paginate, buildMeta } from '../../utils/pagination';
import type { RequestStatus } from '@prisma/client';
import { createNotification } from '../notification/notification.service';
import type { CreateRequestInput, ListRequestsInput, UpdateRequestStatusInput } from './request.schema';

// Transitions de statut legales
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS', 'REFUSED'],
  IN_PROGRESS: ['ACCEPTED', 'REFUSED'],
  ACCEPTED: ['COMPLETED', 'REFUSED'],
  REFUSED: [],
  COMPLETED: [],
};

// ── Creer une demande ──
export const createRequest = async (requesterId: string, data: CreateRequestInput) => {
  const book = await prisma.book.findUnique({
    where: { id: data.bookId },
    include: { owner: { select: { id: true } } },
  });

  if (!book) {
    throw new AppError(404, 'NOT_FOUND', 'Livre introuvable');
  }

  if (book.status !== 'AVAILABLE') {
    throw new AppError(400, 'BOOK_UNAVAILABLE', 'Ce livre n\'est plus disponible');
  }

  // RG-05 : pas son propre livre
  if (book.ownerId === requesterId) {
    throw new AppError(403, 'FORBIDDEN', 'Vous ne pouvez pas demander votre propre livre');
  }

  // RG-04 : une seule demande active par livre/demandeur (@@unique constraint)
  const existing = await prisma.request.findUnique({
    where: { bookId_requesterId: { bookId: data.bookId, requesterId } },
  });

  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Vous avez deja fait une demande pour ce livre');
  }

  const request = await prisma.request.create({
    data: {
      bookId: data.bookId,
      requesterId,
    },
    include: {
      book: { select: { title: true } },
    },
  });

  // Notification au proprietaire
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { firstName: true, lastName: true },
  });
  const requesterName = requester ? `${requester.firstName} ${requester.lastName.charAt(0)}.` : 'Quelqu\'un';
  await createNotification(
    book.owner.id,
    'BOOK_REQUEST',
    `${requesterName} est interesse par votre livre "${request.book.title}"`
  );

  return {
    id: request.id,
    bookId: request.bookId,
    bookTitle: request.book.title,
    status: request.status,
    createdAt: request.createdAt,
  };
};

// ── Detail d'une demande (visible par le demandeur ou le proprietaire du livre) ──
export const getRequestById = async (requestId: string, userId: string) => {
  const req = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          grade: true,
          ownerId: true,
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      requester: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!req) {
    throw new AppError(404, 'NOT_FOUND', 'Demande introuvable');
  }

  if (req.requesterId !== userId && req.book.ownerId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Vous n\'avez pas acces a cette demande');
  }

  return {
    id: req.id,
    status: req.status,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    book: {
      id: req.book.id,
      title: req.book.title,
      imageUrl: req.book.imageUrl,
      grade: req.book.grade,
      owner: req.book.owner,
    },
    requester: req.requester,
  };
};

// ── Annuler sa propre demande (tant que PENDING) ──
export const cancelRequest = async (requestId: string, userId: string) => {
  const req = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, requesterId: true, bookId: true },
  });

  if (!req) {
    throw new AppError(404, 'NOT_FOUND', 'Demande introuvable');
  }

  if (req.requesterId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Vous ne pouvez annuler que vos propres demandes');
  }

  if (req.status !== 'PENDING') {
    throw new AppError(
      400,
      'CANNOT_CANCEL',
      'Seules les demandes en attente peuvent etre annulees',
    );
  }

  await prisma.request.delete({ where: { id: requestId } });
};

// ── Lister les demandes sur un livre dont je suis proprietaire ──
export const getRequestsForBook = async (bookId: string, ownerId: string) => {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, ownerId: true },
  });

  if (!book) {
    throw new AppError(404, 'NOT_FOUND', 'Livre introuvable');
  }

  if (book.ownerId !== ownerId) {
    throw new AppError(403, 'FORBIDDEN', 'Seul le proprietaire peut voir les demandes sur son livre');
  }

  const requests = await prisma.request.findMany({
    where: { bookId },
    include: {
      requester: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    requester: r.requester,
  }));
};

// ── Mes demandes ──
export const getMyRequests = async (requesterId: string) => {
  const requests = await prisma.request.findMany({
    where: { requesterId },
    include: {
      book: {
        select: { id: true, title: true, imageUrl: true, grade: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map(({ book, ...r }) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    book,
  }));
};

// ── Admin : lister toutes les demandes ──
export const listAllRequests = async (query: ListRequestsInput) => {
  const { page, limit, status } = query;
  const { skip, take } = paginate(page, limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            owner: {
              select: { id: true, firstName: true, lastName: true, phone: true, email: true },
            },
          },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.request.count({ where }),
  ]);

  const data = requests.map(({ book, requester, ...r }) => ({
    id: r.id,
    status: r.status,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt,
    book: {
      id: book.id,
      title: book.title,
      owner: book.owner,
    },
    requester,
  }));

  return { requests: data, meta: buildMeta(total, page, limit) };
};

// ── Admin : mettre a jour le statut ──
export const updateRequestStatus = async (requestId: string, data: UpdateRequestStatusInput) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { book: { select: { id: true, status: true } } },
  });

  if (!request) {
    throw new AppError(404, 'NOT_FOUND', 'Demande introuvable');
  }

  // Verifier la transition
  const allowed = VALID_TRANSITIONS[request.status];
  if (!allowed || !allowed.includes(data.status)) {
    throw new AppError(400, 'INVALID_TRANSITION', `Transition de ${request.status} vers ${data.status} non autorisee`);
  }

  // Mettre a jour la demande
  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: data.status as RequestStatus,
      adminNotes: data.adminNotes,
    },
  });

  // Effets de bord sur le livre
  if (data.status === 'ACCEPTED') {
    await prisma.book.update({
      where: { id: request.bookId },
      data: { status: 'RESERVED' },
    });
  } else if (data.status === 'COMPLETED') {
    await prisma.book.update({
      where: { id: request.bookId },
      data: { status: 'EXCHANGED' },
    });
  }

  // Notification au demandeur
  const bookTitle = (await prisma.book.findUnique({
    where: { id: request.bookId },
    select: { title: true },
  }))?.title || 'un livre';

  const statusMessages: Record<string, string> = {
    IN_PROGRESS: `Votre demande pour "${bookTitle}" est en cours de traitement`,
    ACCEPTED: `Votre demande pour "${bookTitle}" a ete acceptee`,
    REFUSED: `Votre demande pour "${bookTitle}" a ete refusee`,
    COMPLETED: `L'echange pour "${bookTitle}" est termine`,
  };

  if (statusMessages[data.status]) {
    await createNotification(request.requesterId, 'REQUEST_UPDATE', statusMessages[data.status]);
  }

  return {
    id: updated.id,
    status: updated.status,
    adminNotes: updated.adminNotes,
    updatedAt: updated.updatedAt,
  };
};
