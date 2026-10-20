<script setup>
import { computed } from "vue"

const props = defineProps({
    text: {
        type: String,
        required: true,
    },
})

const parts = computed(() => {
    const result = []
    const pattern = /\*([^*]+)\*/g
    let last = 0
    let match = pattern.exec(props.text)
    while (match) {
        if (match.index > last) {
            result.push({ emphasis: false, text: props.text.slice(last, match.index) })
        }
        result.push({ emphasis: true, text: match[1] })
        last = match.index + match[0].length
        match = pattern.exec(props.text)
    }
    if (last < props.text.length) {
        result.push({ emphasis: false, text: props.text.slice(last) })
    }
    return result
})
</script>

<template>
    <span>
        <template v-for="(part, index) in parts" :key="index">
            <em v-if="part.emphasis">{{ part.text }}</em>
            <template v-else>{{ part.text }}</template>
        </template>
    </span>
</template>
