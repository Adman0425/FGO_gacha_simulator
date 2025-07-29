// 載入卡池資料
let cardPool = []; // 初始化 cardPool
let singleDrawCounter = 0;
let saintQuartz = 0;
let totalQuartzSpent = 0; // 追蹤總花費
let gachaHistory = []; // 抽卡歷史
let currentPoolFile = "normal_pool.json";

// DOM 元素
const poolSelect = document.getElementById("poolSelect");
const singleDrawBtn = document.getElementById("singleDrawBtn");
const tenDrawBtn = document.getElementById("tenDrawBtn");
const specialDrawBtn = document.getElementById("specialDrawBtn");
const luckyBagBtn = document.getElementById("luckyBagBtn");
const resultContainer = document.getElementById("resultContainer");
const quartzDisplay = document.getElementById("quartzDisplay");
const initialQuartzInput = document.getElementById("initialQuartzInput");
const setInitialQuartzBtn = document.getElementById("setInitialQuartzBtn");
const initialQuartzSetup = document.getElementById("initialQuartzSetup");
const quartzInfo = document.getElementById("quartzInfo");
const addQuartzContainer = document.getElementById("addQuartzContainer");
const addQuartzInput = document.getElementById("addQuartzInput");
const addQuartzBtn = document.getElementById("addQuartzBtn");
const quartzContainer = document.querySelector("#quartzInfo .quartz-container");
const quickAddBtns = document.querySelectorAll(".quickAddBtn");
const statsPanel = document.getElementById("statsPanel");
const historyLog = document.getElementById("historyLog");
const pullSound = document.getElementById("pullSound");
const ssrSound = document.getElementById("ssrSound");

// 更新聖晶石顯示和按鈕狀態
function updateQuartzDisplay() {
    quartzDisplay.textContent = saintQuartz;
    checkButtons();
}

function checkButtons() {
    singleDrawBtn.disabled = saintQuartz < 3;
    tenDrawBtn.disabled = saintQuartz < 30;
    specialDrawBtn.disabled = saintQuartz < 3;
    luckyBagBtn.disabled = saintQuartz < 15;
    
    const isLuckyBag = currentPoolFile === "luckybag_pool.json";
    singleDrawBtn.style.display = !isLuckyBag && singleDrawCounter < 9 ? "inline-block" : "none";
    tenDrawBtn.style.display = !isLuckyBag ? "inline-block" : "none";
    specialDrawBtn.style.display = !isLuckyBag && singleDrawCounter === 9 ? "inline-block" : "none";
    luckyBagBtn.style.display = isLuckyBag ? "inline-block" : "none";
}

function updateSingleDrawButtonState() {
    checkButtons();
}

// 設定初始聖晶石
setInitialQuartzBtn.addEventListener("click", () => {
    saintQuartz = parseInt(initialQuartzInput.value, 10) || 0;
    initialQuartzSetup.style.display = "none";
    quartzInfo.style.display = "block";
    updateQuartzDisplay();
});

// 補充聖晶石
addQuartzBtn.addEventListener("click", () => {
    const amount = parseInt(addQuartzInput.value, 10) || 0;
    if (amount > 0) {
        saintQuartz += amount;
    }
    updateQuartzDisplay();
    addQuartzContainer.style.display = "none";
});

// 快捷補充聖晶石
quickAddBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const amount = parseInt(btn.dataset.amount, 10);
        saintQuartz += amount;
        updateQuartzDisplay();
        addQuartzContainer.style.display = "none";
    });
});

// 點擊聖晶石圖片顯示補充介面
quartzContainer.addEventListener("click", () => {
    addQuartzContainer.style.display = "block";
});


function loadPool(poolFile) {
    currentPoolFile = poolFile;
    fetch("pool/" + poolFile)
        .then(response => response.json())
        .then(data => {
            cardPool = data.servants.concat(data.craft_essences);
            calculateCardProbabilities(data);
            checkButtons();
        })
        .catch(error => console.error("載入卡池資料錯誤：", error));
}

