// Roda BrowserLoader.analisarAno sob o tsx (como a API em produção) e imprime o resultado em JSON.
// Existe porque o tsx injeta o helper __name em funções nomeadas, que não existe dentro da página: o código passado
// a page.evaluate quebrava em silêncio sob o tsx e passava no vitest. Uso: tsx analisar-ano-tsx.mts <url> <ano>...
import { BrowserLoader, shutdownBrowser } from '../../src/evaluator/browser-loader';

const [url, ...anos] = process.argv.slice(2);
const loader = await BrowserLoader.create({ anoTimeoutMs: 3000 });
const resultados = [];
for (const ano of anos) resultados.push(await loader.analisarAno({ url: url!, ano, waitSection: 'tab' }));
await loader.close();
await shutdownBrowser();
console.log(`RESULTADO ${JSON.stringify(resultados)}`);
process.exit(0);
