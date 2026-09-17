'use client'

import { useCallback, useMemo, useState } from 'react'
import { set, unset, type ArrayOfPrimitivesInputProps } from 'sanity'

import {
  AMENITY_GROUPS,
  AMENITY_LABELS,
  canonicalAmenity,
} from './amenityOptions'

/**
 * Amenities as a grouped checkbox matrix.
 *
 * The default Sanity checklist renders one long column, which is unworkable
 * with ~130 options. This lays each group out as a grid that fills across
 * and down, with a filter box and a per-group count.
 *
 * Legacy values ("pool", "sq", …) show as ticked under the item they now map
 * to. Toggling that item rewrites the value to the current one, so old
 * listings clean themselves up as they are edited.
 *
 * Plain elements with `currentColor` and opacity are used on purpose: they
 * follow the Studio's light and dark themes without extra dependencies.
 */

const styles = {
  wrap: { display: 'grid', gap: 16 } as const,
  toolbar: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' } as const,
  search: {
    flex: '1 1 220px',
    padding: '8px 10px',
    fontSize: 13,
    borderRadius: 4,
    border: '1px solid color-mix(in srgb, currentColor 25%, transparent)',
    background: 'transparent',
    color: 'inherit',
  } as const,
  meta: { fontSize: 12, opacity: 0.65 } as const,
  link: {
    fontSize: 12,
    background: 'none',
    border: 0,
    padding: 0,
    color: 'inherit',
    textDecoration: 'underline',
    cursor: 'pointer',
    opacity: 0.8,
  } as const,
  group: {
    border: '1px solid color-mix(in srgb, currentColor 14%, transparent)',
    borderRadius: 6,
    padding: '10px 12px 12px',
  } as const,
  groupHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    background: 'none',
    border: 0,
    padding: 0,
    width: '100%',
    color: 'inherit',
  } as const,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(190px, 100%), 1fr))',
    gap: '4px 16px',
    marginTop: 10,
  } as const,
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    lineHeight: 1.3,
    padding: '4px 0',
    cursor: 'pointer',
  } as const,
  box: { width: 15, height: 15, margin: 0, flexShrink: 0, cursor: 'pointer' } as const,
  extra: { fontSize: 12, opacity: 0.7 } as const,
}

export function AmenitiesInput(props: ArrayOfPrimitivesInputProps<string>) {
  const { value, onChange, readOnly } = props
  const stored = useMemo(() => (value ?? []).filter(Boolean) as string[], [value])

  // Everything ticked, expressed in current values.
  const ticked = useMemo(() => new Set(stored.map(canonicalAmenity)), [stored])

  // Stored values that match nothing in the vocabulary. Kept, never dropped.
  const unknown = useMemo(
    () => stored.filter((v) => !AMENITY_LABELS[canonicalAmenity(v)]),
    [stored]
  )

  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const commit = useCallback(
    (next: string[]) => onChange(next.length ? set(next) : unset()),
    [onChange]
  )

  const toggle = useCallback(
    (item: string) => {
      if (readOnly) return
      // Drop the item and any legacy alias of it, then re-add if ticking.
      const rest = stored.filter((v) => canonicalAmenity(v) !== item)
      commit(ticked.has(item) ? rest : [...rest, item])
    },
    [commit, readOnly, stored, ticked]
  )

  const setGroup = useCallback(
    (items: string[], on: boolean) => {
      if (readOnly) return
      const inGroup = new Set(items)
      const rest = stored.filter((v) => !inGroup.has(canonicalAmenity(v)))
      commit(on ? [...rest, ...items] : rest)
    },
    [commit, readOnly, stored]
  )

  const allCollapsed = AMENITY_GROUPS.every((g) => collapsed[g.group])
  const q = query.trim().toLowerCase()
  const groups = AMENITY_GROUPS.map((g) => ({
    ...g,
    visible: q ? g.items.filter((i) => i.title.toLowerCase().includes(q)) : g.items,
  })).filter((g) => g.visible.length > 0)

  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <input
          type="search"
          placeholder="Filter amenities…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={styles.search}
          aria-label="Filter amenities"
        />
        <span style={styles.meta}>{ticked.size} selected</span>
        <button
          type="button"
          style={styles.link}
          onClick={() =>
            setCollapsed(Object.fromEntries(AMENITY_GROUPS.map((g) => [g.group, !allCollapsed])))
          }
        >
          {allCollapsed ? 'Expand all' : 'Collapse all'}
        </button>
      </div>

      {groups.map(({ group, items, visible }) => {
        const count = items.filter((i) => ticked.has(i.value)).length
        const isCollapsed = !q && collapsed[group]
        const allOn = count === items.length
        return (
          <section key={group} style={styles.group}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                style={styles.groupHead}
                onClick={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}
                aria-expanded={!isCollapsed}
              >
                <span>
                  {isCollapsed ? '▸' : '▾'} {group}
                </span>
                <span style={{ ...styles.meta, textTransform: 'none', letterSpacing: 0 }}>
                  {count}/{items.length}
                </span>
              </button>
              {!readOnly && !isCollapsed && (
                <button
                  type="button"
                  style={{ ...styles.link, whiteSpace: 'nowrap' }}
                  onClick={() => setGroup(items.map((i) => i.value), !allOn)}
                >
                  {allOn ? 'Clear' : 'Select all'}
                </button>
              )}
            </div>

            {!isCollapsed && (
              <div style={styles.grid} role="group" aria-label={group}>
                {visible.map(({ title, value: item }) => (
                  <label key={item} style={{ ...styles.item, opacity: readOnly ? 0.6 : 1 }}>
                    <input
                      type="checkbox"
                      checked={ticked.has(item)}
                      disabled={readOnly}
                      onChange={() => toggle(item)}
                      style={styles.box}
                    />
                    <span>{title}</span>
                  </label>
                ))}
              </div>
            )}
          </section>
        )
      })}

      {groups.length === 0 && <p style={styles.meta}>No amenity matches “{query}”.</p>}

      {unknown.length > 0 && (
        <p style={styles.extra}>
          Also stored (not in the list above, still shown on the website): {unknown.join(', ')}
        </p>
      )}
    </div>
  )
}
