const dishMenu = document.getElementById("dish-menu");
const form = document.getElementById("dish-form");


// Render dish cards
function renderDishes() {
  dishMenu.innerHTML = "";
  dishes.forEach((dish) => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow hover:scale-105 transition";
    card.innerHTML = `
      <img src="${dish.image_url}" alt="${dish.title}" class="rounded mb-2 w-full h-40 object-cover" />
      <h3 class="text-lg font-semibold">${dish.title}</h3>
      <p class="text-gray-600 text-sm">${dish.story}</p>
    `;
    dishMenu.appendChild(card);
  });
}


