// 載入卡池資料
let cardPool = []; // 初始化 cardPool
let singleDrawCounter = 0;
let saintQuartz = 0; // 初始化聖晶石數量
let currentPoolFile = "normal_pool.json"; // 追蹤目前選擇的卡池

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

// 更新聖晶石顯示和按鈕狀態
function updateQuartzDisplay() {
    quartzDisplay.textContent = saintQuartz;
    checkButtons();
}

function checkButtons() {
    singleDrawBtn.disabled = saintQuartz < 3 && currentPoolFile !== "luckybag_pool.json";
    tenDrawBtn.disabled = saintQuartz < 30 && currentPoolFile !== "luckybag_pool.json";
    specialDrawBtn.disabled = saintQuartz < 3;
    luckyBagBtn.disabled = saintQuartz < 15 && currentPoolFile === "luckybag_pool.json";

    singleDrawBtn.style.display = currentPoolFile === "luckybag_pool.json" ? "none" : singleDrawCounter < 9 ? "inline-block" : "none";
    tenDrawBtn.style.display = currentPoolFile === "luckybag_pool.json" ? "none" : "inline-block";
    specialDrawBtn.style.display = currentPoolFile === "luckybag_pool.json" ? "none" : singleDrawCounter === 9 ? "inline-block" : "none";
    luckyBagBtn.style.display = currentPoolFile === "luckybag_pool.json" ? "inline-block" : "none";
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
            checkButtons(); // 載入卡池後更新按鈕狀態
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
        if (pool && pool.hasOwnProperty(type)) {
            for (const card of pool[`${type}`]) {
                const rarity = card.rarity;
                if (!rarityCounts.hasOwnProperty(rarity)) {
                    rarityCounts[`${rarity}`] = { pu: 0, normal: 0 };
                }
                if (card.isPu) {
                    rarityCounts[`${rarity}`].pu++;
                } else {
                    rarityCounts[`${rarity}`].normal++;
                }
            }

            for (const card of pool[`${type}`]) {
                const rarity = card.rarity;
                const isPu = card.isPu;
                let probability = 0;
                const rarityCount = rarityCounts[`${rarity}`];

                if (rarityCount) {
                    if (isPu && rarityCount.pu > 0) {
                        probability = puRarityProbabilities[`${rarity}`][type === "servants" ? "servant" : "craft_essence"] / rarityCount.pu;
                    } else if (!isPu && rarityCount.normal > 0) {
                        const totalPuProb = puRarityProbabilities[`${rarity}`][type === "servants" ? "servant" : "craft_essence"];
                        const normalProb = rarityProbabilities[`${rarity}`][type === "servants" ? "servant" : "craft_essence"] - totalPuProb;
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
    singleDrawCounter = 0; // 切換卡池後重置單抽計數器
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
        if (i !== j) {
            const temp = array[`${i}`];
            array[`${i}`] = array[`${j}`];
            array[`${j}`] = temp;
        }
    }
    return array;
}

// 單抽按鈕
singleDrawBtn.addEventListener("click", () => {
    if (saintQuartz < 3) {
        alert("聖晶石數量不足，無法進行單抽。");
        return;
    }
    saintQuartz -= 3;
    singleDrawCounter++;

    displayCards([drawNonNullCard()]);
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
            tempDraws[`${Math.floor(Math.random() * 11)}`] = potentialReplacements[`${Math.floor(Math.random() * potentialReplacements.length)}`];
        }
    }

    if (!has4StarOrHigher) {
        const potentialReplacements = cardPool.filter(c => c.rarity >= 4);
        if (potentialReplacements.length > 0) {
            let replaceIndex = Math.floor(Math.random() * 11);
            if (tempDraws[`${replaceIndex}`] && tempDraws[`${replaceIndex}`].type === 'servant' && tempDraws[`${replaceIndex}`].rarity >= 3 && !has3StarServant) {
                replaceIndex = (replaceIndex + 1) % 11;
            }
            tempDraws[`${replaceIndex}`] = potentialReplacements[`${Math.floor(Math.random() * potentialReplacements.length)}`];
        }
    }

    drawnCards = tempDraws;

    shuffle(drawnCards);
    displayCards(drawnCards);
    updateQuartzDisplay();
});

// 福袋召喚按鈕
luckyBagBtn.addEventListener("click", () => {
    if (saintQuartz < 15) {
        alert("聖晶石數量不足，無法進行福袋召喚。");
        return;
    }
    saintQuartz -= 15;
    resultContainer.innerHTML = "";
    let drawnCards = [];
    let fiveStarServantDrawn = false;
    let fourStarServantOrCEDrawn = false;

    const servants = cardPool.filter(card => card.type === "servant");
    const fourStarPlus = cardPool.filter(card => card.rarity >= 4);

    // 強制抽出一個五星從者
    const fiveStarServants = servants.filter(card => card.rarity === 5);
    if (fiveStarServants.length > 0) {
        drawnCards.push(fiveStarServants[`${Math.floor(Math.random() * fiveStarServants.length)}`]);
        fiveStarServantDrawn = true;
    } else if (servants.length > 0) {
        // 如果卡池裡沒有五星，至少抽一個最高星等的從者
        const highestRarity = Math.max(...servants.map(s => s.rarity));
        const highestRarityServants = servants.filter(s => s.rarity === highestRarity);
        drawnCards.push(highestRarityServants[`${Math.floor(Math.random() * highestRarityServants.length)}`]);
    }

    // 強制抽出一個四星以上（從者或禮裝）
    if (fourStarPlus.length > 0) {
        drawnCards.push(fourStarPlus[`${Math.floor(Math.random() * fourStarPlus.length)}`]);
        fourStarServantOrCEDrawn = true;
    } else if (cardPool.length > 0) {
        // 如果沒有四星以上，至少抽一個最高星等的
        const highestRarity = Math.max(...cardPool.map(c => c.rarity));
        const highestRarityCards = cardPool.filter(c => c.rarity === highestRarity);
        drawnCards.push(highestRarityCards[`${Math.floor(Math.random() * highestRarityCards.length)}`]);
    }

    // 額外再抽九張
    for (let i = 0; i < 9; i++) {
        drawnCards.push(drawNonNullCard());
    }

    shuffle(drawnCards);
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
