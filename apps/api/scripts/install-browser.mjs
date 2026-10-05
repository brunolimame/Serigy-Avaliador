// Prepara o navegador headless que a API usa para renderizar as páginas (roda no `pnpm install`).
// A API não depende de Chrome/Edge instalados na máquina. Ordem de preferência desta preparação:
//
//  1. ZIP LOCAL: se existir `chrome-headless-shell-*.zip` na raiz do projeto (ou em apps/api, ou o caminho
//     de SERIGY_BROWSER_ZIP), ele é extraído para apps/api/.browser/ — sem rede;
//  2. download pelo Playwright para node_modules (≈ 115 MiB), com repasse por espelho local (fetch do
//     Node) se o downloader do Playwright falhar na rede.
//
// Falhar aqui NÃO quebra a instalação: em tempo de execução a API usa um Chrome/Edge do sistema ou,
// na falta de qualquer navegador, o download simples do HTML (com aviso).
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

if (process.env.SERIGY_SKIP_BROWSER_DOWNLOAD) {
  console.log('[avaliador] SERIGY_SKIP_BROWSER_DOWNLOAD definido: pulando a preparação do navegador.');
  process.exit(0);
}

const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = resolve(apiDir, '..', '..');
const browserDir = join(apiDir, '.browser');
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// 1. ZIP local
// ---------------------------------------------------------------------------
function findLocalZip() {
  if (process.env.SERIGY_BROWSER_ZIP && existsSync(process.env.SERIGY_BROWSER_ZIP)) return process.env.SERIGY_BROWSER_ZIP;
  for (const dir of [projectRoot, apiDir]) {
    const hit = readdirSync(dir).find((f) => /^chrome-headless-shell-.*\.zip$/i.test(f));
    if (hit) return join(dir, hit);
  }
  return undefined;
}

function hasExtractedBrowser() {
  if (!existsSync(browserDir)) return false;
  const stack = [browserDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) stack.push(join(dir, e.name));
      else if (/^chrome-headless-shell(\.exe)?$/.test(e.name)) return true;
    }
  }
  return false;
}

const zip = findLocalZip();
if (zip) {
  if (hasExtractedBrowser()) {
    console.log('[avaliador] Navegador local já extraído em apps/api/.browser.');
    process.exit(0);
  }
  try {
    const { default: extract } = await import('extract-zip');
    console.log(`[avaliador] Extraindo ${zip} para apps/api/.browser …`);
    await extract(zip, { dir: browserDir });
    console.log('[avaliador] Navegador local extraído.');
    process.exit(0);
  } catch (err) {
    console.warn(`[avaliador] Falha ao extrair o zip local (${err instanceof Error ? err.message : err}); tentando baixar.`);
  }
}

// ---------------------------------------------------------------------------
// 2. Download pelo Playwright (hermético: node_modules/playwright-core/.local-browsers)
// ---------------------------------------------------------------------------
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
let cli;
try {
  cli = join(dirname(require.resolve('playwright-core/package.json')), 'cli.js');
} catch {
  console.warn('[avaliador] playwright-core não encontrado; pulando o download do navegador.');
  process.exit(0);
}

const CDN = 'https://cdn.playwright.dev';

function install(env) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [cli, 'install', 'chromium-headless-shell'], { stdio: 'inherit', env });
    child.on('exit', (code) => done(code === 0));
    child.on('error', () => done(false));
  });
}

/** Espelho local: repassa cada GET para o CDN do Playwright usando o fetch do Node (segue redirecionamentos). */
function startMirror() {
  const server = createServer(async (req, res) => {
    try {
      const upstream = await fetch(CDN + req.url, { redirect: 'follow', signal: AbortSignal.timeout(15 * 60_000) });
      const headers = { 'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream' };
      const length = upstream.headers.get('content-length');
      if (length) headers['content-length'] = length;
      res.writeHead(upstream.status, headers);
      if (upstream.body) Readable.fromWeb(upstream.body).pipe(res);
      else res.end();
    } catch (err) {
      res.writeHead(502);
      res.end(String(err));
    }
  });
  return new Promise((ready) => server.listen(0, '127.0.0.1', () => ready(server)));
}

console.log('[avaliador] Baixando o Chromium headless para dentro de node_modules (uma vez, ~115 MiB)…');
let ok = await install({ ...process.env, PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: process.env.PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT ?? '20000' });

if (!ok) {
  console.log('[avaliador] Download normal falhou; tentando por espelho local (fetch do Node)…');
  const mirror = await startMirror();
  const { port } = mirror.address();
  ok = await install({ ...process.env, PLAYWRIGHT_DOWNLOAD_HOST: `http://127.0.0.1:${port}`, PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: '120000' });
  mirror.close();
}

console.log(
  ok
    ? '[avaliador] Chromium embutido instalado.'
    : '[avaliador] Não foi possível baixar o Chromium. Coloque chrome-headless-shell-win64.zip na raiz do projeto e rode: ' +
        'pnpm --filter @serigy/api browser:install',
);
process.exit(0);
