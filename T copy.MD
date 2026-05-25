# Danh sách Script JavaScript

Dưới đây là các đoạn mã JS đã được chuyển đổi sang định dạng chuỗi JSON. 

---

### 1. Loại: `SDK` (Core)
- **File**: `bridge_injector.dart`
- **Mô tả**: Bộ khung API chính cho Mini App. Định nghĩa `window.ejsc`.
- **JSON String**:
```json
"(function() {\n  window.EjscBridge = {\n    postMessage: function(jsonString) {\n      window.flutter_inappwebview.callHandler('EjscBridge', jsonString);\n    }\n  };\n  const callbacks = {};\n  let callbackId = 0;\n  window.ejsc = {\n    _onNativeResponse: (id, res) => {\n      const cb = callbacks[id];\n      if (cb) {\n        if (res && res.success) {\n          if (cb.success) cb.success(res.data);\n          cb.resolve(res.data);\n        } else {\n          const errorData = res?.data || 'Unknown error';\n          if (cb.fail) cb.fail(errorData);\n          cb.reject(errorData);\n        }\n        if (cb.complete) cb.complete(res?.data);\n        delete callbacks[id];\n      }\n    },\n    _onNativeEvent: (eventName, data) => {\n      const event = new CustomEvent('ejsc:native-event', { detail: { eventName, data } });\n      window.dispatchEvent(event);\n    },\n    _invokeNative: (method, opts) => {\n      return new Promise((resolve, reject) => {\n        const id = callbackId++;\n        callbacks[id] = { ...opts, resolve, reject };\n        window.EjscBridge.postMessage(\n          JSON.stringify({ method, id, params: opts || {} })\n        );\n      });\n    }\n  };\n  const methods = ['getLocation', 'getUserLocation', 'openNativeMap', 'chooseImage', 'captureImage', 'chooseMedia', 'scan', 'getSetting', 'authorize', 'openSetting', 'exitMiniApp', 'getSystemInfo', 'getAppLanguage', 'setStorage', 'getStorage', 'setSecureStorage', 'getSecureStorage', 'removeStorage', 'clearStorage', 'getStorageInfo', 'setClipboard', 'getClipboard', 'showToast', 'alert', 'confirm', 'prompt', 'showActionSheet', 'showLoading', 'hideLoading', 'request', 'openInAppBrowser', 'triggerHapticFeedback', 'setNavigationBar', 'getUserInfo', 'downloadFile', 'uploadFile', 'makePhoneCall', 'addCalendarEvent', 'openDeeplink', 'openPublicDeepLink', 'shareApp', 'previewImage', 'saveImage', 'getImageInfo'];\n  methods.forEach(m => {\n    window.ejsc[m] = (opts) => window.ejsc._invokeNative(m, opts);\n  });\n  window.ejscAsync = window.ejsc;\n  window.ejsc.bioMetrics = {\n    isSupported: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'isSupported' }),\n    localAuth: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'localAuth' }),\n    keyExists: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'keyExists' }),\n    createKey: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'createKey' }),\n    createSignature: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'createSignature' }),\n    deleteKey: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'deleteKey' }),\n  };\n})();"
```

---

### 2. Loại: `SAFE_AREA`
- **File**: `webview_safe_area_injector.dart`
- **Mô tả**: Xử lý vùng an toàn (tai thỏ, notch) qua biến CSS.
- **JSON String**:
```json
"(function() {\n  const root = document.documentElement;\n  \n  root.style.setProperty('--ejsc-device-width', '{{deviceWidth}}px');\n  root.style.setProperty('--ejsc-device-height', '{{deviceHeight}}px');\n  root.style.setProperty('--ejsc-screen-width', '{{screenWidth}}px');\n  root.style.setProperty('--ejsc-screen-height', '{{screenHeight}}px');\n  root.style.setProperty('--ejsc-window-width', '{{windowWidth}}px');\n  root.style.setProperty('--ejsc-window-height', '{{windowHeight}}px');\n\n  root.style.setProperty('--ejsc-status-bar-height', '{{statusBarHeight}}px');\n  root.style.setProperty('--ejsc-title-bar-height', '{{titleBarHeight}}px');\n\n  root.style.setProperty('--ejsc-safe-top', '{{safeTop}}px');\n  root.style.setProperty('--ejsc-safe-bottom', '{{safeBottom}}px');\n  root.style.setProperty('--ejsc-safe-left', '{{safeLeft}}px');\n  root.style.setProperty('--ejsc-safe-right', '{{safeRight}}px');\n\n  root.style.setProperty('--ejsc-header-padding-left', '{{headerPaddingLeft}}px');\n  root.style.setProperty('--ejsc-header-padding-right', '{{headerPaddingRight}}px');\n\n  root.style.setProperty('--safe-top', '{{safeTop}}px');\n  root.style.setProperty('--safe-bottom', '{{safeBottom}}px');\n  root.style.setProperty('--is-real-device', '{{isRealDevice}}');\n\n  const styleId = '__ejsc_safe_area_style__';\n  let el = document.getElementById(styleId);\n  if (!el) {\n    el = document.createElement('style');\n    el.id = styleId;\n    document.head.appendChild(el);\n  }\n  el.textContent = `\n    :root {\n      --ejsc-device-width: {{deviceWidth}}px;\n      --ejsc-device-height: {{deviceHeight}}px;\n      --ejsc-screen-width: {{screenWidth}}px;\n      --ejsc-screen-height: {{screenHeight}}px;\n      --ejsc-window-width: {{windowWidth}}px;\n      --ejsc-window-height: {{windowHeight}}px;\n\n      --ejsc-status-bar-height: {{statusBarHeight}}px;\n      --ejsc-title-bar-height: {{titleBarHeight}}px;\n\n      --ejsc-safe-top: {{safeTop}}px;\n      --ejsc-safe-bottom: {{safeBottom}}px;\n      --ejsc-safe-left: {{safeLeft}}px;\n      --ejsc-safe-right: {{safeRight}}px;\n\n      --ejsc-header-padding-left: {{headerPaddingLeft}}px;\n      --ejsc-header-padding-right: {{headerPaddingRight}}px;\n\n      --safe-top: {{safeTop}}px;\n      --safe-bottom: {{bottomHeight}}px;\n      --is-real-device: {{isRealDevice}};\n    }\n\n    .top-\\\\[env\\\\(safe-area-inset-top\\\\,20px\\\\)\\\\] {\n      top: {{safeTop}}px !important;\n    }\n  `;\n})();"
```

---

### 3. Loại: `EVENT`
- **File**: `bridge_event_emitter.dart`
- **JSON String**:
```json
"if (window.ejsc && window.ejsc._onNativeEvent) {\n  window.ejsc._onNativeEvent(\"{{eventName}}\", {{dataJson}});\n}"
```

---

### 4. Loại: `SYNC_UI`
- **File**: `set_navigation_bar_handler.dart`
- **JSON String**:
```json
"window.dispatchEvent(new CustomEvent('mock:setNavigationBar', {\n  detail: {\n    title: '{{title}}',\n    backgroundColor: '{{backgroundColor}}',\n    frontColor: '{{frontColor}}',\n    visible: {{visible}},\n    immersive: {{immersive}},\n    backIcon: '{{backIcon}}',\n    statusBarStyle: '{{statusBarStyle}}'\n  }\n}));"
```

---

### 5. Loại: `RESPONSE`
- **File**: `mini_app_webview_page.dart`
- **JSON String**:
```json
"window.ejsc._onNativeResponse({{id}}, {{responseJson}});"
```


