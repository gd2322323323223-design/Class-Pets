/* Firebase 初始化：匿名登入後再使用 Realtime Database */
(function initFirebaseGlobal() {
  var cfg = typeof window !== "undefined" ? window.FIREBASE_CONFIG : null;

  function rejectReady(message) {
    window.__firebaseInitError = message;
    window.__firebaseReady = Promise.reject(new Error(message));
  }

  if (typeof firebase === "undefined") {
    rejectReady("Firebase SDK 尚未載入，請確認已引入 firebase-app.js 與 firebase-auth.js。");
    return;
  }
  if (!cfg || !cfg.apiKey || !cfg.databaseURL) {
    rejectReady(
      "Firebase 設定不完整，請在 firebase-config.js 填入 apiKey 與 databaseURL。"
    );
    return;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(cfg);
  }

  window.__firebaseReady = new Promise(function (resolve, reject) {
    var database = firebase.database();
    var auth = typeof firebase.auth === "function" ? firebase.auth() : null;

    function finish() {
      window.__firebaseDb = database;
      resolve(database);
    }

    if (!auth) {
      reject(
        new Error("Firebase Auth 未載入，請確認 index.html 已引入 firebase-auth.js。")
      );
      return;
    }

    auth
      .signInAnonymously()
      .then(function () {
        finish();
      })
      .catch(function (err) {
        console.warn("[Firebase] 匿名登入失敗", err);
        var code = err && err.code ? String(err.code) : "";
        var message;
        if (
          code === "auth/configuration-not-found" ||
          code === "auth/operation-not-allowed"
        ) {
          message =
            "Firebase Authentication 尚未完成設定。\n" +
            "請至 Firebase 主控台 → Authentication：\n" +
            "1. 若首次使用，請先按「開始使用」\n" +
            "2. 登入方法 → 匿名 → 啟用\n" +
                "3. 確認 firebase-config.js 的 apiKey 與 databaseURL 來自同一 Firebase 專案";
        } else {
          message =
            (err && err.message) ||
            "Firebase 匿名登入失敗，請檢查 Authentication 設定與網路。";
        }
        window.__firebaseInitError = message;
        reject(new Error(message));
      });
  });
})();