function calculateCardProbabilities(pool) {
    const rarityProbabilities = {
        5: { servant: 0.01, craft_essence: 0.04 },
        4: { servant: 0.03, craft_essence: 0.12 },
        3: { servant: 0.4, craft_essence: 0.4 },
    };

    const puRarityProbabilities = {
        5: { servant: 0.008, craft_essence: 0.028 },
        4: { servant: 0.024, craft_essence: 0.04 },
        3: { servant: 0.04, craft_essence: 0.16 },
    };

    for (const type of ["servants", "craft_essences"]) {
        const rarityCounts = {};
        if (pool && pool[type]) {
            for (const card of pool[type]) {
                if (!rarityCounts[card.rarity]) {
                    rarityCounts[card.rarity] = { pu: 0, normal: 0 };
                }
                if (card.isPu) {
                    rarityCounts[card.rarity].pu++;
                } else {
                    rarityCounts[card.rarity].normal++;
                }
            }

            for (const card of pool[type]) {
                const rarity = card.rarity;
                const isPu = card.isPu;
                let probability = 0;
                const rarityCount = rarityCounts[rarity];

                if (rarityCount) {
                    if (isPu && rarityCount.pu > 0) {
                        probability = puRarityProbabilities[rarity][type === "servants" ? "servant" : "craft_essence"] / rarityCount.pu;
                    } else if (!isPu && rarityCount.normal > 0) {
                        const totalPuProb = puRarityProbabilities[rarity][type === "servants" ? "servant" : "craft_essence"];
                        const normalProb = rarityProbabilities[rarity][type === "servants" ? "servant" : "craft_essence"] - totalPuProb;
                        probability = normalProb / rarityCount.normal;
                    }
                }
                card.probability = probability;
            }
        }
    }
}

poolSelect.addEventListener("change", () => {
    loadPool(poolSelect.value);
});

loadPool("normal_pool.json");

function drawCard() {
    const randomNumber = Math.random();
    let cumulativeProbability = 0;

    for (const card of cardPool) {
        cumulativeProbability += card.probability || 0;
        if (randomNumber < cumulativeProbability) {
            return card;
        }
    }
    return null;
}

function displayCards(cards) {
    resultContainer.innerHTML = "";
    let hasSSR = false;

    if (!Array.isArray(cards)) cards = [cards]; // 確保是陣列

    cards.forEach(card => {
        if (card.rarity === 5) hasSSR = true;
    });

    if (hasSSR) {
        ssrSound.play();
    } else {
        pullSound.play();
    }

    if (cards.length === 1) {
        const cardDiv = createCardElement(cards[0]);
        resultContainer.appendChild(cardDiv);
    } else if (cards.length === 2) {
        const row = document.createElement("div");
        row.classList.add("result-row");
        cards.forEach(card => row.appendChild(createCardElement(card)));
        resultContainer.appendChild(row);
    } else {
        const row1 = document.createElement("div");
        row1.classList.add("result-row");
        const row2 = document.createElement("div");
        row2.classList.add("result-row");

        cards.forEach((card, index) => {
            const cardDiv = createCardElement(card);
            if (index < 6) {
                row1.appendChild(cardDiv);
            } else {
                row2.appendChild(cardDiv);
            }
        });

        resultContainer.appendChild(row1);
        resultContainer.appendChild(row2);
    }
}

function createCardElement(card) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    if (card.rarity === 5) {
        cardDiv.classList.add("ssr-glow");
    }
    const imgSrc = card.imageUrl;
    cardDiv.innerHTML = `<img src="${imgSrc}" width="132" height="144" alt="${card.name}">`;
    return cardDiv;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateHistoryAndStats(cards, cost) {
    totalQuartzSpent += cost;
    gachaHistory.unshift(...cards);

    // 更新歷史紀錄
    historyLog.innerHTML = "";
    gachaHistory.forEach(card => {
        historyLog.innerHTML += `<div>${card.rarity}★ ${card.type === 'servant' ? '從者' : '禮裝'}: ${card.name}</div>`;
    });

    // 更新統計面板
    const stats = {
        totalPulls: gachaHistory.length,
        ssrServants: gachaHistory.filter(c => c.type === 'servant' && c.rarity === 5).length,
        srServants: gachaHistory.filter(c => c.type === 'servant' && c.rarity === 4).length,
        ssrCEs: gachaHistory.filter(c => c.type === 'craft_essence' && c.rarity === 5).length,
        srCEs: gachaHistory.filter(c => c.type === 'craft_essence' && c.rarity === 4).length
    };
    
    statsPanel.innerHTML = `
        總抽數: ${stats.totalPulls} | 總花費: ${totalQuartzSpent} 聖晶石<br>
        五星從者: ${stats.ssrServants} | 四星從者: ${stats.srServants}<br>
        五星禮裝: ${stats.ssrCEs} | 四星禮裝: ${stats.srCEs}
    `;
}


