export interface SummonKeyEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
}

export function summonKey(event: SummonKeyEvent, editable: boolean, blocked: boolean): string | null {
  if (editable || blocked || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return null;
  if (event.key === '/') return '';
  return /^\p{L}$/u.test(event.key) ? event.key : null;
}

export function shouldHoldSpace(event:{code:string;ctrlKey?:boolean;metaKey?:boolean;altKey?:boolean;isComposing?:boolean},editable:boolean,draft:string):boolean{return event.code==='Space'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.isComposing&&(!editable||!draft.trim());}
