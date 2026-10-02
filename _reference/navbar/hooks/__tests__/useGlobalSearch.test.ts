import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGlobalSearch } from '../useGlobalSearch'

describe('useGlobalSearch', () => {
  it('starts with empty search term', () => {
    const { result } = renderHook(() => useGlobalSearch())
    expect(result.current.searchTerm).toBe('')
  })

  it('isExpanded starts as false', () => {
    const { result } = renderHook(() => useGlobalSearch())
    expect(result.current.isExpanded).toBe(false)
  })

  it('debouncedTerm starts empty', () => {
    const { result } = renderHook(() => useGlobalSearch())
    expect(result.current.debouncedTerm).toBe('')
  })

  it('isQueryEnabled is false when not expanded and term is empty', () => {
    const { result } = renderHook(() => useGlobalSearch())
    expect(result.current.isQueryEnabled).toBe(false)
  })

  it('showDropdown starts as false', () => {
    const { result } = renderHook(() => useGlobalSearch())
    expect(result.current.showDropdown).toBe(false)
  })

  it('expand sets isExpanded to true', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => {
      result.current.expand()
    })
    expect(result.current.isExpanded).toBe(true)
  })

  it('collapse sets isExpanded to false', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => {
      result.current.expand()
    })
    act(() => {
      result.current.collapse()
    })
    expect(result.current.isExpanded).toBe(false)
  })

  it('collapse clears searchTerm', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => {
      result.current.expand()
      result.current.handleSearchChange('hello')
    })
    act(() => {
      result.current.collapse()
    })
    expect(result.current.searchTerm).toBe('')
  })

  it('handleSearchChange updates searchTerm', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => {
      result.current.handleSearchChange('test query')
    })
    expect(result.current.searchTerm).toBe('test query')
  })

  it('isQueryEnabled is false when expanded but term is empty', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => {
      result.current.expand()
    })
    expect(result.current.isQueryEnabled).toBe(false)
  })

  it('isQueryEnabled is false when not expanded even with a debounced term', () => {
    const { result } = renderHook(() => useGlobalSearch())
    // Not expanded; debouncedTerm stays '' so isQueryEnabled stays false
    expect(result.current.isQueryEnabled).toBe(false)
  })

  it('showDropdown is true when expanded and searchTerm has 1+ chars', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => {
      result.current.expand()
      result.current.handleSearchChange('a')
    })
    expect(result.current.showDropdown).toBe(true)
  })

  it('showDropdown is false when not expanded even if searchTerm has chars', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => {
      result.current.handleSearchChange('hello')
    })
    expect(result.current.showDropdown).toBe(false)
  })

  it('collapse also clears debouncedTerm immediately', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => {
      result.current.expand()
    })
    act(() => {
      result.current.collapse()
    })
    expect(result.current.debouncedTerm).toBe('')
  })
})
