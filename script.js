// 載入卡池資料
let cardPool = []; // 初始化 cardPool

function loadPool(poolFile) {
    fetch("pool/" + poolFile) // 修改檔案路徑
        .then(response => response.json())
        .then(data => {
            cardPool = data.servants.concat(data.craft_essences);
            calculateCardProbabilities(data);
        })
        .catch(error => console.error("載入卡池資料錯誤：", error));
}

// 計算卡片機率
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
            const rarityCount = rarityCounts[rarity];

            let probability;
            if (isPu) {
                probability = puRarityProbabilities[rarity][type === "servants" ? "servant" : "craft_essence"] / rarityCount.pu;
            } else {
                probability = (rarityProbabilities[rarity][type === "servants" ? "servant" : "craft_essence"] - (puRarityProbabilities[rarity][type === "servants" ? "servant" : "craft_essence"])) / rarityCount.normal;
            }
            card.probability = probability;
            console.log(`${card.name} (${card.rarity}星 ${card.type}) 機率：${probability}`);
        }
    }
}

// 選擇卡池檔案
const poolSelect = document.getElementById("poolSelect");
poolSelect.addEventListener("change", () => {
    const poolFile = poolSelect.value;
    console.log("卡池載入");
    loadPool(poolFile);
});

// 初始載入常駐卡池
// loadPool("normal_pool.json");

// 選擇 HTML 元素
const singleDrawBtn = document.getElementById("singleDrawBtn");
const tenDrawBtn = document.getElementById("tenDrawBtn");
const resultContainer = document.getElementById("resultContainer");

// 抽卡函數
function drawCard() {
    const randomNumber = Math.random();
    let cumulativeProbability = 0;

    for (let i = 0, cumulativeProbability = 0; i < cardPool.length; i++) {
        const card = cardPool[i];
        cumulativeProbability += card.probability;
        cumulativeProbability = parseFloat(cumulativeProbability.toFixed(10)); // Round to 10 decimal places
        if (randomNumber < cumulativeProbability) {
            console.log(`隨機數 ${randomNumber} 累積 ${cumulativeProbability}`);
            return card;
        }
    }
    return null;
}

// 顯示卡片函數
function displayCard(card, index) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    
    // 常數替代圖片路徑
    const imgSrc = card.imageUrl;
    cardDiv.innerHTML = `<img src="${imgSrc}" width="132" height="144" alt="${card.name}">`;

    // 行數
    const rowNumber = Math.floor(index / 6) + 1;
    // console.log(`Card ${card.name} is in row ${rowNumber}`);
    let row = document.querySelector(`.result-row:nth-child(${rowNumber})`);
    if (!row) {
        row = document.createElement("div");
        row.classList.add("result-row");
        resultContainer.appendChild(row);
    }
    
    // 卡片併入所屬行
    row.appendChild(cardDiv);
}

// Fisher-Yates Shuffle Algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 單抽按鈕事件監聽器
singleDrawBtn.addEventListener("click", () => {
    resultContainer.innerHTML = "";
    const card = drawCard();
    if (card) {
        displayCard(card, 0);
    }
});

// 十連按鈕事件監聽器


tenDrawBtn.addEventListener("click", () => {
    resultContainer.innerHTML = ""; 

    let drawnCards = [];

    // 保證不返回null
    function drawNonNullCard() {
        let card = drawCard();
        while (!card) {
            card = drawCard();
        }
        return card;
    }

    // 處理保底
    let guaranteed3StarServant = null;
    let guaranteed4StarCE = null;

    while (!guaranteed3StarServant) {
        const newCard = drawNonNullCard();
        console.log(newCard);
        if (newCard.type === "servant" && newCard.rarity === 3) {
            guaranteed3StarServant = newCard;
            drawnCards.push(newCard);
        }
    }

    while (!guaranteed4StarCE) {
        const newCard = drawNonNullCard();
        console.log(newCard);
        if (newCard.type === "craft_essence" && newCard.rarity === 4) {
            guaranteed4StarCE = newCard;
            drawnCards.push(newCard);
        }
    }

    // 繼續抽卡
    for (let i = 0; i < 9; i++) {
        drawnCards.push(drawNonNullCard());
    }

    // 打亂卡序
    shuffle(drawnCards);

    // 顯示抽卡結果
    drawnCards.forEach((card, index) => {
        if (card) {
            displayCard(card, index);
        }
    });
});
