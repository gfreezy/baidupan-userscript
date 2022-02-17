
function get(url: string, headers: Tampermonkey.RequestHeaders, type?: "json" | "blob" | "arraybuffer", progress?: (resp: Tampermonkey.ProgressResponse<any>) => void) {
    return new Promise((resolve: (res: Tampermonkey.Response<any>) => void, reject: (err: Tampermonkey.ErrorResponse) => void) => {
        GM_xmlhttpRequest({
            method: "GET", url, headers,
            responseType: type || 'json',
            onload: (res) => {
                resolve(res);
            },
            onprogress: progress,
            onerror: (err) => {
                reject(err);
            },
        });
    });
}


function addButton() {
    const toolbarEl = document.querySelector(".nd-file-list-toolbar__wrapper");
    const el = document.createElement("div");
    const progress = document.createElement("span");
    el.addEventListener('click', () => {
        getLink(progress);
    });
    el.innerHTML = `<button class="u-btn u-btn--primary u-btn--default u-btn--small is-has-icon"><i class="iconfont icon-download"></i><span>直接下载</span></button>`;
    el.append(progress);
    toolbarEl?.prepend(el);
}

function blobDownload(blob: Blob, filename: string) {
    if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    console.log("Blog download");
}

interface Resp {
    list: [{ dlink: string, filename: string }]
}



async function getLink(progressEl?: Element) {
    const selectedItems = (document.querySelector('.nd-main-list') as any).__vue__.selectedList as [any];
    const selectedFids = selectedItems.map((v) => v.fs_id);

    const fids = '[' + selectedFids + ']';
    const fidList = encodeURIComponent(fids);
    const urlPrefix = "https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1";
    const url = `${urlPrefix}&fsids=${fidList}`;
    const ua = "pan.baidu.com";
    const resp = await get(url, {
        "User-Agent": ua,
    });
    const res = resp.response as Resp;
    const data = res.list.map((d) => {
        return { link: d.dlink, filename: d.filename.replace(' ', '_') };
    });

    await Promise.all(data.map(({ link, filename }) => {
        console.log(`Download ${link} to ${filename}`);

        let prevLoaded = 0;
        let prevTs = Date.now();
        let duration = 0;
        let speed: number = 0;

        GM_download({
            url: link,
            name: filename,
            saveAs: true,
            headers: {
                "User-Agent": ua
            },
            onerror: (e) => {
                console.error(e);
            },
            onload: () => {
                console.log("download finished");
            },
            onprogress: (res) => {
                const now = Date.now();
                duration = now - prevTs;
                if (duration > 1000) {
                    speed = ((res.loaded - prevLoaded) / duration) / 1024 * 1000;
                    prevLoaded = res.loaded;
                    prevTs = now;
                }
                const progress = res.total > 0 ? (res.loaded * 100 / res.total).toFixed(2) : 0.00;
                if (progressEl) { progressEl.innerHTML = `${progress}% ${speed.toFixed(2)}KB/s`; }
            }
        });
    }));
}

addButton();