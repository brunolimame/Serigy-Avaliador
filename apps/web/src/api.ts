import type {
  AvaliacaoDetalhe,
  AvaliacaoResumo,
  CatalogResponse,
  EvaluationRequest,
  EvaluationResult,
  PoderInfo,
  Portal,
  PortalInput,
  SettingsResponse,
  SettingValue,
  StreamEvent,
} from '@serigy/shared';

/** Erro da API; `extra` guarda campos adicionais do corpo (ex.: `id` da duplicata, `problemas` da importação). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly extra: { id?: number; problemas?: string[] } = {},
  ) {
    super(message);
  }
}

async function fail(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as ({ error?: string } & ApiError['extra']) | null;
  throw new ApiError(body?.error ?? `Erro ${res.status}`, res.status, { id: body?.id, problemas: body?.problemas });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) return fail(res);
  return (await res.json()) as T;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  portais: {
    list: () => request<Portal[]>('/api/portais'),
    create: (input: PortalInput) => request<Portal>('/api/portais', json(input)),
    update: (id: number, input: PortalInput) => request<Portal>(`/api/portais/${id}`, { ...json(input), method: 'PUT' }),
    async remove(id: number): Promise<void> {
      const res = await fetch(`/api/portais/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
    },
  },
  configuracoes: {
    get: () => request<SettingsResponse>('/api/configuracoes'),
    set: (chave: string, valor: SettingValue) =>
      request<SettingsResponse>(`/api/configuracoes/${encodeURIComponent(chave)}`, { ...json({ valor }), method: 'PUT' }),
    reset: (chave?: string) =>
      request<SettingsResponse>(chave ? `/api/configuracoes/${encodeURIComponent(chave)}` : '/api/configuracoes', { method: 'DELETE' }),
  },
  avaliacoes: {
    list: () => request<AvaliacaoResumo[]>('/api/avaliacoes'),
    get: (id: number) => request<AvaliacaoDetalhe>(`/api/avaliacoes/${id}`),
    save: (resultado: EvaluationResult) => request<AvaliacaoResumo>('/api/avaliacoes', json(resultado)),
    /** `arquivo` é o conteúdo JSON já lido do arquivo escolhido; a validação é toda do servidor. */
    import: (arquivo: unknown) => request<AvaliacaoResumo>('/api/avaliacoes/importar', json(arquivo)),
    async remove(id: number): Promise<void> {
      const res = await fetch(`/api/avaliacoes/${id}`, { method: 'DELETE' });
      if (!res.ok) await fail(res);
    },
    removeAll: () => request<{ removidas: number }>('/api/avaliacoes?confirmar=sim', { method: 'DELETE' }),
    /** Baixa o arquivo JSON importável do resultado atual (salvo ou não). */
    async exportCurrent(resultado: EvaluationResult): Promise<void> {
      const res = await fetch('/api/avaliacoes/exportar', json(resultado));
      if (!res.ok) await fail(res);
      downloadBlob(fileNameOf(res) ?? 'avaliacao.json', await res.blob());
    },
    /** Baixa uma avaliação do histórico (`json` importável ou `md` relatório). */
    async exportSaved(id: number, formato: 'json' | 'md'): Promise<void> {
      const res = await fetch(`/api/avaliacoes/${id}/exportar?formato=${formato}`);
      if (!res.ok) await fail(res);
      downloadBlob(fileNameOf(res) ?? `avaliacao-${id}.${formato}`, await res.blob());
    },
  },
  poderes: () => request<PoderInfo[]>('/api/poderes'),
  catalog: (poder: string) => request<CatalogResponse>(`/api/catalog?poder=${encodeURIComponent(poder)}`),
  evaluate: (req: EvaluationRequest) => request<EvaluationResult>('/api/evaluate', json(req)),
  /**
   * Avaliação em streaming (NDJSON): chama `onEvent` a cada evento, na ordem em que chegam.
   * Erros de validação (HTTP 4xx) lançam; falhas durante a análise chegam como evento `error`.
   */
  async evaluateStream(req: EvaluationRequest, onEvent: (event: StreamEvent) => void, signal?: AbortSignal): Promise<void> {
    const res = await fetch('/api/evaluate/stream', { ...json(req), signal });
    if (!res.ok || !res.body) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `Erro ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const LF = String.fromCharCode(10);
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf(LF)) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (line) onEvent(JSON.parse(line) as StreamEvent);
      }
    }
  },
  async reportMarkdown(result: EvaluationResult): Promise<string> {
    const res = await fetch('/api/report', json(result));
    if (!res.ok) throw new Error(`Erro ${res.status} ao gerar o relatório`);
    return res.text();
  },
};

function fileNameOf(res: Response): string | undefined {
  return /filename="?([^";]+)"?/i.exec(res.headers.get('content-disposition') ?? '')?.[1];
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Baixa um texto como arquivo no navegador. */
export function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
