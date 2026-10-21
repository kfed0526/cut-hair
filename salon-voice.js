export const SALON_CUES={
 welcome:'鏡子裡是 Nickson！選剪刀，剪遊戲裡的頭髮。',
 safety:'真的剪刀，要請大人幫忙。',
 scissors:'碰一碰頭髮，或慢慢拖動剪刀。',
 comb:'拿梳子，幫頭髮梳一梳。',
 dryer:'拿吹風機，吹一吹頭髮。',
 trimmed:'喀嚓！頭髮變短了。',
 grown:'頭髮長回來了，再剪一次吧！',
 finished:'造型完成！這就是你的小小理髮店。',
 before:'這是剪頭髮之前的樣子。',
 after:'這是你剪好的樣子。',
 resume:'準備好了，我們繼續玩。'
};
export function salonCue(state){return state.before?SALON_CUES.before:state.done?SALON_CUES.finished:SALON_CUES[state.tool];}
export const salonVoiceTexts=()=>[...new Set(Object.values(SALON_CUES))];
