<script setup>
import { computed, nextTick, ref, watch } from "vue"

const ROW = 48

const props = defineProps({
    show: {
        type: Boolean,
        required: true,
    },
    query: {
        type: String,
        required: true,
    },
    items: {
        type: Array,
        required: true,
    },
    current: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    favorites: {
        type: Object,
        required: true,
    },
    favoritesOnly: {
        type: Boolean,
        required: true,
    },
})

const emit = defineEmits(["update:show", "update:query", "update:favoritesOnly", "select"])

const scroller = ref(null)
const scrollTop = ref(0)
const viewHeight = ref(600)

const start = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW) - 8))
const end = computed(() =>
    Math.min(props.items.length, start.value + Math.ceil(viewHeight.value / ROW) + 16),
)
const slice = computed(() => props.items.slice(start.value, end.value))
const offset = computed(() => start.value * ROW)
const totalHeight = computed(() => props.items.length * ROW)

watch(
    () => props.show,
    async (open) => {
        if (!open) {
            return
        }
        await nextTick()
        const element = scroller.value
        if (!element) {
            return
        }
        viewHeight.value = element.clientHeight || 600
        if (props.query.trim()) {
            return
        }
        const index = props.items.findIndex((item) => item.n === props.current)
        const top = Math.max(0, index * ROW - ROW * 3)
        element.scrollTop = top
        scrollTop.value = top
    },
)

watch(
    () => [props.query, props.favoritesOnly],
    async () => {
        await nextTick()
        if (!scroller.value) {
            return
        }
        scroller.value.scrollTop = 0
        scrollTop.value = 0
    },
)

function onScroll(event) {
    scrollTop.value = event.target.scrollTop
}

function choose(itemNumber) {
    emit("select", itemNumber)
    emit("update:show", false)
}
</script>

<template>
    <van-popup
        :show="show"
        position="right"
        :style="{ width: '100%', height: '100%' }"
        @update:show="emit('update:show', $event)"
    >
        <div class="sheet">
            <van-nav-bar
                title="目录"
                left-text="返回"
                left-arrow
                safe-area-inset-top
                @click-left="emit('update:show', false)"
            />
            <van-search
                :model-value="query"
                shape="round"
                placeholder="搜索习语、释义或例句"
                @update:model-value="emit('update:query', $event)"
            />
            <label class="favorites-only">
                只看收藏
                <van-switch
                    :model-value="favoritesOnly"
                    size="18px"
                    @update:model-value="emit('update:favoritesOnly', $event)"
                />
            </label>
            <p class="status">{{ status }}</p>
            <p v-if="items.length === 0" class="empty">
                {{ favoritesOnly && !query.trim() ? "还没有收藏" : "没有匹配的习语" }}
            </p>
            <div v-else ref="scroller" class="list" @scroll="onScroll">
                <div class="spacer" :style="{ height: `${totalHeight}px` }">
                    <div class="window" :style="{ transform: `translateY(${offset}px)` }">
                        <button
                            v-for="item in slice"
                            :key="item.n"
                            type="button"
                            class="row"
                            :class="{ current: item.n === current }"
                            @click="choose(item.n)"
                        >
                            <span class="num">{{ item.n }}</span>
                            <span class="name">{{ item.name }}</span>
                            <van-icon v-if="favorites.has(item.n)" name="star" class="mark" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </van-popup>
</template>

<style scoped>
.sheet {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
}

.favorites-only {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
    padding: 0 16px 8px;
    font-size: 14px;
}

.status,
.empty {
    margin: 0;
    padding: 0 16px 8px;
    color: #969799;
    font-size: 12px;
}

.empty {
    padding-top: 24px;
    text-align: center;
    font-size: 14px;
}

.list {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

.spacer {
    position: relative;
}

.window {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
}

.row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border: 0;
    border-bottom: 1px solid #ebedf0;
    background: #fff;
    color: inherit;
    text-align: left;
}

.num {
    flex: none;
    width: 36px;
    color: #969799;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
}

.name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mark {
    flex: none;
    color: #ffb300;
    font-size: 14px;
}

.current {
    color: var(--van-primary-color);
    background: #f2f8ff;
}
</style>
