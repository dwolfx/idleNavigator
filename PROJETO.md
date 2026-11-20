# IdleNavigator — Memória do Projeto & Próximos Passos

> Documento de contexto para continuidade em novas sessões dentro da pasta `C:\Sites\idle`.  
> Repositório GitHub: https://github.com/dwolfx/idleNavigator.git

---

## 1. O que já foi feito

### Arquitetura e Decisão Técnica (v1 → v2)
- **Tentativa v1 (descartada):** WebViews embutidas no Electron (`WebContentsView` com `persist:instance-<id>`).
  - **Por que mudamos:** tanto o **Google OAuth** quanto o **Cloudflare Turnstile** bloqueiam WebViews embutidas do Electron por política de segurança.
- **Arquitetura atual (v2 — Orquestrador de Navegador Oficial):**
  - O app Electron funciona como um **painel/deck leve** para gerenciar instâncias.
  - Cada instância abre o navegador Chromium oficial instalado no Windows (**Microsoft Edge**, **Google Chrome** ou **Brave**, detectados automaticamente).
  - Usa **1 único `--user-data-dir`** em `%APPDATA%\idle-navigator\browser-profiles\<navegador>` combinado com **`--profile-directory="slot-<id>"`** por instância:
    - Isola 100% cookies, `localStorage` e logins entre contas.
    - Compartilha um único processo de GPU e rede entre as janelas (economiza RAM/CPU).
    - Abre em modo `--app=<url>` (janela limpa, sem barra de abas/endereço).
    - Aplica flags de **anti-throttling 24/7** (`--disable-background-timer-throttling`, `--disable-renderer-backgrounding`, `--disable-backgrounding-occluded-windows`).

### Funcionalidades entregues
- [x] CRUD completo de instâncias (criar, editar, remover) com validação/normalização de URL ([src/core/url.ts](src/core/url.ts)).
- [x] Persistência local de estado em JSON ([electron/store.ts](electron/store.ts)).
- [x] Detecção automática de Edge, Chrome e Brave instalados no Windows ([electron/browserLauncher.ts](electron/browserLauncher.ts)).
- [x] Abertura individual de instância ou abertura em lote **"Abrir todas em Grid"** com alinhamento real via Win32 (`SetWindowPos` + `SetProcessDPIAware` em [electron/windowArranger.ts](electron/windowArranger.ts)).
- [x] Botão **"Organizar Grid"** (no painel e na bandeja) para realinhar janelas já abertas do IdleNavigator em 1 clique, sem tocar no navegador pessoal.
- [x] Empacotamento Windows (`.exe` portátil e instalador NSIS) configurado com `electron-builder` (`npm run dist`) e ícone próprio em `build/icon.png`.
- [x] Limpeza de sessão/cookies individual (logout forçado removendo apenas o `slot-<id>`).
- [x] Minimizar para a bandeja do Windows (System Tray) com menu rápido.
- [x] Atalhos de teclado: `Ctrl + N` (nova instância) e `Ctrl + Enter` (abrir todas em Grid).
- [x] Testes unitários em PT-BR com Vitest ([tests/url.test.ts](tests/url.test.ts) e [tests/layout.test.ts](tests/layout.test.ts)).

### Notas de ambiente importantes (Windows / Node 26)
- No Node v26, o `extract-zip` do `postinstall` do Electron pode sair silenciosamente sem extrair `electron.exe`. O binário já está extraído em `node_modules/electron/dist/electron.exe` com `path.txt = electron.exe`.
- Ao lançar o Electron via PowerShell/automação em background, usar `Start-Process` para não herdar `SW_HIDE`.

---

## 2. O que falta fazer (Backlog priorizado)

### Curto prazo (prioridade alta)
- [x] **Validar em uso real:** confirmado rodando com Edge oficial, passando Google OAuth e Cloudflare Turnstile.
- [x] **Gerar executável `.exe` para Windows (`electron-builder`):** configurado `npm run dist` gerando `release/IdleNavigator-Portable.exe` e instalador NSIS.
- [x] **Botão "Organizar Grid" em janelas já abertas:** implementado via Win32 `SetWindowPos` filtrando apenas janelas do `--user-data-dir` do IdleNavigator.

### Médio prazo (evoluções úteis, sem feature creep)
- [ ] **Workspaces / Grupos:** separar conjuntos de contas por jogo (ex: "Jogo A — 3 contas", "Jogo B — 2 contas") para abrir cada grupo com 1 clique.
- [ ] **Indicador de instâncias abertas + botão "Fechar todas":** rastrear quais instâncias estão rodando e permitir encerrar apenas as janelas lançadas pelo IdleNavigator (filtrando pelo `--user-data-dir` exclusivo, sem tocar no navegador pessoal).
- [ ] **Testes adicionais:** cobrir `buildLaunchArgs` e `StateStore` com testes unitários em PT-BR.

---

## 3. Estrutura atual de arquivos

```text
C:\Sites\idle\
├── electron/
│   ├── main.ts            # Janela principal do deck, IPC e System Tray
│   ├── preload.ts         # Bridge segura (contextBridge)
│   ├── store.ts           # Persistência JSON local
│   └── browserLauncher.ts # Detecção de navegador, args anti-throttling e spawn
├── src/
│   ├── core/
│   │   ├── types.ts       # Tipos compartilhados
│   │   ├── url.ts         # Normalização e validação de URL
│   │   └── layout.ts      # Cálculo de colunas e retângulos do Grid
│   ├── components/
│   │   ├── InstanceCard.tsx
│   │   └── InstanceModal.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css          # Tailwind v4 + Tokens CSS semânticos
├── tests/
│   ├── url.test.ts
│   └── layout.test.ts
├── PROJETO.md             # Este documento de contexto
└── README.md
```
