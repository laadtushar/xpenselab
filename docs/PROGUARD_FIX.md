# ProGuard Fix for @capacitor-firebase/authentication

## Issue
The `@capacitor-firebase/authentication` plugin's Android build.gradle was using the deprecated `getDefaultProguardFile('proguard-android.txt')` method, which is no longer supported in newer Android Gradle Plugin versions.

## Error Message
```
`getDefaultProguardFile('proguard-android.txt')` is no longer supported since it includes `-dontoptimize`, which prevents R8 from performing many optimizations. Instead use `getDefaultProguardFile('proguard-android-optimize.txt)`
```

## Solution
Created a patch using `patch-package` to fix the issue:

**File:** `patches/@capacitor-firebase+authentication+8.0.1.patch`

**Change:**
- Changed `proguard-android.txt` → `proguard-android-optimize.txt` in the plugin's `build.gradle`

## How It Works
1. The patch is automatically applied after `npm install` via the `postinstall` script in `package.json`
2. The patch modifies the plugin's build.gradle file in `node_modules`
3. This allows the Android build to proceed without errors

## Verification
- ✅ Patch created successfully
- ✅ `npx cap sync android` completes without errors
- ✅ Build should now work correctly

## Future Updates
If the plugin is updated and the patch no longer applies:
1. The patch will fail to apply during `npm install`
2. You'll need to either:
   - Wait for the plugin maintainers to fix it upstream
   - Recreate the patch if the file structure changed
   - Report the issue to the plugin repository
