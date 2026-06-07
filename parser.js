/*
数据结构
words{
    begin: Int, // 开始时间
    end: Int,   // 结束时间
    text: String,    // 歌词内容
    isHeightLine: Boolean, // 是否是高亮歌词
}

[]lrcItem{
    begin: Int, // 开始时间
    end: Int, // 结束时间
    words: []words, // 歌词内容
    haveBg: Boolean, // 是否有背景歌词
    haveTranslation: Boolean, // 是否有翻译歌词
    bg: bg{ // 背景歌词
        begin: Int, // 开始时间
        end: Int,   // 结束时间
        words: []words, // 背景歌词内容
        haveTranslation: Boolean,   // 背景歌词是否有翻译
        translation: String,    // 背景歌词翻译
    },
    translation: String,// 翻译歌词
    agent: String "default" || "v1" || "v2", // 对唱模式
    index: Int, // 索引
    isLine:Boolean, // 是否是单行歌词
    isWait: Boolean, // 是否是等待歌词
}
*/






function parseTTML(xml) {
    // DOMParser 解析 XML 文档
    let parser = new DOMParser(xml, "application/xml");
    let doc = parser.parseFromString(xml, "text/xml");

    const body = doc.getElementsByTagName("body")[0].getElementsByTagName("div")[0].children;
    let lrc = [];
    let lastWaitTime = 0;
    for (let i = 0; i < body.length; i++) {
        const item = body[i];
        let beginR = timeToMilliseconds(item.getAttribute("begin"));
        if (lrc.length > 0) {
            if (beginR - lrc[lrc.length - 1].end < 40) {
                lrc[lrc.length - 1].end -= 40;
            }
        }

        let lrcItem = {
            begin: beginR,
            end: timeToMilliseconds(item.getAttribute("end")),
            words: [],
            haveBg: false,
            haveTranslation: false,
            bg: {
                begin: 0,
                end: 0,
                words: [],
                haveTranslation: false,
                translation: ""
            },
            translation: "",
            agent: item.getAttribute("ttm:agent") || "default",
            index: 0,
            isLine: false,
            isWait: false
        };
        let words = [];
        let children = item.children;

        if (lrcItem.begin - lastWaitTime > 10 * 1000) {
            lrc.push({
                begin: lastWaitTime + 40,
                end: lrcItem.begin - 40,
                words: [],
                haveBg: false,
                haveTranslation: false,
                bg: {
                    begin: 0,
                    end: 0,
                    words: [],
                    haveTranslation: false,
                    translation: ""
                },
                translation: "",
                agent: "default",
                index: 0,
                isLine: false,
                isWait: true
            });
        }
        lastWaitTime = lrcItem.end;

        if (children.length < 1) {
            words.push({
                text: item.textContent,
                begin: timeToMilliseconds(item.getAttribute("begin")),
                end: timeToMilliseconds(item.getAttribute("end")),
                isHeightLine: timeToMilliseconds(item.getAttribute("end")) - timeToMilliseconds(item.getAttribute("begin")) > 1500
            });
        } else {
            for (let j = 0; j < children.length; j++) {
                switch (children[j].getAttribute("ttm:role")) {
                    case "x-bg":
                        lrcItem.haveBg = true;
                        let bgWords = [];
                        lrcItem.bg.begin = timeToMilliseconds(children[j].getAttribute("begin"));
                        lrcItem.bg.end = timeToMilliseconds(children[j].getAttribute("end"));
                        if (lrcItem.bg.end > lrcItem.end) { // 背景歌词结束时间大于歌词结束时间，将背景歌词结束时间设置为歌词结束时间
                            lrcItem.end = lrcItem.bg.end;
                        }
                        if (lrcItem.bg.begin < lrcItem.begin) { // 背景歌词开始时间小于歌词开始时间，将背景歌词开始时间设置为歌词开始时间
                            lrcItem.begin = lrcItem.bg.begin;
                        }
                        if (children[j].children.length > 0) {
                            for (let k = 0; k < children[j].children.length; k++) {
                                const bgWord = children[j].children[k];
                                if (bgWord.getAttribute("ttm:role") == "x-translation") {
                                    lrcItem.bg.haveTranslation = true;
                                    lrcItem.bg.translation = bgWord.textContent;
                                } else {
                                    bgWords.push({
                                        text: bgWord.textContent,
                                        begin: timeToMilliseconds(bgWord.getAttribute("begin")),
                                        end: timeToMilliseconds(bgWord.getAttribute("end")),
                                        isHeightLine: timeToMilliseconds(bgWord.getAttribute("end")) - timeToMilliseconds(bgWord.getAttribute("begin")) > 1500
                                    });
                                }
                            }
                        } else {
                            bgWords.push({
                                text: children[j].textContent,
                                begin: timeToMilliseconds(children[j].getAttribute("begin")),
                                end: timeToMilliseconds(children[j].getAttribute("end")),
                                isHeightLine: timeToMilliseconds(children[j].getAttribute("end")) - timeToMilliseconds(children[j].getAttribute("begin")) > 1500
                            });
                        }
                        lrcItem.bg.words = bgWords;
                        break;
                    case "x-translation":
                        lrcItem.haveTranslation = true;
                        lrcItem.translation = children[j].textContent;
                        break;
                    case "x-roman":
                        break;
                    default:
                        words.push({
                            text: children[j].textContent,
                            begin: timeToMilliseconds(children[j].getAttribute("begin")),
                            end: timeToMilliseconds(children[j].getAttribute("end")),
                            isHeightLine: timeToMilliseconds(children[j].getAttribute("end")) - timeToMilliseconds(children[j].getAttribute("begin")) > 1500
                        });
                }
            }
        }

        lrcItem.words = words;
        lrc.push(lrcItem);
    }

    for (let i = 0; i < lrc.length; i++) {
        lrc[i].index = i;
    }
    return lrc;
}

