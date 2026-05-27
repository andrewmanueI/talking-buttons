# Release Checklist

## Before Building

- [ ] App builds with `npm run build`
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Capacitor sync succeeds (`npx cap sync android`)
- [ ] App name is "Talking Buttons"
- [ ] Package ID is `com.talkingbuttons.app`
- [ ] Version code is `1` (increment for each Play Store upload)
- [ ] Version name is `1.0.0`
- [ ] Launcher icon is not the default Capacitor icon
- [ ] Round icon matches launcher icon
- [ ] No unnecessary permissions in AndroidManifest.xml
- [ ] No remote URLs in source code
- [ ] No analytics SDKs
- [ ] No ad SDKs
- [ ] Google Fonts caching removed from service worker
- [ ] Privacy policy written and hosted publicly
- [ ] `.gitignore` includes `*.jks`, `*.keystore`, `keystore.properties`

## Build

- [ ] Debug APK builds: `cd android && gradlew.bat assembleDebug`
- [ ] Debug APK installs and runs on device
- [ ] Release keystore created (one-time)
- [ ] Release AAB builds: `cd android && gradlew.bat bundleRelease`

## Device Testing

- [ ] Microphone recording works
- [ ] Audio playback works
- [ ] Camera capture works
- [ ] Gallery image picker works
- [ ] Images display correctly in circular buttons
- [ ] Button title badge is readable
- [ ] Long-press menu opens (Rename/Edit/Delete)
- [ ] Rename works
- [ ] Edit works
- [ ] Delete with confirmation works
- [ ] IndexedDB persists after app restart
- [ ] Presets save and load correctly
- [ ] Language switch (ID/EN) works and persists
- [ ] Background settings persist
- [ ] Reset data works
- [ ] App launches offline (airplane mode)

## Play Store Upload

- [ ] Release AAB signed with release keystore
- [ ] Privacy policy URL entered in Play Console
- [ ] Data Safety section completed in Play Console
- [ ] Content rating questionnaire completed
- [ ] Store listing (title, short description, full description)
- [ ] Screenshots uploaded (phone + tablet if targeting both)
- [ ] Feature graphic uploaded
- [ ] App category selected
- [ ] Contact details provided
- [ ] Internal test track used before production

## Signing Commands (CLI Reference)

### Create a release keystore (one-time)

```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA \
  -keysize 2048 -validity 10000 -alias talking-buttons
```

### Build release AAB with signing

```bash
cd android
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file=../release-key.jks \
  -Pandroid.injected.signing.store.password=YOUR_PASSWORD \
  -Pandroid.injected.signing.key.alias=talking-buttons \
  -Pandroid.injected.signing.key.password=YOUR_PASSWORD
```

**Important:** Do not commit `release-key.jks` or passwords to git.
Use Google Play App Signing for production releases.

## Output Paths

| Artifact | Path |
|---|---|
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release AAB (unsigned) | `android/app/build/outputs/bundle/release/app-release.aab` |
| Release AAB (signed) | Same as above (signed during build if keystore is configured) |
