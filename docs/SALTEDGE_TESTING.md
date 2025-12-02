# Salt Edge Testing Guide

This guide explains how to test the Salt Edge integration using fake providers.

## Setup

1. **Get Salt Edge Credentials**
   - Sign up at https://www.saltedge.com/clients/sign_up
   - Create an API key from https://www.saltedge.com/clients/api_keys
   - Copy your `App-id` and `Secret`

2. **Set Environment Variables**
   ```env
   SALTEDGE_APP_ID=your_app_id_here
   SALTEDGE_SECRET=your_secret_here
   ```
   
   **Note:** For test/pending status, you don't need the private key. Signature is optional.

## Testing with Fake Providers

### Option 1: Use the UI (Recommended)

1. Go to **Settings** page
2. Click **"Connect Bank Account"**
3. In the "Test with Fake Provider" dropdown:
   - Click **"Load Fake Providers..."** to see available fake providers
   - Select a fake provider (e.g., `fake_oauth_client_xf`)
   - Or leave empty to see all providers in the widget
4. Click **"Connect Bank Account"**
5. The Salt Edge widget will open in a new window
6. If you selected a provider, it will be pre-selected
7. If not, search for "fake" or select country "XF" to see fake providers

### Option 2: Direct Provider Code

You can also directly specify a fake provider code when creating a connection. The main fake providers are:

- **`fake_oauth_client_xf`** - OAuth-based fake provider (most common for testing)
- **`fake_client_xf`** - Username/password based fake provider

## Fake Provider Credentials

When testing with fake providers, you can use any credentials. Common test credentials:

- **Username:** `test_user`
- **Password:** `test_password`
- Or any values you want - they're all accepted

## Testing Flow

1. **Create Connection**
   - Go to Settings → Connect Bank Account
   - Select a fake provider (optional)
   - Complete the connection in the widget

2. **View Accounts**
   - Go to Integrations page
   - Your fake bank accounts will appear
   - Select an account to view transactions

3. **Import Transactions**
   - View transactions from the fake account
   - Click "Import Expense" or "Import Income" on any transaction
   - Review and confirm the import

## Common Fake Providers

| Provider Code | Type | Description |
|--------------|------|-------------|
| `fake_oauth_client_xf` | OAuth | Most commonly used for testing OAuth flows |
| `fake_client_xf` | Embedded | Username/password form |
| `fake_client_xf_success` | Embedded | Always succeeds |
| `fake_client_xf_error` | Embedded | Simulates errors |

## Troubleshooting

### "Provider not found" error
- Make sure you're using the correct provider code
- Try loading fake providers from the dropdown first
- Ensure `include_sandboxes: true` is set (it's set by default)

### Widget doesn't show fake providers
- Make sure your account is in "Pending" or "Test" status
- Check that you haven't filtered out sandbox providers
- Try selecting country "XF" in the widget

### Connection fails
- Verify your API credentials are correct
- Check that you're using test credentials (any values work for fake providers)
- Review the browser console for errors

## Next Steps

Once testing is complete:
1. Request **Test** status from Salt Edge to test with real sandbox banks
2. Request **Live** status when ready for production
3. Generate RSA key pair for Live status (signature required)
4. Update environment variables with private key

## Resources

- [Salt Edge Documentation](https://docs.saltedge.com/v6/)
- [Fake Providers Guide](https://docs.saltedge.com/v6/api_reference#ais-providers-fake)
- [Salt Edge Dashboard](https://www.saltedge.com/clients/dashboard)

