import { gsap } from "gsap";
class VisualLyric {
    constructor(audio, lyric, lyricsMainDom, settings) {
        this.audio = audio;
        this.lyricsData = lyric;
        this.lyricsMainDom = lyricsMainDom;
        this.lyricsContainer = document.createElement("div");
        //this.lyricsContainer.style.transition = "transform 0.3s";
        this.lyricsMainDom.appendChild(this.lyricsContainer);
        this.settings = Object.assign({
            lineHeight: 0,
            nowPlayingOffset: window.innerHeight / 5,
            innerHeightShowItemNum: 10,
            scrollSpeed: 1.2,
        }, settings);
        this.nowPlayingIndex = [];
        this.isScrolling = false;
        this.scrollTimer = null;
        this.lyricsContainerY = 0;
        this.meanHeight = 0;
    }
    init() {
        for (let i = 0; i < this.lyricsData.length; i++) {
            this.lyricsData[i].timers = []
            this.lyricsData[i].animates = {
                gsap: [],
                anime: []
            }
            this.lyricsData[i].top = 0;

        }
        // 滚轮滚动事件
        this.lyricsMainDom.addEventListener("wheel", e => {
            this.isScrolling = true;
            // 阻止默认事件
            e.preventDefault();
            console.log(e.deltaY);
            this.lyricsContainerY -= e.deltaY;
            this.lyricsContainer.style.transform = `translateY(${this.lyricsContainerY}px)`;
            for (let i = 0; i < this.lyricsData.length; i++) {
                this.lyricsData[i].parent.style.filter = "blur(0px)";
                //this.lyricsData[i].parent.style.display = "block";
                //gsap.to(this.lyricsData[i].parent, {
                //    duration: 0,
                //    y: this.lyricsData[i].top,
                //})
                this.lyricsData[i].parent.style.transform = `translate(0,${this.lyricsData[i].top}px)`;
                this.lyricsData[i].parent.style.contentVisibility = "auto";
            }
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
            }
            this.scrollTimer = setTimeout(() => {
                this.isScrolling = false;
            }, 1000);

        })
    }
    renderLyrics() {
        let totalH = 0;
        for (let i = 0; i < this.lyricsData.length; i++) {

            const lrcDiv = document.createElement("div");
            lrcDiv.classList.add("lyric_item");
            lrcDiv.addEventListener("click", () => {
                this.audio.currentTime = (this.lyricsData[i].begin - 20) / 1000
            })
            // 鼠标按下事件
            lrcDiv.addEventListener("mousedown", (event) => {
                if (this.isScrolling) return;
                gsap.to(lrcDiv, {
                    duration: 0.7,
                    scale: 0.95,
                    ease: "elastic.out(1, 0.6)",
                })
            });
            lrcDiv.addEventListener("mouseup", (event) => {
                if (this.isScrolling) return;
                gsap.to(lrcDiv, {
                    duration: 0.7,
                    scale: 1,
                    ease: "elastic.out(1, 0.6)",
                })
            });
            // 鼠标移出
            lrcDiv.addEventListener("mouseleave", (event) => {
                if (this.isScrolling) return;
                //if (lyricsData[i].isPlaying) return;
                if (this.isPlaying(i)) return;
                gsap.to(lrcDiv, {
                    duration: 0.7,
                    scale: 1,
                    ease: "elastic.out(1, 0.6)",
                })
            });


            const mainLrc = document.createElement("div");
            mainLrc.classList.add("main_lrc");

            if (this.lyricsData[i].isWait) {
                //console.log("等待");
                mainLrc.classList.add("watting")
                for (let z = 0; z < 3; z++) {
                    const item = document.createElement("div");
                    item.classList.add("watting_item")

                    mainLrc.style.display = "none"
                    mainLrc.appendChild(item);
                    lrcDiv.style.left = "20px"
                }
            }
            for (let j = 0; j < this.lyricsData[i].words.length; j++) {

                const word = document.createElement("div");

                //console.log(lyricsData[i].words[j].end - lyricsData[i].words[j].begin);
                //word.style.transition = "color 0.5s";
                word.style.setProperty("--color", "0.2");
                word.style.transform = "translateY(10px)";
                word.classList.add("char");
                if (this.lyricsData[i].words[j].isHeightLine) {
                    for (let k = 0; k < this.lyricsData[i].words[j].text.length; k++) {
                        const wordSpan = document.createElement("div");
                        wordSpan.classList.add("hl_text")
                        wordSpan.innerText = this.lyricsData[i].words[j].text[k];

                        //wordSpan.innerHTML = `<span>${lyricsData[i].words[j].text[k]}</span>`;
                        //wordSpan.style.transition = "color 0.5s";
                        word.appendChild(wordSpan);
                    }
                    const text = word.children;
                    const middle = Math.floor(text.length / 2);
                    const total = text.length;

                    for (let k = 0; k < total; k++) {
                        const position = k;
                        let origin;

                        if (position < middle) {
                            // 左半部分: 从 100% 到 50%
                            origin = 100 - ((50 * position) / middle);
                        } else {
                            // 右半部分: 从 50% 到 0%
                            origin = 50 - ((50 * (position - middle)) / (total - middle));
                        }
                        //console.log(origin);

                        word.children[k].style.transformOrigin = `${origin}% 50%`;
                    }

                } else {
                    word.innerText = this.lyricsData[i].words[j].text;
                    word.style.setProperty("--p", "-40%");
                    word.style.setProperty("--rp", "0%");

                    word.style.setProperty("--rcolor", "1");

                }
                if (this.isEnglishOrSymbol(this.lyricsData[i].words[j].text)) {
                    word.style.marginRight = "2%";
                    //const sp = document.createElement("span");
                    //sp.innerText = " ";
                    //word.appendChild(sp);
                    //word.innerHTML += " ";
                }

                mainLrc.appendChild(word);
                this.lyricsData[i].words[j].dom = word;
            }
            lrcDiv.appendChild(mainLrc);
            if (this.lyricsData[i].haveTranslation) {
                const tr = document.createElement("div");
                tr.classList.add("translation");
                tr.innerHTML = this.lyricsData[i].translation;
                lrcDiv.appendChild(tr);

            }




            if (this.lyricsData[i].haveBg) {
                const bgLrc = document.createElement("div");
                bgLrc.classList.add("bg");
                const bgText = document.createElement("div");
                bgText.classList.add("text");
                for (let j = 0; j < this.lyricsData[i].bg.words.length; j++) {
                    const word = document.createElement("div");
                    word.classList.add("char");
                    word.style.setProperty("--p", "-40%");
                    word.style.setProperty("--rp", "0%");
                    word.style.setProperty("--color", "0.2");
                    word.style.setProperty("--rcolor", "1");
                    word.style.transform = "translateY(10px)";
                    //word.innerText = lyricsData[i].bg.words[j].text;
                    if (this.lyricsData[i].bg.words[j].isHeightLine) {
                        for (let k = 0; k < this.lyricsData[i].bg.words[j].text.length; k++) {
                            const wordSpan = document.createElement("span");
                            wordSpan.classList.add("hl_text")
                            wordSpan.innerText = this.lyricsData[i].bg.words[j].text[k];
                            word.appendChild(wordSpan);


                        }
                        word.style.marginLeft = "20px";
                        word.style.marginRight = "20px";
                    } else {
                        word.innerText = this.lyricsData[i].bg.words[j].text;
                    }
                    if (this.isEnglishOrSymbol(this.lyricsData[i].bg.words[j].text)) {
                        word.style.marginRight = "2%";
                        //const sp = document.createElement("span");
                        //sp.innerText = " ";
                        //word.appendChild(sp);
                        word.innerHTML += " ";
                    }
                    bgText.appendChild(word);
                    this.lyricsData[i].bg.words[j].dom = word;
                }

                bgLrc.appendChild(bgText);
                if (this.lyricsData[i].bg.haveTranslation) {
                    const tr = document.createElement("div");
                    tr.classList.add("translation");
                    tr.innerHTML = this.lyricsData[i].bg.translation;
                    bgLrc.appendChild(tr);
                }
                //lrcDiv.appendChild(bgLrc);
                this.lyricsData[i].bg.dom = bgLrc;

            }
            if (this.lyricsData[i].agent != "default") {
                let item = +this.lyricsData[i].agent.split("v")[1];
                if ((item % 2) != 0) {
                    lrcDiv.style.left = "10px"
                    lrcDiv.style.right = "auto"
                    lrcDiv.style.transformOrigin = "center left"
                } else {
                    lrcDiv.classList.add("right")
                    //bgLrc.classList.add("right")
                    //try {
                    //    lyricsData[i].bg.dom.classList.add("bg_right")
                    //}
                    //catch {
                    //
                    //}

                    lrcDiv.style.left = "auto"
                    lrcDiv.style.right = "15px"
                    lrcDiv.style.transformOrigin = "center right"
                }
                //console.log((item % 2) == 0);

            }
            //mainLrc.style.top = getTopHeight(1,i);
            //content.appendChild(lrcDiv);
            this.lyricsData[i].parent = lrcDiv;
            //lyricsData[i].isPlaying = false;
            this.lyricsData[i].dom = mainLrc;

        }

        for (let i = 0; i < this.lyricsData.length; i++) {

            //lyricsData[i].parent.appendChild(lyricsData[i].dom);
            if (this.lyricsData[i].haveBg) this.lyricsData[i].parent.appendChild(this.lyricsData[i].bg.dom);
            this.lyricsContainer.appendChild(this.lyricsData[i].parent);
            setTimeout(() => {
                //    lyricsData[i].parent.style.top = getTopHeight(1, i, lyricsData) + 200 + "px";
                //transform: translateY(px);
                const top = this.getTopHeight(1, i, this.lyricsData) + this.settings.nowPlayingOffset
                this.lyricsData[i].parent.style.transform = `translate(0,${top}px)`
                this.lyricsData[i].top = top
            }, 1000);
            totalH += this.lyricsData[i].parent.offsetHeight;
        }
        this.meanHeight = totalH / this.lyricsData.length;
    }

    getTopHeight(now, to) {
        const data = this.lyricsData;
        let res = 0;
        
        // Determine the scroll direction
        if (to > now) { // Scrolling down
            for (let i = now; i < to; i++) {
                const cu = data[i].parent.offsetHeight + this.settings.lineHeight;
                if (cu === 20) { // Element is hidden
                    res += data[i].isWait ? 0 : this.meanHeight;
                } else {
                    res += cu;
                }
            }
        } else { // Scrolling up
            for (let i = now; i > to; i--) {
                const cu = data[i - 1].parent.offsetHeight + this.settings.lineHeight;
                if (cu === 20) { // Element is hidden
                    res -= data[i - 1].isWait ? 0 : this.meanHeight;
                } else {
                    res -= cu;
                }
            }
        }
    
        // Ensure the top position includes the nowPlayingOffset
        return res + this.settings.nowPlayingOffset;
    }

    isPlaying(i) {
        return this.nowPlayingIndex.includes(i);
    }

    addIndex(index) {
        if (!this.nowPlayingIndex.includes(index)) {
            this.nowPlayingIndex.push(index);
        }
        //console.log(nowPlayingIndex);

    }

    removeIndex(i) {
        const index = this.nowPlayingIndex.indexOf(i);
        if (index > -1) {
            this.nowPlayingIndex.splice(index, 1);
        }
        //console.log(nowPlayingIndex);
    }

    gd(i) {
        this.lyricsData.forEach(element => {


            //}
            // 判断nowPlayingIndex中是否包含element.index
            if (!this.isPlaying(element.index)) {
                if (!this.isScrolling) {
                    element.parent.style.filter = `blur(${Math.abs(element.index - i)}px)`
                }


                if (element.haveBg) {

                    element.bg.dom.classList.remove("bgShow")
                    //lyricsData[i].bg.dom.style.display = "none";
                    //setTimeout(() => {
                    element.bg.dom.style.display = "none";
                    //}, 500);
                    //setTimeout(() => { gd(i) }, 50)
                }
                //if (!element.isPlaying) {
                if (this.isPlaying(i)) {
                    //console.log("gd", element);
                    setTimeout(() => {
                        if (!this.isScrolling) {
                            gsap.to(element.parent, {
                                duration: 0.5,
                                scale: 1,
                                delay: 0,
                            });
                        }

                        this.lyricsData[element.index].animates.anime.forEach(element => {
                            element.cancel()
                        })
                        this.lyricsData[element.index].animates.anime = [];
                        element.words.forEach(word => {
                            gsap.to(word.dom, {
                                duration: 0.2,
                                "--rcolor": 0.2,
                                onComplete: () => {
                                    word.dom.style.setProperty("--p", "-40%");
                                    word.dom.style.setProperty("--rp", "0%");
                                    word.dom.style.setProperty("--rcolor", "1");
                                },
                            })

                            if (word.isHeightLine) {
                                const domList = word.dom.children;
                                for (let k = 0; k < domList.length; k++) {
                                    domList[k].style.color = "rgba(255,255,255,0.2)";
                                }
                            }
                            //gsap.to(element.dom, {
                            //    duration: 0.5,
                            //    translateY: "10px",
                            //
                            //})
                            const aimt = word.dom.animate([{
                                transform: word.dom.style.transform,
                            }, {
                                transform: "translateY(10px)",
                            }], {
                                duration: 500,
                                easing: 'ease-in',
                            })
                            aimt.onfinish = () => {
                                word.dom.style.transform = "translateY(10px)"
                            }



                        })

                        element.bg.words.forEach(element => {
                            //element.dom.style.setProperty("--p", "-40%");
                            //element.dom.style.setProperty("--rp", "0%");

                            gsap.to(element.dom, {
                                duration: 0.2,
                                "--rcolor": 0.2,
                                onComplete: () => {
                                    element.dom.style.setProperty("--p", "-40%");
                                    element.dom.style.setProperty("--rp", "0%");
                                    element.dom.style.setProperty("--rcolor", "1");

                                }
                            })
                            //setTimeout(() => {
                            //    gsap.to(element.dom, {
                            //        duration: 0.5,
                            //        y: "10px"
                            //    })
                            //}, 200)
                            const aimt = element.dom.animate([{
                                transform: element.dom.style.transform,
                            }, {
                                transform: "translateY(10px)",
                            }], {
                                duration: 500,
                                easing: 'ease-in',
                            })
                            aimt.onfinish = () => {
                                element.dom.style.transform = "translateY(10px)"
                            }
                        })
                    }, 100)
                }


            } else {
                element.parent.style.filter = `blur(0px)`
            }

            //i = nowPlayingIndex[0]
            const n = Math.abs(i - 3 - element.index)
            const ah = n * 70 - n * 20
            const rn = i - element.index
            //console.log(rn);



            //if (nowPlayingIndex.length > 1) return

            if (!this.isScrolling) {

                this.lyricsContainerY = 0
                this.lyricsContainer.style.transform = `translateY(0px)`;
                this.lyricsData[element.index].top = this.getTopHeight(i, element.index)
                if (!(rn > -this.settings.innerHeightShowItemNum && rn < this.settings.innerHeightShowItemNum)) {
                    //element.parent.style.top = getTopHeight(i, element.index, lyricsData) + "px";
                    //element.parent.style.transform = `translate(0,${top}px)`

                    gsap.to(element.parent, {
                        duration: 0,
                        y: this.lyricsData[element.index].top,
                    })
                } else {
                    setTimeout(() => {

                        gsap.to(element.parent, {
                            duration: this.settings.scrollSpeed,
                            ease: "elastic.out(1, 1.35)",
                            y: this.lyricsData[element.index].top,
                        })
                    }, ah)

                }
                // rn在-10 到 10之间，则执行动画
                setTimeout(() => {
                    if (rn > -this.settings.innerHeightShowItemNum && rn < this.settings.innerHeightShowItemNum) {
                        //element.parent.style.display = "block"
                        element.parent.style.contentVisibility = "auto"
                    } else {
                        //element.parent.style.display = "none"
                        element.parent.style.contentVisibility = "hidden"
                    }
                }, 100)
            }

        });
    }

    addLyric = (i) => {
        this.lyricsData[i].timers.forEach(element => {
            clearTimeout(element);
        });
        this.lyricsData[i].timers = [];
        const currentTime = this.audio.currentTime * 1000;
        //lyricsData[i].isPlaying = true;
        this.addIndex(i);
        //console.log(nowPlayingIndex);

        if (this.lyricsData[i].haveBg) {
            this.lyricsData[i].bg.dom.style.display = "inherit";
            setTimeout(() => {
                this.lyricsData[i].bg.dom.classList.add("bgShow")
                //console.log(lyricsData[i].bg.dom);

                setTimeout(() => { this.gd(this.bubbleSort(this.nowPlayingIndex)[0]) }, 50)

            }, 10)
        }
        if (!this.isScrolling) {
            gsap.to(this.lyricsData[i].parent, {
                duration: 0.5,
                scale: 1.04,
                delay: this.nowPlayingIndex.length > 1 ? 0 : 0.2,
            });
        }
        if (this.lyricsData[i].isWait) {
            //lyricsData[i].dom.style.transform = 'scale(1)'
            //lyricsData[i].dom.classList.add("watting_animate_ing")
            const dom = this.lyricsData[i].dom;
            const totalTime = this.lyricsData[i].end - currentTime;
            this.lyricsData[i].dom.style.display = "inherit";
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    dom.children[i].classList.add("watting_highlight")
                }, (totalTime / 3 * (i)))
            }
            this.animateScale(
                {
                    element: this.lyricsData[i].dom,
                    totalTime,
                    endTime: 500,
                    onComplete: () => {
                        this.lyricsData[i].dom.style.display = "none";
                    }
                }
            )
        }
        this.gd(this.bubbleSort(this.nowPlayingIndex)[0]);

        // 在这里执行添加新歌词的动画或效果
        //console.log("Added lyric:", i, nowPlayingIndex);
        //console.log(lyricsData[i].parent.offsetHeight);


        const words = this.lyricsData[i].words;
        const bgWords = this.lyricsData[i].haveBg ? this.lyricsData[i].bg.words : [];
        // 高亮主歌词
        for (let j = 0; j < words.length; j++) {
            const intervalTime = words[j].begin - currentTime;
            //console.log(intervalTime);

            const timerItem = setTimeout(() => {
                const duration = (words[j].end - words[j].begin) * 1.25;
                if (!this.lyricsData[i].words[j].isHeightLine) {
                    gsap.to(this.lyricsData[i].words[j].dom, { // 背景
                        duration: duration / 1000, // 防止时间过长
                        //duration:0,
                        "--p": "100%",
                        "--rp": "140%",
                        ease: "none",
                    });
                }
                const transformYD = (words[j].end - words[j].begin);
                //console.log("1", transformYD);

                //gsap.to(lyricsData[i].words[j].dom, { // 位移
                //    //duration: (words[j].end - words[j].begin) / 1000 * 3,
                //    duration: transformYD > 1 ? transformYD + 0.3 : 1.3,
                //    y: "0px",
                //    ease: "power1.out",
                //});
                //}
                const aimt = this.lyricsData[i].words[j].dom.animate(
                    [
                        {
                            transform: this.lyricsData[i].words[j].dom.style.transform,
                        },
                        {
                            transform: `translateY(5px)`
                        }
                    ],
                    {
                        duration: transformYD > 1 ? transformYD + 500 : 1500,
                        easing: "ease-out",
                        delay: 50
                    }
                )
                aimt.onfinish = () => {
                    this.lyricsData[i].words[j].dom.style.transform = "translate(0px, 5px)"

                }

                //isHeightLine
                if (this.lyricsData[i].words[j].isHeightLine) {
                    console.log("歌词高亮线");
                    const Hitem = this.lyricsData[i].words[j].dom;
                    //console.log(Hitem.children);


                    for (let k = 0; k < Hitem.children.length; k++) {
                        const ele = Hitem.children[k];
                        //console.log(100 + (10 - (Hitem.children.length / duration * 1000)) * 2);
                        const dTim = Hitem.children.length / duration * 1000;
                        // 动画的总时长为 `duration`
                        const anim = ele.animate([
                            {
                                transform: "scale(1) translateY(0px)",
                                //marginLeft: "none",
                                easing: "cubic-bezier(0.5, 0, 0.5, 1)",
                                color: "rgba(255, 255, 255, 0.2)"

                            },
                            {
                                //fontSize: "115%",
                                transform: "scale(120%) translateY(-10%)",
                                //transform: "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -10, 0, 0.8)",
                                textShadow: "#ffffff 0px 0px " + 20 + "px",
                                //marginLeft: "-" + (10 - (dTim)) * 2.5 / 10 + "px",
                                easing: "cubic-bezier(0.5, 0, 0.5, 1)",
                                color: "rgba(255, 255, 255, 1)"
                            },
                            {
                                transform: "scale(1) translateY(0px)",
                                //transform: "matrix(1, 0, 0, 1, 0, 0)",
                                textShadow: "none",
                                easing: "cubic-bezier(0.5, 0, 0.5, 1)",
                                color: "rgba(255, 255, 255,1)"
                                //marginLeft: "none"
                            }
                        ], {
                            duration: this.isEnglishOrSymbol(words[j].text) ? duration : duration * 1.5, // 统一时长
                            easing: "cubic-bezier(0.5, 0, 0.5, 1)",
                            delay: ((k - 1) * 0.3 * duration / Hitem.children.length), // 设置每个动画的开始时间略有延迟（如果需要）
                            fill: "forwards",
                        })

                        this.lyricsData[i].animates.anime.push(anim)

                    }


                }


                //}, words[j].begin - lyricsData[i].begin);
            }, intervalTime * 0.95);
            this.lyricsData[i].timers.push(timerItem)
        }

        // 高亮背景歌词（如果有）
        for (let p = 0; p < bgWords.length; p++) {

            setTimeout(() => {
                const duration = (bgWords[p].end - bgWords[p].begin) * 1.25;
                gsap.to(this.lyricsData[i].bg.words[p].dom, {
                    duration: duration / 1000,
                    "--p": "100%",
                    "--rp": "140%",

                    ease: "none",
                });
                const transformYD = (bgWords[p].end - bgWords[p].begin);
                //console.log("2", transformYD);

                //gsap.to(lyricsData[i].bg.words[p].dom, {
                //    //duration: (bgWords[p].end - bgWords[p].begin) / 1000 * 3,
                //    duration: transformYD > 1 ? transformYD + 0.3 : 1.3,
                //    y: "0px",
                //    ease: "power1.out",
                //});
                const aimt = this.lyricsData[i].bg.words[p].dom.animate(
                    [
                        {
                            transform: `translateY(10px)`
                        },
                        {
                            transform: `translateY(7px)`
                        }
                    ],
                    {
                        duration: transformYD > 1 ? transformYD + 500 : 1500,
                        easing: "ease-out",
                    }
                )
                aimt.onfinish = () => {
                    this.lyricsData[i].bg.words[p].dom.style.transform = "translate(0px, 7px)"
                }
            }, (bgWords[p].begin - this.lyricsData[i].begin) * 0.95);
        }

    }

    removeLyric = (i) => {
        this.removeIndex(i);
        this.lyricsData[i].timers.forEach(timer => {
            clearTimeout(timer);
        });
        this.lyricsData[i].timers = [];

        //console.log("removeLyric", i);
        //lyricsData[i].isPlaying = false;



        if (this.lyricsData[i].isWait) {
            this.lyricsData[i].dom.style.display = "none";
            for (let j = 0; i < 3; i++) {
                this.lyricsData[j].dom.children[i].classList.remove("watting_highlight")
            }
        }

    }


    animateScale({
        element,
        totalTime,
        endTime,
        onComplete
    }) {
        if (!element || !totalTime || !endTime || typeof onComplete !== 'function') {
            throw new Error('Invalid arguments. Please provide element, totalTime, endTime, and onComplete callback.');
        }

        const loopTime = 2500; // Time for one loop
        const ease = "power1.inOut"; // Easing for smooth transition
        let isAnimationComplete = false;

        // Loop the animation
        gsap.to(element, {
            scale: 1.5,
            duration: loopTime / 1000, // Convert milliseconds to seconds
            ease: ease,
            repeat: -1, // Repeat infinitely
            yoyo: true, // Reverse the animation (scale back down)
            onRepeat: () => {
                if (isAnimationComplete) {
                    // Stop the animation once the total time is reached
                    gsap.killTweensOf(element);
                    onComplete();
                }
            }
        });

        // Handle the final scale-down logic and stopping the loop after totalTime is reached
        gsap.to(element, {
            scale: 0,
            duration: endTime / 1000, // Convert milliseconds to seconds
            ease: ease,
            delay: totalTime / 1000 - endTime / 1000, // Delay the scale-down
            onComplete: () => {
                isAnimationComplete = true;
            }
        });
    }

    isEnglishOrSymbol(input) {
        // 判断是否为英文字符（字母或数字）
        const englishRegex = /^[A-Za-z0-9]+$/;

        // 判断是否为英文符号（包括常见的标点符号）
        const symbolRegex = /^[!-/:-@[-`{-~]+$/;

        // 如果是纯英文字符、纯符号，或两者的组合，返回 true
        const combinedRegex = /^[A-Za-z0-9!-/:-@[-`{-~]+$/;
        return combinedRegex.test(input);
    }

    bubbleSort(array) {

        for (var i = 0; i < array.length - 1; i++) {
            for (var j = 0; j < array.length - i - 1; j++) {
                // 1.对每一个值和它的下一个值进行比较
                if (array[j] > array[j + 1]) {
                    // 如果第一个值更多，则将其赋予自定义计数值 count
                    var count = array[j];
                    // 反复交换
                    array[j] = array[j + 1];
                    array[j + 1] = count;
                };
            };
        };
        return array;
    }

}

export default VisualLyric;