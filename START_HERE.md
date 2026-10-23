# 從這裡開始

2026-10-23 發布：使用者已明確授權將此離線版推送至 GitHub 並更新 GitHub Pages。以下「尚未發布」敘述記錄先前本機驗證階段；本次發布以此版離線功能為內容，實體 iPad／Safari 仍待裝置驗證。

這是獨立的 `cut-hair`，不是 Panda School 子頁。先讀AGENTS.md、README.md、DEVELOPMENT_STATUS.md及VALIDATION.md；來源見SOURCE.json。

一般啟動只需Node：`npm start`，開啟http://localhost:4176/。無需原專案、不安裝套件、不登入。`npm test`驗證遊戲與音訊；`npm run check`核對資源完整性。更動可用資源後重建`node scripts/asset-manifest.mjs`。

公開版本：<https://kfed0526.github.io/cut-hair/>；repository：<https://github.com/kfed0526/cut-hair>。

本專案已獨立初始化Git並透過GitHub Pages公開；未升Panda School版本。不要假設原機瀏覽器紀錄或開發用工具路徑存在。

2026-10-23 本機新增 iPad 離線版，尚未發布。`manifest.webmanifest`、主畫面圖示及 `offline.js` 配合 `sw.js` 完整快取約 3.4 MB；第一次需用 HTTPS 連網下載。Safari 加入主畫面後，須從主畫面再開一次並確認「離線準備完成」，再斷網玩。完整操作見 README。修改執行期資源或 `scripts/sw-template.txt` 後，執行 `node scripts/asset-manifest.mjs` 同時更新完整性清單與快取版本；不要手改產生的 `sw.js`。發布仍需使用者當次明確授權。
