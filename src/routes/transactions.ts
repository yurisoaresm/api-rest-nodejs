import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { knex } from '../database';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies;

    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select('*');

    return { transactions };
  });

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getTransactionsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionsSchema.parse(request.params);

    const { sessionId } = request.cookies;

    const transaction = await knex('transactions')
      .where({ id, session_id: sessionId })
      .first();

    return { transaction };
  });

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies;

      const summary = await knex('transactions')
        .sum('amount', { as: 'total_amount' })
        .where('session_id', sessionId)
        .first();

      return { summary };
    },
  );

  app.post('/', async (request, response) => {
    const createTransactionSchema = z.object({
      amount: z.number().positive(),
      title: z.string(),
      type: z.enum(['credit', 'debit']),
    });

    const { amount, title, type } = createTransactionSchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      response.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    });

    return response.code(201).send('Transcantion created');
  });
}
