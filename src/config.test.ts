import { describe, expect, it } from 'vitest';

import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('APIパスワードのみ設定されている場合はデフォルトのベースURLを使う', () => {
    expect(loadConfig({ KABU_API_PASSWORD: 'secret' })).toEqual({
      apiPassword: 'secret',
      baseUrl: 'http://localhost:18080/kabusapi',
    });
  });

  it('設定されたベースURLをそのまま使う', () => {
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

  it('APIパスワードが未設定の場合は例外を投げる', () => {
    expect(() => loadConfig({})).toThrowError('KABU_API_PASSWORD is required');
  });

  it('APIパスワードが空文字の場合は例外を投げる', () => {
    expect(() => loadConfig({ KABU_API_PASSWORD: '' })).toThrowError(
      'KABU_API_PASSWORD is required',
    );
  });
});
