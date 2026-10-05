import { createServer, type IncomingMessage, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { BrowserLoader, browserSource, shutdownBrowser } from '../src/evaluator/browser-loader';
import { evaluate } from '../src/evaluator/evaluate';
import { find, SCHEMAS } from './helpers';

/**
 * Testes com um Chrome/Edge real contra um portal falso local. Se não houver navegador instalado,
 * o grupo é ignorado (a avaliação cai para HTTP simples nesse ambiente).
 */
let server: Server;
let base = '';
let hasBrowser = false;
const hits: string[] = [];
const headers: Record<string, IncomingMessage['headers']> = {};
let throttled = 0;

const SCHEMA = SCHEMAS.despesas;
const page = (body: string) => `<!doctype html><html><head><title>Portal</title></head><body>${body}</body></html>`;

const routes: Record<string, (req: IncomingMessage) => { status?: number; body: string; headers?: Record<string, string> }> = {
  '/': () => ({ body: page('<meta serigyItem="invoker" serigyValue="h4sh">') }),
  // Conteúdo montado por JavaScript depois do carregamento
  '/despesas': () => ({
    body: page(`<div id="app"></div><script>
      setTimeout(() => {
        document.getElementById('app').innerHTML =
          '<div serigySchema="${SCHEMA}"><b serigyItem="valorEmpenhado">1,00</b></div>';
      }, 300);
    </script>`),
  }),
  // serigyExecuteWaitSection: o conteúdo só aparece depois do clique
  '/ouvidoria': () => ({
    body: page(`<div serigySchema="${SCHEMAS.ouvidoria}"><button serigyExecuteWaitSection="det1">Ver</button></div><script>
      document.querySelector('button').addEventListener('click', () => {
        fetch('/clicked/det1');
        setTimeout(() => {
          const t = document.createElement('div');
          t.setAttribute('serigyLoadSection', 'det1');
          t.setAttribute('serigySchema', '${SCHEMAS.ouvidoria}');
          t.innerHTML = '<p serigyItem="enderecoSetor">Rua A, 10</p>';
          document.body.appendChild(t);
        }, 200);
      });
    </script>`),
  }),
  // Botão dentro de um item de exportação: NÃO deve ser clicado
  '/export': () => ({
    body: page(`<div serigySchema="${SCHEMA}"><span serigyItem="salvarRelatorio"><button serigyExecuteWaitSection="exp1"
      onclick="fetch('/clicked/exp1')">Exportar</button></span></div>`),
  }),
  '/probe': (req) => {
    headers.probe = req.headers;
    return {
      body: page(`<div id="r"></div><script>
        document.getElementById('r').textContent = 'UA=' + navigator.userAgent + ';WD=' + navigator.webdriver + ';LANG=' + navigator.language;
      </script>`),
    };
  },
  '/bloqueado': () => ({ status: 403, body: '<html><head><title>Access Denied</title></head><body>blocked</body></html>' }),
  '/limitado': () => {
    throttled += 1;
    return throttled <= 2 ? { status: 429, body: '<html><title>Too Many Requests</title></html>' } : { body: page('<p>ok depois da espera</p>') };
  },
};

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    hits.push(path);
    const route = routes[path];
    const out = route ? route(req) : { status: 404, body: 'nf' };
    res.writeHead(out.status ?? 200, { 'content-type': 'text/html; charset=utf-8', ...out.headers });
    res.end(out.body);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
  try {
    const probe = await BrowserLoader.create();
    await probe.close();
    hasBrowser = true;
  } catch {
    hasBrowser = false;
  }
}, 60_000);

afterAll(async () => {
  server?.close();
  await shutdownBrowser();
});

const maybe = (name: string, fn: () => Promise<void>, timeout = 60_000) =>
  it(name, async (ctx) => {
    if (!hasBrowser) return ctx.skip();
    await fn();
  }, timeout);

