'use client'
import { useId, type ReactNode } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import s from './admin.module.css'
export function SortableList<T extends {id:string;label:string}>({label,items,onChange,renderItem}:{label:string;items:T[];onChange:(items:T[])=>void;renderItem:(item:T)=>ReactNode}) {
 const id=useId();const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:8}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}))
 return <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} accessibility={{screenReaderInstructions:{draggable:'Tekan Spasi untuk mengambil. Gunakan panah untuk memindahkan. Tekan Spasi untuk meletakkan, Escape untuk membatalkan.'},announcements:{onDragStart:({active})=>`${items.find(i=>i.id===active.id)?.label} diambil.`,onDragOver:({active,over})=>over?`${items.find(i=>i.id===active.id)?.label} di posisi ${items.findIndex(i=>i.id===over.id)+1}.`:undefined,onDragEnd:({active,over})=>over?`${items.find(i=>i.id===active.id)?.label} diletakkan di posisi ${items.findIndex(i=>i.id===over.id)+1}.`:'Pemindahan dibatalkan.',onDragCancel:()=> 'Pemindahan dibatalkan.'}}} onDragEnd={({active,over})=>{if(over&&active.id!==over.id)onChange(arrayMove(items,items.findIndex(i=>i.id===active.id),items.findIndex(i=>i.id===over.id)))}}><SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}><ol className={s.list} aria-label={label}>{items.map(item=><SortableItem key={item.id} id={item.id} label={item.label}>{renderItem(item)}</SortableItem>)}</ol></SortableContext></DndContext>
}
function SortableItem({id,label,children}:{id:string;label:string;children:ReactNode}) {
 const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,isDragging}=useSortable({id})
 return <li ref={setNodeRef} className={s.row} style={{transform:CSS.Transform.toString(transform),position:'relative',zIndex:isDragging?2:undefined}}><button ref={setActivatorNodeRef} className={s.button} {...attributes} {...listeners} type="button" aria-label={`Pindahkan ${label}`}>↕</button>{children}</li>
}
