# 驗證紀錄

2026-10-21獨立剪髮專案：核心從已發布Panda School複製，移除import版本query，原剪髮模型／互動／音訊不重寫。0.2.0公開版使用兩張V4虛構繪本角色PNG／WebP及11段WAV；V3衍生圖只作來源紀錄，未複製私人JPG、教材或瀏覽器紀錄。

測試包含原20項理髮店、7項音訊播放、7項合成音效，以及6項獨立入口／設定／資源與HTTP伺服器檢查。瀏覽器需另檢查1180×714與320×800的剪短／比較／長回來、工具、拖曳／點選／鍵盤、照片重試、實際WAV播放、靜音、音量／語速、設定隔離、背景與離場取消。

40項Node測試全數通過；npm run check核對25個本機瀏覽器資源與SHA-256／大小、11段WAV、所有本機import及交接文件。瀏覽器執行時全部請求指向此專案伺服器，無原Panda School或第三方服務請求。

Chromium 1180×714／320×800（模擬觸控）完成開始按鈕／inert防誤觸、點臉不剪、點頭髮與拖曳剪短、三區鍵盤操作、梳頭／吹風、剪前後、剪到最短／完成／長回來。觸控pointercancel會清掉手勢；背景需明確繼續、pagehide銷毀後pageshow恢復仍需明確繼續，頭髮狀態保留。

1180模式實際WAV currentTime前進，語速2為0.875、音量70%為0.7；320模式語音0且工具音效0不建立播放或AudioContext。家長調速、調音量及關動畫後重載仍保留設定；種入nickson-settings／nickson-records作哨兵，前後完全未變。兩尺寸無水平溢出、pageerror或非預期HTTP錯誤，截圖與結果在忽略的.local-assets/validation/。

長／短人像各故意在開始前載入失敗，仍能顯示重試、暫停工具並重新載入恢復。獨立入口的mount檢查已完成但naturalWidth為0的照片，補接既有photoError，避免開始前錯過error事件。首段Audio.play故意拒絕後，點喇叭可重試。Playwright測試以DOM捲動避開呼吸動畫的等待穩定條件，不停用正式遊戲動態。

核心salon-model／salon-voice／salon.css／speech／sounds、音檔映射與原檔雜湊核對相同；salon.js及salon-art.js只去掉原發布query，另將執行期人像切換至V4。Panda School Git工作樹保持乾淨、原324項回歸通過。

asset-manifest.json為資源完整性清單，不代表離線快取。未宣稱實體iPad／Safari、揚聲器主觀聽感或關閉伺服器後離線遊玩。

0.2.0公開版重新執行40項Node測試及`npm run check`，全部通過；資源清單仍為25個瀏覽器資源與11段WAV。GitHub Pages建置成功，公開網址https://kfed0526.github.io/cut-hair/可載入。實際部署頁以1180×714及320×800瀏覽器viewport檢查：V4長髮角色成功載入、短髮圖naturalWidth為900、手機版scrollWidth等於clientWidth，未見水平溢出。這是瀏覽器模擬尺寸驗證，不是實體裝置驗證。
