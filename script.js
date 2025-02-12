const cardPool = [
    { name: "Saber", rarity: 5, imageUrl: "images/saber.jpg", type: "servant", probability: 0.01 },
    { name: "Archer", rarity: 4, imageUrl: "images/archer.jpg", type: "servant", probability: 0.03 },
    { name: "Lancer", rarity: 3, imageUrl: "images/lancer.jpg", type: "servant", probability: 0.4 },
    { name: "CE1", rarity: 5, imageUrl: "images/ce1.jpg", type: "craft_essence", probability: 0.04 },
    { name: "CE2", rarity: 4, imageUrl: "images/ce2.jpg", type: "craft_essence", probability: 0.12 },
    { name: "CE3", rarity: 3, imageUrl: "images/ce3.jpg", type: "craft_essence", probability: 0.4 },
];

const singleDrawBtn = document.getElementById("singleDrawBtn");
const tenDrawBtn = document.getElementById("tenDrawBtn");
const resultContainer = document.getElementById("resultContainer");

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

function displayCard(card) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.innerHTML = `<img src="${card.imageUrl}" width="100" height="150" alt="${card.name}">`;
    resultContainer.appendChild(cardDiv);
}

singleDrawBtn.addEventListener("click", () => {
    resultContainer.innerHTML = ""; // Clear previous results
    const card = drawCard();
    if (card) {
        displayCard(card);
    }
});

tenDrawBtn.addEventListener("click", () => {
    resultContainer.innerHTML = ""; // Clear previous results
    for (let i = 0; i < 11; i++) {
        const card = drawCard();
        if (card) {
            displayCard(card);
        }
    }
});
