import type { CatalogResponse, EvaluationRequest, EvaluationResult, PoderInfo, Portal, PortalInput, StreamEvent } from '@serigy/shared';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Erro ${res.status}`);
  }
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

/** Baixa um texto como arquivo no navegador. */
export function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
