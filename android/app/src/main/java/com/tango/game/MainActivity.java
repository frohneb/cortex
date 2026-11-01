package com.tango.game;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.util.Calendar;

public class MainActivity extends Activity {
    private WebView webView;
    public static final String CHANNEL_ID = "tango_daily_reminder";
    public static final int NOTIFICATION_ID = 1001;
    public static final String PREFS_NAME = "tango_alarm_prefs";
    public static final String KEY_HOUR = "reminder_hour";
    public static final String KEY_MINUTE = "reminder_minute";
    public static final String KEY_ENABLED = "reminder_enabled";
    public static final String KEY_LAST_COMPLETED_DATE = "last_completed_date";

    public class NotificationBridge {
        @JavascriptInterface
        public void setDailyCompleted(final String dateStr) {
            try {
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit().putString(KEY_LAST_COMPLETED_DATE, dateStr != null ? dateStr : "").apply();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void showNotification(final String title, final String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    sendNativeNotification(title, message);
                }
            });
        }

        @JavascriptInterface
        public void scheduleDailyReminder(int hour, int minute) {
            scheduleExactDailyAlarm(MainActivity.this, hour, minute);
        }

        @JavascriptInterface
        public void cancelDailyReminder() {
            cancelExactDailyAlarm(MainActivity.this);
        }

        @JavascriptInterface
        public boolean isNativeSupported() {
            return true;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        createNotificationChannel();

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // Sicherheit: Dateizugriffe minimieren
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setAllowContentAccess(false);

        // Sicherheit: Kein Netzwerkzugriff notwendig
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webView.clearCache(true);
        settings.setBlockNetworkImage(true);
        settings.setBlockNetworkLoads(true);

        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new NotificationBridge(), "AndroidNotification");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Offline-Sicherheit: Keine Medien- oder Sensor-Berechtigungen in der WebView gewähren
                request.deny();
            }
        });
        webView.setWebViewClient(new WebViewClient());

        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        // Re-Arming bei App-Start
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            if (prefs.getBoolean(KEY_ENABLED, false)) {
                int hour = prefs.getInt(KEY_HOUR, 9);
                int minute = prefs.getInt(KEY_MINUTE, 0);
                scheduleExactDailyAlarm(this, hour, minute);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Tango Tagesrätsel";
            String description = "Tägliche Erinnerung für das Tango Logikrätsel";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void createNotificationChannel() {
        createNotificationChannel(this);
    }

    private void sendNativeNotification(String title, String message) {
        try {
            createNotificationChannel(this);

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(this, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(this);
            }

            builder.setContentTitle(title != null ? title : "Tango Tagesrätsel")
                   .setContentText(message != null ? message : "Dein heutiges Tagesrätsel wartet auf dich! ☀️🌙")
                   .setSmallIcon(getApplicationInfo().icon)
                   .setContentIntent(pendingIntent)
                   .setAutoCancel(true);

            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify(NOTIFICATION_ID, builder.build());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void scheduleExactDailyAlarm(Context context, int hour, int minute) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            // In SharedPreferences persistieren für Rescheduling im Receiver
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                 .putInt(KEY_HOUR, hour)
                 .putInt(KEY_MINUTE, minute)
                 .putBoolean(KEY_ENABLED, true)
                 .apply();

            Intent intent = new Intent(context, NotificationReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, flags);

            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, hour);
            calendar.set(Calendar.MINUTE, minute);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);

            String lastCompleted = prefs.getString(KEY_LAST_COMPLETED_DATE, "");
            java.text.SimpleDateFormat sdfUtc = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US);
            sdfUtc.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            String todayUtc = sdfUtc.format(new java.util.Date());
            java.text.SimpleDateFormat sdfLocal = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault());
            String todayLocal = sdfLocal.format(new java.util.Date());
            boolean isCompletedToday = todayUtc.equals(lastCompleted) || todayLocal.equals(lastCompleted);

            // Liegt die Zeit heute bereits in der Vergangenheit oder wurde das Tagesrätsel heute bereits gelöst, dann für morgen ansetzen
            if (calendar.getTimeInMillis() <= System.currentTimeMillis() || isCompletedToday) {
                calendar.add(Calendar.DAY_OF_YEAR, 1);
            }

            long triggerAtMillis = calendar.getTimeInMillis();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void cancelExactDailyAlarm(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(KEY_ENABLED, false).apply();

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            Intent intent = new Intent(context, NotificationReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, flags);
            if (alarmManager != null) {
                alarmManager.cancel(pendingIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
