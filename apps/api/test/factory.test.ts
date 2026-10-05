import { describe, expect, it, vi } from 'vitest';
import { HttpLoader } from '../src/evaluator/loader';
import { createLoader } from '../src/evaluator/loader-factory';

// Simula um ambiente sem Chrome/Edge: o navegador não abre.
vi.mock('../src/evaluator/browser-loader', () => ({
  BrowserLoader: {
    create: async () => {
      throw new Error('nenhum navegador disponível');
    },
  },
}));

describe('createLoader', () => {
  it('sem navegador, cai para HTTP simples e avisa', async () => {
    const created = await createLoader('browser');
    expect(created.loader).toBeInstanceOf(HttpLoader);
    expect(created.renderer).toBe('http');
    expect(created.warning).toContain('Não foi possível abrir o navegador');
    expect(created.warning).toContain('sem executar JavaScript');
  });

  it('http pedido explicitamente: não tenta abrir o navegador', async () => {
    const created = await createLoader('http');
    expect(created.loader).toBeInstanceOf(HttpLoader);
    expect(created.warning).toBeUndefined();
  });
});
