// 複製此檔為 firebase-config.js，並填入 Firebase 主控台「專案設定 → 一般」中的完整設定。
// Realtime Database 網址：https://classpets-61912-default-rtdb.firebaseio.com
//
// ★ 若出現「Permission denied / 無法連接雲端」，請到 Firebase 主控台設定：
// 1. Authentication → Sign-in method → 匿名 (Anonymous) → 啟用
// 2. Realtime Database → 規則 (Rules)，擇一：
//    方案 A（建議，需匿名登入）：
//    {
//      "rules": {
//        ".read": "auth != null",
//        ".write": "auth != null"
//      }
//    }
//    方案 B（僅測試／內網，較開放）：
//    {
//      "rules": {
//        ".read": true,
//        ".write": true
//      }
//    }
window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "classpets-61912.firebaseapp.com",
  databaseURL: "https://classpets-61912-default-rtdb.firebaseio.com",
  projectId: "classpets-61912",
  storageBucket: "classpets-61912.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