describe('renderização com navegador real', () => {
  maybe('usa o navegador EMBUTIDO na API, não o Chrome/Edge instalado na máquina', async () => {
    const bundled = existsSync(resolve(__dirname, '../.browser')) || existsSync(resolve(__dirname, '../node_modules/playwright-core/.local-browsers'));
    if (!bundled) return; // sem navegador embutido neste ambiente: o teste só vale quando há um
    expect(browserSource()).toBe('embutido');
  });

  maybe('vê conteúdo montado por JavaScript; o download simples (http) não vê', async () => {
    const withBrowser = await evaluate({ url: base, poder: 'executivo', items: ['4.1.1'], renderer: 'browser' });
    expect(find(withBrowser, '4.1.1').status).toBe('ok');
    expect(withBrowser.crawl.renderer).toBe('browser');

    const withHttp = await evaluate({ url: base, poder: 'executivo', items: ['4.1.1'], renderer: 'http' });
    expect(find(withHttp, '4.1.1').status).toBe('missing');
    expect(withHttp.crawl.renderer).toBe('http');
  });

  maybe('dispara serigyExecuteWaitSection e avalia o conteúdo carregado após o clique', async () => {
    const r = await evaluate({ url: base, poder: 'executivo', items: ['14.1'], renderer: 'browser' });
    expect(find(r, '14.1')).toMatchObject({ status: 'ok' });
    expect(hits).toContain('/clicked/det1');
    expect(r.warnings.some((w) => w.includes('serigyExecuteWaitSection'))).toBe(false);

    // sem navegador (http) o item continua não encontrado e o aviso explica
    const http = await evaluate({ url: base, poder: 'executivo', items: ['14.1'], renderer: 'http' });
    expect(find(http, '14.1').status).toBe('missing');
    expect(http.warnings.some((w) => w.includes('serigyExecuteWaitSection'))).toBe(true);
  });

  maybe('não clica em elementos de exportação (salvarRelatorio)', async () => {
    const r = await evaluate({ url: base, poder: 'executivo', items: ['4.1.16'], renderer: 'browser' });
    // 4.1.16 = salvarRelatorio em /despesas (aqui a página montada por JS não o tem) ...
    expect(find(r, '4.1.16')).toBeDefined();
    const loader = await BrowserLoader.create();
    try {
      const loaded = await loader.load(`${base}export`);
      expect(loaded.html).toContain('salvarRelatorio');
    } finally {
      await loader.close();
    }
    expect(hits).not.toContain('/clicked/exp1');
  });

  maybe('apresenta-se como navegador comum (sem "Headless", sem webdriver, pt-BR)', async () => {
    const loader = await BrowserLoader.create();
    try {
      const loaded = await loader.load(`${base}probe`);
      const text = /UA=(.*?);WD=(.*?);LANG=(.*?)</.exec(loaded.html ?? '')!;
      expect(text[1]).toMatch(/^Mozilla\/5\.0 .*Chrome\/\d+/);
      expect(text[1]).not.toMatch(/Headless/i);
      expect(text[2]).not.toBe('true');
      expect(text[3]).toBe('pt-BR');
      expect(String(headers.probe!['accept-language'])).toContain('pt-BR');
    } finally {
      await loader.close();
    }
  });

  maybe('bloqueio (403 + "Access Denied") é identificado com uma mensagem clara', async () => {
    const loader = await BrowserLoader.create();
    try {
      const loaded = await loader.load(`${base}bloqueado`);
      expect(loaded.status).toBe(403);
      expect(loaded.error).toContain('bloquear acessos automatizados');
    } finally {
      await loader.close();
    }
  });

  maybe('429 é repetido com espera até o portal responder', async () => {
    throttled = 0;
    const loader = await BrowserLoader.create();
    try {
      const loaded = await loader.load(`${base}limitado`);
      expect(loaded.status).toBe(200);
      expect(loaded.html).toContain('ok depois da espera');
      expect(throttled).toBe(3);
    } finally {
      await loader.close();
    }
  }, 30_000);

  maybe('páginas inexistentes retornam HTTP 404 sem derrubar a avaliação', async () => {
    const loader = await BrowserLoader.create();
    try {
      const loaded = await loader.load(`${base}nao-existe`);
      expect(loaded).toMatchObject({ status: 404, error: 'HTTP 404' });
    } finally {
      await loader.close();
    }
  });
});
