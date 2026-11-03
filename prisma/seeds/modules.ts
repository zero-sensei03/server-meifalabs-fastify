import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const categories = [
  { code: 'ACADEMIC', name: 'Akademik', slug: 'akademik', description: 'Administrasi akademik sekolah.', order: 1 },
  { code: 'FINANCE', name: 'Keuangan', slug: 'keuangan', description: 'Administrasi pembayaran dan keuangan.', order: 2 },
  { code: 'LEARNING', name: 'Pembelajaran', slug: 'pembelajaran', description: 'Materi dan kegiatan pembelajaran.', order: 3 },
  { code: 'COMMUNICATION', name: 'Komunikasi', slug: 'komunikasi', description: 'Komunikasi sekolah dengan orang tua.', order: 4 },
];
const modules = [
  { code: 'ACADEMIC', category_id: 'ACADEMIC', module_name: 'Akademik', slug: 'akademik', description: 'Data siswa, kelas, jadwal, dan administrasi akademik.', order: 1 },
  { code: 'ATTENDANCE', category_id: 'ACADEMIC', module_name: 'Absensi', slug: 'absensi', description: 'Pencatatan kehadiran siswa dan staf.', order: 2 },
  { code: 'PAYMENT', category_id: 'FINANCE', module_name: 'Pembayaran', slug: 'pembayaran', description: 'Tagihan dan pencatatan pembayaran sekolah.', order: 1 },
  { code: 'LMS', category_id: 'LEARNING', module_name: 'LMS', slug: 'lms', description: 'Kegiatan belajar dan penugasan digital.', order: 1 },
  { code: 'MATERIAL', category_id: 'LEARNING', module_name: 'Materi', slug: 'materi', description: 'Pengelolaan materi pembelajaran.', order: 2 },
  { code: 'PARENTING', category_id: 'COMMUNICATION', module_name: 'Parenting', slug: 'parenting', description: 'Informasi dan komunikasi untuk orang tua.', order: 1 },
];
try {
  await prisma.$transaction(async (tx) => {
    for (const category of categories) {
      await tx.moduleCategory.upsert({ where: { code: category.code }, create: category, update: { name: category.name, slug: category.slug, description: category.description, order: category.order } });
    }
    for (const module of modules) {
      await tx.module.upsert({ where: { code: module.code }, create: module, update: { category_id: module.category_id, module_name: module.module_name, slug: module.slug, description: module.description, order: module.order } });
    }
  });
  console.info(`Seeded ${categories.length} module categories and ${modules.length} catalog modules.`);
} finally {
  await prisma.$disconnect();
}
