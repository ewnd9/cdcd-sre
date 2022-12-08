import { config } from './config';

const patterns = config.patterns.map(({ pattern, ...rest }) => {
  return {
    pattern: new RegExp(pattern, 'g'),
    ...rest,
  };
});

export function findPattern(logs: string) {
  const pattern = patterns.find(({ pattern }) => logs.match(pattern));
  return pattern;
}
