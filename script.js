// 載入卡池資料
let cardPool = []; // 初始化 cardPool
let singleDrawCounter = 0;
let saintQuartz = 0; // 初始化聖晶石數量
let currentPoolFile = "normal_pool.json";
let summonHistory = []; // 抽卡歷史紀錄

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

const statsToggle = document.getElementById("statsToggle");
const statsContent = document.getElementById("statsContent");
const historyToggle = document.getElementById("historyToggle");
const historyContent = document.getElementById("historyContent");

// 音效元素
const sfxClick = document.getElementById("sfx-click");
const sfxSummon = document.getElementById("sfx-summon");
const sfxGoldSpark = document.getElementById("sfx-gold-spark");

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
    
    // 根據卡池類型顯示/隱藏按鈕
    const isLuckyBag = currentPoolFile === "luckybag_pool.json";
    singleDrawBtn.style.display = isLuckyBag ? "none" : (singleDrawCounter < 9 ? "inline-block" : "none");
    tenDrawBtn.style.display = isLuckyBag ? "none" : "inline-block";
    specialDrawBtn.style.display = isLuckyBag ? "none" : (singleDrawCounter === 9 ? "inline-block" : "none");
    luckyBagBtn.style.display = isLuckyBag ? "inline-block" : "none";
}

function updateSingleDrawButtonState() {
    checkButtons();
}

// 設定初始聖晶石
setInitialQuartzBtn.addEventListener("click", () => {
    playSound(sfxClick);
    saintQuartz = parseInt(initialQuartzInput.value, 10) || 0;
    initialQuartzSetup.style.display = "none";
    quartzInfo.style.display = "block";
    updateQuartzDisplay();
});

// 補充聖晶石
addQuartzBtn.addEventListener("click", () => {
    playSound(sfxClick);
    const amount = parseInt(addQuartzInput.value, 10) || 0;
    if (amount > 0) {
        saintQuartz += amount;
    }
    updateQuartzDisplay();
    addQuartzContainer.style.display = "none";
});

// 快捷補充聖晶石
document.querySelectorAll(".quick-add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        playSound(sfxClick);
        const amount = parseInt(btn.dataset.amount, 10) || 0;
        saintQuartz += amount;
        updateQuartzDisplay();
        addQuartzContainer.style.display = "none";
    });
});

