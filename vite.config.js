import { createReadStream } from "node:fs"
import fs from "node:fs"
import path from "node:path"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

const audioDir = path.resolve("audio")

function serveAudio() {
    const middleware = (req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? "").split("?")[0])
        if (!pathname.startsWith("/audio/")) {
            next()
            return
        }

        const relative = pathname.slice("/audio/".length)
        const file = path.resolve(audioDir, relative)
        if (relative === "" || !file.startsWith(`${audioDir}${path.sep}`)) {
            next()
            return
        }

        fs.stat(file, (error, stat) => {
            if (error || !stat.isFile()) {
                next()
                return
            }

            const range = req.headers.range
            res.setHeader("Accept-Ranges", "bytes")
            res.setHeader("Content-Type", "audio/mpeg")

            if (range) {
                const match = /bytes=(\d+)-(\d*)/.exec(range)
                if (!match) {
                    res.statusCode = 416
                    res.end()
                    return
                }
                const start = Number(match[1])
                const end = match[2] ? Number(match[2]) : stat.size - 1
                res.statusCode = 206
                res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`)
                res.setHeader("Content-Length", String(end - start + 1))
                createReadStream(file, { start, end }).pipe(res)
                return
            }

            res.setHeader("Content-Length", String(stat.size))
            createReadStream(file).pipe(res)
        })
    }

    let outDir = path.resolve("dist")

    return {
        name: "serve-audio",
        configResolved(config) {
            outDir = path.resolve(config.root, config.build.outDir)
        },
        configureServer(server) {
            server.middlewares.use(middleware)
        },
        configurePreviewServer(server) {
            server.middlewares.use(middleware)
        },
        closeBundle() {
            fs.cpSync(audioDir, path.join(outDir, "audio"), { recursive: true })
        },
    }
}

export default defineConfig({
    plugins: [vue(), serveAudio()],
})
