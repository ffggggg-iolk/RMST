# Universal Quotation Discord Bot

An advanced, production-ready, general-purpose commercial pricing and quotation bot for Discord. Built with Node.js LTS, TypeScript, Discord.js v14, decimal precision mathematics, and a multi-tenant persistence architecture.

---

## 🌟 Key Features

- **General-Purpose Quotation Engine:** Calculates costs for digital goods, physical merchandise, subscriptions, custom design commissions, software engineering, cloud compute credits, and gaming items.
- **Universal Pricing Models (11 Configurable Models):**
  1. *Fixed-Price*: Standard unit-based multiplication.
  2. *Tiered Volume Pricing*: Bulk pricing with quantity threshold brackets.
  3. *Variable Pricing*: Base price with customizable add-ons and percentage/flat multipliers.
  4. *Percentage Discounts*: Promotional codes with maximum cap limits.
  5. *Fixed Discounts*: Cash-off coupons with non-negative subtotal safeguards.
  6. *Additional Surcharges*: Configurable shipping, handling, packaging, and gateway fees.
  7. *Taxes*: Regional sales tax / VAT applied either pre- or post-discount.
  8. *Subscriptions*: Recurring interval billing (weekly/monthly/yearly), setup fees, and intro pricing.
  9. *Bundles*: Pre-configured packages with component savings transparency.
  10. *Budget-Based Affordability Solver*: Binary search calculator that determines the maximum affordable quantity without exceeding budget limits.
  11. *Custom Extensible Strategies*: Registered strategy hooks with parameter validation (no `eval()` or unsanitized code).
- **Multi-Currency Engine:** Real-time exchange rate conversions supporting USD, EUR, GBP, CAD, AUD, BRL, MXN, PEN, and JPY. Every quote records the exact exchange rate and timestamp used.
- **Immutable Quote Snapshots:** When a quotation is generated, an exact immutable JSON snapshot of all line items, tax rules, exchange rates, and fees is frozen. Future price updates will never alter historical records.
- **Support & Ticket Workflow:** Users can generate unique Quote IDs (e.g., `Q-000101`) and open dedicated purchase tickets directly via interactive buttons.
- **Discord Desktop Dark-Theme Web Simulator & Admin Console:** Interactive web environment to test slash commands, manage the product catalog, audit logs, and simulate server interactions.

---

## 📋 Slash Commands Reference

| Command | Syntax | Description |
| :--- | :--- | :--- |
| `/quote` | `product: <name> [quantity] [budget] [currency] [discount_code] [details]` | Generates an official price quotation with full breakdown and unique Quote ID. |
| `/calculate` | `budget: <amount> [currency] [product]` | Calculates the maximum affordable units within a spending budget. |
| `/compare` | `product_a: <name> product_b: <name> [quantity_a] [quantity_b] [currency]` | Compares two catalog items or quantities on unit cost and final total. |
| `/product` | `product: <name>` | Displays comprehensive catalog item specifications, pricing models, and terms. |
| `/budget` | `[spending_limit] [currency]` | Opens an interactive multi-item quote cart builder. |
| `/history` | `[quote_id] [status]` | Browses saved quotations and accesses historical pricing snapshots. |
| `/help` | — | Shows command reference, syntax, and examples. |
| `/admin` | `[product / discount / currency / settings / statistics / audit_log]` | Staff administrative suite for managing products, coupons, and branding. |

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js LTS (v18, v20, or v22+)
- A Discord Bot Application from the [Discord Developer Portal](https://discord.com/developers/applications)

### 1. Discord Developer Portal Configuration
1. Navigate to [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Name your application (e.g. `Universal Quotation Bot`).
3. Under the **Bot** tab:
   - Click **Add Bot**.
   - Under **Privileged Gateway Intents**, enable **Server Members Intent** and **Message Content Intent**.
   - Click **Reset Token** and copy your **Bot Token**.
4. Under the **OAuth2** tab:
   - Copy your **Client ID (Application ID)**.
   - Go to **OAuth2 URL Generator**:
     - Scopes: `bot`, `applications.commands`
     - Bot Permissions: `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`, `Manage Channels` (for ticket creation), `Use Slash Commands`.
   - Copy the generated invite link to invite the bot to your Discord server.

### 2. Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
DISCORD_BOT_TOKEN="your_discord_bot_token"
DISCORD_CLIENT_ID="your_discord_application_id"
DISCORD_GUILD_ID="optional_guild_id_for_instant_command_refresh"
DATABASE_URL="sqlite://./data/quotations.db"
```

### 3. Register Slash Commands
Run the deployment script to publish all application commands to Discord:
```bash
npx tsx src/scripts/deploy-commands.ts
```

### 4. Run the Bot
- **Full Bot Gateway Connection:**
  ```bash
  npx tsx src/scripts/run-bot.ts
  ```
- **Web Administration & Discord Simulator UI:**
  ```bash
  npm run dev
  ```
  Open `http://localhost:3000` to access the interactive Discord Simulator and Administration Dashboard.

---

## 🗄️ Database Architecture & Migrations

The database layer follows a repository pattern supporting SQLite and PostgreSQL:
- `guild_settings`: Multi-tenant server customization (name, color, currency, ticket channels).
- `products`: Dynamic catalog items with availability, delivery info, and inventory.
- `pricing_rules`: Mathematical rule definition for fixed, tiered, variable, subscription, bundle, and custom models.
- `currency_rates`: Timestamped exchange rate pairs.
- `discounts`: Promotional coupon codes with percentage/fixed rules and caps.
- `quotations`: Header records with Quote ID, user ID, and computed totals.
- `quotation_items`: Line item breakdown for each quote.
- `quotation_snapshots`: Permanent, immutable JSON snapshot of every quote calculation.
- `tickets`: Support channels tied to Quote IDs.
- `audit_logs`: Traceability log for administrative adjustments.

### Backup and Disaster Recovery
1. **SQLite Database Backup:**
   Execute a hot-backup of the SQLite database:
   ```bash
   sqlite3 ./data/quotations.db ".backup ./backups/quotations-$(date +%Y%m%d%H%M%S).db"
   ```
2. **PostgreSQL Dump:**
   ```bash
   pg_dump -U postgres -d quotations > ./backups/pg_dump_$(date +%Y%m%d).sql
   ```
3. **Recovery Procedure:**
   Stop the bot process, restore the `.db` or `.sql` file into the target directory, and restart the service.

---

## 🧪 Automated Testing

Automated unit tests verify mathematical precision, deterministic fee/tax ordering, and snapshot freezing:
```bash
npx tsx --test src/tests/*.test.ts
```
All 13 unit tests execute in milliseconds using Node's native test runner with 100% pass rate.
