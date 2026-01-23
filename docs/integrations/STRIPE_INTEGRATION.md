# Stripe Payment Integration

This document describes the Stripe payment integration for XpenseLab Premium subscriptions.

## Overview

The integration allows users to subscribe to Premium ($10/month) using Stripe Checkout. Upon successful payment, users are automatically upgraded to premium tier in Firestore.

## Architecture

1. **Checkout Flow**: User clicks "Upgrade to Premium" → Creates Stripe Checkout Session → Redirects to Stripe Checkout → Returns to success page
2. **Webhook Handler**: Stripe sends webhook events → Server verifies signature → Updates user tier in Firestore

## Environment Variables

Add these to your `.env` file and Firebase App Hosting secrets:

### Required Variables

- `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_`)
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (starts with `pk_`) - prefix with `NEXT_PUBLIC_`
- `STRIPE_PRICE_ID`: The Stripe Price ID for the $10/month subscription (starts with `price_`)
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret from Stripe Dashboard (starts with `whsec_`)

### Example `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Setup Steps

### 1. Create Stripe Product and Price

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Products → Add Product
3. Create a product named "XpenseLab Premium"
4. Set price to $10/month (recurring)
5. Copy the Price ID (starts with `price_`)

### 2. Configure Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

### 3. Set Environment Variables

Add all required environment variables to:
- Local `.env` file
- Firebase App Hosting secrets (via `firebase apphosting:secrets:set`)

### 4. Deploy

After setting up environment variables, deploy the application. The webhook endpoint will be available at `/api/webhook`.

## Files Created

- `src/lib/stripe.ts` - Stripe client initialization
- `src/firebase/admin.ts` - Firebase Admin SDK helpers
- `src/app/api/create-checkout-session/route.ts` - Creates Stripe checkout session
- `src/app/api/webhook/route.ts` - Handles Stripe webhook events
- `src/app/(app)/checkout/page.tsx` - Checkout redirect page
- `src/app/(app)/checkout/success/page.tsx` - Success page after payment
- `src/app/(app)/pricing/page.tsx` - Pricing page with upgrade button
- `src/components/checkout/checkout-form.tsx` - (Not used, kept for reference)

## User Flow

1. User visits `/pricing` page
2. Clicks "Upgrade to Premium"
3. Redirected to `/checkout` which creates a Stripe Checkout Session
4. Redirected to Stripe Checkout page
5. User enters payment details and completes payment
6. Stripe redirects to `/checkout/success`
7. Webhook receives `checkout.session.completed` event
8. User document in Firestore is updated: `tier: 'premium'`

## Webhook Events Handled

- `checkout.session.completed`: Upgrades user to premium
- `customer.subscription.updated`: Handles subscription status changes
- `customer.subscription.deleted`: Downgrades user to basic
- `invoice.payment_failed`: Downgrades user to basic

## Testing

### Test Mode

Use Stripe test mode for development:
- Test cards: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### Webhook Testing

Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:9002/api/webhook
```

## Security

- All API routes verify Firebase authentication
- Webhook signature verification prevents unauthorized requests
- User ID is stored in session metadata for secure user identification
- Firebase Admin SDK is used for server-side operations

# Stripe Payment Integration

This document describes the Stripe payment integration for XpenseLab Premium subscriptions.

## Overview

The integration allows users to subscribe to Premium ($10/month) using Stripe Checkout. Upon successful payment, users are automatically upgraded to premium tier in Firestore.

## Architecture

1. **Checkout Flow**: User clicks "Upgrade to Premium" → Creates Stripe Checkout Session → Redirects to Stripe Checkout → Returns to success page
2. **Webhook Handler**: Stripe sends webhook events → Server verifies signature → Updates user tier in Firestore

## Environment Variables

Add these to your `.env` file and Firebase App Hosting secrets:

### Required Variables

- `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_`)
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (starts with `pk_`) - prefix with `NEXT_PUBLIC_`
- `STRIPE_PRICE_ID`: The Stripe Price ID for the $10/month subscription (starts with `price_`)
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret from Stripe Dashboard (starts with `whsec_`)

### Example `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Setup Steps

