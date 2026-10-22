export const SALON_CHARACTERS=[
 {id:'nickson',label:'Nickson',icon:'🙂',hairLabel:'頭髮',cutLabel:'剪髮',portrait:'assets/characters/nickson-salon-storybook-v4.webp',shortPortrait:'assets/characters/nickson-salon-storybook-short-v4.webp',alt:'虛構化的柔和繪本動畫角色 Nickson，穿著黑色理髮圍布'},
 {id:'cat',label:'貓咪',icon:'🐱',hairLabel:'毛髮',cutLabel:'剪毛',portrait:'assets/characters/cat-salon-storybook.webp',shortPortrait:'assets/characters/cat-salon-storybook-short.webp',alt:'橘色虎斑貓繪本動畫角色，有棕色長毛造型並穿著黑色理髮圍布'},
 {id:'dog',label:'狗狗',icon:'🐶',hairLabel:'毛髮',cutLabel:'剪毛',portrait:'assets/characters/dog-salon-storybook.webp',shortPortrait:'assets/characters/dog-salon-storybook-short.webp',alt:'金棕色垂耳狗繪本動畫角色，有棕色長毛造型並穿著黑色理髮圍布'},
 {id:'monkey',label:'猴子',icon:'🐵',hairLabel:'毛髮',cutLabel:'剪毛',portrait:'assets/characters/monkey-salon-storybook.webp',shortPortrait:'assets/characters/monkey-salon-storybook-short.webp',alt:'棕色卷尾猴繪本動畫角色，有棕色長毛造型並穿著黑色理髮圍布'}
];
export function salonCharacter(id){return SALON_CHARACTERS.find(character=>character.id===id)||SALON_CHARACTERS[0];}
export function salonCharacterText(id,text){const character=salonCharacter(id);return text.replaceAll('Nickson',character.label).replaceAll('頭髮',character.hairLabel).replaceAll('剪髮',character.cutLabel);}
