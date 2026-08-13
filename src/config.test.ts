import { describe, expect, it } from 'vitest';

import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('uses the default base URL when only the API password is configured', () => {
    expect(loadConfig({ KABU_API_PASSWORD: 'secret' })).toEqual({
      apiPassword: 'secret',
      baseUrl: 'http://localhost:18080/kabusapi',
    });
  });

  it('uses the configured base URL as-is', () => {
    expect(
      loadConfig({
        KABU_API_PASSWORD: 'secret',
        KABU_API_BASE_URL: 'https://example.com/kabusapi/',
      }),
    ).toEqual({
      apiPassword: 'secret',
      baseUrl: 'https://example.com/kabusapi/',
    });
  });

  it('throws when the API password is missing', () => {
    expect(() => loadConfig({})).toThrowError('KABU_API_PASSWORD is required');
  });

  it('throws when the API password is empty', () => {
    expect(() => loadConfig({ KABU_API_PASSWORD: '' })).toThrowError(
      'KABU_API_PASSWORD is required',
    );
  });
});
