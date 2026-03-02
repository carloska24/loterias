import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

export async function ticketRoutes(server: FastifyInstance) {
  const prisma = new PrismaClient();

  // ── POST /tickets — Salvar bilhetes ────────────────────────────────────────
  server.post('/tickets', async (request, reply) => {
    const { tickets } = request.body as {
      tickets: {
        lotterySlug: string;
        contestNumber?: number;
        numbers: number[];
        cost: number;
        isSyndicate: boolean;
        participants: { name: string; quota: number }[];
      }[];
    };

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return reply.status(400).send({ error: 'Nenhum bilhete fornecido' });
    }

    try {
      const saved = await prisma.$transaction(
        tickets.map(ticket => {
          return prisma.savedTicket.create({
            data: {
              lotterySlug: ticket.lotterySlug,
              contestNumber: ticket.contestNumber,
              numbers: ticket.numbers,
              cost: ticket.cost,
              isSyndicate: ticket.isSyndicate,
              participants: {
                create: ticket.participants.map(p => ({
                  name: p.name,
                  quota: p.quota,
                })),
              },
            },
            include: {
              participants: true,
            },
          });
        })
      );

      return reply.status(201).send({ message: 'Bilhetes salvos com sucesso', saved });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao salvar os bilhetes' });
    }
  });

  // ── GET /tickets — Resgatar tickets com filtro de loteria e arquivamento ───
  // Query params: lotterySlug?, archived? ('true' | 'false' | 'all')
  server.get('/tickets', async (request, reply) => {
    const { lotterySlug, archived } = request.query as {
      lotterySlug?: string;
      archived?: string; // 'true' | 'false' | 'all'
    };

    // Monta filtro de archived
    let archivedFilter: boolean | undefined = undefined;
    if (archived === 'true') archivedFilter = true;
    else if (archived === 'false') archivedFilter = false;
    // 'all' ou undefined → sem filtro

    const where: Record<string, unknown> = {};
    if (lotterySlug) where.lotterySlug = lotterySlug;
    if (archivedFilter !== undefined) where.archived = archivedFilter;

    try {
      const tickets = await prisma.savedTicket.findMany({
        where,
        include: { participants: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ tickets });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao resgatar os bilhetes' });
    }
  });

  // ── PATCH /tickets/archive-all — Arquivar todas as apostas ativas ─────────
  // IMPORTANTE: deve ficar ANTES de /tickets/:id/archive para evitar conflito
  server.patch('/tickets/archive-all', async (request, reply) => {
    const { lotterySlug } = request.query as { lotterySlug?: string };

    const where: Record<string, unknown> = { archived: false };
    if (lotterySlug) where.lotterySlug = lotterySlug;

    try {
      const result = await prisma.savedTicket.updateMany({
        where,
        data: { archived: true },
      });
      return reply.send({ message: 'Apostas arquivadas', count: result.count });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao arquivar apostas' });
    }
  });

  // ── PATCH /tickets/:id/archive — Arquivar / Desarquivar ───────────────────
  server.patch('/tickets/:id/archive', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { archived } = request.body as { archived: boolean };

    if (typeof archived !== 'boolean') {
      return reply.status(400).send({ error: 'Campo "archived" (boolean) é obrigatório' });
    }

    try {
      const updated = await prisma.savedTicket.update({
        where: { id },
        data: { archived },
      });
      return reply.send({
        message: archived ? 'Aposta arquivada' : 'Aposta restaurada',
        ticket: updated,
      });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao atualizar status do bilhete' });
    }
  });

  // ── DELETE /tickets/all — Apagar todas (só apaga as não arquivadas por padrão) ──
  // Query: lotterySlug?, includeArchived? ('true')
  server.delete('/tickets/all', async (request, reply) => {
    const { lotterySlug, includeArchived } = request.query as {
      lotterySlug?: string;
      includeArchived?: string;
    };

    try {
      const where: Record<string, unknown> = {};
      if (lotterySlug) where.lotterySlug = lotterySlug;
      if (includeArchived !== 'true') where.archived = false; // por segurança, só apaga ativas

      const ticketsToDelete = await prisma.savedTicket.findMany({
        where,
        select: { id: true },
      });

      const ticketIds = ticketsToDelete.map(t => t.id);

      const deleteParticipants = prisma.participant.deleteMany({
        where: { savedTicketId: { in: ticketIds } },
      });
      const deleteTickets = prisma.savedTicket.deleteMany({
        where: { id: { in: ticketIds } },
      });

      await prisma.$transaction([deleteParticipants, deleteTickets]);

      return reply.send({ message: 'Bilhetes removidos', count: ticketIds.length });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao deletar bilhetes' });
    }
  });

  // ── DELETE /tickets/:id — Apagar bilhete individual ─────────────────────
  server.delete('/tickets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const deleteParticipants = prisma.participant.deleteMany({
        where: { savedTicketId: id },
      });
      const deleteTicket = prisma.savedTicket.delete({
        where: { id },
      });

      await prisma.$transaction([deleteParticipants, deleteTicket]);

      return reply.send({ message: 'Bilhete removido com sucesso' });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao deletar bilhete' });
    }
  });
}
