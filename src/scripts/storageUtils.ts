import { ref, watch, type Ref } from 'vue'

const STORE_STORAGE_KEY_PREFIX = 'store.'

function createStoreStorageKey(key: string) {
  return `${STORE_STORAGE_KEY_PREFIX}${key}`
}

function readStorage<T>(storage: Storage, key: string, defaultValue: T): T {
  try {
    const raw = storage.getItem(createStoreStorageKey(key))
    return raw === null ? defaultValue : (JSON.parse(raw) as T)
  } catch {
    return defaultValue
  }
}

function writeStorage<T>(storage: Storage, key: string, value: T) {
  storage.setItem(createStoreStorageKey(key), JSON.stringify(value))
}

function createCachedRef<T>(storage: Storage, key: string, defaultValue: T): Ref<T> {
  const state = ref(readStorage(storage, key, defaultValue)) as Ref<T>
  watch(state, value => writeStorage(storage, key, value), { deep: true })
  return state
}

/**
 * 创建持久化响应式引用 (localStorage)
 */
export function cacheRef<T>(key: string, defaultValue: T): Ref<T> {
  return createCachedRef<T>(localStorage, key, defaultValue)
}

/**
 * 创建会话级响应式引用 (sessionStorage)
 */
export function tempRef<T>(key: string, defaultValue: T): Ref<T> {
  return createCachedRef<T>(sessionStorage, key, defaultValue)
}
