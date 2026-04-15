import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { uploadImage, deleteImage } from '../../utils/cloudinary';
import { paginate, buildMeta } from '../../utils/pagination';
import { createNotification } from '../notification/notification.service';
import type { CreateSupplyInput, ListSuppliesInput, ContactSupplierInput } from './supply.schema';

const supplierSelect = {
  id: true,
  firstName: true,
  lastName: true,
};

// ── Lister les fournitures ──
export const listSupplies = async (query: ListSuppliesInput) => {
  const { page, limit, type } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = {};
  if (type) where.type = type;

  const [supplies, total] = await Promise.all([
    prisma.supply.findMany({
      where,
      include: { supplier: { select: supplierSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.supply.count({ where }),
  ]);

  return { supplies, meta: buildMeta(total, page, limit) };
};

// ── Detail d'une fourniture ──
export const getSupplyById = async (supplyId: string) => {
  const supply = await prisma.supply.findUnique({
    where: { id: supplyId },
    include: { supplier: { select: supplierSelect } },
  });

  if (!supply) {
    throw new AppError(404, 'NOT_FOUND', 'Fourniture introuvable');
  }

  return supply;
};

// ── Creer une fourniture (SUPPLIER ou ADMIN) ──
export const createSupply = async (supplierId: string, data: CreateSupplyInput, imageBuffer?: Buffer) => {
  let imageData = {};
  if (imageBuffer) {
    const { url, publicId } = await uploadImage(imageBuffer, 'supplies');
    imageData = { imageUrl: url };
  }

  const supply = await prisma.supply.create({
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      price: data.price,
      supplierId,
      ...imageData,
    },
  });

  return supply;
};

// ── Contacter un fournisseur ──
export const contactSupplier = async (requesterId: string, supplyId: string, data: ContactSupplierInput) => {
  const supply = await prisma.supply.findUnique({
    where: { id: supplyId },
    select: { id: true, supplierId: true },
  });

  if (!supply) {
    throw new AppError(404, 'NOT_FOUND', 'Fourniture introuvable');
  }

  const contact = await prisma.contactRequest.create({
    data: {
      supplyId,
      requesterId,
      message: data.message,
    },
  });

  // Notification au fournisseur
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { firstName: true, lastName: true },
  });
  const supplyName = (await prisma.supply.findUnique({
    where: { id: supplyId },
    select: { name: true },
  }))?.name || 'une fourniture';
  const requesterName = requester ? `${requester.firstName} ${requester.lastName.charAt(0)}.` : 'Quelqu\'un';
  await createNotification(
    supply.supplierId,
    'SUPPLIER_CONTACT',
    `${requesterName} vous a contacte pour "${supplyName}"`
  );

  return {
    id: contact.id,
    message: 'Votre demande a ete transmise au fournisseur',
    createdAt: contact.createdAt,
  };
};
