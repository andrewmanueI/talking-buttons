package com.talkingbuttons.app;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

/**
 * Talking Buttons main activity.
 *
 * Capacitor wraps the React web app in an Android WebView. When the web app calls
 * navigator.mediaDevices.getUserMedia({ audio: true }), the WebView fires its own
 * onPermissionRequest callback, which is a separate layer from the Android
 * manifest permissions (RECORD_AUDIO, CAMERA).
 *
 * Without handling onPermissionRequest, the WebView silently denies the request
 * even after the user has granted Android-level permissions, causing getUserMedia
 * to throw NotAllowedError ("Permission denied").
 *
 * This handler selectively grants only the resources the app actually needs.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        bridge.getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // onPermissionRequest is called on the UI thread.
                // Selectively grant only the resources this app uses.
                String[] requested = request.getResources();
                java.util.ArrayList<String> granted = new java.util.ArrayList<>();

                for (String resource : requested) {
                    switch (resource) {
                        case PermissionRequest.RESOURCE_AUDIO_CAPTURE:
                            // Microphone recording via getUserMedia({ audio: true })
                            granted.add(resource);
                            break;

                        case PermissionRequest.RESOURCE_VIDEO_CAPTURE:
                            // Camera capture via <input type="file" capture="environment">
                            // The file input fires an Android camera intent, but some
                            // WebView implementations still route it through the
                            // permission system.
                            granted.add(resource);
                            break;

                        default:
                            // Deny any resource the app does not use (e.g. protected
                            // media ID, MIDI, or future permission types).
                            break;
                    }
                }

                if (granted.isEmpty()) {
                    request.deny();
                } else {
                    request.grant(granted.toArray(new String[0]));
                }
            }
        });
    }
}
