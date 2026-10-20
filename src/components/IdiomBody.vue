<script setup>
import { onUnmounted, ref, watch } from "vue"
import RichText from "./RichText.vue"

const props = defineProps({
    idiom: {
        type: Object,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    showChinese: {
        type: Boolean,
        required: true,
    },
})

const playingIndex = ref(-1)
const meaningEl = ref(null)
const examplesEl = ref(null)
const audios = new Map()

defineExpose({
    meaningEl,
    examplesEl,
})

function paragraphs(text) {
    if (!text) {
        return []
    }
    return text.split("\n\n").filter(Boolean)
}

function setAudio(index, element) {
    if (element) {
        audios.set(index, element)
        return
    }
    audios.delete(index)
}

function play(index) {
    const audio = audios.get(index)
    if (!audio) {
        return
    }
    if (playingIndex.value === index && !audio.paused) {
        audio.pause()
        audio.currentTime = 0
        playingIndex.value = -1
        return
    }
    for (const [key, other] of audios) {
        if (key !== index) {
            other.pause()
            other.currentTime = 0
        }
    }
    audio.currentTime = 0
    playingIndex.value = index
    audio.play().catch(() => {
        playingIndex.value = -1
    })
}

function onEnded(index) {
    if (playingIndex.value === index) {
        playingIndex.value = -1
    }
}

watch(
    () => props.idiom.n,
    () => {
        playingIndex.value = -1
    },
)

onUnmounted(() => {
    for (const audio of audios.values()) {
        audio.pause()
    }
})
</script>

<template>
    <p class="kicker">{{ idiom.n }} / {{ total }}</p>
    <h1 lang="en">{{ idiom.name }}</h1>

    <section ref="meaningEl">
        <h2>释义</h2>
        <div v-if="showChinese" lang="zh-CN">
            <p v-for="(paragraph, index) in paragraphs(idiom.meaning.zh)" :key="index" class="zh">
                <RichText :text="paragraph" />
            </p>
        </div>
        <div v-if="idiom.meaning.en" lang="en">
            <p v-for="(paragraph, index) in paragraphs(idiom.meaning.en)" :key="index" class="en">
                <RichText :text="paragraph" />
            </p>
        </div>
        <p v-else-if="!showChinese" class="note">这条释义只有中文。</p>
    </section>

    <section v-if="idiom.examples.length" ref="examplesEl" class="examples">
        <h2>例句</h2>
        <article v-for="(example, index) in idiom.examples" :key="index" class="example">
            <div class="example-head">
                <p class="label">例句 {{ index + 1 }}</p>
                <button
                    v-if="example.audio"
                    type="button"
                    class="play"
                    :class="{ playing: playingIndex === index }"
                    :aria-label="playingIndex === index ? `停止例句 ${index + 1}` : `播放例句 ${index + 1}`"
                    @click="play(index)"
                >
                    <van-icon :name="playingIndex === index ? 'stop' : 'play'" />
                </button>
            </div>
            <template v-for="(line, lineIndex) in example.lines" :key="lineIndex">
                <p v-if="line.en" class="en" lang="en"><RichText :text="line.en" /></p>
                <p v-if="line.zh && showChinese" class="zh" lang="zh-CN">
                    <RichText :text="line.zh" />
                </p>
            </template>
            <audio
                v-if="example.audio"
                :ref="(element) => setAudio(index, element)"
                preload="none"
                :src="example.audio"
                @ended="onEnded(index)"
            />
        </article>
    </section>
</template>

<style scoped>
.kicker,
.label,
.note,
h2 {
    color: #969799;
}

.kicker,
.label {
    margin: 0;
    font-size: 12px;
}

h1 {
    margin: 8px 0 4px;
    font-size: 28px;
    line-height: 1.25;
    font-weight: 650;
}

h2 {
    margin: 22px 0 8px;
    font-size: 13px;
    font-weight: 600;
}

.en,
.zh {
    margin: 0 0 10px;
    font-size: 16px;
    line-height: 1.65;
}

.zh {
    color: #646566;
}

.note {
    margin: 0;
    font-size: 14px;
}

.examples {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.example {
    padding: 14px;
    border: 1px solid #ebedf0;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 8px 20px rgba(50, 50, 51, 0.06);
}

.example-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.label {
    margin: 0;
    color: var(--van-primary-color);
    font-weight: 600;
}

.play {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--van-primary-color);
    color: #fff;
}

.play :deep(.van-icon) {
    font-size: 16px;
}

.play:not(.playing) :deep(.van-icon) {
    margin-left: 2px;
}

.play.playing {
    box-shadow: 0 0 0 4px rgba(25, 137, 250, 0.18);
}

.example .en,
.example .zh {
    margin-bottom: 8px;
}

.example .zh:last-child,
.example .en:last-child {
    margin-bottom: 0;
}

em {
    font-style: italic;
}
</style>
