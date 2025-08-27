package com.anonymous.myApp.usage

import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import java.text.SimpleDateFormat
import java.util.*
import android.app.usage.UsageEvents

class UsageModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UsageModule"
    }

    @ReactMethod
    fun getUsageStats(promise: Promise) {
        try {
            val usageStatsManager =
                reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            // Get data from 12 AM today (midnight) to now
            val endTime = System.currentTimeMillis()
            val calendar = Calendar.getInstance()
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis

            Log.d("UsageModule", "Fetching usage events from ${SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date(startTime))} to ${SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date(endTime))}")

            val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
            
            val usageMap = mutableMapOf<String, Long>()
            val lastForegroundEvent = mutableMapOf<String, UsageEvents.Event>()
            val lastUsedTimes = mutableMapOf<String, Long>()

            while (usageEvents.hasNextEvent()) {
                val event = UsageEvents.Event()
                usageEvents.getNextEvent(event)

                lastUsedTimes[event.packageName] = maxOf(lastUsedTimes.getOrDefault(event.packageName, 0L), event.timeStamp)

                if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastForegroundEvent[event.packageName] = event
                } else if (event.eventType == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                    val foregroundEvent = lastForegroundEvent[event.packageName]
                    if (foregroundEvent != null) {
                        val duration = event.timeStamp - foregroundEvent.timeStamp
                        if (duration > 0) {
                            usageMap[event.packageName] = usageMap.getOrDefault(event.packageName, 0L) + duration
                        }
                        lastForegroundEvent.remove(event.packageName)
                    }
                }
            }
            
            // Account for apps that are still in the foreground at the end of the time range
            for ((packageName, event) in lastForegroundEvent) {
                val duration = endTime - event.timeStamp
                if (duration > 0) {
                    usageMap[packageName] = usageMap.getOrDefault(packageName, 0L) + duration
                }
            }

            Log.d("UsageModule", "Aggregated to ${usageMap.size} unique apps from events")

            val result = Arguments.createArray()
            val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())

            for ((packageName, totalTime) in usageMap) {
                if (totalTime > 0) {
                    Log.d("UsageModule", "Final App: $packageName, Total Time: ${totalTime}ms (${totalTime / 1000}s)")
                    val map = Arguments.createMap()
                    map.putString("packageName", packageName)
                    map.putDouble("totalTimeForeground", (totalTime / 1000).toDouble()) // in seconds
                    map.putString("lastTimeUsed", dateFormat.format(Date(lastUsedTimes[packageName] ?: endTime)))
                    result.pushMap(map)
                }
            }

            Log.d("UsageModule", "Returning ${result.size()} filtered usage stats")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e("UsageModule", "Error fetching usage stats from events", e)
            promise.reject("USAGE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val usageStatsManager =
                reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            // Get data from 12 AM today (midnight) to now for permission check
            val endTime = System.currentTimeMillis()
            val calendar = Calendar.getInstance()
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis

            // Use regular query for permission check
            val stats: List<UsageStats> =
                usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_BEST,
                    startTime,
                    endTime
                )

            // Check if we have permission by verifying if we can get any stats
            // When permission is not granted, the list is usually empty even if apps were used
            val hasPermission = stats.isNotEmpty()
            
            Log.d("UsageModule", "Permission check: ${if (hasPermission) "GRANTED" else "DENIED"}, stats count: ${stats.size}")
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            Log.e("UsageModule", "Permission check failed", e)
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openUsageSettings() {
        try {
            Log.d("UsageModule", "Opening usage access settings")
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            Log.d("UsageModule", "Successfully opened usage access settings")
        } catch (e: Exception) {
            Log.e("UsageModule", "Error opening usage settings, trying fallback", e)
            // Fallback to general settings
            try {
                val intent = Intent(Settings.ACTION_SETTINGS)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(intent)
                Log.d("UsageModule", "Opened general settings as fallback")
            } catch (fallbackException: Exception) {
                Log.e("UsageModule", "Error opening any settings", fallbackException)
            }
        }
    }
}