import { describe, it, expect } from 'vitest';

describe('config — getApiUrl + API_URL', () => {
  it('getApiUrl retorna la URL del backend Kotlin', async () => {
    const { getApiUrl } = await import('../config');
    expect(getApiUrl()).toMatch(/https?:\/\//);
  });

  it('API_URL coincide con getApiUrl', async () => {
    const { getApiUrl, API_URL } = await import('../config');
    expect(API_URL).toBe(getApiUrl());
  });
});
