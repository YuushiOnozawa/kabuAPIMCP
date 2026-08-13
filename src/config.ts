export type KabuConfig = {
  apiPassword: string;
  baseUrl: string;
};

const DEFAULT_BASE_URL = 'http://localhost:18080/kabusapi';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): KabuConfig {
  const apiPassword = env.KABU_API_PASSWORD;

  if (!apiPassword) {
    throw new Error('KABU_API_PASSWORD is required');
  }

  return {
    apiPassword,
    baseUrl: env.KABU_API_BASE_URL ?? DEFAULT_BASE_URL,
  };
}
