/** Four scenes have three transitions; the incoming scene wipes from right to left. */
export function chapterInset(progress:number,index:number):number{
 if(index===0)return 0;
 const transition=Math.max(0,Math.min(1,progress*3-(index-1)));
 return (1-transition)*100;
}
