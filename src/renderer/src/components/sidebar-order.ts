// The person's order of their DMs and of the agents in the sidebar (settings.sidebarOrder), apart
// from the channels'. Each list is a ChannelLayout with no groups, so it reuses the channels' moves.
// Kept in its own file so the sidebar only hooks it up: a row moves only within its own list.
import { useRef, type DragEvent } from 'react'
import { L } from '../../../shared/lang'
import { arrange, moveChannel, nudgeChannel, type ChannelLayout } from '../../../shared/channel-layout'
import type { Settings } from '../../../shared/types'
import type { MenuItem } from './Dialogs'

export type OrderedList = 'dms' | 'agents'
type SidebarOrder = NonNullable<Settings['sidebarOrder']>

// Everything a saved layout arranges, in one run: a stray group (a bad value) loses no row.
export function ordered<T extends { id: string }>(items: T[], saved?: ChannelLayout | null): T[] {
  const now = arrange(items, saved)
  return [...now.loose, ...now.groups.flatMap((g) => g.channels)]
}

// The new sidebarOrder after moving `id` in `list`: before another, or last with no `before`.
export function movedIn(order: SidebarOrder | undefined, list: OrderedList, items: { id: string }[], id: string, before?: string): SidebarOrder {
  return { ...order, [list]: moveChannel(items, order?.[list], id, { before }) }
}

export function nudgedIn(order: SidebarOrder | undefined, list: OrderedList, items: { id: string }[], id: string, by: -1 | 1): SidebarOrder {
  return { ...order, [list]: nudgeChannel(items, order?.[list], id, by) }
}

export function useSidebarOrder<D extends { id: string }, A extends { id: string }>(order: SidebarOrder | undefined, dms: D[], agents: A[], save: (next: SidebarOrder) => void) {
  const lists = { dms: ordered(dms, order?.dms), agents: ordered(agents, order?.agents) }
  // Its own drag, apart from the channels': a DM never lands among the channels or the agents.
  const dragged = useRef<{ list: OrderedList; id: string } | null>(null)
  const dropOn = (list: OrderedList, before?: string) => {
    const accept = (e: DragEvent): void => {
      if (dragged.current?.list === list) e.preventDefault()
    }
    return {
      onDragEnter: accept,
      onDragOver: accept,
      onDrop: (e: DragEvent): void => {
        const from = dragged.current
        if (from?.list !== list) return
        e.preventDefault()
        e.stopPropagation()
        dragged.current = null
        save(movedIn(order, list, lists[list], from.id, before))
      }
    }
  }
  return {
    dms: lists.dms,
    agents: lists.agents,
    // Spread on a row: drag it, or drop another before it.
    row: (list: OrderedList, id: string, label: string) => ({
      draggable: true,
      onDragStart: (e: DragEvent): void => {
        dragged.current = { list, id }
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', label)
      },
      onDragEnd: (): void => {
        dragged.current = null
      },
      ...dropOn(list, id)
    }),
    // Spread on the gap after the last row: dropped there, it goes last.
    end: (list: OrderedList) => dropOn(list),
    // The row's menu with Move up/down added, before its last part (delete, archive) when it has one.
    menu: (list: OrderedList, id: string, items: MenuItem[]): MenuItem[] => {
      const moves: MenuItem[] = [
        'separator',
        { label: L('Mover para cima', 'Move up'), onClick: () => save(nudgedIn(order, list, lists[list], id, -1)) },
        { label: L('Mover para baixo', 'Move down'), onClick: () => save(nudgedIn(order, list, lists[list], id, 1)) }
      ]
      const last = items.lastIndexOf('separator')
      return last < 0 ? [...items, ...moves] : [...items.slice(0, last), ...moves, ...items.slice(last)]
    }
  }
}
