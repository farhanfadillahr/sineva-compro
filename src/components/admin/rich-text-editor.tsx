'use client'
import { useId, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { validateCopyField } from '@/lib/copy/dash-rule'
import { Dialog } from './overlays'
import s from './admin.module.css'
const blocks=['Paragraf','Judul H2','Judul H3','Daftar berpoin','Daftar bernomor','Kutipan','Blok kode','Garis pemisah']
export function isSafeEditorUrl(value:string){if(/^\/(?!\/)/.test(value))return true;try{return ['http:','https:','mailto:','tel:'].includes(new URL(value).protocol)}catch{return false}}
export function RichTextEditor({label,name,defaultValue,onChange,onPickImage,searchInternalLinks}:{label:string;name:string;defaultValue?:JSONContent;onChange:(value:JSONContent)=>void;onPickImage?:(editor:Editor)=>void;searchInternalLinks?:(search:string)=>Promise<{label:string;href:string}[]>}) {
 const id=useId();const [snapshot,setSnapshot]=useState<{json:JSONContent;text:string}>({json:defaultValue??{type:'doc',content:[{type:'paragraph'}]},text:''})
 const [slash,setSlash]=useState(false);const slashRef=useRef(false);slashRef.current=slash
 const [slashIndex,setSlashIndex]=useState(0);const indexRef=useRef(0);indexRef.current=slashIndex
 const [linkOpen,setLinkOpen]=useState(false);const [url,setUrl]=useState('');const [linkError,setLinkError]=useState('');const [internal,setInternal]=useState<{label:string;href:string}[]>([])
 const editorRef=useRef<Editor|null>(null);const onChangeRef=useRef(onChange);onChangeRef.current=onChange
 const selectBlockRef=useRef<(index:number)=>void>(()=>{})
 const editor=useEditor({
  immediatelyRender:false,extensions:[StarterKit.configure({heading:{levels:[2,3]},link:{openOnClick:false,protocols:['https','http','mailto','tel']},strike:false,underline:false})],content:defaultValue??{type:'doc',content:[{type:'paragraph'}]},
  onUpdate:({editor})=>{const next={json:editor.getJSON(),text:editor.getText()};setSnapshot(next);onChangeRef.current(next.json)},
  editorProps:{attributes:{role:'textbox','aria-label':label,'aria-multiline':'true','aria-describedby':`${id}-stats`},
   handlePaste:(view,event)=>{const plain=event.clipboardData?.getData('text/plain');if(plain===undefined)return false;event.preventDefault();view.dispatch(view.state.tr.insertText(plain));return true},
   handleKeyDown:(view,event)=>{
    if(event.key==='/'&&view.state.selection.$from.parent.textContent===''){setSlash(true);setSlashIndex(0);return false}
    if(!slashRef.current)return false
    if(event.key==='Escape'){setSlash(false);return true}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){setSlashIndex(i=>(i+(event.key==='ArrowDown'?1:blocks.length-1))%blocks.length);return true}
    if(event.key==='Enter'){selectBlockRef.current(indexRef.current);return true}
    if(event.key!=='Shift')setSlash(false)
    return false
   },
  },
 })
 editorRef.current=editor
 function block(index:number){if(!editor)return;const chain=editor.chain().focus();if(index===0)chain.setParagraph().run();else if(index===1||index===2)chain.setHeading({level:index===1?2:3}).run();else if(index===3)chain.toggleBulletList().run();else if(index===4)chain.toggleOrderedList().run();else if(index===5)chain.toggleBlockquote().run();else if(index===6)chain.toggleCodeBlock().run();else chain.setHorizontalRule().run()}
 selectBlockRef.current=(index)=>{if(!editorRef.current)return;const current=editorRef.current;const pos=current.state.selection.$from;if(pos.parent.textContent.startsWith('/'))current.commands.deleteRange({from:pos.start(),to:pos.start()+1});block(index);setSlash(false)}
 const words=snapshot.text.trim()?snapshot.text.trim().split(/\s+/).length:0;const copy=validateCopyField(snapshot.text)
 function applyLink(){const next=url.trim();if(next&&!isSafeEditorUrl(next)){setLinkError('Gunakan URL http, https, mailto, tel, atau jalur internal.');return}if(next)editor?.chain().focus().extendMarkRange('link').setLink({href:next}).run();else editor?.chain().focus().unsetLink().run();setLinkOpen(false)}
 const toolbar=(text:string,action:()=>void,pressed?:boolean)=><button className={s.button} type="button" onClick={action} aria-pressed={pressed} disabled={!editor}>{text}</button>
 return <div className={s.panel}><div className={s.editorToolbar} role="group" aria-label={`Format ${label}`}><label>Gaya paragraf <select aria-label="Gaya paragraf" value={editor?.isActive('heading',{level:2})?'h2':editor?.isActive('heading',{level:3})?'h3':'paragraph'} disabled={!editor} onChange={e=>block(e.target.value==='h2'?1:e.target.value==='h3'?2:0)}><option value="paragraph">Paragraf</option><option value="h2">H2</option><option value="h3">H3</option></select></label>{toolbar('Tebal',()=>editor?.chain().focus().toggleBold().run(),editor?.isActive('bold'))}{toolbar('Miring',()=>editor?.chain().focus().toggleItalic().run(),editor?.isActive('italic'))}{toolbar('Tautan',()=>{setUrl(editor?.getAttributes('link').href??'');setLinkError('');setLinkOpen(true)})}{blocks.slice(3).map((text,i)=><span key={text}>{toolbar(text,()=>block(i+3))}</span>)}{onPickImage?toolbar('Gambar',()=>{if(editor)onPickImage(editor)}):null}{toolbar('Urungkan',()=>editor?.chain().focus().undo().run())}{toolbar('Ulangi',()=>editor?.chain().focus().redo().run())}</div><EditorContent editor={editor} className={s.editorContent}/><input type="hidden" name={name} value={JSON.stringify(snapshot.json)}/>{slash?<div role="menu" aria-label="Sisipkan blok" className={s.panel}>{blocks.map((text,i)=><button key={text} className={s.button} type="button" role="menuitem" tabIndex={i===slashIndex?0:-1} aria-current={i===slashIndex?true:undefined} onMouseDown={e=>e.preventDefault()} onClick={()=>selectBlockRef.current(i)}>{text}</button>)}</div>:null}<footer id={`${id}-stats`} className={`${s.row} ${s.muted}`}><span>{words} kata · {Math.max(1,Math.ceil(words/200))} menit baca</span><span>Ketik / pada paragraf kosong untuk memilih blok.</span></footer>{!copy.ok?<p role="alert" className={s.error}>{copy.message}</p>:null}<Dialog open={linkOpen} onClose={()=>setLinkOpen(false)} title="Tautan" onConfirm={applyLink} confirmLabel="Terapkan tautan"><div className={s.field}><label htmlFor={`${id}-url`}>URL tautan</label><input id={`${id}-url`} value={url} onChange={e=>setUrl(e.target.value)} aria-invalid={!!linkError} aria-describedby={linkError?`${id}-url-error`:undefined}/>{linkError?<p id={`${id}-url-error`} role="alert" className={s.error}>{linkError}</p>:null}{searchInternalLinks?<><label>Cari halaman internal<input type="search" onChange={async e=>{try{setInternal(await searchInternalLinks(e.target.value))}catch{setLinkError('Pencarian gagal. Coba lagi.')}}/></label><ul>{internal.filter(i=>isSafeEditorUrl(i.href)).map(i=><li key={i.href}><button type="button" className={s.button} onClick={()=>setUrl(i.href)}>{i.label}</button></li>)}</ul></>:null}</div></Dialog></div>
}
