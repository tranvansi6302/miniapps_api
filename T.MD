# Danh sách Script JavaScript

Dưới đây là các đoạn mã JS đã được chuyển đổi sang định dạng code bình thường (Dễ đọc và chỉnh sửa).

---

### 1. Loại: `SDK` (Core)
- **File**: `bridge_injector.dart`
- **Mô tả**: Bộ khung API chính cho Mini App. Định nghĩa `window.ejsc`.
- **Mã JavaScript**:
```javascript
(function() {
  window.EjscBridge = {
    postMessage: function(jsonString) {
      window.flutter_inappwebview.callHandler('EjscBridge', jsonString);
    }
  };
  const callbacks = {};
  let callbackId = 0;
  window.ejsc = {
    _onNativeResponse: (id, res) => {
      const cb = callbacks[id];
      if (cb) {
        if (res && res.success) {
          if (cb.success) cb.success(res.data);
          cb.resolve(res.data);
        } else {
          const errorData = res?.data || 'Unknown error';
          if (cb.fail) cb.fail(errorData);
          cb.reject(errorData);
        }
        if (cb.complete) cb.complete(res?.data);
        delete callbacks[id];
      }
    },
    _onNativeEvent: (eventName, data) => {
      const event = new CustomEvent('ejsc:native-event', { detail: { eventName, data } });
      window.dispatchEvent(event);
    },
    _invokeNative: (method, opts) => {
      return new Promise((resolve, reject) => {
        const id = callbackId++;
        callbacks[id] = { ...opts, resolve, reject };
        window.EjscBridge.postMessage(
          JSON.stringify({ method, id, params: opts || {} })
        );
      });
    }
  };
  const methods = ['getLocation', 'getUserLocation', 'openNativeMap', 'chooseImage', 'captureImage', 'chooseMedia', 'scan', 'getSetting', 'authorize', 'openSetting', 'exitMiniApp', 'getSystemInfo', 'getAppLanguage', 'setStorage', 'getStorage', 'setSecureStorage', 'getSecureStorage', 'removeStorage', 'clearStorage', 'getStorageInfo', 'setClipboard', 'getClipboard', 'showToast', 'alert', 'confirm', 'prompt', 'showActionSheet', 'showLoading', 'hideLoading', 'request', 'openInAppBrowser', 'triggerHapticFeedback', 'setNavigationBar', 'getUserInfo', 'downloadFile', 'uploadFile', 'makePhoneCall', 'addCalendarEvent', 'openDeeplink', 'openPublicDeepLink', 'shareApp', 'previewImage', 'saveImage', 'getImageInfo'];
  methods.forEach(m => {
    window.ejsc[m] = (opts) => window.ejsc._invokeNative(m, opts);
  });
  window.ejscAsync = window.ejsc;
  window.ejsc.bioMetrics = {
    isSupported: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'isSupported' }),
    localAuth: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'localAuth' }),
    keyExists: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'keyExists' }),
    createKey: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'createKey' }),
    createSignature: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'createSignature' }),
    deleteKey: (opts) => window.ejsc._invokeNative('bioMetrics', { ...opts, action: 'deleteKey' }),
  };
})();
```

---

### 2. Loại: `SAFE_AREA`
- **File**: `webview_safe_area_injector.dart`
- **Mô tả**: Xử lý vùng an toàn (tai thỏ, notch) qua biến CSS.
- **Mã JavaScript**:
```javascript
(function() {
  const root = document.documentElement;
  
  root.style.setProperty('--ejsc-device-width', '{{deviceWidth}}px');
  root.style.setProperty('--ejsc-device-height', '{{deviceHeight}}px');
  root.style.setProperty('--ejsc-screen-width', '{{screenWidth}}px');
  root.style.setProperty('--ejsc-screen-height', '{{screenHeight}}px');
  root.style.setProperty('--ejsc-window-width', '{{windowWidth}}px');
  root.style.setProperty('--ejsc-window-height', '{{windowHeight}}px');

  root.style.setProperty('--ejsc-status-bar-height', '{{statusBarHeight}}px');
  root.style.setProperty('--ejsc-title-bar-height', '{{titleBarHeight}}px');

  root.style.setProperty('--ejsc-safe-top', '{{safeTop}}px');
  root.style.setProperty('--ejsc-safe-bottom', '{{safeBottom}}px');
  root.style.setProperty('--ejsc-safe-left', '{{safeLeft}}px');
  root.style.setProperty('--ejsc-safe-right', '{{safeRight}}px');

  root.style.setProperty('--ejsc-header-padding-left', '{{headerPaddingLeft}}px');
  root.style.setProperty('--ejsc-header-padding-right', '{{headerPaddingRight}}px');

  root.style.setProperty('--safe-top', '{{safeTop}}px');
  root.style.setProperty('--safe-bottom', '{{safeBottom}}px');
  root.style.setProperty('--is-real-device', '{{isRealDevice}}');

  const styleId = '__ejsc_safe_area_style__';
  let el = document.getElementById(styleId);
  if (!el) {
    el = document.createElement('style');
    el.id = styleId;
    document.head.appendChild(el);
  }
  el.textContent = `
    :root {
      --ejsc-device-width: {{deviceWidth}}px;
      --ejsc-device-height: {{deviceHeight}}px;
      --ejsc-screen-width: {{screenWidth}}px;
      --ejsc-screen-height: {{screenHeight}}px;
      --ejsc-window-width: {{windowWidth}}px;
      --ejsc-window-height: {{windowHeight}}px;

      --ejsc-status-bar-height: {{statusBarHeight}}px;
      --ejsc-title-bar-height: {{titleBarHeight}}px;

      --ejsc-safe-top: {{safeTop}}px;
      --ejsc-safe-bottom: {{safeBottom}}px;
      --ejsc-safe-left: {{safeLeft}}px;
      --ejsc-safe-right: {{safeRight}}px;

      --ejsc-header-padding-left: {{headerPaddingLeft}}px;
      --ejsc-header-padding-right: {{headerPaddingRight}}px;

      --safe-top: {{safeTop}}px;
      --safe-bottom: {{bottomHeight}}px;
      --is-real-device: {{isRealDevice}};
    }

    .top-\\[env\\(safe-area-inset-top\\,20px\\)\\] {
      top: {{safeTop}}px !important;
    }
  `;
})();
```

---

### 3. Loại: `EVENT`
- **File**: `bridge_event_emitter.dart`
- **Mã JavaScript**:
```javascript
if (window.ejsc && window.ejsc._onNativeEvent) {
  window.ejsc._onNativeEvent("{{eventName}}", {{dataJson}});
}
```

---

### 4. Loại: `SYNC_UI`
- **File**: `set_navigation_bar_handler.dart`
- **Mã JavaScript**:
```javascript
window.dispatchEvent(new CustomEvent('mock:setNavigationBar', {
  detail: {
    title: '{{title}}',
    backgroundColor: '{{backgroundColor}}',
    frontColor: '{{frontColor}}',
    visible: {{visible}},
    immersive: {{immersive}},
    backIcon: '{{backIcon}}',
    statusBarStyle: '{{statusBarStyle}}'
  }
}));
```

---

### 5. Loại: `RESPONSE`
- **File**: `mini_app_webview_page.dart`
- **Mã JavaScript**:
```javascript
window.ejsc._onNativeResponse({{id}}, {{responseJson}});
```
