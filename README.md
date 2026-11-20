# IdleNavigator

Gerenciador desktop para jogos idle/incrementais de navegador com perfis isolados, modo app limpo e anti-throttling 24/7 — 100% local e open-source.

## Como funciona

O **IdleNavigator** orquestra instâncias reais do seu navegador Chromium oficial instalado no Windows (**Microsoft Edge**, **Google Chrome** ou **Brave**):

- **1 `--user-data-dir` + N `--profile-directory`:** todas as contas compartilham um único processo de GPU/rede (menor consumo de RAM), mantendo **cookies, `localStorage` e logins 100% isolados e persistentes**.
- **Compatível com Google OAuth e Cloudflare Turnstile:** por usar o navegador oficial do sistema (e não uma WebView embutida), verificações anti-bot e login com Google funcionam normalmente.
- **Modo `--app`:** cada jogo abre em janela limpa, sem barra de abas ou de endereço.
- **Anti-throttling 24/7:** aplica `--disable-background-timer-throttling`, `--disable-renderer-backgrounding` e `--disable-backgrounding-occluded-windows`.
- **Abrir todas em Grid:** calcula automaticamente a área útil do monitor e abre todas as instâncias lado a lado (`Auto`, `2 col` ou `3 col`).

## Atalhos

- `Ctrl + N` — criar nova instância
- `Ctrl + Enter` — abrir todas as instâncias em Grid

## Desenvolvimento e uso

```bash
npm install
npm run build
npm start
```

## Gerar executável Windows (`.exe`)

```bash
npm run dist
```

Os arquivos gerados ficam em `release/` (`IdleNavigator-Portable.exe` e o instalador NSIS).

## Testes

```bash
npm test
```
