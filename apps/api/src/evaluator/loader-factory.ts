import type { Renderer } from '@serigy/shared';
import { HttpLoader, type PageLoader } from './loader';

export interface CreatedLoader {
  loader: PageLoader;
  /** Renderizador efetivamente usado (pode ser `http` se o navegador não estiver disponível). */
  renderer: Renderer;
  /** Aviso para o usuário quando houve queda para `http`. */
  warning?: string;
}

/**
 * Cria o carregador de páginas da avaliação.
 *  - `browser` (padrão): navegador real headless, executa JavaScript (browser-loader.ts);
 *  - `http`: download simples do HTML, mais rápido, sem JavaScript.
 * Se o navegador não puder ser aberto, cai para `http` e avisa.
 */
export async function createLoader(renderer: Renderer): Promise<CreatedLoader> {
  if (renderer === 'http') return { loader: new HttpLoader(), renderer: 'http' };
  try {
    // import dinâmico: o Playwright só é carregado quando o navegador é usado
    const { BrowserLoader } = await import('./browser-loader');
    return { loader: await BrowserLoader.create(), renderer: 'browser' };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      loader: new HttpLoader(),
      renderer: 'http',
      warning: `Não foi possível abrir o navegador (${reason}). A avaliação usou download simples do HTML, sem executar JavaScript.`,
    };
  }
}
