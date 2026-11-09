// The person's order of their DMs and of the agents (settings.sidebarOrder): kept apart from the
// channels' and from each other, with the channels' moves and no groups.
import { describe, expect, it } from 'vitest'
import { movedIn, nudgedIn, ordered } from '../src/renderer/src/components/sidebar-order'

const items = ['a', 'b', 'c', 'd'].map((id) => ({ id }))
const ids = (l: { id: string }[]): string[] => l.map((c) => c.id)

describe('sidebar order of the DMs and the agents', () => {
  it('follows the saved order, new ones last, and loses none to a stray group or a bad value', () => {
    expect(ids(ordered(items))).toEqual(['a', 'b', 'c', 'd'])
    expect(ids(ordered(items, { loose: ['c', 'gone', 'a'], groups: [] }))).toEqual(['c', 'a', 'b', 'd'])
    expect(ids(ordered(items, { loose: ['d'], groups: [{ id: 'g', name: 'G', channels: ['b'] }] }))).toEqual(['d', 'a', 'c', 'b'])
    expect(ids(ordered(items, 'bad' as never))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('moves before another or last, touching only its own list', () => {
    const agents = { loose: ['x'], groups: [] }
    const moved = movedIn({ agents }, 'dms', items, 'd', 'a')
    expect(moved.agents).toBe(agents)
    expect(ids(ordered(items, moved.dms))).toEqual(['d', 'a', 'b', 'c'])
    expect(ids(ordered(items, movedIn(moved, 'dms', items, 'd').dms))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('nudges one place, stopping at the ends', () => {
    const start = movedIn(undefined, 'agents', items, 'd', 'a')
    expect(ids(ordered(items, nudgedIn(start, 'agents', items, 'b', -1).agents))).toEqual(['d', 'b', 'a', 'c'])
    expect(ids(ordered(items, nudgedIn(start, 'agents', items, 'd', -1).agents))).toEqual(['d', 'a', 'b', 'c'])
    expect(ids(ordered(items, nudgedIn(start, 'agents', items, 'c', 1).agents))).toEqual(['d', 'a', 'b', 'c'])
    expect(nudgedIn(start, 'agents', items, 'b', 1).dms).toBeUndefined()
  })
})
