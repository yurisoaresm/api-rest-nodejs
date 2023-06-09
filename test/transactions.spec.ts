import { execSync } from 'child_process';
import request from 'supertest';
import { expect, it, beforeAll, afterAll, describe, beforeEach } from 'vitest';

import { app } from '../src/app';

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all');
    execSync('npm run knex migrate:latest');
  });

  it('should be able to create a new transaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 3000,
      type: 'credit',
    });

    expect(response.statusCode).toBe(201);
  });

  it('should be able to list the transactions', async () => {
    const transaction = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 3000,
      type: 'credit',
    });

    const cookies = transaction.headers['set-cookie'];

    const response = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies);

    expect(response.statusCode).toBe(200);
    expect(response.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 3000,
      }),
    ]);
  });

  it('should be able to find a transaction', async () => {
    const transaction = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 3000,
      type: 'credit',
    });

    const cookies = transaction.headers['set-cookie'];

    const listTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies);

    const transactionId = listTransactions.body.transactions[0].id;

    const response = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies);

    expect(response.statusCode).toBe(200);
    expect(response.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 3000,
      }),
    );
  });

  it('should be able to get the summary of amount', async () => {
    const transaction = await request(app.server).post('/transactions').send({
      title: 'Credit transaction',
      amount: 5000,
      type: 'credit',
    });

    const cookies = transaction.headers['set-cookie'];

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 3000,
        type: 'debit',
      });

    const response = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies);

    expect(response.body.summary).toEqual({
      total_amount: 2000,
    });
  });
});
