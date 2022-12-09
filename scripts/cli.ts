import { getLogs } from '../src/gitlab';
import { findPattern } from '../src/matcher';

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function main() {
  const input = process.argv[2];
  console.log({ input });
  const match = /https?:\/\/[\w-\.]+\/([\w-\/]+)\/-\/jobs\/([\d]+)/.exec(input);

  if (!match) {
    console.error(
      `input should be like "https://gitlab.com/namespace/repo/-/jobs/1111"`
    );
    process.exit(1);
  }

  const [, projectId, jobId] = match;
  const logs = await getLogs({ projectId, jobId });
  const pattern = findPattern(logs);
  console.log(pattern);

  if (pattern) {
    console.log(`line: ${input}#L${pattern.line}`);
  }
}
