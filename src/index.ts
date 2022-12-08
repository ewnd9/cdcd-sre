import axios from 'axios';
import fastify from 'fastify';

import fs from 'fs';
import { env } from './config';
import { processWebhook } from './gitlab';
import { findPattern } from './matcher';

const server = fastify();

server.get('/', async () => {
  return 'ok\n';
});

server.post('/api/v1/gitlab/webhook', async (request) => {
  const job = await processWebhook(request.body);

  if (job.status === 'failed') {
    const pattern = findPattern(job.logs);
    console.log({ pattern });

    if (env.WEBHOOK_URL) {
      await axios.post(env.WEBHOOK_URL, {
        text: [
          pattern ? `${pattern.id}: ${pattern.message}` : 'not pattern',
          `${job.url} (${job.name} in ${job.duration}ms, allow_failure: ${job.isFailureAllowed})`,
        ].join('\n\n'),
      });
    }
  } else if (job.status === 'success') {
    console.log('success');
  }

  return '';
});

server.listen({ port: env.PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
