# Android Build Setup

## Java Version Requirements

Capacitor 8 requires **Java 21** for building Android apps. If you have a different Java version installed, you'll need Java 21.

### Installing Java 21

#### Option 1: Using SDKMAN (Recommended for Windows with WSL/Git Bash)

```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Install Java 21
sdk install java 21.0.1-tem
sdk use java 21.0.1-tem
```

#### Option 2: Download from Adoptium (Eclipse Temurin)

1. Visit: https://adoptium.net/temurin/releases/?version=21
2. Download Java 21 for Windows x64
3. Install it (e.g., to `C:\Program Files\Eclipse Adoptium\jdk-21`)
4. Set `JAVA_HOME` environment variable:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-21', 'User')
   ```
5. Add to PATH:
   ```powershell
   $currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
   [System.Environment]::SetEnvironmentVariable('Path', "$currentPath;C:\Program Files\Eclipse Adoptium\jdk-21\bin", 'User')
   ```
6. Restart your terminal/PowerShell

#### Option 3: Using Chocolatey

```powershell
choco install temurin21jdk
```

### Verify Java Installation

```bash
java -version
# Should show: openjdk version "21.x.x"
```

### Configure Gradle to Use Java 21

If you have multiple Java versions installed, you can configure Gradle to use Java 21 specifically:

1. Set `JAVA_HOME` to point to Java 21:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21"
   ```

2. Or add to `gradle.properties`:
   ```properties
   org.gradle.java.home=C:/Program Files/Eclipse Adoptium/jdk-21
   ```

### Alternative: Use Java 25 (If Compatible)

If you only have Java 25 installed and it's working, you can try configuring Gradle to use it. However, Capacitor plugins are configured for Java 21, so this may cause issues.

## Building the Android App

Once Java 21 is installed:

```bash
cd android
./gradlew assembleDebug
```

The first build will download dependencies and may take several minutes.

## Troubleshooting

### "Cannot find Java installation matching version 21"

- Ensure Java 21 is installed
- Verify `JAVA_HOME` points to Java 21
- Restart your terminal after setting environment variables
- Check `java -version` shows Java 21

### "Class JvmVendorSpec does not have member field"

- This is a toolchain plugin compatibility issue
- Remove any toolchain resolver plugins from `settings.gradle`
- Use the manual Java installation approach above

### Build succeeds but app crashes

- Check Android SDK is properly installed
- Verify all Capacitor plugins are synced: `npx cap sync android`
- Check device/emulator logs: `adb logcat`
