import { PrismaClient, Role, BookCondition, BookStatus, SupplyType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg';

async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

async function main(): Promise<void> {
  console.log('Seeding database...');

  await prisma.refreshToken.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.request.deleteMany();
  await prisma.supply.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await hash('Password123!');

  const admin = await prisma.user.create({
    data: {
      firstName: 'Awa',
      lastName: 'Diallo',
      email: 'admin@bookswap.sn',
      password: defaultPassword,
      phone: '+221770000001',
      address: 'Dakar, Plateau',
      gradeInterests: [],
      role: Role.ADMIN,
      isActive: true,
      isPhoneVerified: true,
    },
  });

  const supplier1 = await prisma.user.create({
    data: {
      firstName: 'Moussa',
      lastName: 'Ndiaye',
      email: 'librairie@bookswap.sn',
      password: defaultPassword,
      phone: '+221770000002',
      address: 'Dakar, Sacre-Coeur',
      gradeInterests: [],
      role: Role.SUPPLIER,
      isActive: true,
      isPhoneVerified: true,
    },
  });

  const supplier2 = await prisma.user.create({
    data: {
      firstName: 'Fatou',
      lastName: 'Sarr',
      email: 'papeterie@bookswap.sn',
      password: defaultPassword,
      phone: '+221770000003',
      address: 'Thies, Centre',
      gradeInterests: [],
      role: Role.SUPPLIER,
      isActive: true,
      isPhoneVerified: true,
    },
  });

  const userSpecs = [
    { firstName: 'Ibrahima', lastName: 'Fall', phone: '+221771111101', grades: ['6e', '5e'] },
    { firstName: 'Aissatou', lastName: 'Ba', phone: '+221771111102', grades: ['4e', '3e'] },
    { firstName: 'Ousmane', lastName: 'Sow', phone: '+221771111103', grades: ['2nde', '1ere'] },
    { firstName: 'Mariama', lastName: 'Diop', phone: '+221771111104', grades: ['Tle'] },
    { firstName: 'Cheikh', lastName: 'Gueye', phone: '+221771111105', grades: ['CM1', 'CM2'] },
  ];

  const users = await Promise.all(
    userSpecs.map((spec, i) =>
      prisma.user.create({
        data: {
          firstName: spec.firstName,
          lastName: spec.lastName,
          email: `user${i + 1}@bookswap.sn`,
          password: defaultPassword,
          phone: spec.phone,
          address: `Dakar, quartier ${i + 1}`,
          gradeInterests: spec.grades,
          role: Role.USER,
          isActive: true,
          isPhoneVerified: true,
        },
      }),
    ),
  );

  const bookSpecs = [
    { title: 'Mathematiques 6eme', author: 'Hachette', grade: '6e', condition: BookCondition.USED },
    { title: 'Francais 6eme - Belin', author: 'Belin', grade: '6e', condition: BookCondition.NEW },
    { title: 'Histoire-Geo 5eme', author: 'Nathan', grade: '5e', condition: BookCondition.USED },
    { title: 'SVT 4eme', author: 'Magnard', grade: '4e', condition: BookCondition.USED },
    { title: 'Anglais 3eme', author: 'Didier', grade: '3e', condition: BookCondition.NEW },
    { title: 'Maths Seconde', author: 'Hachette', grade: '2nde', condition: BookCondition.USED },
    {
      title: 'Physique-Chimie Premiere S',
      author: 'Bordas',
      grade: '1ere',
      condition: BookCondition.USED,
    },
    {
      title: 'Philosophie Terminale',
      author: 'Hatier',
      grade: 'Tle',
      condition: BookCondition.USED,
    },
    { title: 'Lecture CM1', author: 'Istra', grade: 'CM1', condition: BookCondition.NEW },
    { title: 'Calcul CM2', author: 'Retz', grade: 'CM2', condition: BookCondition.USED },
  ];

  const books = await Promise.all(
    bookSpecs.map((spec, i) =>
      prisma.book.create({
        data: {
          title: spec.title,
          author: spec.author,
          grade: spec.grade,
          condition: spec.condition,
          description: `Manuel scolaire ${spec.title}, en bon etat.`,
          imageUrl: PLACEHOLDER_IMAGE,
          status: BookStatus.AVAILABLE,
          ownerId: users[i % users.length].id,
        },
      }),
    ),
  );

  await prisma.request.createMany({
    data: [
      { bookId: books[0].id, requesterId: users[1].id },
      { bookId: books[2].id, requesterId: users[0].id },
      { bookId: books[5].id, requesterId: users[3].id },
    ],
  });

  await prisma.supply.createMany({
    data: [
      {
        name: 'Cahier 96 pages grands carreaux',
        type: SupplyType.NOTEBOOK,
        description: 'Lot de 10 cahiers',
        price: 5000,
        supplierId: supplier1.id,
      },
      {
        name: 'Stylos bille bleus (lot de 20)',
        type: SupplyType.PEN,
        price: 3500,
        supplierId: supplier1.id,
      },
      {
        name: 'Sac a dos ecolier',
        type: SupplyType.BAG,
        description: 'Modele renforce, 3 compartiments',
        price: 12000,
        supplierId: supplier2.id,
      },
      {
        name: 'Kit geometrie complet',
        type: SupplyType.OTHER,
        price: 2500,
        supplierId: supplier2.id,
      },
    ],
  });

  console.log('Seed complete:');
  console.log(`  1 admin (admin@bookswap.sn)`);
  console.log(`  2 suppliers`);
  console.log(`  ${users.length} users`);
  console.log(`  ${books.length} books`);
  console.log(`  3 requests`);
  console.log(`  4 supplies`);
  console.log(`  Default password: Password123!`);
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
