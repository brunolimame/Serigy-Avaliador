import { createApp } from './app';

const port = Number(process.env.PORT ?? 3001);
// Por padrão escuta só em localhost: a API baixa URLs arbitrárias a pedido do usuário.
const host = process.env.HOST ?? '127.0.0.1';

createApp().listen(port, host, () => {
  console.log(`API do avaliador em http://${host}:${port}`);
});