// 更稳健的时间字符串解析函数
function timeToMilliseconds(time) {
    if (!time) return 0;
    let s = String(time).trim();
    if (!s) return 0;

    // 辅助：解析 "SS" 或 "SS.mmm" 返回 [seconds, milliseconds]
    function parseSecAndMs(part) {
        const dotIdx = part.indexOf('.');
        if (dotIdx === -1) {
            const sec = parseInt(part || "0", 10);
            return [isNaN(sec) ? 0 : sec, 0];
        } else {
            const secPart = part.slice(0, dotIdx) || "0";
            let fracPart = part.slice(dotIdx + 1) || "0";
            const sec = parseInt(secPart, 10);
            // 保证毫秒为三位：截断或补零
            if (fracPart.length > 3) fracPart = fracPart.slice(0, 3);
            while (fracPart.length < 3) fracPart += '0';
            const ms = parseInt(fracPart, 10);
            return [(isNaN(sec) ? 0 : sec), (isNaN(ms) ? 0 : ms)];
        }
    }

    try {
        const colonCount = (s.match(/:/g) || []).length;
        if (colonCount === 2) {
            // hh:mm:ss(.mmm)
            const parts = s.split(':');
            const h = parseInt(parts[0] || "0", 10) || 0;
            const m = parseInt(parts[1] || "0", 10) || 0;
            const [sec, ms] = parseSecAndMs(parts[2] || "0");
            return h * 3600 * 1000 + m * 60 * 1000 + sec * 1000 + ms;
        } else if (colonCount === 1) {
            // mm:ss(.mmm)
            const parts = s.split(':');
            const m = parseInt(parts[0] || "0", 10) || 0;
            const [sec, ms] = parseSecAndMs(parts[1] || "0");
            return m * 60 * 1000 + sec * 1000 + ms;
        } else {
            // seconds or seconds.fraction
            const f = parseFloat(s);
            if (isNaN(f)) return 0;
            return Math.round(f * 1000);
        }
    } catch (e) {
        return 0;
    }
}

function parseLRC(str, endTime) {
    let lrc = [];
    str.split("\n").forEach(line => {
        if (line) {
            let [time, words] = line.replace(/\]/g, "").split("[").map(s => s.trim());
            console.log(time, words);

            /*lrc.push({
                begin: timeToMilliseconds(time),
                end: 0,
                words: [{text: words}],
                haveBg: false,
                haveTranslation: false,
                bg: {
                    begin: 0,
                    end: 0,
                    words: [],
                    haveTranslation: false,
                    translation: ""
                },
                translation: "",
                agent: "default",
                index: 0,
                isLine: true
            });*/
        }
    });
    return lrc;
}
export {
    parseTTML
}

