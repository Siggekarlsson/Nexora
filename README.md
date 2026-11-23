This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Integrations

All apps on the Integrations page live in `src/data/integrations.ts` (id, name, description, category, Composio toolkit slug and fallback logo). Connect starts a Composio sign-in and sends the browser to the app's own login page (Google, Microsoft, Slack, Meta and so on), then back to `/integrations?connected=<app>`. Status and Disconnect come from Composio. A card only says "Connected" when Composio (or Nexora's own Google OAuth, when Composio is off) reports a live connection.

Logos come from Composio first. If Composio has none, the card uses the Iconify icon from `src/data/logo-icons.json`, a bundled subset of the "logos" and "simple-icons" sets. If there is no icon either, it shows a neutral app icon. Rebuild that file with `scripts/build-logo-icons.mjs` when you add apps.

### Apps that show "Setup needed"

- **Base44**: Composio has no toolkit for it yet.
- **Brex**: Composio has no shared sign-in app for it, so it needs an auth config with your own Brex OAuth app in the Composio dashboard.
- **Other apps that need their own auth config**: Nexora picks these up from Composio's error when it creates a session, and the card then shows "Setup needed". On 2026-11-23 Brex was the only one. The live list for this deployment is in `GET /api/integrations/status`: every app with `"setup": true`.
- **Coming Soon** (greyed out, cannot be connected): Proton Mail, Google Forms, DocuSign, Amazon S3, iCloud Drive, Nextcloud, Obsidian, Evernote, Xero, Sage, PayPal, Expensify, Shopify, TikTok, WooCommerce, Zapier, PostgreSQL, Snowflake, n8n, Exa.

### Rekommenderat: Composio (en nyckel)

[Composio](https://composio.dev) sköter inloggningen mot Google med sina egna godkända appar, så du behöver ingen egen Google Cloud-app för Gmail och Google Drive (`src/lib/integrations/composio.ts`).

Shopify har ingen delad app hos Composio. Antingen använder du Nexoras egen Shopify-koppling (stegen nedan), eller så skapar du en Shopify auth config med din egen Shopify-app i Composio-dashboarden och lägger dess id i `COMPOSIO_SHOPIFY_AUTH_CONFIG_ID`.

1. Skapa ett gratis konto på [dashboard.composio.dev](https://dashboard.composio.dev).
2. Gå till **Settings → API Keys** och kopiera nyckeln.
3. I **Vercel → Project → Settings → Environment Variables**: lägg in `COMPOSIO_API_KEY` och `APP_URL=https://<din-sida>`. Gör sedan en **Redeploy**.
4. Klicka **Connect** på Gmail eller Google Drive i Nexora och logga in.

Samma nyckel kopplar alla appar på Integrations-sidan som har en Composio-toolkit. I chatten får agenterna Composios verktyg (`COMPOSIO_SEARCH_TOOLS` och `COMPOSIO_MULTI_EXECUTE_TOOL`) och kan läsa data från de appar som är kopplade. De kan inte skicka, posta, ändra eller radera något, eftersom sessionen stänger av verktyg märkta create, update och destructive. Om Composio saknar en färdig app för någon tjänst hoppas den över och kortet visar "Setup needed".

Varje webbläsare får ett slumpat användar-id i en httpOnly-cookie (`nx_uid`), och Composio håller den användarens kopplingar. När `COMPOSIO_API_KEY` finns används Composio; annars används de egna OAuth-apparna nedan.

When a chat message is about email, files/documents/reports or orders/products, the chat API reads the connected account (latest inbox messages, latest Drive files with the text of Google Docs and txt/md/csv files up to ~20,000 characters, or recent Shopify orders and products) and passes it to the AI as data, never as instructions.

### Alternativ: egna OAuth-appar

Tokens are stored encrypted in an httpOnly cookie per browser (`src/lib/integrations/vault.ts`).

| Integration | Environment variables | Redirect URI |
| --- | --- | --- |
| Gmail | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` | `<APP_URL>/api/integrations/gmail/callback` |
| Google Drive | same Google client as Gmail | `<APP_URL>/api/integrations/drive/callback` |
| Shopify | `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `APP_URL` | `<APP_URL>/api/integrations/shopify/callback` |

#### Google-nycklar (Gmail och Google Drive)

1. Gå till [console.cloud.google.com](https://console.cloud.google.com) och skapa ett projekt, t.ex. "Nexora".
2. Gå till **APIs & Services → Library** och aktivera **Gmail API** och **Google Drive API**.
3. Gå till **OAuth consent screen**: välj **External**, fyll i appnamn och e-post, och lägg till din egen Gmail som **Test user**.
4. Gå till **Credentials → Create credentials → OAuth client ID → Web application**. Lägg in båda redirect-URI:erna under **Authorized redirect URIs**:
   - `https://<din-sida>/api/integrations/gmail/callback`
   - `https://<din-sida>/api/integrations/drive/callback`
5. Kopiera **Client ID** och **Client secret**.
6. I **Vercel → Project → Settings → Environment Variables**: lägg in `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` och `APP_URL=https://<din-sida>` (din fasta adress, t.ex. `nexora-gilt-gamma.vercel.app`). Gör sedan en **Redeploy**.

#### Shopify

1. Skapa ett gratis konto på [dev.shopify.com](https://dev.shopify.com) och en dev store om du saknar butik.
2. Skapa en app. App URL: `https://<din-sida>`, redirect URL: `https://<din-sida>/api/integrations/shopify/callback`.
3. Lägg till scopes `read_orders` och `read_products` och släpp en version av appen.
4. Lägg in `SHOPIFY_API_KEY` (Client ID), `SHOPIFY_API_SECRET` (Client secret) och `APP_URL` i Vercel och gör en **Redeploy**.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
