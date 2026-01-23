# XpenseLab - Personal Finance Tracker

> A modern, intelligent application for managing your personal finances with AI-powered categorization, real-time monitoring, and comprehensive financial tracking.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.8-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

Welcome to XpenseLab, a modern and intelligent application for managing your personal finances. This application is built with a powerful stack including Next.js, Firebase, and Genkit, providing a robust platform for tracking income, expenses, budgets, and more.

For a detailed technical overview, project structure, and feature breakdown, please see the [**Application Guide**](./docs/APPLICATION_GUIDE.md).

## 📋 Table of Contents

- [Core Features](#-core-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Runtime UI/UX Monitoring](#-runtime-uiux-monitoring)
- [Browser Support](#-browser-support)
- [Deployment](#-deployment)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Documentation](#-documentation)
- [Support](#-support)

## ✨ Core Features

### Financial Management
- **Dashboard:** An at-a-glance overview of your financial health, including recent transactions, income vs. expense charts, and key financial metrics
- **Transaction Management:** Add, view, filter, and manage your income and expenses with detailed information
- **Recurring Transactions:** Set up recurring income and expenses that automatically log on schedule
- **Budgeting:** Set monthly budgets and track your spending progress with visual progress indicators
- **Loans & EMIs:** Track loans, calculate EMIs, and monitor repayment schedules

### AI-Powered Features (Premium)
- **AI Expense Categorization:** Automatically categorize expenses using Google Gemini AI
- **AI Budgeting Assistant:** Get personalized budget recommendations and spending insights
- **AI Financial Insights:** Receive intelligent financial analysis and forecasting
- **Predictive Forecasting:** AI-powered predictions for future spending patterns

### Organization & Sharing
- **Custom Categories:** Create and customize your own income and expense categories with unique icons
- **Expense Splitting:** Create groups with friends or family to easily split shared expenses
- **Debt Tracking:** Log and manage one-on-one debts and track who owes whom
- **Loans Management:** Track loans, EMIs, and repayment schedules

### Security & Privacy
- **Client-Side Encryption:** Optional end-to-end encryption for your financial data
- **Recovery Codes:** Secure backup codes for encryption recovery
- **GDPR Compliant:** Full compliance with GDPR data protection regulations
- **Secure Authentication:** Firebase Authentication with Google and GitHub OAuth providers

### Integrations & Data
- **Data Import/Export:** Import transactions from CSV/XLSX files and export financial reports
- **Receipt Scanning:** (Premium) Scan receipts to automatically extract expense information

### Premium Features
- **Subscription Management:** Stripe-powered premium subscriptions ($10/month)
- **Premium Badge:** Visual indicators for premium users
- **Advanced AI Features:** All AI-powered features require premium subscription
- **Priority Support:** Enhanced support for premium users

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
- **UI Library:** [React 18](https://react.dev/), [TypeScript 5.9](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), [ShadCN/UI](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)

### Backend & Services
- **Backend:** [Firebase](https://firebase.google.com/)
  - **Authentication:** Firebase Auth (Google, GitHub OAuth)
  - **Database:** Cloud Firestore (NoSQL)
  - **Hosting:** Firebase App Hosting
  - **Admin SDK:** Firebase Admin (server-side operations)
- **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) with Google Gemini
- **Payments:** [Stripe](https://stripe.com/) (Checkout Sessions, Webhooks)

### Development & Monitoring
- **Monitoring:** Web Vitals, Error Tracking, Network Monitoring, UI/UX Detection
- **Build Tool:** Turbopack (Next.js)
- **Package Manager:** npm
- **Code Quality:** ESLint, TypeScript strict mode

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 (recommended: LTS version)
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- **Firebase CLI** (for deployment)
- **Git** (for version control)

## 🚀 Getting Started

The application is designed to be run within the Firebase Studio environment.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xpenselab
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in your actual values. 
   
   **📖 See [`.env.example`](./.env.example) for comprehensive instructions, all available variables, and detailed setup guides.**
   
   **Quick Start - Minimum Required:**
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
   - `NEXT_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key  
   - `GOOGLE_GENAI_API_KEY` - For AI features (categorization, insights, forecasting)
   
   **For Premium Subscriptions:**
   - `STRIPE_SECRET_KEY` - Stripe secret key (server-side)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (public)
   - `STRIPE_PRICE_ID` - Stripe price ID for $10/month subscription
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
   - See [Stripe Integration Guide](./docs/integrations/STRIPE_INTEGRATION.md) for complete setup
   

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:9002](http://localhost:9002)

For more in-depth information, refer to the [**Application Guide**](./docs/APPLICATION_GUIDE.md).

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack on port 9002 |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run genkit:dev` | Start Genkit AI development server |
| `npm run genkit:watch` | Start Genkit with watch mode |

## 📊 Runtime UI/UX Monitoring

XpenseLab includes comprehensive runtime monitoring to detect UI/UX issues across all responsive screen sizes. The monitoring system is production-ready, secure, and optimized for performance.

### Features

- **Web Vitals Tracking**: Automatically tracks Core Web Vitals (CLS, LCP, INP, FCP, TTFB) for performance monitoring
- **Error Detection**: React Error Boundary + global JavaScript error handlers catch runtime errors
- **Network Monitoring**: Tracks API calls, detects slow/failed requests, and monitors network performance
- **UI/UX Checks**: Detects touch target sizes, text overlap, viewport issues, and accessibility violations (development only)
- **Dev Dashboard**: Visual dashboard in development mode for real-time issue visualization

### What's Monitored

✅ **Production (Always Enabled):**
- Core Web Vitals metrics
- React component errors
- JavaScript runtime errors
- Network request performance
- Unhandled promise rejections

🔧 **Development Only:**
- Touch target size validation
- Text overlap detection
- Viewport overflow detection
- Accessibility checks
- Visual dashboard with issue highlighting

### Security & Privacy

- **URL Sanitization**: All URLs are automatically sanitized to remove sensitive query parameters
- **No Sensitive Data**: No tokens, API keys, or passwords are logged or stored
- **Production-Safe**: Generic error messages in production, detailed logs only in development
- **Disable Option**: Can be completely disabled via `NEXT_PUBLIC_DISABLE_MONITORING=true`

### Usage

**Development Mode:**
- Open browser DevTools Console to see Web Vitals and issues
- Click the floating dashboard button (bottom-right) to view real-time metrics
- Resize browser window to test responsive breakpoints

**Production Mode:**
- Monitoring runs silently in the background
- Ready for integration with Firebase Performance Monitoring or Sentry
- No console logs or performance impact

### Documentation

**Note:** Runtime monitoring features are built into the application. See the codebase for implementation details.

### Integration

The monitoring system is ready to integrate with:
- **Firebase Performance Monitoring** - Enable in Firebase Console
- **Firebase Crashlytics** - For error tracking
- **Sentry** - Alternative error tracking solution
- **Google Analytics** - For Web Vitals reporting

See the [Application Guide](./docs/APPLICATION_GUIDE.md) for monitoring integration details.

## 🌐 Browser Support

XpenseLab supports all modern browsers:

- ✅ Chrome/Edge (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Opera (latest 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note:** Internet Explorer is not supported.

## 🚀 Deployment

### Firebase App Hosting

XpenseLab is deployed using Firebase App Hosting, which automatically builds and deploys from your GitHub repository.

1. **Configure Firebase App Hosting**
   - Ensure `apphosting.yaml` is configured correctly
   - Set up GitHub integration in Firebase Console

2. **Set environment variables and secrets**
   
   **For plain values (public variables):**
   ```bash
   # These can be set directly in apphosting.yaml or via Firebase Console
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-3845013162-4f4cd
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
   ```
   
   **For secrets (sensitive values):**
   ```bash
   # Use Firebase CLI to set secrets
   npx firebase-tools apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY
   npx firebase-tools apphosting:secrets:set GOOGLE_GENAI_API_KEY
   npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY
   npx firebase-tools apphosting:secrets:set STRIPE_PRICE_ID
   npx firebase-tools apphosting:secrets:set STRIPE_WEBHOOK_SECRET
   
   # Grant backend access to secrets
   npx firebase-tools apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_API_KEY,GOOGLE_GENAI_API_KEY,STRIPE_SECRET_KEY,STRIPE_PRICE_ID,STRIPE_WEBHOOK_SECRET --backend=studio
   ```
   
   See [docs/setup/FIREBASE_APPHOSTING_COMMANDS.md](./docs/setup/FIREBASE_APPHOSTING_COMMANDS.md) for detailed instructions.

3. **Deploy**
   - Push to your main branch - Firebase App Hosting automatically deploys
   - Or manually trigger: `firebase apphosting:backends:rollout --backend=studio`

4. **Configure Stripe Webhook**
   - Set webhook endpoint: `https://your-domain.com/api/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy webhook signing secret and set as `STRIPE_WEBHOOK_SECRET` secret

### Environment Variables for Production

**Required:**
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key (set as secret)
- `GOOGLE_GENAI_API_KEY` - Google Generative AI API key (set as secret)

**For Premium Features:**
- `STRIPE_SECRET_KEY` - Stripe secret key (set as secret)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (can be value)
- `STRIPE_PRICE_ID` - Stripe price ID (set as secret)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (set as secret)

**Optional:**
- `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` - For Firebase App Check
- `NEXT_PUBLIC_DISABLE_MONITORING` - Disable runtime monitoring

## 🔒 Security

### Data Protection

- **Client-Side Encryption**: Optional end-to-end encryption for financial data using AES-256
- **Recovery Codes**: Secure backup codes for encryption key recovery
- **Authentication**: Secure authentication via Firebase Auth (Google, GitHub OAuth)
- **API Security**: All sensitive API keys are server-side only (never exposed to browser)
- **Monitoring**: Runtime monitoring sanitizes URLs and never logs sensitive data
- **Firestore Security Rules**: Comprehensive security rules ensure users can only access their own data

### Premium Subscription Security

- **Stripe Integration**: Secure payment processing via Stripe Checkout
- **Webhook Verification**: All Stripe webhooks are cryptographically verified
- **Server-Side Processing**: Payment verification happens server-side only
- **Firebase Admin SDK**: Secure server-side operations for user tier updates

### Best Practices

- **Never commit `.env` files** to version control (already in `.gitignore`)
- **Use secrets for sensitive values** in Firebase App Hosting (not plain values)
- **Rotate API keys regularly**, especially if exposed in client-side code
- **Use test keys for development**, production keys only in production
- **Regularly update dependencies**: `npm audit` and `npm update`
- **Enable Firebase App Check** for production with reCAPTCHA v3
- **Review Firebase Security Rules** regularly (`firestore.rules`)
- **Monitor webhook events** in Stripe Dashboard for payment issues

### Environment Variable Security

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser - only use for public keys
- Server-side variables (no prefix) are never exposed to the client
- Use Firebase App Hosting secrets for all sensitive values
- See [`.env.example`](./.env.example) for security best practices

### Reporting Security Issues

If you discover a security vulnerability, please email security@xpenselab.com (or your security contact) instead of using the issue tracker.

## 🐛 Troubleshooting

### Common Issues

**Issue: Port 9002 already in use**
```bash
# Solution: Use a different port
npm run dev -- -p 3000
```

**Issue: Firebase connection errors**
- Verify `.env` file has correct Firebase configuration
- Check Firebase Console for project status
- Ensure Firebase App Check is properly configured

**Issue: Genkit AI not working**
- Verify `GOOGLE_GENAI_API_KEY` or `GEMINI_API_KEY` is set
- Check API key permissions in Google Cloud Console
- Review Genkit logs: `npm run genkit:dev`

**Issue: Build fails**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Issue: Type errors**
```bash
# Run type checking
npm run typecheck
```

### Getting Help

- Check the [Application Guide](./docs/APPLICATION_GUIDE.md) for detailed documentation
- Review the [Documentation Index](./docs/README.md) for all available guides
- Check existing GitHub issues
- Create a new issue with:
  - Description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser/OS information
  - Error messages/logs

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed
4. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules (run `npm run lint`)
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused

## 📚 Documentation

**📖 [Documentation Index](./docs/README.md)** - Complete documentation index organized by category

### Quick Links

**Setup & Configuration:**
- **[Environment Variables](./.env.example)** - Comprehensive environment variable setup guide
- **[Firebase App Hosting Commands](./docs/setup/FIREBASE_APPHOSTING_COMMANDS.md)** - Commands for managing secrets and environment variables

**Integrations:**
- **[Stripe Integration](./docs/integrations/STRIPE_INTEGRATION.md)** - Complete Stripe payment setup, webhook configuration, and testing

**Features:**
- **[Recovery Codes Storage](./docs/features/RECOVERY_CODES_STORAGE.md)** - Encryption recovery code management
- **[Change Code Edge Cases](./docs/features/CHANGE_CODE_EDGE_CASES.md)** - Encryption code change edge case analysis

**Legal & Compliance:**
- **[GDPR Compliance](./docs/legal/GDPR_COMPLIANCE.md)** - Data protection and GDPR compliance information

**Core Documentation:**
- **[Application Guide](./docs/APPLICATION_GUIDE.md)** - Complete feature documentation, architecture, and project structure
- **[Brand Kit](./brand-kit/README.md)** - Brand assets, guidelines, and usage instructions

## 🔄 Point-in-Time Recovery (PITR)

XpenseLab supports Firestore Point-in-Time Recovery (PITR) to recover data from a specific timestamp. This is useful for recovering from data corruption, accidental deletions, or encryption issues.

### Prerequisites

1. **PITR must be enabled** for your Firestore database (7-day retention window)
2. **Google Cloud CLI (gcloud)** must be installed
3. **Cloud Storage bucket** for storing exports
4. **Required IAM permissions**:
   - `datastore.databases.export`
   - `datastore.databases.import`
   - `datastore.databases.get`

### Installing Google Cloud CLI

**Windows:**
```powershell
winget install Google.CloudSDK
# Or download from: https://cloud.google.com/sdk/docs/install
```

**macOS:**
```bash
brew install --cask google-cloud-sdk
```

**Linux (Debian/Ubuntu):**
```bash
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt-get update && sudo apt-get install google-cloud-cli
```

**After installation:**
```bash
# Authenticate
gcloud auth login

# Set your project
gcloud config set project studio-3845013162-4f4cd

# Verify installation
gcloud --version
```

### Checking PITR Status

```bash
gcloud firestore databases describe --database="(default)" --project="studio-3845013162-4f4cd"
```

Look for:
- `pointInTimeRecoveryEnablement: POINT_IN_TIME_RECOVERY_ENABLED`
- `earliestVersionTime`: Earliest recoverable timestamp
- `versionRetentionPeriod`: Should be `604800s` (7 days)

### Recovering Data

#### Option 1: Using Recovery Scripts (Recommended)

**PowerShell (Windows):**
```powershell
cd scripts
.\recover-from-pitr.ps1
```

**Bash (macOS/Linux):**
```bash
cd scripts
chmod +x recover-from-pitr.sh
./recover-from-pitr.sh
```

The scripts are pre-configured to recover these collections:
- `incomes`, `expenses`, `budgets`, `loans`, `recurringTransactions`
- `categories`, `repayments`, `sharedExpenses`, `debts`

#### Option 2: Manual Recovery

**1. Export data from PITR:**
```bash
PROJECT_ID="studio-3845013162-4f4cd"
BUCKET_NAME="studio-3845013162-4f4cd-pitr-exports"
SNAPSHOT_TIME="2026-01-19T09:00:00.00Z"  # Adjust timestamp as needed
EXPORT_PATH="gs://${BUCKET_NAME}/pitr-recovery-$(date +%Y%m%d-%H%M%S)"

gcloud firestore export "${EXPORT_PATH}" \
    --snapshot-time="${SNAPSHOT_TIME}" \
    --collection-ids="expenses,incomes,budgets,loans,recurringTransactions" \
    --database="(default)" \
    --project="${PROJECT_ID}"
```

**2. Import recovered data:**

**Option A: Import to current database (overwrites):**
```bash
gcloud firestore import "${EXPORT_PATH}" \
    --database="(default)" \
    --project="${PROJECT_ID}"
```

**Option B: Clone to new database (safer):**
```bash
gcloud firestore databases clone \
    --source-database="projects/${PROJECT_ID}/databases/(default)" \
    --snapshot-time="${SNAPSHOT_TIME}" \
    --destination-database="recovered-$(date +%Y%m%d)" \
    --project="${PROJECT_ID}"
```

### Important Notes

- **Timestamp Format**: Must be RFC 3339 format at **minute granularity** (e.g., `2026-01-19T09:00:00.00Z`)
- **PITR Window**: 7 days if enabled, 1 hour if disabled
- **Encryption**: Recovered data retains its encryption state - you'll need the correct encryption key
- **Costs**: Export operations and storage are charged
- **Collections**: Use collection group IDs (e.g., `expenses`), not full paths (e.g., `users/{userId}/expenses`)

### Troubleshooting

**"snapshot-time is not within the PITR window"**
- Check `earliestVersionTime` - you can't recover from before this time
- Ensure timestamp is at minute granularity (whole minute)

**"Permission denied"**
- Ensure you have `datastore.databases.export` and `datastore.databases.import` permissions

**"Bucket not found"**
- Create a Cloud Storage bucket: `gsutil mb gs://your-bucket-name`
- Ensure bucket is in the same project

### Quick Reference

- **Project ID**: `studio-3845013162-4f4cd`
- **Database ID**: `(default)`
- **Default Bucket**: `studio-3845013162-4f4cd-pitr-exports`

## 💬 Support

- **Documentation**: Check the [docs](./docs/) folder for detailed guides
- **Issues**: [GitHub Issues](https://github.com/your-repo/xpenselab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/xpenselab/discussions)

## 📄 License

This project is private and proprietary. All rights reserved.

---

**Built with ❤️ by XpenseLab Team**
