import { describe, expect, it } from 'vitest';
import { splitMessage } from '../../web/src/message';

describe('splitMessage', () => {
  it('separa os motivos unidos por "; "', () => {
    expect(splitMessage('Item encontrado, mas o schema não confere: encontrado "a"; esperado "b". Valor inválido; serigyEmpty declarado')).toEqual([
      'Item encontrado, mas o schema não confere: encontrado "a"',
      'esperado "b". Valor inválido',
      'serigyEmpty declarado',
    ]);
  });
  it('não separa um ";" dentro de aspas nem sem espaço depois', () => {
    expect(splitMessage('serigyEmpty declarado — motivo: "sem dados; aguardando"; outro')).toEqual([
      'serigyEmpty declarado — motivo: "sem dados; aguardando"',
      'outro',
    ]);
    expect(splitMessage('a;b')).toEqual(['a;b']);
  });
  it('mensagem simples ou vazia', () => {
    expect(splitMessage('Encontrado (1 ocorrência(s))')).toEqual(['Encontrado (1 ocorrência(s))']);
    expect(splitMessage('')).toEqual([]);
  });
});
