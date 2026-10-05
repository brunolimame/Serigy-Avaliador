/**
 * Importado ANTES do playwright-core: o Playwright lê PLAYWRIGHT_BROWSERS_PATH ao ser carregado.
 * `0` = o Chromium fica dentro de node_modules (node_modules/playwright-core/.local-browsers), isto é,
 * a avaliação depende só das bibliotecas da API, e não de um navegador instalado na máquina.
 */
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
