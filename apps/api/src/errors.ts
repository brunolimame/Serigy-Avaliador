/** Erro de regra de negócio com código HTTP; `extra` vai junto no corpo JSON da resposta (ex.: `id`, `problemas`). */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}
