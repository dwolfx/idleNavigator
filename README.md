# IdleNavigator

Navegador desktop dedicado para jogos idle/incrementais de navegador, 100% local e open-source.

## Recursos (MVP v1)

- **Sessões isoladas e persistentes:** cada instância usa sua própria partição Chromium (`persist:instance-<id>`), mantendo cookies, `localStorage` e logins separados entre contas.
- **Anti-throttling 24/7:** flags do Chromium + `backgroundThrottling: false` para manter loops, timers e farms rodando mesmo em segundo plano ou minimizado na bandeja do Windows.
- **Modo Foco e Modo Grid:** visualize uma conta em tela cheia ou várias lado a lado (Auto, 2x ou 3x colunas).
- **Controles por instância:** áudio/mute individual, zoom salvo (`50%` a `150%`), recarregar, voltar, auto-reload em caso de queda/erro, DevTools e limpeza de sessão (logout forçado).
- **Atalhos rápidos:**
  - `Ctrl + 1..9` — alterna entre instâncias
  - `Ctrl + G` — alterna entre Foco e Grid
  - `Ctrl + N` — adiciona nova instância

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build e execução local

```bash
npm run build
npm start
```

## Testes

```bash
npm test
```
