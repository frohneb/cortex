package com.tango.game;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

public class NotificationReceiver extends BroadcastReceiver {
    public static final String CHANNEL_ID = MainActivity.CHANNEL_ID;
    public static final int NOTIFICATION_ID = MainActivity.NOTIFICATION_ID;

    @Override
    public void onReceive(Context context, Intent intent) {
        MainActivity.createNotificationChannel(context);

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, openIntent, flags);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(context);
        }

        builder.setContentTitle("Cortex Tagesrätsel")
               .setContentText("Dein heutiges Tagesrätsel wartet auf dich! 🧩")
               .setSmallIcon(context.getApplicationInfo().icon)
               .setContentIntent(pendingIntent)
               .setAutoCancel(true);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, builder.build());
        }

        // Automatisch den nächsten Tag exakt neu terminieren
        try {
            SharedPreferences prefs = context.getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);
            boolean enabled = prefs.getBoolean(MainActivity.KEY_ENABLED, true);
            if (enabled) {
                int hour = prefs.getInt(MainActivity.KEY_HOUR, 9);
                int minute = prefs.getInt(MainActivity.KEY_MINUTE, 0);
                MainActivity.scheduleExactDailyAlarm(context, hour, minute);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
