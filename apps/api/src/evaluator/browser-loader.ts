import './playwright-env'; // tem de vir antes do playwright-core
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import type { LoadedPage, PageLoader } from './loader';

/**
 * Carregador que abre a página em um navegador real (Chrome/Edge em modo headless), executa o
 * JavaScript e devolve o DOM já renderizado. Assim páginas reativas (SPA, tabelas montadas por
 * script, conteúdo carregado após clique) são avaliadas como o usuário as vê.
 *
 * - Usa o navegador EMBUTIDO na API (extraído de chrome-headless-shell-*.zip para apps/api/.browser, ou
 *   baixado para node_modules, no `pnpm install`; ver scripts/install-browser.mjs): não depende de
 *   nenhum programa instalado na máquina. Só se ele
 *   faltar tenta o Chrome/Edge do sistema. Ordem: `BROWSER_EXECUTABLE_PATH`, Chromium embutido,
 *   Chrome, Edge. Variáveis: `BROWSER_EXECUTABLE_PATH`, `BROWSER_USER_AGENT`.
 * - Apresenta-se como um navegador comum (UA sem "HeadlessChrome", sem `navigator.webdriver`,
 *   idioma/fuso do Brasil), para não ser confundido com um robô. Isso NÃO burla CAPTCHA nem desafios
 *   de WAF: se o portal bloquear, o erro diz isso e o ideal é liberar o avaliador no portal.
 * - Baixa uma página por vez por aba, com poucas abas simultâneas (ver SECTION_CONCURRENCY),
 *   repete com espera em 429/503 e não aceita downloads (nada é exportado/baixado).
 */

export interface BrowserLoaderOptions {
  navigationTimeoutMs?: number;
  /** Tempo máximo esperando a rede ficar ociosa após o carregamento. */
  settleMs?: number;
  /** Dispara os serigyExecuteWaitSection (clique + espera do serigyLoadSection). */
  executeWaitSections?: boolean;
  /** Máximo de cliques de serigyExecuteWaitSection por página. */
  maxWaitSections?: number;
  userAgent?: string;
}

// ---------------------------------------------------------------------------
// Navegador compartilhado entre avaliações (abrir o Chrome é a parte cara)
// ---------------------------------------------------------------------------

let browserPromise: Promise<Browser> | null = null;
let users = 0;
let idleTimer: NodeJS.Timeout | undefined;
/** De onde veio o navegador em uso: 'embutido' (node_modules), 'caminho' (env), 'chrome' ou 'edge'. */
let launchedFrom: 'embutido' | 'caminho' | 'chrome' | 'edge' | undefined;

export function browserSource(): typeof launchedFrom {
  return launchedFrom;
}
const IDLE_CLOSE_MS = 60_000;

const LF = String.fromCharCode(10);

/**
 * Navegador extraído de chrome-headless-shell-*.zip para apps/api/.browser (scripts/install-browser.mjs).
 * Fica junto da API: não depende de nada instalado na máquina nem de rede.
 */
function findLocalBrowser(): string | undefined {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../.browser');
  if (!existsSync(root)) return undefined;
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) stack.push(join(dir, entry.name));
      else if (/^chrome-headless-shell(\.exe)?$/.test(entry.name)) return join(dir, entry.name);
    }
  }
  return undefined;
}

