import { computed, ref, watch } from "vue"

const storageKeys = {
    n: "idiom-reader:n",
    chinese: "idiom-reader:zh",
    favorites: "idiom-reader:favorites",
}

export function useReader() {
    const names = ref([])
    const n = ref(1)
    const idiom = ref(null)
    const loading = ref(false)
    const error = ref("")
    const showChinese = ref(readFlag(storageKeys.chinese, true))
    const favorites = ref(readFavorites())
    const favoritesOnly = ref(false)
    const query = ref("")
    const search = ref(null)
    const searchState = ref("idle")
    const cache = new Map()
    let token = 0

    const filtered = computed(() => {
        const tokens = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
        const result = []
        for (let index = 0; index < names.value.length; index += 1) {
            const name = names.value[index]
            const number = index + 1
            if (favoritesOnly.value && !favorites.value.has(number)) {
                continue
            }
            if (tokens.length === 0) {
                result.push({ n: number, name })
                continue
            }
            const body = search.value ? String(search.value[index]).toLowerCase() : ""
            const haystack = `${name.toLowerCase()}\n${body}`
            if (tokens.every((item) => haystack.includes(item))) {
                result.push({ n: number, name })
            }
        }
        return result
    })

    const statusText = computed(() => {
        const count = `${filtered.value.length} 条`
        if (!query.value.trim()) {
            return count
        }
        if (searchState.value === "loading") {
            return `${count} · 全文索引加载中`
        }
        if (searchState.value === "failed") {
            return `${count} · 只搜索了习语名`
        }
        return count
    })

    const isFavorite = computed(() => favorites.value.has(n.value))

    watch(showChinese, (value) => {
        localStorage.setItem(storageKeys.chinese, value ? "1" : "0")
    })

    function toggleFavorite() {
        const next = new Set(favorites.value)
        if (next.has(n.value)) {
            next.delete(n.value)
        } else {
            next.add(n.value)
        }
        favorites.value = next
        localStorage.setItem(storageKeys.favorites, JSON.stringify([...next]))
    }

    async function init() {
        const response = await fetch("/data/catalog.json")
        if (!response.ok) {
            throw new Error(String(response.status))
        }
        names.value = await response.json()
        const params = new URLSearchParams(location.search)
        const fromUrl = Number(params.get("n"))
        const stored = Number(localStorage.getItem(storageKeys.n))
        const initial = inRange(fromUrl) ? fromUrl : inRange(stored) ? stored : 1
        await openIdiom(initial, "replace")
    }

    async function openIdiom(requested, mode = "push") {
        const next = clamp(requested)
        if (next === n.value && idiom.value && mode !== "replace") {
            return
        }

        n.value = next
        localStorage.setItem(storageKeys.n, String(next))
        syncUrl(next, mode)
        const name = names.value[next - 1]
        document.title = name ? `${name} · American Idioms` : "American Idioms"

        const current = ++token
        loading.value = true
        error.value = ""
        try {
            const data = await loadIdiom(next)
            if (current !== token) {
                return
            }
            idiom.value = data
            prefetch(next - 1)
            prefetch(next + 1)
        } catch (reason) {
            console.error(reason)
            if (current !== token) {
                return
            }
            idiom.value = null
            error.value = "这条习语没有打开。"
        } finally {
            if (current === token) {
                loading.value = false
            }
        }
    }

    async function ensureSearch() {
        if (searchState.value !== "idle") {
            return
        }
        searchState.value = "loading"
        try {
            const response = await fetch("/data/search.json")
            if (!response.ok) {
                throw new Error(String(response.status))
            }
            search.value = await response.json()
            searchState.value = "ready"
        } catch (reason) {
            console.error(reason)
            searchState.value = "failed"
        }
    }

    function inRange(value) {
        return Number.isInteger(value) && value >= 1 && value <= names.value.length
    }

    function clamp(value) {
        if (!Number.isInteger(value) || names.value.length === 0) {
            return n.value
        }
        return Math.min(names.value.length, Math.max(1, value))
    }

    function syncUrl(next, mode) {
        const url = `?n=${next}`
        if (mode === "push") {
            history.pushState({ n: next }, "", url)
        } else if (mode === "replace") {
            history.replaceState({ n: next }, "", url)
        }
    }

    async function loadIdiom(next) {
        if (cache.has(next)) {
            return cache.get(next)
        }
        const response = await fetch(`/data/idioms/${next}.json`)
        if (!response.ok) {
            throw new Error(String(response.status))
        }
        const data = await response.json()
        cache.set(next, data)
        return data
    }

    function prefetch(next) {
        if (!inRange(next) || cache.has(next)) {
            return
        }
        loadIdiom(next).catch(() => {})
    }

    return {
        names,
        n,
        idiom,
        loading,
        error,
        showChinese,
        favorites,
        favoritesOnly,
        isFavorite,
        query,
        filtered,
        statusText,
        init,
        openIdiom,
        ensureSearch,
        toggleFavorite,
    }
}

function readFavorites() {
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKeys.favorites) || "[]")
        if (!Array.isArray(parsed)) {
            return new Set()
        }
        return new Set(parsed.filter((item) => Number.isInteger(item) && item > 0))
    } catch {
        return new Set()
    }
}

function readFlag(key, fallback) {
    const value = localStorage.getItem(key)
    if (value === null) {
        return fallback
    }
    return value === "1"
}