const l = `[00:00.000]I promise that you'll never find another like me
[00:03.490]I know that I'm a handful baby uh
[00:06.087]I know I never think before I jump
[00:08.763]And you're the kind of guy the ladies want
[00:11.355]And there's a lot of cool chicks out there
[00:13.998]I know that I went psycho on the phone
[00:16.665]I never leave well enough alone
[00:19.294]And trouble's gonna follow where I go
[00:21.859]And there's a lot of cool chicks out there
[00:23.959]But one of these things is not like the others
[00:26.745]Like a rainbow with all of the colors
[00:29.377]Baby doll when it comes to a lover
[00:31.861]I promise that you'll never find another like
[00:33.804]Me-e-e
[00:36.111]Ooh, ooh, ooh, ooh, ooh
[00:39.891]I'm the only one of me
[00:42.519]Baby that's the fun of me
[00:44.161]Eeh-eeh-eeh
[00:46.792]Ooh, ooh, ooh, ooh, ooh
[00:50.367]You're the only one of you
[00:53.024]Baby that's the fun of you
[00:55.362]And I promise that nobody's gonna love you like
[00:57.651]Me-e-e
[00:58.854]I know I tend to make it about me
[01:01.498]I know you never get just what you see
[01:04.105]But I will never bore you baby
[01:06.659]And there's a lot of lame guys out there
[01:09.436]And when we had that fight out in the rain
[01:12.190]You ran after me and called my name
[01:14.648]I never want to see you walk away
[01:17.283]And there's a lot of lame guys out there
[01:19.222]'Cause one of these things is not like the others
[01:22.106]Living in winter I am your summer
[01:24.771]baby doll when it comes to a lover
[01:27.189]I promise that you'll never find another like me
[01:29.280]Me-e-e
[01:31.574]Ooh, ooh, ooh, ooh, ooh
[01:35.283]I'm the only one of me
[01:37.878] Let me keep you company
[01:39.505]Eeh-eeh-eeh
[01:42.094]Ooh, ooh, ooh, ooh, ooh
[01:45.799]You're the only one of you
[01:48.424]baby that's the fun of you
[01:50.746]And I promise that nobody's gonna love you like
[01:52.937]Me-e-e
[01:56.365]Girl there ain't no 'I' in team
[01:58.945]But you know there is a 'Me'
[02:01.506]Strike the band up One Two Three
[02:04.068]I promise that you'll never find another like me
[02:06.875]Girl there ain't no 'I' in team
[02:09.472]But you know there is a 'Me'
[02:11.810]And you can't spell awesome without me
[02:14.682]I promise that you'll never find another like
[02:16.715]Me-e-e
[00:00.000]Yeah
[02:19.082]Ooh, ooh, ooh, ooh, ooh
[02:21.045]And I want you, baby
[02:22.740]I'm the only one of me
[02:24.056]I'm the only one of me
[02:25.335]Baby that's the fun of me
[02:26.690]Baby that's the fun of me
[02:26.937]Eeh-eeh-eeh
[02:29.600]Ooh, ooh, ooh, ooh, ooh
[00:00.000]Oh
[02:33.299]You're the only one of you
[02:35.906]Baby that's the fun of you
[02:38.209]And I promise that nobody's gonna love you like
[02:40.496]Me-e-e
[02:41.138]Girl there ain't no 'I' in team
[02:42.829]Ooh, ooh, ooh, ooh, ooh
[02:43.828]But you know there is a 'Me'
[02:46.447]I'm the only one of me
[02:49.090]Baby that's the fun of me
[02:50.728]Eeh-eeh-eeh
[02:51.538]Strike the band up One Two Three
[02:53.314]Ooh, ooh, ooh, ooh, ooh
[02:54.202]You can't spell awesome without me
[02:57.027]You're the only one of you
[02:58.650]Baby
[02:59.634]Baby that's the fun of you
[03:01.941]And I promise that nobody's gonna love you like
[03:03.830]Me-e-e
`
