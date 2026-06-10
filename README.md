# WhatsApp-Telegram Bot

Bot do WhatsApp que gerencia downloads do Telegram, compressão/extração de arquivos e verificação de integridade. Implementado com Clean Architecture e Domain-Driven Design.

## Funcionalidades

- 📥 Download de arquivos do Telegram via interface WhatsApp
- 📦 Compressão e extração de arquivos ZIP/RAR
- ✅ Verificação de integridade de pacotes
- 🛑 Comando `/stop` para cancelar downloads em andamento
- 🗑️ Comando `/delete` com confirmação para remover downloads
- 🔔 Notificações em tempo real via WhatsApp
- 🗄️ Persistência em PostgreSQL

## Arquitetura

```
src/
├── core/          # Primitivas compartilhadas (Either, entidades base)
├── domain/        # Lógica de negócio por bounded context
│   ├── download/  # Casos de uso de download do Telegram
│   ├── notify/    # Envio de notificações WhatsApp
│   ├── archives/  # Compressão/extração ZIP/RAR
│   ├── checker/   # Validação de arquivos
│   ├── chat/      # Gerenciamento de chats
│   └── shared/    # Cross-cutting concerns
├── events/        # EventDispatcher (pub/sub)
└── infra/         # Adaptadores externos
    ├── whatsapp/  # Conexão Baileys + comandos
    ├── database/  # Prisma + PostgreSQL
    └── repositories/ # Implementações concretas
```

## Pré-requisitos

- **Node.js** 20+
- **PostgreSQL** 15+
- **pnpm** (recomendado) ou npm
- **TDLib** (biblioteca nativa do Telegram)

### Instalação do TDLib

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y cmake g++ git
git clone https://github.com/tdlib/td.git
cd td
git checkout v1.8.7
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
cmake --build . -- -j$(nproc)
sudo cmake --install .
```

**macOS:**
```bash
brew install tdlib
```

## Setup Rápido

1. **Clone e instale dependências:**
```bash
git clone <seu-repo>
cd logs
pnpm install
```

2. **Configure o banco de dados:**
```bash
docker compose up -d  # ou PostgreSQL local
npx prisma generate
npx prisma db push
```

3. **Configure variáveis de ambiente:**
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

4. **Execute o bot:**
```bash
pnpm dev
```

5. **Autenticação WhatsApp:**
   - Escaneie o QR Code que aparecer no terminal
   - Sessões são salvas em `sessions-bot/` (não versionado)

## Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `WHATSAPP_SESSION_PATH` | Caminho para sessões Baileys | Não (padrão: `./sessions-bot`) |
| `DATABASE_URL` | Conexão PostgreSQL | **Sim** |
| `TELEGRAM_API_ID` | API ID do Telegram | **Sim** |
| `TELEGRAM_API_HASH` | API Hash do Telegram | **Sim** |
| `TELEGRAM_SESSION_PATH` | Caminho para sessões TDLib | Não (padrão: `./.tdlib`) |
| `LOG_LEVEL` | Nível de log (info/debug/error) | Não |
| `PORT` | Porta do servidor (se applicable) | Não |

## Comandos WhatsApp

- `/start` - Inicia interação com o bot
- `/stop` - Cancela download ou verificação em andamento
- `/delete` - Remove downloads com confirmação em duas etapas
- `/status` - Mostra downloads ativos (se implementado)

## Comandos de Desenvolvimento

```bash
pnpm dev                # Servidor com hot reload
pnpm test:unit          # Testes unitários (*.spec.ts)
pnpm test:e2e           # Testes e2e sequenciais
pnpm fix                # Auto-fix com Biome
pnpm lint               # Lint manual
npx prisma studio        # Interface do banco
```

## Deploy

### Requisitos de Produção

- Servidor com Node.js 20+
- PostgreSQL 15+ (recomendado usar RDS ou managed DB)
- TDLib instalado no sistema
- Process manager (PM2, systemd, Docker)

### Docker (recomendado)

```dockerfile
# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run
FROM node:20-alpine
RUN apk add --no-cache tdlib
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/infra/server.js"]
```

### Deploy com PM2

```bash
# Build
pnpm build

# Start
pm2 start dist/infra/server.js \
  --name whatsapp-telegram-bot \
  --env production

# Save
pm2 save
pm2 startup
```

## Segurança

**IMPORTANTE:**

- ❌ **Nunca** commitar arquivos em:
  - `sessions-bot/` (credenciais WhatsApp)
  - `downloads/` (dados baixados)
  - `.tdlib/` (dados Telegram)
  - `.env` (variáveis sensíveis)

- ✅ Use `.gitignore` configurado
- ✅ Rotacione credenciais se vazarem
- ✅ Use PostgreSQL com SSL em produção
- ✅ Restrinja IPs que podem acessar o bot

## Estrutura de Diretórios

```
.
├── src/
│   ├── core/
│   ├── domain/
│   ├── events/
│   └── infra/
├── downloads/          # Ignorado - arquivos temporários
├── sessions-bot/       # Ignorado - sessões Baileys
├── .tdlib/            # Ignorado - sessões TDLib
├── prisma/            # Schema e migrations
├── tests/             # Testes e2e
├── generated/         # Ignorado - Prisma Client
└── node_modules/      # Ignorado
```

## Troubleshooting

### TDLib não encontrado
```bash
ldconfig  # Atualiza cache de bibliotecas
```

### Erro de autenticação WhatsApp
- Delete `sessions-bot/` e reinicie para novo QR Code
- Verifique se número está verificado no WhatsApp

### Erro no PostgreSQL
```bash
docker compose logs postgres
npx prisma db push  # Recria schema
```

### Memory leak em downloads longos
O sistema usa polling de 500ms para detectar abort. Considere ajustar se necessário.

---

**Clean Architecture** | **Domain-Driven Design** | **TypeScript** | **Prisma**
