# Nickson 的小小理髮店 · Cut Hair

從 Panda School `20261021.v2` 複製的獨立剪髮遊戲。開啟後可幫 Nickson 剪頭髮，也可選貓咪、狗狗或猴子來剪毛，不需原專案、課本、小鎮地圖、帳號或網路語音服務，不受原理髮店營業時間限制。

線上版本：<https://kfed0526.github.io/cut-hair/>

## iPad 離線玩

本版支援加入主畫面的離線遊戲：

1. 在 iPad 用 Safari 開啟網站，保持連網，等待「✓ 離線準備完成」。全部角色、程式和 11 段語音約 3.4 MB，下載失敗可按「重試離線下載」。
2. 按 Safari「分享」→「加入主畫面」。
3. 從主畫面的「小小理髮店」開啟，保持連網直到這裡也顯示「離線準備完成」。
4. 開飛航模式，關掉遊戲再從主畫面重開，確認可以開始、換角色及聽語音。此後無需電腦或本機伺服器。

首次下載需要連網；清除網站資料或裝置回收儲存空間後需要重新下載。造型不會跨次保存，家長設定仍保存在這個遊戲。新版先在背景下載，關閉所有遊戲視窗後再開啟才套用，不會在剪髮中強制更新。

一般區域網路 `http://電腦IP:4176` 可測試畫面，但不符合離線安裝所需的安全連線；正式在 iPad 使用請透過 HTTPS 網站。電腦開發可用 `http://localhost:4176/`。

## 開始玩

需要 Node.js 20 以上，不需 `npm install`。

```powershell
cd D:\project\cut-hair
npm start
```

在瀏覽器開啟 <http://localhost:4176/>，按「開始剪髮」即可玩。Windows 也能雙擊 `start.cmd` 啟動，保持該視窗開著，再開上述網址；不要直接雙擊 index.html。若4176被其他程式使用，可用 `$env:PORT=4177; npm start` 改埠號。

## 保留的玩法

- 點頭髮／拖剪刀剪短；左邊、瀏海、右邊按鈕也能操作，支援鍵盤。
- 可切換 Nickson、貓咪、狗狗與猴子；人物顯示「頭髮／剪髮」，動物顯示「毛髮／剪毛」，每位角色都有對位的長／短造型圖。
- 洗髮精可分區洗出泡泡；洗頭時角色會眨眼微笑，吹風時會瞇眼鼓嘴。吹乾後有完成回饋，也可保留濕髮自由創作。
- 梳頭、吹整、比較剪前後、完成造型、讓頭髮長回來。
- 明顯虛構化的繪本動畫角色與配對短髮底圖、11段中文語音、剪髮音效、呼吸與落髮效果。
- 家長可調語音／音效音量、1–5語速及動畫；設定使用獨立的 `cut-hair-settings`，不讀寫 Panda School。
- 切到背景自動休息；回來按繼續。離開會清理聲音、手勢及效果；減少動態會停用人物、泡泡、表情與落髮動畫，但保留靜態狀態提示。

造型只保留當次頁面，重新整理會重來。不會改寫原照，不使用真剪刀、不上傳照片。

## 開發與檢查

```powershell
npm test
npm run check
node scripts/asset-manifest.mjs
```

最後一行在改動程式／圖片／語音後，同時重建資源完整性清單與 `sw.js`。`asset-manifest.json`本身不是快取；產生的 Service Worker 會完整下載清單內的資源，成功後才提供離線遊玩。清單或快取程式改變會自動產生新的快取版本，不升版或發布。

開發用瀏覽器回歸：`node scripts/browser-smoke.mjs <Playwright的node_modules路徑>`。離線回歸：`node scripts/offline-smoke.mjs <Playwright的node_modules路徑>`，涵蓋根目錄／`/cut-hair/`、斷網重新開啟、伺服器不可用、所有角色／語音、音訊分段請求、下載失敗重試及更新等待。Playwright 只供開發驗證，遊戲不需要安裝套件。

原遊戲核心是 salon.js、salon-model.js、salon-art.js、salon-voice.js、salon.css；speech.js／sounds.js沿用原共用音訊實作。app.js／settings.js／style.css為獨立入口與設定，server.mjs從自己的資料夾提供檔案。來源與差異見SOURCE.json，素材完整提示在assets/salon.prompts.json。

目前本機版使用四組、共八張對位的透明WebP；Nickson沿用V4虛構繪本造型，貓咪、狗狗與猴子是原創的非真人繪本角色。V3 Nickson 衍生圖只留在本機並由`.gitignore`排除，提示則保留作來源紀錄，兩者都不進入瀏覽器資源清單。原始私人JPG、舊V1／V2圖片、其他場景、教材、相簿、瀏覽器紀錄與家長PIN均未複製。

原始碼公開於 <https://github.com/kfed0526/cut-hair>，GitHub Pages 從 `main` 分支根目錄發佈。
