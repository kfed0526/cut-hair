# Nickson 的小小理髮店 · Cut Hair

從 Panda School `20261021.v2` 複製的獨立剪髮遊戲。開啟就能幫 Nickson 剪頭髮，不需原專案、課本、小鎮地圖、帳號或網路語音服務，不受原理髮店營業時間限制。

線上版本：<https://kfed0526.github.io/cut-hair/>

## 開始玩

需要 Node.js 20 以上，不需 `npm install`。

```powershell
cd D:\project\cut-hair
npm start
```

在瀏覽器開啟 <http://localhost:4176/>，按「開始剪髮」即可玩。Windows 也能雙擊 `start.cmd` 啟動，保持該視窗開著，再開上述網址；不要直接雙擊 index.html。若4176被其他程式使用，可用 `$env:PORT=4177; npm start` 改埠號。

## 保留的玩法

- 點頭髮／拖剪刀剪短；左邊、瀏海、右邊按鈕也能操作，支援鍵盤。
- 梳頭、吹整、比較剪前後、完成造型、讓頭髮長回來。
- 明顯虛構化的繪本動畫角色與配對短髮底圖、11段中文語音、剪髮音效、呼吸與落髮效果。
- 家長可調語音／音效音量、1–5語速及動畫；設定使用獨立的 `cut-hair-settings`，不讀寫 Panda School。
- 切到背景自動休息；回來按繼續。離開會清理聲音、手勢及效果；減少動態會停用人物／落髮動畫。

造型只保留當次頁面，重新整理會重來。不會改寫原照，不使用真剪刀、不上傳照片。

## 開發與檢查

```powershell
npm test
npm run check
node scripts/asset-manifest.mjs
```

最後一行只在改動程式／圖片／語音後重建資源完整性清單，不升版或發布。`asset-manifest.json`不是 Service Worker 快取；此版仍需本機 HTTP 伺服器，沒有承諾關閉伺服器後仍能開網頁。

原遊戲核心是 salon.js、salon-model.js、salon-art.js、salon-voice.js、salon.css；speech.js／sounds.js沿用原共用音訊實作。app.js／settings.js／style.css為獨立入口與設定，server.mjs從自己的資料夾提供檔案。來源與差異見SOURCE.json，素材完整提示在assets/salon.prompts.json。

公開版使用兩張V4繪本角色PNG來源與WebP，刻意簡化五官、膚質及髮絲以降低真人辨識度；V3衍生圖只留在本機並由`.gitignore`排除，提示則保留作來源紀錄，兩者都不進入瀏覽器資源清單。原始私人JPG、舊V1／V2圖片、其他場景、教材、相簿、瀏覽器紀錄與家長PIN均未複製。

原始碼公開於 <https://github.com/kfed0526/cut-hair>，GitHub Pages 從 `main` 分支根目錄發佈。
