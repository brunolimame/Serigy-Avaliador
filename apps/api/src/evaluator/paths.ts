/**
 * Resolve o "Caminho URL" da documentação (ex.: `[Portal da Transparencia]/Despesas`) a partir da URL
 * do portal informada pelo usuário (que corresponde a `[Portal da Transparencia]`).
 *
 * - sem caminho, só o prefixo ou curinga (`/*`)  -> a própria URL do portal
 * - caso contrário -> URL do portal + caminho, exatamente como grafado na documentação
 *   (a variante em minúsculas é tentada pelo coletor se a grafia da documentação falhar).
 */
export function documentedUrl(portalUrl: string, caminho?: string): string {
  const base = new URL(portalUrl);
  base.hash = '';
  const root = base.href;
  const rest = (caminho ?? '').replace(/^\[[^\]]*\]/, '').trim();
  if (!rest || rest.includes('*')) return root;
  const prefix = `${base.origin}${base.pathname}`.replace(/\/+$/, '');
  const path = rest.startsWith('/') ? rest : `/${rest}`;
  return `${prefix}${path}`.replace(/\/+$/, '');
}
