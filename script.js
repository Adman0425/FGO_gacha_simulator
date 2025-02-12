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
                probability = (rarityProbabilities[rarity][type === "servants" ? "servant" : "craft_essence"] - (puRarityProbabilities[rarity][type === "servants" ? "servant" : "craft_essence"] * rarityCount.pu)) / rarityCount.normal;
            }
            card.probability = probability;
        }
    }
}

// 選擇卡池檔案
const poolOptions = document.querySelectorAll(".pool-option");
poolOptions.forEach(option => {
    option.addEventListener("click", () => {
        const poolFile = option.dataset.pool;
        loadPool(poolFile);
    });
});

// 初始載入常駐卡池
loadPool("normal_pool.json");

// 選擇 HTML 元素
const singleDrawBtn = document.getElementById("singleDrawBtn");
const tenDrawBtn = document.getElementById("tenDrawBtn");
const resultContainer = document.getElementById("resultContainer");

// 抽卡函數
function drawCard() {
    const randomNumber = Math.random();
    let cumulativeProbability = 0;

    for (const card of cardPool) {
        cumulativeProbability += card.probability;
        if (randomNumber < cumulativeProbability) {
            return card;
        }
    }
    return null;
}

// 顯示卡片函數
function displayCard(card) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.innerHTML = `<img src="images/${card.imageUrl}" width="100" height="150" alt="${card.name}">`;
    resultContainer.appendChild(cardDiv);
}

// 單抽按鈕事件監聽器
singleDrawBtn.addEventListener("click", () => {
    resultContainer.innerHTML = "";
    const card = drawCard();
    if (card) {
        displayCard(card);
    }
});

// 十連抽按鈕事件監聽器
tenDrawBtn.addEventListener("click", () => {
    resultContainer.innerHTML = "";
    for (let i = 0; i < 11; i++) {
        const card = drawCard();
        if (card) {
            displayCard(card);
        }
    }
});
