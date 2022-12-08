import { cleanEnv, num, str } from 'envalid';
import yaml from 'js-yaml';
import { Static, TSchema, Type } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';

import fs from 'fs';

export const env = cleanEnv(process.env, {
  PORT: num({ default: 8080 }),
  GITLAB_HOST: str({ default: 'https://gitlab.com' }),
  GITLAB_TOKEN: str({ default: '' }),
  WEBHOOK_URL: str({ default: '' }),
});

const ConfigSchema = Type.Object({
  patterns: Type.Array(
    Type.Object({
      id: Type.String({ pattern: '[\\w-]+' }),
      pattern: Type.String(),
      message: Type.String(),
    })
  ),
});
const ConfigSchemaChecker = TypeCompiler.Compile(ConfigSchema); // }>>

export const config = ensureType(
  yaml.load(fs.readFileSync(`./config.yaml`, 'utf-8')),
  ConfigSchemaChecker
);

function ensureType<T extends TSchema>(
  value: any,
  schemaChecker: TypeCheck<T>
): Static<T> {
  const errors = [...schemaChecker.Errors(value)];

  if (errors.length > 0) {
    console.error(errors);
    process.exit(1);
  }

  return value;
}