async function launch(): Promise<Browser> {
  const args = ['--disable-blink-features=AutomationControlled'];
  const attempts: Array<{ source: NonNullable<typeof launchedFrom>; options: Parameters<typeof chromium.launch>[0] }> = [];
  if (process.env.BROWSER_EXECUTABLE_PATH) {
    attempts.push({ source: 'caminho', options: { executablePath: process.env.BROWSER_EXECUTABLE_PATH } });
  }
  const local = findLocalBrowser();
  if (local) attempts.push({ source: 'embutido', options: { executablePath: local } }); // apps/api/.browser
  attempts.push(
    { source: 'embutido', options: {} }, // Chromium baixado pelo Playwright para node_modules
    { source: 'chrome', options: { channel: 'chrome' } },
    { source: 'edge', options: { channel: 'msedge' } },
  );
  const errors: string[] = [];
  for (const a of attempts) {
    try {
      const browser = await chromium.launch({ headless: true, args, ...a.options });
      launchedFrom = a.source;
      return browser;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${a.source}: ${message.split(LF)[0] ?? message}`);
    }
  }
  throw new Error(
    'nenhum navegador disponível. Rode "pnpm --filter @serigy/api browser:install" para baixar o Chromium embutido ' +
      `(ou defina BROWSER_EXECUTABLE_PATH). Tentativas: ${errors.join(' | ')}`,
  );
}

async function acquire(): Promise<Browser> {
  if (idleTimer) clearTimeout(idleTimer);
  users += 1;
  browserPromise ??= launch();
  try {
    const browser = await browserPromise;
    if (!browser.isConnected()) {
      browserPromise = launch();
      return await browserPromise;
    }
    return browser;
  } catch (err) {
    users -= 1;
    browserPromise = null;
    throw err;
  }
}

function release(): void {
  users -= 1;
  if (users > 0) return;
  idleTimer = setTimeout(() => {
    const p = browserPromise;
    browserPromise = null;
    void p?.then((b) => b.close()).catch(() => undefined);
  }, IDLE_CLOSE_MS);
  idleTimer.unref();
}

/** Fecha o navegador compartilhado (encerramento do processo / testes). */
export async function shutdownBrowser(): Promise<void> {
  if (idleTimer) clearTimeout(idleTimer);
  const p = browserPromise;
  browserPromise = null;
  users = 0;
  await p?.then((b) => b.close()).catch(() => undefined);
}

/** UA de um Chrome comum (o modo headless acrescenta "HeadlessChrome", que denuncia automação). */
function normalUserAgent(version: string): string {
  const major = version.split('.')[0] ?? '130';
  const platform =
    process.platform === 'win32'
      ? 'Windows NT 10.0; Win64; x64'
      : process.platform === 'darwin'
        ? 'Macintosh; Intel Mac OS X 10_15_7'
        : 'X11; Linux x86_64';
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`;
}

const BLOCK_TITLE = /just a moment|attention required|access denied|acesso negado|captcha|verifying you are human|um momento/i;

export class BrowserLoader implements PageLoader {
  private constructor(
    private readonly context: BrowserContext,
    private readonly opts: Required<Omit<BrowserLoaderOptions, 'userAgent'>>,
  ) {}

  /** Abre um contexto isolado (cookies próprios) no navegador compartilhado. */
  static async create(options: BrowserLoaderOptions = {}): Promise<BrowserLoader> {
    const browser = await acquire();
    try {
      const context = await browser.newContext({
        userAgent: options.userAgent ?? process.env.BROWSER_USER_AGENT ?? normalUserAgent(browser.version()),
        locale: 'pt-BR',
        timezoneId: 'America/Maceio',
        viewport: { width: 1366, height: 768 },
        extraHTTPHeaders: { 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' },
        acceptDownloads: false, // nada é baixado/exportado
        ignoreHTTPSErrors: true, // portais públicos com certificado incompleto continuam analisáveis
      });
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });
      // Imagens, mídia e fontes não mudam a marcação: não baixa (mais rápido e menos tráfego no portal).
      await context.route('**/*', (route) =>
        ['image', 'media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue(),
      );
      return new BrowserLoader(context, {
        navigationTimeoutMs: options.navigationTimeoutMs ?? 30_000,
        settleMs: options.settleMs ?? 8_000,
        executeWaitSections: options.executeWaitSections ?? true,
        maxWaitSections: options.maxWaitSections ?? 20,
      });
    } catch (err) {
      release();
      throw err;
    }
  }

  async close(): Promise<void> {
    await this.context.close().catch(() => undefined);
    release();
  }

  async load(url: string): Promise<LoadedPage> {
    let last: LoadedPage = { url, status: null, html: null, error: 'sem resposta' };
    for (let attempt = 0; attempt < 3; attempt++) {
      last = await this.loadOnce(url);
      // Limite de requisições / indisponibilidade momentânea: espera e tenta de novo.
      if (last.status === 429 || last.status === 503) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      break;
    }
    return last;
  }

  private async loadOnce(url: string): Promise<LoadedPage> {
    const page = await this.context.newPage();
    page.on('dialog', (d) => void d.dismiss().catch(() => undefined));
    try {
      let response;
      try {
        response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.opts.navigationTimeoutMs });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/download is starting/i.test(msg)) return { url, status: null, html: null, error: 'conteúdo não é HTML (download)' };
        if (/timeout/i.test(msg)) return { url, status: null, html: null, error: `timeout após ${this.opts.navigationTimeoutMs} ms` };
        return { url, status: null, html: null, error: msg.split('\n')[0] ?? msg };
      }

      const status = response?.status() ?? null;
      // Aguarda a rede ficar ociosa (JS que monta a página) sem travar em sites com polling.
      await page.waitForLoadState('networkidle', { timeout: this.opts.settleMs }).catch(() => undefined);
      await page.waitForTimeout(300);

      if (this.opts.executeWaitSections) await this.runWaitSections(page, page.url());

      const title = await page.title().catch(() => '');
      const finalUrl = page.url();
      const html = await page.content();

      if (status !== null && status >= 400) {
        const blocked = (status === 403 || status === 429 || status === 503) && (BLOCK_TITLE.test(title) || status === 429);
        return {
          url: finalUrl,
          status,
          html,
          error: blocked
            ? `HTTP ${status}: o portal parece bloquear acessos automatizados (${title || 'sem título'}); libere o avaliador no portal`
            : `HTTP ${status}`,
        };
      }
      if (BLOCK_TITLE.test(title) && !/serigy/i.test(html)) {
        return { url: finalUrl, status, html: null, error: `desafio anti-robô detectado ("${title}"); libere o avaliador no portal` };
      }
      return { url: finalUrl, status, html };
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  /**
   * serigyExecuteWaitSection (docs/pntp-2026/definicoes.md): clica no elemento e espera o
   * serigyLoadSection correspondente aparecer. Não clica em itens de exportação (salvarRelatorio).
   */
  private async runWaitSections(page: Page, startUrl: string): Promise<void> {
    const names = await page
      .$$eval('[serigyexecutewaitsection]', (els) =>
        els
          .filter((el) => !el.closest('[serigyitem="salvarRelatorio"]') && !el.matches('[serigyitem="salvarRelatorio"], a[download]'))
          .map((el) => el.getAttribute('serigyexecutewaitsection') ?? ''),
      )
      .catch(() => [] as string[]);

    for (const name of [...new Set(names.filter(Boolean))].slice(0, this.opts.maxWaitSections)) {
      const target = JSON.stringify(name); // string CSS válida
      if (await page.$(`[serigyloadsection=${target}]`)) continue; // já está no DOM
      await page
        .locator(`[serigyexecutewaitsection=${target}]`)
        .first()
        .click({ timeout: 2_000, noWaitAfter: true })
        .catch(() => undefined);
      await page.waitForSelector(`[serigyloadsection=${target}]`, { timeout: 5_000 }).catch(() => undefined);
      // O clique navegou para outra página: volta para a original e encerra as interações.
      if (page.url() !== startUrl) {
        await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: this.opts.navigationTimeoutMs }).catch(() => undefined);
        return;
      }
    }
  }
}
