package com.azurlize.team;

import android.os.Bundle;
import android.graphics.Color;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#030712"));
        window.setNavigationBarColor(Color.parseColor("#030712"));

        // Ensure status bar (clock, battery, signal) sits above webview without overlapping
        WindowCompat.setDecorFitsSystemWindows(window, true);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(false); // Bright white status bar icons
        controller.setAppearanceLightNavigationBars(false);
    }
}