// 點擊聖晶石圖片顯示補充介面
quartzContainer.addEventListener("click", () => {
    playSound(sfxClick);
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
    singleDrawCounter = 0;
    updateSingleDrawButtonState();
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

    if (cards.length === 1) {
        const cardDiv = createCardElement(cards);
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

// 單抽按鈕
singleDrawBtn.addEventListener("click", () => {
    playSound(sfxClick);
    if (saintQuartz < 3) {
        alert("聖晶石數量不足，無法進行單抽。");
        return;
    }
    saintQuartz -= 3;
    singleDrawCounter++;
    
    const drawnCards = [drawNonNullCard()];
    addToHistory(drawnCards, 3);
    displayCards(drawnCards);
    updateQuartzDisplay();
    updateSingleDrawButtonState();
});

// 特殊召喚按鈕
specialDrawBtn.addEventListener("click", () => {
    playSound(sfxClick);
    if (saintQuartz < 3) {
        alert("聖晶石數量不足，無法進行召喚。");
        return;
    }
    saintQuartz -= 3;
    singleDrawCounter = 0; // 重置計數器
    
    const drawnCards = [drawNonNullCard(), drawNonNullCard()];
    addToHistory(drawnCards, 3);
    displayCards(drawnCards);
    updateQuartzDisplay();
    updateSingleDrawButtonState();
});

// 十連按鈕
tenDrawBtn.addEventListener("click", () => {
    playSound(sfxClick);
    if (saintQuartz < 30) {
        alert("聖晶石數量不足，無法進行十連抽。");
        return;
    }
    saintQuartz -= 30;
    let drawnCards = [];

    // 處理保底
    let tempDraws = [];
    for (let i = 0; i < 11; i++) {
        tempDraws.push(drawNonNullCard());
    }

    const has3StarServant = tempDraws.some(card => card.type === 'servant' && card.rarity >= 3);
    const has4StarOrHigher = tempDraws.some(card => card.rarity >= 4);

    if (!has3StarServant) {
        const potentialReplacements = cardPool.filter(c => c.type === 'servant' && c.rarity >= 3);
        if (potentialReplacements.length > 0) {
            tempDraws[Math.floor(Math.random() * 11)] = potentialReplacements[Math.floor(Math.random() * potentialReplacements.length)];
        }
    }
    
    if (!has4StarOrHigher) {
        const potentialReplacements = cardPool.filter(c => c.rarity >= 4);
        if (potentialReplacements.length > 0) {
            let replaceIndex = Math.floor(Math.random() * 11);
            if (tempDraws[replaceIndex] && tempDraws[replaceIndex].type === 'servant' && tempDraws[replaceIndex].rarity >= 3 && !has3StarServant) {
                replaceIndex = (replaceIndex + 1) % 11;
            }
            tempDraws[replaceIndex] = potentialReplacements[Math.floor(Math.random() * potentialReplacements.length)];
        }
    }

    drawnCards = tempDraws;

    shuffle(drawnCards);
    addToHistory(drawnCards, 30);
    displayCards(drawnCards);
    updateQuartzDisplay();
});

// 福袋召喚按鈕
luckyBagBtn.addEventListener("click", () => {
    playSound(sfxClick);
    if (saintQuartz < 15) {
        alert("聖晶石數量不足，無法進行福袋召喚。");
        return;
    }
    saintQuartz -= 15;
    resultContainer.innerHTML = "";
    let drawnCards = [];
    
    // 強制抽出五星和四星從者
    const fiveStarServants = cardPool.filter(c => c.type === 'servant' && c.rarity === 5);
    const fourStarServants = cardPool.filter(c => c.type === 'servant' && c.rarity === 4);

    if (fiveStarServants.length > 0) {
        drawnCards.push(fiveStarServants[Math.floor(Math.random() * fiveStarServants.length)]);
    } else {
        drawnCards.push(drawNonNullCard()); // 如果福袋卡池沒有五星，則隨機抽
    }

    if (fourStarServants.length > 0) {
        drawnCards.push(fourStarServants[Math.floor(Math.random() * fourStarServants.length)]);
    } else {
        drawnCards.push(drawNonNullCard()); // 如果福袋卡池沒有四星，則隨機抽
    }
    
    // 額外再抽九張
    for (let i = 0; i < 9; i++) {
        drawnCards.push(drawNonNullCard());
    }

    shuffle(drawnCards);
    addToHistory(drawnCards, 15);
    displayCards(drawnCards);
    updateQuartzDisplay();
});

function drawNonNullCard() {
    let card = null;
    while (!card) {
        card = drawCard();
    }
    return card;
}

// 播放音效
function playSound(sfx) {
    sfx.currentTime = 0;
    sfx.play();
}

// 歷史紀錄與統計
statsToggle.addEventListener("click", () => {
    const content = statsContent;
    content.style.display = content.style.display === "block" ? "none" : "block";
});

historyToggle.addEventListener("click", () => {
    const content = historyContent;
    content.style.display = content.style.display === "block" ? "none" : "block";
});

function addToHistory(cards, cost) {
    summonHistory.unshift({ cards, cost, date: new Date() });
    renderHistory();
    calculateAndDisplayStats();
}

function renderHistory() {
    historyContent.innerHTML = "";
    summonHistory.forEach(entry => {
        const div = document.createElement("div");
        const summary = entry.cards.map(c => `<span title="${c.name}">${c.rarity}★ ${c.type === 'servant' ? '從者' : '禮裝'}</span>`).join(', ');
        div.innerHTML = `
            <p>
                <strong>${entry.date.toLocaleString()}</strong> (花費: ${entry.cost} 石)<br>
                ${summary}
            </p>
        `;
        historyContent.appendChild(div);
    });
}

function calculateAndDisplayStats() {
    const stats = {
        totalQuartz: 0,
        totalSummons: 0,
        rarity: { '5': 0, '4': 0, '3': 0 },
        type: { 'servant': 0, 'craft_essence': 0 },
        ssrServants: {}
    };

    summonHistory.forEach(entry => {
        stats.totalQuartz += entry.cost;
        stats.totalSummons += entry.cards.length;
        entry.cards.forEach(card => {
            stats.rarity[card.rarity]++;
            stats.type[card.type]++;
            if (card.rarity === 5 && card.type === 'servant') {
                stats.ssrServants[card.name] = (stats.ssrServants[card.name] || 0) + 1;
            }
        });
    });

    const ssrList = Object.entries(stats.ssrServants).map(([name, count]) => `<li>${name} x${count}</li>`).join('');

    statsContent.innerHTML = `
        <ul>
            <li>總花費聖晶石: ${stats.totalQuartz}</li>
            <li>總召喚次數: ${stats.totalSummons}</li>
            <li>五星機率: ${((stats.rarity[5] / stats.totalSummons) * 100 || 0).toFixed(2)}% (${stats.rarity[5]} 張)</li>
            <li>四星機率: ${((stats.rarity[4] / stats.totalSummons) * 100 || 0).toFixed(2)}% (${stats.rarity[4]} 張)</li>
            <li>三星機率: ${((stats.rarity[3] / stats.totalSummons) * 100 || 0).toFixed(2)}% (${stats.rarity[3]} 張)</li>
            <li>從者總數: ${stats.type.servant} | 禮裝總數: ${stats.type.craft_essence}</li>
        </ul>
        <h4>抽到的五星從者:</h4>
        <ul>${ssrList || "<li>尚未抽到</li>"}</ul>
    `;
}
