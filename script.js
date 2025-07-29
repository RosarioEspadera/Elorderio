const dishMenu = document.getElementById("dish-menu");
const form = document.getElementById("dish-form");

let dishes = [
  {
    title: "Midnight Miso Musings",
    story: "Inspired by late-night cravings and warm comfort. Shared by Elio.",
    image_url: "assets/miso.jpg",
  },
  {
    title: "Banana Bliss Theory",
    story: "Rosario's hypothesis: joy = ripe banana + community.",
    image_url: "assets/banana.jpg",
  },
];

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

// Submit new dish
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = form.title.value;
  const story = form.story.value;
  const image_url = form.image_url.value || "assets/default.jpg";

  dishes.push({ title, story, image_url });
  renderDishes();
  form.reset();
});

renderDishes();

