import fastify from 'fastify';
import cors from '@fastify/cors';

import { lotteryRoutes } from './routes/lottery.js';
import { generatorRoutes } from './routes/generator.js';

const server = fastify({
  logger: true,
});

server.register(cors, {
  origin: true, // Allow all for dev
});

server.register(lotteryRoutes);
server.register(generatorRoutes);

server.get('/', async (request, reply) => {
  return { hello: 'Loterias world' };
});

const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
