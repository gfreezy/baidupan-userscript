const esbuild = require('esbuild');
const watch = require("chokidar").watch;

const OUTPUT = "./dist/index.user.js";
const INPUT = ["./src/index.ts"];

const BANNER = `\
// ==UserScript==
// @name         百度网盘直接下载
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match             *://pan.baidu.com/disk/home*
// @match             *://yun.baidu.com/disk/home*
// @match             *://pan.baidu.com/disk/main*
// @match             *://yun.baidu.com/disk/main*
// @match             *://pan.baidu.com/s/*
// @match             *://yun.baidu.com/s/*
// @match             *://pan.baidu.com/share/*
// @match             *://yun.baidu.com/share/*
// @icon              https://www.google.com/s2/favicons?sz=64&domain=baidu.com
// @grant             GM_xmlhttpRequest
// @grant             GM_download
// ==/UserScript==
`;


const clearScreen = () => {
    process.stdout.cursorTo(0, 0);
    process.stdout.clearScreenDown();

};


const logTime = async(action) => {

    let result
    try {
        clearScreen();
        // Get time before build starts
        const timerStart = Date.now();

        result = await action();

        // Get time after build ends
        const timerEnd = Date.now();

        console.log(`Built in ${timerEnd - timerStart}ms.`);
    } catch (e) {

    }

    return result;
};


/**
 * Builds the code in no time
 */
const startWatch = async() => {
    const watcher = watch(["src/**/*"]);
    // Build code
    const result = await logTime(async() => {
        return await esbuild.build({
            color: true,
            entryPoints: INPUT,
            outfile: OUTPUT,
            // minify: true,
            bundle: true,
            sourcemap: false,
            tsconfig: "./tsconfig.json",
            platform: "node",
            logLevel: "error",
            incremental: true,
            banner: {
                js: BANNER
            }
        });
    });

    watcher.on("change", () => {
        logTime(async() => {
            await result.rebuild();
        });
    });
};

console.log("Watching files... \n");
startWatch();