### Step 1: Create Stripe Account and Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. If you don't have an account, sign up (use test mode for development)
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_` for test mode)
5. Click **Reveal test key** and copy your **Secret key** (starts with `sk_test_` for test mode)
6. Add these to your `.env` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

### Step 2: Create Stripe Product and Price

1. In Stripe Dashboard, navigate to **Products** → **Add Product**
2. Fill in the product details:
   - **Name**: `XpenseLab Premium`
   - **Description**: `Premium subscription with AI features, receipt scanning, and more`
3. Under **Pricing**, select:
   - **Pricing model**: `Standard pricing`
   - **Price**: `$10.00`
   - **Billing period**: `Monthly` (recurring)
   - **Currency**: `USD`
4. Click **Save product**
5. After saving, you'll see the Price ID (starts with `price_`)
6. Copy this Price ID and add it to your `.env`:
   ```env
   STRIPE_PRICE_ID=price_your_price_id_here
   ```

### Step 3: Configure Webhook Endpoint

#### 3.1 Create Webhook Endpoint

1. In Stripe Dashboard, navigate to **Developers** → **Webhooks**
2. Click **Add endpoint** (or **Add webhook endpoint**)
3. Fill in the endpoint details:
   - **Endpoint URL**: 
     - For production: `https://your-domain.com/api/webhook`
     - For local testing: Use Stripe CLI (see Testing section below)
   - **Description**: `XpenseLab Premium Subscription Webhook`

#### 3.2 Select Events to Listen To

**IMPORTANT**: You must select the following events. Click **Select events** and choose:

1. **Checkout Sessions**:
   - ✅ `checkout.session.completed` - Fires when a customer successfully completes a checkout session

2. **Customer Subscriptions**:
   - ✅ `customer.subscription.updated` - Fires when a subscription is updated (e.g., plan change, status change)
   - ✅ `customer.subscription.deleted` - Fires when a subscription is canceled or deleted

3. **Invoices**:
   - ✅ `invoice.payment_failed` - Fires when a payment attempt fails

**How to select events:**
- In the "Select events" section, you'll see a list of event categories
- Expand each category by clicking on it
- Check the boxes next to the events listed above
- You can also use the search box to find specific events
- After selecting all events, click **Add events** or **Done**

#### 3.3 Get Webhook Signing Secret

1. After creating the webhook endpoint, click on it to view details
2. In the **Signing secret** section, click **Reveal** or **Click to reveal**
3. Copy the signing secret (starts with `whsec_`)
4. Add it to your `.env` file:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

**Important**: Keep this secret secure! Never commit it to version control.

### Step 4: Set Environment Variables in Firebase App Hosting

For production deployment, you need to set these as secrets in Firebase App Hosting:

```bash
# Set Stripe secret key
firebase apphosting:secrets:set STRIPE_SECRET_KEY --secret-value="sk_live_your_secret_key"

# Set Stripe publishable key (as regular env var, not secret)
firebase apphosting:backends:update --backend=your-backend-name --env-vars="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key"

# Set Stripe price ID
firebase apphosting:secrets:set STRIPE_PRICE_ID --secret-value="price_your_price_id"

# Set webhook secret
firebase apphosting:secrets:set STRIPE_WEBHOOK_SECRET --secret-value="whsec_your_webhook_secret"

# Grant backend access to secrets
firebase apphosting:secrets:grantaccess STRIPE_SECRET_KEY --backend=your-backend-name
firebase apphosting:secrets:grantaccess STRIPE_PRICE_ID --backend=your-backend-name
firebase apphosting:secrets:grantaccess STRIPE_WEBHOOK_SECRET --backend=your-backend-name
```

**Note**: Replace `your-backend-name` with your actual backend name (usually found in `apphosting.yaml` or via `firebase apphosting:backends:list`)

### Step 5: Update apphosting.yaml

Add the environment variables to your `apphosting.yaml`:

```yaml
env:
  - variable: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    value: "pk_live_your_publishable_key"  # Or use secret if preferred
  - variable: STRIPE_SECRET_KEY
    secret: STRIPE_SECRET_KEY
  - variable: STRIPE_PRICE_ID
    secret: STRIPE_PRICE_ID
  - variable: STRIPE_WEBHOOK_SECRET
    secret: STRIPE_WEBHOOK_SECRET
```

### Step 6: Deploy and Test

1. Commit your changes
2. Push to your repository (this triggers auto-deployment if configured)
3. Or manually deploy:
   ```bash
   firebase deploy --only hosting
   ```

## Files Created

- `src/lib/stripe.ts` - Stripe client initialization
- `src/firebase/admin.ts` - Firebase Admin SDK helpers
- `src/app/api/create-checkout-session/route.ts` - Creates Stripe checkout session
- `src/app/api/webhook/route.ts` - Handles Stripe webhook events
- `src/app/(app)/checkout/page.tsx` - Checkout redirect page
- `src/app/(app)/checkout/success/page.tsx` - Success page after payment
- `src/app/(app)/pricing/page.tsx` - Pricing page with upgrade button
- `src/components/checkout/checkout-form.tsx` - (Not used, kept for reference)

## User Flow

