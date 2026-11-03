import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';

describe('Fastify application', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('returns 200 on GET /health', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'server-meifalabs',
    });
  });

  it('returns 404 for an unknown route', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/unknown-route',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      success: false,
      error: { code: 'ROUTE_NOT_FOUND' },
    });
  });

  it('rejects current-user requests without a session cookie', async () => {
    app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ success: false });
  });

  it('validates login bodies before attempting authentication', async () => {
    app = await buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: '', password: '' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('does not allow an unlisted CORS origin', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'https://untrusted.example',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(
      response.headers['access-control-allow-origin'],
    ).toBeUndefined();
  });

  it('returns security headers', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });
});
