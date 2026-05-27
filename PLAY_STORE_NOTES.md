# Play Store Notes for Talking Buttons

## App Identity

- **App name:** Talking Buttons
- **Package ID:** com.talkingbuttons.app
- **Version code:** 1
- **Version name:** 1.0.0

## Data Safety (Google Play Console)

### Data Collection and Sharing

The app does **not** collect or share any user data. All button names,
audio recordings, images, settings, and presets are stored locally on the
user's device using IndexedDB.

| Question | Answer |
|---|---|
| Does the app collect data? | No |
| Does the app share data? | No |
| Data encrypted in transit? | Not applicable (no data transmitted) |
| Data deletion requested? | All data is local; user can clear app data in Android Settings or use the in-app "Reset All Data" button |

### Data Types

| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| Audio recordings | No (local only) | No | Communication buttons |
| Photos / images | No (local only) | No | Button images |
| App settings | No (local only) | No | Language, background |
| Personal info | No | No | — |
| Device ID | No | No | — |

## Permissions

### Microphone (`RECORD_AUDIO`)

Used only when the caregiver presses the record button to create an audio
clip for a communication button. Recordings are stored locally and never
leave the device.

### Camera (`CAMERA`)

Used only when the caregiver chooses "Take Photo" to add an image to a
communication button. Photos are stored locally and never leave the device.

### Internet (`INTERNET`)

Required by Capacitor's WebView to serve the app's bundled HTML, CSS, and
JavaScript files from local storage. The app does not make any remote
network requests.

## Target Audience

The app is designed for caregivers of non-speaking autistic children.
It functions as an AAC-style communication board where the caregiver
creates buttons that play recorded audio.

The app does not include:
- Advertisements
- Social features
- User-generated public content
- In-app purchases
- External links
- Online interactions

## Content Rating

Suggested Google Play content rating: **Everyone**

Reasons:
- No user-generated content
- No social interaction
- No purchases
- No external links
- Educational/accessibility purpose

## Store Listing Category

Suggested category: **Parenting** or **Education**

## Store Listing Languages

- Indonesian (default)
- English

## Testing

The app has been tested on Android via debug APK build. Capacitor wraps
the React/Vite PWA into a native Android WebView.
