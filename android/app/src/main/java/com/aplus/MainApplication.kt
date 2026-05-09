package com.aplus

import android.app.Application
import com.aplus.storage.AplusNativePackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.apply {
          // Batch 01: thêm storage native mock để session sống qua app restart trên Android.
          add(AplusNativePackage())
        }

      override fun getJSMainModuleName(): String = "index"

      /**
       * Batch 01 vẫn chạy offline bằng Android Studio, không phụ thuộc Metro.
       * Nếu để BuildConfig.DEBUG, app có thể ăn nhầm Metro/bundle từ project khác.
       */
      override fun getUseDeveloperSupport(): Boolean = false

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
