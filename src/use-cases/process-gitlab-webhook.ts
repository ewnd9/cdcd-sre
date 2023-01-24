import axios from 'axios';

import { env } from '../config';
import { processWebhook } from '../gitlab';
import { logger } from '../logger';
import { findPattern } from '../matcher';

export async function processGitLabWebhook(body: any) {
  const job = await processWebhook(body);

  if (job.status === 'failed') {
    const pattern = findPattern(job.logs);
    logger.info({ pattern });

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
    logger.info('success');
  }
}
