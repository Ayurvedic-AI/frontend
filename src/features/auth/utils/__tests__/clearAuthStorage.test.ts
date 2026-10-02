import { describe, it, expect, beforeEach } from 'vitest'
import { clearAuthStorage } from '../clearAuthStorage'

const AUTH_KEYS = [
  'userData',
  'userId',
  'email',
  'firstName',
  'lastName',
  'authToken',
  'refreshToken',
  'authMethod',
  'permissions',
  'roleType',
  'status',
]

describe('clearAuthStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes all auth data from localStorage', () => {
    // Populate all auth keys
    AUTH_KEYS.forEach((key) => {
      localStorage.setItem(key, `value-for-${key}`)
    })

    clearAuthStorage()

    AUTH_KEYS.forEach((key) => {
      expect(localStorage.getItem(key)).toBeNull()
    })
  })

  it('does not throw when localStorage is empty', () => {
    expect(() => clearAuthStorage()).not.toThrow()
  })

  it('does not remove non-auth keys', () => {
    localStorage.setItem('unrelatedKey', 'keepMe')
    localStorage.setItem('userData', 'removeMe')

    clearAuthStorage()

    expect(localStorage.getItem('unrelatedKey')).toBe('keepMe')
    expect(localStorage.getItem('userData')).toBeNull()
  })

  it('clears userData specifically', () => {
    localStorage.setItem('userData', JSON.stringify({ uuid: 'test', email: 'a@b.com' }))
    clearAuthStorage()
    expect(localStorage.getItem('userData')).toBeNull()
  })

  it('clears authToken and refreshToken', () => {
    localStorage.setItem('authToken', 'Bearer abc123')
    localStorage.setItem('refreshToken', 'refresh_xyz')
    clearAuthStorage()
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('is idempotent — calling twice does not throw', () => {
    AUTH_KEYS.forEach((key) => {
      localStorage.setItem(key, 'value')
    })
    clearAuthStorage()
    expect(() => clearAuthStorage()).not.toThrow()
    AUTH_KEYS.forEach((key) => {
      expect(localStorage.getItem(key)).toBeNull()
    })
  })
})
