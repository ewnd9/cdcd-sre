import { config } from './config';

const patterns = config.patterns.map(({ pattern, ...rest }) => {
  return {
    pattern: new RegExp(pattern, 'g'),
    ...rest,
  };
});

export function findPattern(logs: string) {
  for (const pattern of patterns) {
    const match = pattern.pattern.exec(logs);

    if (match) {
      return {
        ...pattern,
        line: findLineNumber(logs, match.index),
      };
    }
  }

  return null;
}

function findLineNumber(str: string, index: number) {
  const lines = str.split(/\n|\r/);

  let line = 0;
  let processed = 0;

  for (let i = 0; i < lines.length; i++) {
    if (processed + lines[i].length > index) {
      break;
    }

    processed += lines[i].length;

    if (
      lines[i] &&
      // @TODO: regex
      !lines[i].startsWith('section_start:') &&
      !lines[i].startsWith('\x1B[0Ksection_start')
    ) {
      line++;
    }
  }

  return line;
}
