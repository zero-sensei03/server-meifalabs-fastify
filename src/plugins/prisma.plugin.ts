
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db/prisma.js';

async function prismaPlugin(app: FastifyInstance): Promise<void> {
  await prisma.$connect();

  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin, {
  name: 'prisma-plugin',
});
