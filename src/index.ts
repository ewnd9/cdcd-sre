import axios from 'axios';
import fastify from 'fastify';
import metricsPlugin from 'fastify-metrics';

import { env } from './config';
import { processWebhook } from './gitlab';
import { findPattern } from './matcher';

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

async function main() {
  const server = fastify({
    logger: true,
  });
  await server.register(metricsPlugin, { endpoint: '/metrics' });

  server.get('/', async () => {
    return 'ok\n';
  });

  server.get('/error', async () => {
    throw new Error('err');
    return 'ok\n';
  });

  server.post('/api/v1/gitlab/webhook', async (request) => {
    const job = await processWebhook(request.body);

    if (job.status === 'failed') {
      const pattern = findPattern(job.logs);
      server.log.info({ pattern });

      if (env.WEBHOOK_URL) {
        await axios.post(env.WEBHOOK_URL, {
          text: [
            pattern ? `${pattern.id}: ${pattern.message}` : 'not pattern',
            `${job.url}#L${pattern?.line} (${job.name} in ${job.duration}ms, allow_failure: ${job.isFailureAllowed})`,
          ].join('\n\n'),
        }, {
          timeout: 10000,
        });
      }
    } else if (job.status === 'success') {
      server.log.info('success');
    }

    return '';
  });

  server.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      server.log.error(err)
      process.exit(1);
    }
  });
}
