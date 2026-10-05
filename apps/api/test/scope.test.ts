import { describe, expect, it } from 'vitest';
import { evaluate } from '../src/evaluator/evaluate';
import { documentedUrl } from '../src/evaluator/paths';
import { FakeLoader, find, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';

const run = (loader: FakeLoader, extra: Partial<Parameters<typeof evaluate>[0]> = {}) =>
  evaluate({ url: P, poder: 'executivo', ...extra }, { loader });

describe('documentedUrl', () => {
  it('acrescenta o caminho da documentação à URL do portal', () => {
    expect(documentedUrl('https://p.gov.br/', '[Portal da Transparencia]/Despesas')).toBe('https://p.gov.br/Despesas');
    expect(documentedUrl('https://p.gov.br/transparencia/', '[Portal da Transparencia]/Atividades/ComposicaoCasa')).toBe(
      'https://p.gov.br/transparencia/Atividades/ComposicaoCasa',
    );
  });
  it('sem caminho, só o prefixo ou curinga: a própria URL do portal', () => {
    expect(documentedUrl('https://p.gov.br/', '[Portal da Transparencia]')).toBe('https://p.gov.br/');
    expect(documentedUrl('https://p.gov.br/', '[Portal da Transparencia]/*')).toBe('https://p.gov.br/');
    expect(documentedUrl('https://p.gov.br/', undefined)).toBe('https://p.gov.br/');
  });
});

describe('um item é avaliado somente na URL do caminho da sua seção', () => {
  const lgpd = (extra: string) => `<div serigySchema="${SCHEMAS.lgpd}">${extra}</div>`;

  it('item 15.2.1 usa só /LGPDeGovernoDigital/Servicos, mesmo havendo o schema em outras páginas', async () => {
    const loader = new FakeLoader({
      [P]: lgpd('<b serigyItem="servicoPublico">na raiz</b>'),
      'https://p.gov.br/lgpdegovernodigital': lgpd('<b serigyItem="servicoPublico">na seção 15.1</b>'),
      'https://p.gov.br/lgpdegovernodigital/servicos': lgpd('<b serigyItem="servicoPublico">aqui</b>'),
    });
    const i = find(await run(loader, { items: ['15.2.1'] }), '15.2.1');
    expect(i.status).toBe('ok');
    expect(i.analyzedUrls).toEqual(['https://p.gov.br/lgpdegovernodigital/servicos']);
    expect(i.evidence).toHaveLength(1);
  });

  it('na avaliação completa nenhum item analisa mais de uma URL (sem serigyLink)', async () => {
    const loader = new FakeLoader({
      [P]: lgpd('<b serigyItem="servicoPublico">x</b>'),
      'https://p.gov.br/lgpdegovernodigital': lgpd('<b serigyItem="nomeResponsavel">x</b>'),
      'https://p.gov.br/lgpdegovernodigital/servicos': lgpd('<b serigyItem="servicoPublico">x</b>'),
    });
    const r = await run(loader);
    for (const i of r.pages.flatMap((p) => p.sections.flatMap((s) => s.items))) {
      expect(i.analyzedUrls, i.id).toHaveLength(1);
    }
    // 15.1.1 olha a página da seção 15.1, não a de 15.2
    expect(find(r, '15.1.1').analyzedUrls).toEqual(['https://p.gov.br/lgpdegovernodigital']);
  });
});

describe('só baixa o necessário', () => {
  const lower = 'https://p.gov.br/despesas';
  const upper = 'https://p.gov.br/Despesas'; // grafia da documentação: [Portal da Transparencia]/Despesas
  const despesas = `<div serigySchema="${SCHEMAS.despesas}"><b serigyItem="valorEmpenhado">1,00</b></div>`;

  it('não navega por links <a href>; baixa só a URL inicial e o caminho da seção', async () => {
    const loader = new FakeLoader({
      [P]: '<a href="/a">a</a><a href="/b">b</a><a href="/despesas/detalhe">c</a>',
      [lower]: `${despesas}<a href="/outra">x</a>`,
    });
    await run(loader, { items: ['4.1.1'] });
    expect(loader.calls).toEqual([P, lower]);
  });

  it('seção sem caminho (a própria URL do portal) é pedida uma única vez', async () => {
    const root = new FakeLoader({ [P]: '<html/>' });
    await run(root, { items: ['1.1'] }); // informacoes: [Portal da Transparencia]
    expect(root.calls).toEqual([P]);
  });
});

describe('maiúsculas/minúsculas no caminho da documentação', () => {
  const lower = 'https://p.gov.br/despesas';
  const upper = 'https://p.gov.br/Despesas';
  const despesas = `<div serigySchema="${SCHEMAS.despesas}"><b serigyItem="valorEmpenhado">1,00</b></div>`;

  it('por padrão testa SOMENTE em minúsculas, mesmo que a grafia da documentação exista no site', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', [upper]: despesas });
    const i = find(await run(loader, { items: ['4.1.1'] }), '4.1.1');
    expect(loader.calls).toEqual([P, lower]); // a URL com maiúsculas nunca é pedida
    expect(i).toMatchObject({ status: 'missing', analyzedUrls: [lower] });
    expect(i.message).toContain('[Portal da Transparencia]/Despesas');
  });

  it('em minúsculas encontrada: uma única requisição, com ou sem a opção ligada', async () => {
    for (const tryDocumentedCase of [false, true]) {
      const loader = new FakeLoader({ [P]: '<html/>', [lower]: despesas });
      const i = find(await run(loader, { items: ['4.1.1'], tryDocumentedCase }), '4.1.1');
      expect(i).toMatchObject({ status: 'ok', analyzedUrls: [lower] });
      expect(loader.calls).toEqual([P, lower]);
    }
  });

  it('com a opção ligada: se a minúscula falhar (404 ou outro erro), testa a grafia da documentação', async () => {
    for (const lowerError of [undefined, 'boom']) {
      const loader = new (class extends FakeLoader {
        override async load(url: string) {
          if (url === lower && lowerError) {
            this.calls.push(url);
            return { url, status: 500, html: null, error: lowerError };
          }
          return super.load(url);
        }
      })({ [P]: '<html/>', [upper]: despesas });
      const i = find(await run(loader, { items: ['4.1.1'], tryDocumentedCase: true }), '4.1.1');
      expect(i, String(lowerError)).toMatchObject({ status: 'ok', analyzedUrls: [upper] });
      expect(loader.calls).toEqual([P, lower, upper]);
    }
  });

  it('com a opção ligada e as duas falhando: a mensagem cita as duas tentativas', async () => {
    const i = find(await run(new FakeLoader({ [P]: '<html/>' }), { items: ['4.1.1'], tryDocumentedCase: true }), '4.1.1');
    expect(i.status).toBe('missing');
    expect(i.analyzedUrls).toEqual([upper]);
    expect(i.message).toContain('em minúsculas');
  });

  it('a opção é guardada no resultado (usada ao reavaliar um item)', async () => {
    const loader = new FakeLoader({ [P]: '<html/>' });
    expect((await run(loader, { items: ['4.1.1'] })).crawl.tryDocumentedCase).toBe(false);
    expect((await run(loader, { items: ['4.1.1'], tryDocumentedCase: true })).crawl.tryDocumentedCase).toBe(true);
  });

  it('serigyLink não é alterado: é pedido exatamente como o portal escreveu', async () => {
    const loader = new FakeLoader({
      [P]: '<html/>',
      [lower]: `<iframe serigySchema="${SCHEMAS.despesas}" serigyLink="https://ext.com/Despesas"></iframe>`,
      'https://ext.com/Despesas': despesas,
    });
    const i = find(await run(loader, { items: ['4.1.1'] }), '4.1.1');
    expect(i.status).toBe('ok');
    expect(loader.calls).toContain('https://ext.com/Despesas');
    expect(loader.calls).not.toContain('https://ext.com/despesas');
  });
});