// 單抽按鈕
singleDrawBtn.addEventListener("click", () => {
    if (saintQuartz < 3) {
        alert("聖晶石數量不足，無法進行單抽。");
        return;
    }
    saintQuartz -= 3;
    singleDrawCounter++;
    
    const drawnCard = drawNonNullCard();
    displayCards([drawnCard]);
    updateHistoryAndStats([drawnCard], 3);
    updateQuartzDisplay();
    updateSingleDrawButtonState();
});

// 特殊召喚按鈕
specialDrawBtn.addEventListener("click", () => {
    if (saintQuartz < 3) {
        alert("聖晶石數量不足，無法進行召喚。");
        return;
    }
    saintQuartz -= 3;
    singleDrawCounter = 0; // 重置計數器
    
    let drawnCards = [drawNonNullCard(), drawNonNullCard()];
    displayCards(drawnCards);
    updateHistoryAndStats(drawnCards, 3);
    updateQuartzDisplay();
    updateSingleDrawButtonState();
});

// 十連按鈕
tenDrawBtn.addEventListener("click", () => {
    if (saintQuartz < 30) {
        alert("聖晶石數量不足，無法進行十連抽。");
        return;
    }
    saintQuartz -= 30;
    
    // 處理保底
    let drawnCards = [];
    for (let i = 0; i < 11; i++) {
        drawnCards.push(drawNonNullCard());
    }

    const has3StarServant = drawnCards.some(card => card.type === 'servant' && card.rarity >= 3);
    const has4StarOrHigher = drawnCards.some(card => card.rarity >= 4);

    if (!has3StarServant) {
        const potentialReplacements = cardPool.filter(c => c.type === 'servant' && c.rarity >= 3);
        if (potentialReplacements.length > 0) {
            drawnCards[Math.floor(Math.random() * 11)] = potentialReplacements[Math.floor(Math.random() * potentialReplacements.length)];
        }
    }
    
    if (!has4StarOrHigher) {
        const potentialReplacements = cardPool.filter(c => c.rarity >= 4);
        if (potentialReplacements.length > 0) {
            let replaceIndex = Math.floor(Math.random() * 11);
            if (drawnCards[replaceIndex].type === 'servant' && drawnCards[replaceIndex].rarity >= 3 && !has3StarServant) {
                replaceIndex = (replaceIndex + 1) % 11;
            }
            drawnCards[replaceIndex] = potentialReplacements[Math.floor(Math.random() * potentialReplacements.length)];
        }
    }

    shuffle(drawnCards);
    displayCards(drawnCards);
    updateHistoryAndStats(drawnCards, 30);
    updateQuartzDisplay();
});

// 福袋召喚按鈕
luckyBagBtn.addEventListener("click", () => {
    if (saintQuartz < 15) {
        alert("聖晶石數量不足，無法進行福袋召喚。");
        return;
    }
    saintQuartz -= 15;
    
    let drawnCards = [];
    
    // 保底五星從者
    const fiveStarServants = cardPool.filter(c => c.type === 'servant' && c.rarity === 5);
    if (fiveStarServants.length > 0) {
        drawnCards.push(fiveStarServants[Math.floor(Math.random() * fiveStarServants.length)]);
    }

    // 保底四星從者
    const fourStarServants = cardPool.filter(c => c.type === 'servant' && c.rarity === 4);
    if (fourStarServants.length > 0) {
        drawnCards.push(fourStarServants[Math.floor(Math.random() * fourStarServants.length)]);
    }

    // 補足剩餘的9張
    for (let i = 0; i < 9; i++) {
        drawnCards.push(drawNonNullCard());
    }

    shuffle(drawnCards);
    displayCards(drawnCards);
    updateHistoryAndStats(drawnCards, 15);
    updateQuartzDisplay();
});

function drawNonNullCard() {
    let card = null;
    while (!card) {
        card = drawCard();
    }
    return card;
}