1. User visits `/pricing` page
2. Clicks "Upgrade to Premium"
3. Redirected to `/checkout` which creates a Stripe Checkout Session
4. Redirected to Stripe Checkout page
5. User enters payment details and completes payment
6. Stripe redirects to `/checkout/success`
7. Webhook receives `checkout.session.completed` event
8. User document in Firestore is updated: `tier: 'premium'`

## Webhook Events Explained

### `checkout.session.completed`
- **When**: Customer successfully completes a checkout session
- **Action**: Upgrades user to premium tier
- **Data Used**: `session.metadata.userId` or `session.subscription.metadata.userId`

### `customer.subscription.updated`
- **When**: Subscription status changes (e.g., plan change, renewal, cancellation scheduled)
- **Action**: Checks subscription status and downgrades if canceled
- **Data Used**: `subscription.metadata.userId` and `subscription.status`

### `customer.subscription.deleted`
- **When**: Subscription is canceled or deleted
- **Action**: Immediately downgrades user to basic tier
- **Data Used**: `subscription.metadata.userId`

### `invoice.payment_failed`
- **When**: Payment attempt fails (e.g., card declined, insufficient funds)
- **Action**: Downgrades user to basic tier
- **Data Used**: `invoice.subscription.metadata.userId` (if available)

## Testing

### Test Mode Setup

1. Use Stripe test mode for development
2. Test cards:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`
   - Use any future expiry date (e.g., `12/34`)
   - Use any 3-digit CVC (e.g., `123`)

### Local Webhook Testing with Stripe CLI

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:9002/api/webhook
   ```

4. Copy the webhook signing secret shown (starts with `whsec_`) and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_local_webhook_secret_from_cli
   ```

5. In another terminal, trigger test events:
   ```bash
   # Test checkout completion
   stripe trigger checkout.session.completed
   
   # Test subscription update
   stripe trigger customer.subscription.updated
   
   # Test subscription deletion
   stripe trigger customer.subscription.deleted
   
   # Test payment failure
   stripe trigger invoice.payment_failed
   ```

### Testing the Full Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:9002/pricing`
3. Click "Upgrade to Premium"
4. Use test card `4242 4242 4242 4242`
5. Complete the checkout
6. Verify in Firestore that user's `tier` field is set to `premium`
7. Check Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries to see webhook events

### Production Testing Checklist

- [ ] All environment variables are set correctly
- [ ] Webhook endpoint is accessible (check Stripe Dashboard → Webhooks → Recent deliveries)
- [ ] Webhook events are being received (check server logs)
- [ ] User tier is updated correctly in Firestore after payment
- [ ] Success page displays correctly
- [ ] Cancel flow works correctly
- [ ] Payment failure handling works

## Security

- All API routes verify Firebase authentication
- Webhook signature verification prevents unauthorized requests
- User ID is stored in session metadata for secure user identification
- Firebase Admin SDK is used for server-side operations
- Never expose secret keys in client-side code
- Use environment variables for all sensitive data

## Troubleshooting

### Checkout not working
- ✅ Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
- ✅ Check browser console for errors
- ✅ Verify Stripe Price ID is correct
- ✅ Ensure user is authenticated before accessing checkout
- ✅ Check network tab for API errors

### Webhook not processing
- ✅ Verify webhook secret is correct in `.env`
- ✅ Check Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries
- ✅ Look for failed deliveries (red status)
- ✅ Verify webhook endpoint URL is accessible (must be HTTPS in production)
- ✅ Check server logs for webhook processing errors
- ✅ Verify webhook signature verification is working (check for "Webhook signature verification failed" errors)

### User not upgraded after payment
- ✅ Check webhook delivery in Stripe Dashboard → Webhooks
- ✅ Verify webhook signature verification is working
- ✅ Check Firestore rules allow updates to user document (`/users/{userId}`)
- ✅ Manually verify user document in Firestore Console
- ✅ Check server logs for webhook processing errors
- ✅ Verify `userId` is present in session metadata
- ✅ Test webhook locally using Stripe CLI

### Webhook returns 400 Bad Request
- ✅ Verify webhook secret matches the one in Stripe Dashboard
- ✅ Check that the request body is being read correctly (should be raw text, not JSON)
- ✅ Verify the Stripe signature header is present
- ✅ Check server logs for specific error messages

### Subscription not canceling properly
- ✅ Verify `customer.subscription.deleted` event is selected in webhook
- ✅ Check that subscription metadata contains `userId`
- ✅ Verify webhook is receiving the event (check Stripe Dashboard)
- ✅ Check server logs for processing errors

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Firebase App Hosting Secrets](https://firebase.google.com/docs/app-hosting/configure#secret-parameters)