describe('limite de páginas', () => {
  it('não limita as páginas dos caminhos da documentação, mesmo com maxPages baixo', async () => {
    const r = await run(new FakeLoader({ [P]: '<html/>' }), { maxPages: 1 });
    const documented = r.fetched.filter((f) => f.origin === 'documentacao');
    expect(documented.length).toBeGreaterThan(40);
    expect(r.fetched.some((f) => f.error?.includes('limite'))).toBe(false);
  });

  it('limita só as páginas seguidas por serigyLink', async () => {
    const links = [1, 2, 3].map((n) => `<iframe serigySchema="${SCHEMAS.despesas}" serigyLink="https://ext.com/${n}"></iframe>`).join('');
    const loader = new FakeLoader({
      [P]: '<html/>',
      'https://p.gov.br/despesas': links,
      'https://ext.com/1': '<p/>',
      'https://ext.com/2': '<p/>',
      'https://ext.com/3': '<p/>',
    });
    const r = await run(loader, { items: ['4.1.1'], maxPages: 2 });
    const followed = r.fetched.filter((f) => f.origin === 'iframe');
    expect(followed).toHaveLength(3);
    expect(followed.filter((f) => f.error?.includes('limite de 2 páginas seguidas por serigyLink'))).toHaveLength(1);
  });
});

describe('exportação de dados: apenas verifica se está mapeada', () => {
  const html = `<div serigySchema="${SCHEMAS.despesas}">
      <a serigyItem="salvarRelatorio" serigyValue="pdf" href="/exportar?formato=pdf" serigyLink="https://exp.com/pdf">PDF</a>
      <a serigyItem="salvarRelatorio" serigyValue="csv" href="/exportar?formato=csv">CSV</a>
    </div>`;

  it('ok se mapeado; não baixa os links de exportação nem segue o serigyLink do elemento', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', 'https://p.gov.br/despesas': html });
    const i = find(await run(loader, { items: ['4.1.16'] }), '4.1.16');
    expect(i.status).toBe('ok');
    expect(i.message).toContain('a exportação não é executada');
    expect(i.message).toContain('pdf, csv');
    expect(loader.calls).toEqual([P, 'https://p.gov.br/despesas']);
  });

  it('sem o serigyItem de exportação, não encontrado', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', 'https://p.gov.br/despesas': `<div serigySchema="${SCHEMAS.despesas}"></div>` });
    expect(find(await run(loader, { items: ['4.1.16'] }), '4.1.16').status).toBe('missing');
  });
});
