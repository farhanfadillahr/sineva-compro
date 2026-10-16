'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import s from './admin.module.css'
export function InlineBanner({tone='info',children}:{tone?:'info'|'warning'|'error';children:ReactNode}){return <div className={`${s.banner} ${tone==='error'?s.error:tone==='warning'?s.warning:''}`} role={tone==='error'?'alert':'note'}>{children}</div>}
export function Progress({label,value}:{label:string;value:number}){return <progress className={s.progress} aria-label={label} max={100} value={Math.min(100,Math.max(0,value))}/>}
function CheckPop(){const ref=useRef<HTMLSpanElement>(null)
 useEffect(()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;let disposed=false;let destroy:(()=>void)|undefined
 void import('lottie-web').then(({default:lottie})=>{if(disposed||!ref.current)return;const color=getComputedStyle(ref.current).color.match(/[\d.]+/g)?.slice(0,3).map(n=>Number(n)/255)??[0,0,0];const animation=lottie.loadAnimation({container:ref.current,renderer:'svg',loop:false,autoplay:true,animationData:{v:'5.13.0',fr:30,ip:0,op:8,w:24,h:24,nm:'check-pop',ddd:0,assets:[],layers:[{ddd:0,ind:1,ty:4,nm:'check',sr:1,ks:{o:{a:0,k:100},r:{a:0,k:0},p:{a:0,k:[4,5,0]},a:{a:0,k:[0,0,0]},s:{a:0,k:[100,100,100]}},ao:0,shapes:[{ty:'sh',ks:{a:0,k:{i:[[0,0],[0,0],[0,0]],o:[[0,0],[0,0],[0,0]],v:[[0,7],[5,12],[15,0]],c:false}},nm:'path'},{ty:'st',c:{a:0,k:[...color,1]},o:{a:0,k:100},w:{a:0,k:2},lc:2,lj:2,nm:'stroke'},{ty:'tm',s:{a:0,k:0},e:{a:1,k:[{t:0,s:[0],e:[100],o:{x:[.2],y:[0]},i:{x:[.8],y:[1]}},{t:7,s:[100]}]},o:{a:0,k:0},m:1}],ip:0,op:8,st:0,bm:0}]}});destroy=()=>animation.destroy()}).catch(()=>{/* The static check remains if animation cannot load. */})
 return()=>{disposed=true;destroy?.()}
 },[])
 return <span ref={ref} aria-hidden style={{display:'inline-block',width:24,height:24,color:'var(--admin-success)'}}>✓</span>
}
export function Toast({tone='success',message,onRetry,onDismiss}:{tone?:'success'|'error';message:string;onRetry?:()=>void;onDismiss:()=>void}) {return <div className={`${s.panel} ${s.toast}`} role="status" aria-live="polite"><div className={s.row}>{tone==='success'?<CheckPop/>:null}<span>{message}</span><button className={s.button} type="button" aria-label="Tutup notifikasi" onClick={onDismiss}>×</button>{onRetry?<button className={s.button} type="button" onClick={onRetry}>Coba lagi</button>:null}</div></div>}
