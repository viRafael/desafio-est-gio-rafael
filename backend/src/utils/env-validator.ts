import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
import { EnvironmentVariables } from './dto/env.dto';

dotenv.config();

const envVars = plainToInstance(EnvironmentVariables, {
  PORT: Number(process.env.PORT),
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
});

const errors = validateSync(envVars, {
  skipMissingProperties: false,
});

if (errors.length > 0) {
  console.error('❌ Erro nas variáveis de ambiente:', errors);
  process.exit(1);
}

export const env = envVars;
