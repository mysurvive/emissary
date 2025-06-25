import esbuild from "esbuild";
import fs from "fs-extra";
import path from "path";
import * as Vite from "vite";
import checker from "vite-plugin-checker";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";
import packageJSON from "./package.json" with { type: "json" };

const EN_JSON = JSON.parse(fs.readFileSync("./static/languages/en.json", { encoding: "utf-8" }));

// Modeled after pf2e's vite config

const config = Vite.defineConfig(({ command, mode }): Vite.UserConfig => {
    const buildMode = mode === "production" ? "production" : "development";
    const outDir = "dist";

    const plugins = [checker({ typescript: true }), tsconfigPaths()];

    if (buildMode === "production") {
        plugins.push(
            {
                name: "minify",
                renderChunk: {
                    order: "post",
                    async handler(code, chunk) {
                        return chunk.fileName.endsWith(".mjs")
                            ? esbuild.transform(code, {
                                  keepNames: true,
                                  minifyIdentifiers: false,
                                  minifySyntax: true,
                                  minifyWhitespace: true,
                                  sourcemap: true,
                              })
                            : code;
                    },
                },
            },
            ...viteStaticCopy({
                targets: [{ src: "README.md", dest: "." }],
            }),
        );
    } else {
        plugins.push(
            {
                name: "touch-vendor-mjs",
                apply: "build",
                writeBundle: {
                    async handler() {
                        fs.closeSync(fs.openSync(path.resolve(outDir, "vendor.mjs"), "w"));
                    },
                },
            },
            {
                name: "hmr-handler",
                apply: "serve",
                handleHotUpdate(context) {
                    if (context.file.startsWith(outDir)) return;

                    if (context.file.endsWith("en.json")) {
                        const basePath = context.file.slice(context.file.indexOf("languages/"));
                        console.log(`Updating lang file at ${basePath}`);
                        fs.promises.copyFile(context.file, `${outDir}/${basePath}`).then(() => {
                            context.server.ws.send({
                                type: "custom",
                                event: "lang-update",
                                data: { path: `modules/emissary/${basePath}` },
                            });
                        });
                    } else if (context.file.endsWith(".hbs")) {
                        const basePath = context.file.slice(context.file.indexOf("templates/"));
                        console.log(`Updating template file at ${basePath}`);
                        fs.promises.copyFile(context.file, `${outDir}/${basePath}`).then(() => {
                            context.server.ws.send({
                                type: "custom",
                                event: "template-update",
                                data: { path: `modules/emissary/${basePath}` },
                            });
                        });
                    }
                },
            },
        );
    }

    if (command === "serve") {
        const message = "This file is for running vite dev server and is not copied to a build";
        fs.writeFileSync("./index.html", `<h1>${message}</h1>\n`);
        if (!fs.existsSync("./styles")) fs.mkdirSync("./styles");
        fs.writeFileSync("./styles/emissary.css", `/** ${message} */\n`);
        fs.writeFileSync("./emissary.mjs", `/** ${message} */\n\nimport "./src/emissary.ts";\n`);
        fs.writeFileSync("./vendor.mjs", `/** ${message} */\n`);
    }

    const reEscape = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

    return {
        base: command === "build" ? "./" : "/modules/emissary/",
        publicDir: "static",
        define: {
            BUILD_MODE: JSON.stringify(buildMode),
            EN_JSON: JSON.stringify(EN_JSON),
            fu: "foundry.utils",
        },
        esbuild: { keepNames: true },
        build: {
            outDir,
            emptyOutDir: false,
            minify: false,
            sourcemap: true,
            lib: {
                name: "emissary",
                entry: "src/emissary.ts",
                formats: ["es"],
                fileName: "emissary",
            },
            rollupOptions: {
                external: new RegExp(["(?:", reEscape(".webp"), ")$"].join("")),
                output: {
                    assetFileNames: "styles/emissary.css",
                    chunkFileNames: "[name].mjs",
                    entryFileNames: "emissary.mjs",
                    manualChunks: {
                        vendor: buildMode === "production" ? Object.keys(packageJSON.dependencies) : [],
                    },
                },
                watch: { buildDelay: 100 },
            },
            target: "es2022",
        },
        server: {
            port: 30000,
            open: "/game",
            proxy: {
                "^(?!/modules/emissary/)": "http://localhost:30000/",
                "/socket.io": {
                    target: "ws://localhost:30000",
                    ws: true,
                },
            },
        },
        plugins,
        css: {
            devSourcemap: buildMode === "development",
        },
    };
});

export default config;
