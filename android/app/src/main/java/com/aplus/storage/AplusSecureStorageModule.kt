package com.aplus.storage

import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AplusSecureStorageModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private val preferences = reactContext.getSharedPreferences("aplus_secure_storage_mock", Context.MODE_PRIVATE)

  override fun getName(): String = "AplusSecureStorage"

  @ReactMethod
  fun getItem(key: String, promise: Promise) {
    try {
      promise.resolve(preferences.getString(key, null))
    } catch (error: Exception) {
      promise.reject("APLUS_SECURE_STORAGE_GET_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun setItem(key: String, value: String, promise: Promise) {
    try {
      preferences.edit().putString(key, value).apply()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("APLUS_SECURE_STORAGE_SET_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun removeItem(key: String, promise: Promise) {
    try {
      preferences.edit().remove(key).apply()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("APLUS_SECURE_STORAGE_REMOVE_FAILED", error.message, error)
    }
  }
}
