import axios from 'axios';

import fs from 'fs/promises';
import { env } from './config';

const client = axios.create({
  baseURL: env.GITLAB_HOST,
  headers: {
    'PRIVATE-TOKEN': env.GITLAB_TOKEN,
  },
});

export async function processWebhook(body: any) {
  const {
    project_id: projectId,
    build_id: id,
    build_name: name,
    build_status: status,
    build_duration: duration,
    build_allow_failure: isFailureAllowed,
    repository: { git_http_url: repoUrlWithGitSuffix },
  } = body;

  if (process.env.WRITE_REQUESTS) {
    await fs.writeFile(
      `data/job-${id}-${status}.json`,
      JSON.stringify(body, null, 2)
    );
  }

  const job = {
    projectId,
    id,
    name,
    status,
    duration,
    isFailureAllowed,
    url: `${repoUrlWithGitSuffix.replace('.git', '')}/-/jobs/${id}`,
    logs: '',
  };

  if (status === 'failed') {
    job.logs = await getLogs({ projectId, jobId: job.id });
  }

  return job;
}

export async function getLogs({ projectId, jobId }) {
  const { data } = await client.get<string>(
    `/api/v4/projects/${encodeURIComponent(projectId)}/jobs/${jobId}/trace`,
    {
      headers: {
        // code: 'Z_BUF_ERROR' on trying to decode brottli
        'Accept-Encoding': 'gzip',
      },
    }
  );

  return data;
}
