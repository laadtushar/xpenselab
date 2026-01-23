# Scripts

This directory contains utility and test scripts for XpenseLab.

## Available Scripts

### Test Scripts

- **`test-firebase-access.js`** - Test Firebase connection and API key configuration
- **`test-genkit-init.ts`** - Test Genkit initialization and AI flow setup
- **`check-user-doc.js`** - Check user document structure in Firestore

## Usage

Run scripts using Node.js or TypeScript:

```bash
# JavaScript files
node scripts/test-firebase-access.js

# TypeScript files (requires tsx or ts-node)
npx tsx scripts/test-genkit-init.ts
```

## Notes

- These scripts are for development and testing purposes
- Some scripts may require environment variables from `.env` file
- Ensure Firebase CLI and dependencies are installed before running
