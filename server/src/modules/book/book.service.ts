import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { uploadImage, deleteImage } from '../../utils/cloudinary';
import { paginate, buildMeta } from '../../utils/pagination';
import type { CreateBookInput, UpdateBookInput, ListBooksInput } from './book.schema';

const ownerSelect = {
  id: true,
  firstName: true,
  lastName: true,
};

// Niveaux scolaires standards exposes dans le filtre mobile. Le sentinel
// GRADE_OTHER_SENTINEL declenche un filtre "grade non present dans cette liste".
const KNOWN_GRADES = ['6e', '5e', '4e', '3e', '2nde', '1ere', 'Tle'];
const GRADE_OTHER_SENTINEL = '__other__';

// ── Creer un livre ──
export const createBook = async (userId: string, data: CreateBookInput, imageBuffer: Buffer) => {
  const { url, publicId } = await uploadImage(imageBuffer, 'books');

  const book = await prisma.book.create({
    data: {
      ...data,
      imageUrl: url,
      imagePublicId: publicId,
      ownerId: userId,
    },
  });

  return book;
};

// ── Modifier un livre ──
export const updateBook = async (
  userId: string,
  bookId: string,
  data: UpdateBookInput,
  imageBuffer?: Buffer,
) => {
  const book = await prisma.book.findUnique({ where: { id: bookId } });

  if (!book) {
    throw new AppError(404, 'NOT_FOUND', 'Livre introuvable');
  }

  if (book.ownerId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Vous ne pouvez modifier que vos propres livres');
  }

  let imageData = {};
  if (imageBuffer) {
    // Supprimer l'ancienne image
    if (book.imagePublicId) {
      await deleteImage(book.imagePublicId);
    }
    const { url, publicId } = await uploadImage(imageBuffer, 'books');
    imageData = { imageUrl: url, imagePublicId: publicId };
  }

  const updated = await prisma.book.update({
    where: { id: bookId },
    data: { ...data, ...imageData },
  });

  return updated;
};

// ── Supprimer un livre ──
export const deleteBook = async (userId: string, userRole: string, bookId: string) => {
  const book = await prisma.book.findUnique({ where: { id: bookId } });

  if (!book) {
    throw new AppError(404, 'NOT_FOUND', 'Livre introuvable');
  }

  if (book.ownerId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'Action non autorisee');
  }

  // Supprimer l'image sur Cloudinary
  if (book.imagePublicId) {
    await deleteImage(book.imagePublicId);
  }

  await prisma.book.delete({ where: { id: bookId } });
};

// ── Detail d'un livre ──
export const getBookById = async (bookId: string, currentUserId: string) => {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      owner: { select: ownerSelect },
      requests: {
        where: { requesterId: currentUserId },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!book) {
    throw new AppError(404, 'NOT_FOUND', 'Livre introuvable');
  }

  const { requests, owner, ...rest } = book;

  return {
    ...rest,
    owner: {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName.charAt(0) + '.',
    },
    hasRequested: requests.length > 0,
  };
};

// ── Lister les livres (avec recherche full-text) ──
export const listBooks = async (query: ListBooksInput, currentUserId: string) => {
  const { page, limit, grade, condition, status, search } = query;
  const { skip, take } = paginate(page, limit);

  // Si recherche full-text, utiliser $queryRaw
  if (search) {
    return listBooksFullText(search, {
      grade,
      condition,
      status,
      skip,
      take,
      page,
      limit,
      currentUserId,
    });
  }

  // Sinon, filtres Prisma classiques
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (grade === GRADE_OTHER_SENTINEL) {
    where.grade = { notIn: KNOWN_GRADES };
  } else if (grade) {
    where.grade = grade;
  }
  if (condition) where.condition = condition;
  if (status) where.status = status;
  else where.status = 'AVAILABLE'; // Par defaut, seulement les livres disponibles

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: { owner: { select: ownerSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.book.count({ where }),
  ]);

  const data = books.map(({ owner, ...book }) => ({
    ...book,
    owner: {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName.charAt(0) + '.',
    },
  }));

  return { books: data, meta: buildMeta(total, page, limit) };
};

// ── Full-text search avec ts_rank ──
// Note securite : $queryRawUnsafe est utilise ici car le WHERE est dynamique,
// mais toutes les valeurs utilisateur passent par des parametres positionels ($1, $2...)
// et ne sont jamais interpolees dans la string SQL.
async function listBooksFullText(
  search: string,
  opts: {
    grade?: string;
    condition?: string;
    status?: string;
    skip: number;
    take: number;
    page: number;
    limit: number;
    currentUserId: string;
  },
) {
  const conditions: string[] = [`search_vector @@ plainto_tsquery('french', $1)`];
  const params: (string | number)[] = [search];
  let paramIndex = 2;

  if (opts.grade === GRADE_OTHER_SENTINEL) {
    const placeholders = KNOWN_GRADES.map(() => `$${paramIndex++}`).join(', ');
    conditions.push(`b.grade NOT IN (${placeholders})`);
    params.push(...KNOWN_GRADES);
  } else if (opts.grade) {
    conditions.push(`b.grade = $${paramIndex}`);
    params.push(opts.grade);
    paramIndex++;
  }
  if (opts.condition) {
    conditions.push(`b.condition = $${paramIndex}::"BookCondition"`);
    params.push(opts.condition);
    paramIndex++;
  }

  const statusFilter = opts.status || 'AVAILABLE';
  conditions.push(`b.status = $${paramIndex}::"BookStatus"`);
  params.push(statusFilter);
  paramIndex++;

  const whereClause = conditions.join(' AND ');

  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM books b WHERE ${whereClause}`,
    ...params,
  );
  const total = Number(countResult[0].count);

  const books = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT b.id, b.title, b.author, b.grade, b.class_name as "className",
            b.condition, b.description, b.image_url as "imageUrl", b.status,
            b.created_at as "createdAt", b.owner_id as "ownerId",
            u.id as "owner_id", u.first_name as "ownerFirstName", u.last_name as "ownerLastName",
            ts_rank(search_vector, plainto_tsquery('french', $1)) as rank
     FROM books b
     JOIN users u ON u.id = b.owner_id
     WHERE ${whereClause}
     ORDER BY rank DESC, b.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    ...params,
    opts.take,
    opts.skip,
  );

  const data = books.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    grade: row.grade,
    className: row.className,
    condition: row.condition,
    description: row.description,
    imageUrl: row.imageUrl,
    status: row.status,
    createdAt: row.createdAt,
    ownerId: row.ownerId,
    owner: {
      id: row.owner_id,
      firstName: row.ownerFirstName,
      lastName: (row.ownerLastName as string).charAt(0) + '.',
    },
  }));

  return { books: data, meta: buildMeta(total, opts.page, opts.limit) };
}

// ── Mes livres ──
export const getMyBooks = async (userId: string) => {
  const books = await prisma.book.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return books;
};
