import axios from 'axios';

import { env } from '../config';
import { processWebhook, upsertComment } from '../gitlab';
import { logger } from '../logger';
import { findPattern } from '../matcher';
import { GitLabWebhookBody } from '../types';

export async function processGitLabWebhook(body: GitLabWebhookBody) {
  const job = await processWebhook(body);

  if (job.status === 'failed') {
    const pattern = findPattern(job.logs);
    logger.info({ pattern });

    if (env.WEBHOOK_URL) {
      await axios.post(env.WEBHOOK_URL, {
        text: [
          pattern ? `${pattern.id}: ${pattern.message}` : 'not pattern',
          `${job.url}${pattern ? `#L${pattern.line}` : ''} (${job.name} in ${job.duration}s, allow_failure: ${job.isFailureAllowed})`,
        ].join('\n\n'),
      }, {
        timeout: 10000,
      });

      if (pattern) {
        const result = await upsertComment({
          id: pattern.id,
          projectId: body.project_id,
          refName: body.ref,
          sha: body.sha,
          async buildMessage() {
            return [
              pattern.message,
              `${job.url}#L${pattern.line} (${job.name} in ${job.duration}s, allow_failure: ${job.isFailureAllowed})`,
            ].join('\n\n');
          },
        });

        logger.info({ upsertComment: result });
      }
    }
  } else if (job.status === 'success') {
    logger.info('success');
  }
}
