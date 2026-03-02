import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';

import { lotteryRoutes } from './routes/lottery.js';
import { generatorRoutes } from './routes/generator.js';
import { ticketRoutes } from './routes/tickets.js';

const server = fastify({
  logger: true,
});

server.register(cors, {
  origin: true, // Allow all for dev
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

server.register(lotteryRoutes);
server.register(generatorRoutes);
server.register(ticketRoutes);

server.get('/', async (request, reply) => {
  return { hello: 'Loterias world' };
});

import { setupCronJobs } from './utils/cronJobs.js';

const start = async () => {
  try {
    // Configura os agendamentos automáticos
    setupCronJobs();

    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
