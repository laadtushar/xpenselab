# Firebase App Hosting - Stripe Configuration Commands

## Backend Name
Your backend name is: `studio`

## Available Commands

The correct Firebase CLI commands for App Hosting secrets are:
- `firebase apphosting:secrets:set` - Create or update a secret
- `firebase apphosting:secrets:grantaccess` - Grant backend access to secrets
- `firebase apphosting:secrets:describe` - Get metadata for a secret
- `firebase apphosting:secrets:access` - Access secret value (for verification)

**Note**: There is no `list` command. Use `describe` to check individual secrets or check Google Cloud Console.

## Step 1: Create Secrets in Google Cloud Secret Manager

Run these commands to create the secrets. You'll be prompted to enter the secret value interactively:

```bash
# Set Stripe Secret Key (you'll be prompted to enter the value)
npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY

# Set Stripe Price ID
npx firebase-tools apphosting:secrets:set STRIPE_PRICE_ID

# Set Stripe Webhook Secret
npx firebase-tools apphosting:secrets:set STRIPE_WEBHOOK_SECRET
```

**Alternative 1**: Use `--data-file` to read from a file or stdin:
```bash
# From a file
echo "sk_live_your_secret_key" > /tmp/stripe_key.txt
npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY --data-file=/tmp/stripe_key.txt

# From stdin (PowerShell)
echo "sk_live_your_secret_key" | npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY --data-file=-

# From stdin (Bash)
echo -n "sk_live_your_secret_key" | npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY --data-file=-
```

**Alternative 2**: Use `--force` flag to automatically grant permissions and add to YAML:
```bash
npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY --force
# This will prompt for the value AND automatically grant access to your backend
```

**Alternative 3**: Use Google Cloud Secret Manager directly:
```bash
# Using gcloud CLI
echo -n "sk_live_your_secret_key" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-
echo -n "price_your_price_id" | gcloud secrets create STRIPE_PRICE_ID --data-file=-
echo -n "whsec_your_webhook_secret" | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
```

**Note**: Replace the placeholder values with your actual Stripe values.

## Step 2: Grant Backend Access to Secrets

After creating the secrets, grant your backend access to them:

```bash
# Grant access to all three secrets at once (comma-separated)
npx firebase-tools apphosting:secrets:grantaccess STRIPE_SECRET_KEY,STRIPE_PRICE_ID,STRIPE_WEBHOOK_SECRET --backend=studio

# Or grant access individually:
npx firebase-tools apphosting:secrets:grantaccess STRIPE_SECRET_KEY --backend=studio
npx firebase-tools apphosting:secrets:grantaccess STRIPE_PRICE_ID --backend=studio
npx firebase-tools apphosting:secrets:grantaccess STRIPE_WEBHOOK_SECRET --backend=studio

# Or use the short form:
npx firebase-tools apphosting:secrets:grantaccess STRIPE_SECRET_KEY,STRIPE_PRICE_ID,STRIPE_WEBHOOK_SECRET -b studio
```

## Step 3: Set Public Environment Variable

For `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, add it directly to `apphosting.yaml` (since it's public and safe to expose):

```yaml
env:
  - variable: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    value: "pk_live_your_publishable_key_here"
```

**Note**: Replace `pk_live_your_publishable_key_here` with your actual Stripe publishable key.

## Step 4: Verify Configuration

Check that secrets exist and are accessible:

```bash
# Describe a secret to verify it exists
npx firebase-tools apphosting:secrets:describe STRIPE_SECRET_KEY

# Access secret value (for verification - be careful with this!)
npx firebase-tools apphosting:secrets:access STRIPE_SECRET_KEY

# Check backend configuration
npx firebase-tools apphosting:backends:get studio
```

## Complete Command Sequence

Here's the complete sequence to run. You'll be prompted for secret values:

```bash
# Option 1: Interactive (recommended for first-time setup)
# 1. Create secrets (you'll be prompted to enter values)
npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY
# When prompted, enter: sk_live_YOUR_KEY (or sk_test_ for test mode)

npx firebase-tools apphosting:secrets:set STRIPE_PRICE_ID
# When prompted, enter: price_YOUR_PRICE_ID

npx firebase-tools apphosting:secrets:set STRIPE_WEBHOOK_SECRET
# When prompted, enter: whsec_YOUR_SECRET

# 2. Grant backend access (all at once)
npx firebase-tools apphosting:secrets:grantaccess STRIPE_SECRET_KEY,STRIPE_PRICE_ID,STRIPE_WEBHOOK_SECRET --backend=studio

# Option 2: Use --force flag (automatically grants access and can add to YAML)
npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY --force
npx firebase-tools apphosting:secrets:set STRIPE_PRICE_ID --force
npx firebase-tools apphosting:secrets:set STRIPE_WEBHOOK_SECRET --force
# The --force flag will prompt you to grant access to your backend automatically

# 3. Update apphosting.yaml to include NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# (Edit the file and add the value directly - see Step 3 above)
```

## Using Google Cloud Secret Manager (Alternative)

If you prefer using `gcloud` CLI directly:

```bash
# Create secrets
echo -n "sk_live_YOUR_KEY" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-
echo -n "price_YOUR_PRICE_ID" | gcloud secrets create STRIPE_PRICE_ID --data-file=-
echo -n "whsec_YOUR_SECRET" | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-

# Grant App Hosting service account access
PROJECT_ID="studio-3845013162-4f4cd"
SERVICE_ACCOUNT="studio@apphosting.gcp.firebaseapp.com"

gcloud secrets add-iam-policy-binding STRIPE_SECRET_KEY \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"

gcloud secrets add-iam-policy-binding STRIPE_PRICE_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"

gcloud secrets add-iam-policy-binding STRIPE_WEBHOOK_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"
```

## Important Notes

1. **Secrets vs Environment Variables**:
   - Secrets (using `secret:` in apphosting.yaml) are stored in Google Cloud Secret Manager
   - Regular env vars (using `value:` in apphosting.yaml) are stored in the backend config
   - Public keys (NEXT_PUBLIC_*) can be stored as regular env vars since they're safe to expose

2. **Backend Name**: Your backend is named `studio` (confirmed via `firebase apphosting:backends:list`)

3. **After Setting Secrets**: You need to redeploy for changes to take effect:
   ```bash
   git add apphosting.yaml
   git commit -m "Add Stripe configuration"
   git push
   ```

4. **Testing**: Use test mode keys first, then switch to live keys for production

5. **No List Command**: There's no `apphosting:secrets:list` command. Use:
   - `apphosting:secrets:describe <secretName>` to check individual secrets
   - Google Cloud Console → Secret Manager to view all secrets
   - `gcloud secrets list` to list all secrets

## Troubleshooting

### Secret not found error
- Verify the secret exists: `npx firebase-tools apphosting:secrets:describe SECRET_NAME`
- Check Google Cloud Console → Secret Manager
- Ensure you've granted access: `npx firebase-tools apphosting:secrets:grantaccess SECRET_NAME --backend=studio`

### Backend can't access secret
- Verify access was granted: Check the secret's IAM permissions in Google Cloud Console
- Ensure backend name is correct: `npx firebase-tools apphosting:backends:list`
- Redeploy after granting access: Push changes to trigger a new deployment
