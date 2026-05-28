package com.talkingbuttons.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * Talking Buttons main activity.
 *
 * Two separate permission layers must be satisfied for audio recording to
 * work in the Capacitor WebView:
 *
 * 1. Android runtime permissions (RECORD_AUDIO + MODIFY_AUDIO_SETTINGS).
 *    Without MODIFY_AUDIO_SETTINGS, Chromium's audio_manager_android.cc
 *    logs "Unable to select audio device!" and getUserMedia fails with
 *    "Could not start Audio Source".
 *
 * 2. WebView onPermissionRequest — the Chromium WebView fires its own
 *    permission callback.  Without granting RESOURCE_AUDIO_CAPTURE there
 *    the WebView silently denies getUserMedia.
 *
 * We extend Capacitor's BridgeWebChromeClient rather than replacing it
 * with a plain WebChromeClient so that Capacitor's built-in file chooser
 * (onShowFileChooser), JS dialog, and console handling continue to work.
 * Without this, &lt;input type="file"&gt; (used by the wallpaper picker and
 * button image picker) silently breaks in the APK.
 */
public class MainActivity extends BridgeActivity {

    private static final int REQUEST_AUDIO_PERMISSIONS = 1001;

    @Override
    public void onStart() {
        super.onStart();

        // Request Android runtime permissions upfront so the WebView's
        // audio manager can select an audio device before getUserMedia
        // is ever called.
        if (!hasRecordAudioPermission() || !hasModifyAudioSettingsPermission()) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.MODIFY_AUDIO_SETTINGS
                },
                REQUEST_AUDIO_PERMISSIONS
            );
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Extend Capacitor's BridgeWebChromeClient instead of replacing it.
        // This preserves onShowFileChooser (needed for &lt;input type="file"&gt;
        // in the wallpaper picker and ImagePicker) while adding the
        // onPermissionRequest override for getUserMedia microphone access.
        bridge.getWebView().setWebChromeClient(
            new BridgeWebChromeClient(bridge) {
                @Override
                public void onPermissionRequest(PermissionRequest request) {
                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            if (hasRecordAudioPermission()) {
                                request.grant(new String[]{resource});
                            } else {
                                request.deny();
                            }
                            return;
                        }
                    }
                    // Deny everything the app doesn't use.
                    request.deny();
                }
            }
        );
    }

    private boolean hasRecordAudioPermission() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasModifyAudioSettingsPermission() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.MODIFY_AUDIO_SETTINGS)
                == PackageManager.PERMISSION_GRANTED;
    }
}
