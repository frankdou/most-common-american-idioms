<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import CatalogSheet from "./components/CatalogSheet.vue"
import IdiomBody from "./components/IdiomBody.vue"
import { useReader } from "./useReader.js"

const catalogOpen = ref(false)
const bootError = ref("")
const scroller = ref(null)
const article = ref(null)
const activeSection = ref("meaning")
const tailHeight = ref(0)

const {
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
} = useReader()

const title = computed(() => names.value[n.value - 1] || "American Idioms")

watch(query, (value) => {
    if (value.trim()) {
        ensureSearch()
    }
})

watch(n, () => {
    activeSection.value = "meaning"
    if (scroller.value) {
        scroller.value.scrollTop = 0
    }
})

function scrollToSection(section) {
    const scrollerEl = scroller.value
    const target = section === "examples" ? article.value?.examplesEl : article.value?.meaningEl
    if (!scrollerEl || !target) {
        return
    }
    const top =
        target.getBoundingClientRect().top -
        scrollerEl.getBoundingClientRect().top +
        scrollerEl.scrollTop
    scrollerEl.scrollTo({ top, behavior: "smooth" })
    activeSection.value = section
}

function onBodyScroll() {
    const scrollerEl = scroller.value
    const examples = article.value?.examplesEl
    if (!scrollerEl || !examples) {
        activeSection.value = "meaning"
        return
    }
    const limit = scrollerEl.getBoundingClientRect().top + 48
    activeSection.value = examples.getBoundingClientRect().top <= limit ? "examples" : "meaning"
}

async function updateTail() {
    tailHeight.value = 0
    await nextTick()
    const scrollerEl = scroller.value
    const examples = article.value?.examplesEl
    if (!scrollerEl || !examples) {
        return
    }
    const examplesTop =
        examples.getBoundingClientRect().top -
        scrollerEl.getBoundingClientRect().top +
        scrollerEl.scrollTop
    const maxScroll = scrollerEl.scrollHeight - scrollerEl.clientHeight
    tailHeight.value = Math.max(0, Math.ceil(examplesTop - maxScroll))
}

function onPopState() {
    const fromUrl = Number(new URLSearchParams(location.search).get("n"))
    if (Number.isInteger(fromUrl)) {
        openIdiom(fromUrl, "none")
    }
}

watch([idiom, showChinese], () => {
    updateTail()
})

onMounted(async () => {
    window.addEventListener("popstate", onPopState)
    window.addEventListener("resize", updateTail)
    try {
        await init()
    } catch (reason) {
        console.error(reason)
        bootError.value = "目录没有载入。"
    }
})

onUnmounted(() => {
    window.removeEventListener("popstate", onPopState)
    window.removeEventListener("resize", updateTail)
})
</script>

<template>
    <div class="app">
        <van-nav-bar :title="title" left-text="目录" safe-area-inset-top @click-left="catalogOpen = true">
            <template #right>
                <button
                    type="button"
                    class="star"
                    :class="{ on: isFavorite }"
                    :aria-pressed="isFavorite"
                    :aria-label="isFavorite ? '取消收藏' : '收藏'"
                    @click="toggleFavorite"
                >
                    <van-icon :name="isFavorite ? 'star' : 'star-o'" />
                </button>
            </template>
        </van-nav-bar>

        <div class="switches">
            <div v-if="idiom" class="sections" role="tablist">
                <button
                    type="button"
                    role="tab"
                    :aria-selected="activeSection === 'meaning'"
                    :class="{ on: activeSection === 'meaning' }"
                    @click="scrollToSection('meaning')"
                >
                    释义
                </button>
                <button
                    type="button"
                    role="tab"
                    :disabled="!idiom.examples.length"
                    :aria-selected="activeSection === 'examples'"
                    :class="{ on: activeSection === 'examples' }"
                    @click="scrollToSection('examples')"
                >
                    例句
                </button>
            </div>
            <label>
                中文
                <van-switch v-model="showChinese" size="18px" />
            </label>
        </div>

        <div ref="scroller" class="body" @scroll="onBodyScroll">
            <div v-if="bootError" class="state">{{ bootError }}</div>
            <div v-else-if="loading && !idiom" class="state">
                <van-loading size="24px">正在打开…</van-loading>
            </div>
            <div v-else-if="error" class="state">
                <p>{{ error }}</p>
                <van-button size="small" type="primary" @click="openIdiom(n, 'replace')">重试</van-button>
            </div>
            <IdiomBody
                v-else-if="idiom"
                ref="article"
                :idiom="idiom"
                :total="names.length"
                :show-chinese="showChinese"
            />
            <div v-if="tailHeight" class="tail" :style="{ height: `${tailHeight}px` }"></div>
        </div>

        <div class="pager">
            <van-button block :disabled="n <= 1" @click="openIdiom(n - 1)">上一条</van-button>
            <van-button block type="primary" :disabled="n >= names.length" @click="openIdiom(n + 1)">
                下一条
            </van-button>
        </div>

        <CatalogSheet
            :show="catalogOpen"
            :query="query"
            :items="filtered"
            :current="n"
            :status="statusText"
            :favorites="favorites"
            :favorites-only="favoritesOnly"
            @update:show="catalogOpen = $event"
            @update:query="query = $event"
            @update:favorites-only="favoritesOnly = $event"
            @select="openIdiom"
        />
    </div>
</template>

<style scoped>
.app {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: #fff;
}

.switches {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid #ebedf0;
    background: #fff;
    font-size: 14px;
}

.sections {
    display: flex;
    padding: 2px;
    border-radius: 999px;
    background: #f2f3f5;
}

.sections button {
    border: 0;
    border-radius: 999px;
    padding: 4px 14px;
    background: transparent;
    color: #646566;
    font-size: 13px;
}

.sections button.on {
    background: #fff;
    color: var(--van-primary-color);
    font-weight: 600;
}

.sections button:disabled {
    opacity: 0.4;
}

.switches label {
    display: flex;
    align-items: center;
    gap: 8px;
}

.star {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #c8c9cc;
    font-size: 22px;
}

.star.on {
    color: #ffb300;
}

.body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 16px 16px 24px;
    background: #f7f8fa;
}

.state {
    padding-top: 48px;
    color: #969799;
    text-align: center;
}

.pager {
    display: flex;
    gap: 12px;
    padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
    border-top: 1px solid #ebedf0;
    background: #fff;
}

.pager :deep(.van-button) {
    flex: 1;
}
</style>
