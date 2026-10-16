// @vitest-environment jsdom
import React, { useState } from 'react'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanup, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePicker } from '@/components/admin/date-picker'
import { SortableList } from '@/components/admin/sortable-list'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { Toast, InlineBanner, Progress } from '@/components/admin/feedback'
import { Avatar, StatCard, ListCard, ActivityFeed, CompletenessCard, DescriptionList, EmptyState, Skeleton, Tooltip } from '@/components/admin/display'
beforeAll(()=>{HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}})
afterEach(cleanup)
it('selects an Indonesian Monday-first calendar date and returns a UTC ISO value',async()=>{
 const user=userEvent.setup();let iso=''
 render(<DatePicker label="Tanggal terbit" value="2026-10-15T00:00:00.000Z" onChange={v=>{iso=v??''}} />)
 await user.click(screen.getByRole('button',{name:/Tanggal terbit/}))
 const dialog=screen.getByRole('dialog',{name:'Tanggal terbit'})
 expect(within(dialog).getByRole('columnheader',{name:/Senin/})).toBeTruthy()
 await user.click(within(dialog).getByRole('button',{name:/Jumat, 16 Oktober 2026/}))
 expect(iso).toMatch(/^2026-10-16T.*Z$/)
})
it('moves a sortable item with Space, arrows and Space and announces the result',async()=>{
 const user=userEvent.setup()
 function Fixture(){const [items,set]=useState([{id:'a',label:'Pertama'},{id:'b',label:'Kedua'}]);return <SortableList label="Urutan" items={items} onChange={set} renderItem={i=>i.label} />}
 render(<Fixture/>);screen.getByRole('button',{name:'Pindahkan Pertama'}).focus();await user.keyboard(' {ArrowDown} ')
 await waitFor(()=>expect(screen.getAllByRole('listitem').map(i=>i.textContent?.replace('↕','').trim())).toEqual(['Kedua','Pertama']))
})
it('edits structured Tiptap JSON, marks a heading, flags forbidden punctuation and supports slash blocks',async()=>{
 const user=userEvent.setup();let json=''
 render(<RichTextEditor label="Isi artikel" name="body" onChange={v=>{json=JSON.stringify(v)}} />)
 const input=await screen.findByRole('textbox',{name:'Isi artikel'})
 await user.click(input);await user.type(input,'Halo — tim')
 expect(json).toContain('Halo — tim');expect(screen.getByRole('alert').textContent).toContain('Gunakan koma')
 await user.selectOptions(screen.getByLabelText('Gaya paragraf'),'h2')
 await waitFor(()=>expect(json).toContain('heading'))
 expect(screen.getByText(/3 kata/)).toBeTruthy()
 await user.click(input);await user.keyboard('{ControlOrMeta>}{a}{/ControlOrMeta}')
 await user.type(input,'/')
 expect(screen.getByRole('menu',{name:'Sisipkan blok'})).toBeTruthy()
})
it('announces feedback, clamps progress and exposes retry and dismiss actions',async()=>{
 const user=userEvent.setup();let retry=false;let dismissed=false
 render(<><Toast tone="error" message="Gagal menyimpan" onRetry={()=>{retry=true}} onDismiss={()=>{dismissed=true}}/><InlineBanner tone="warning">Perubahan belum disimpan</InlineBanner><Progress label="Unggah" value={140}/></>)
 expect(screen.getByRole('status').textContent).toContain('Gagal menyimpan')
 expect((screen.getByRole('progressbar',{name:'Unggah'}) as HTMLProgressElement).value).toBe(100)
 await user.click(screen.getByRole('button',{name:'Coba lagi'}));await user.click(screen.getByRole('button',{name:'Tutup notifikasi'}));expect(retry&&dismissed).toBe(true)
})
it('renders real summary, feed, completeness links and labelled display states',async()=>{
 const user=userEvent.setup()
 render(<><Avatar name="Farhan Rafi"/><StatCard label="Draft" value={3} href="/admin/blog?status=draft"/><ListCard title="Terbaru" href="/admin/blog" items={[{id:'1',title:'Artikel A',href:'/admin/blog/1'}]}/><ActivityFeed items={[{id:'1',actor:'Farhan',action:'menerbitkan Artikel A',date:'2026-10-15T12:00:00Z'}]}/><CompletenessCard locales={[{code:'en',percent:50,missing:[{label:'Judul',href:'#title'}]}]}/><DescriptionList items={[{label:'Email',value:'hello@example.com'}]}/><EmptyState message="Belum ada artikel" action={<a href="/admin/blog/new">Tambah artikel</a>}/><Skeleton label="Memuat panel"/><Tooltip label="Informasi tanggal"><button>Tanggal</button></Tooltip></>)
 expect(screen.getByRole('img',{name:'Farhan Rafi'}).textContent).toBe('FR')
 expect(screen.getByRole('link',{name:/Draft.*3/}).getAttribute('href')).toBe('/admin/blog?status=draft')
 expect(screen.getByRole('link',{name:'Judul'}).getAttribute('href')).toBe('#title')
 expect(screen.getByRole('progressbar',{name:'EN'}).getAttribute('value')).toBe('50')
 await user.tab();screen.getByRole('button',{name:'Tanggal'}).focus()
 await waitFor(()=>expect(screen.getByRole('tooltip').textContent).toBe('Informasi tanggal'))
})
