const dishMenu = document.getElementById("dish-menu");
const form = document.getElementById("order-form");
emailjs.init("AqvkFhQnxowOJda9J");

const cart = [];

function renderDishes() {
  dishMenu.innerHTML = "";
  dishes.forEach((dish) => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow hover:scale-105 transition cursor-pointer";
    card.innerHTML = `
      <img src="${dish.image_url}" alt="${dish.title}" class="rounded mb-2 w-full h-40 object-cover" />
      <h3 class="text-lg font-semibold">${dish.title}</h3>
      <p class="text-gray-600 text-sm mb-2">${dish.story}</p>
      <button class="bg-indigo-600 text-white px-3 py-1 rounded" onclick="addToCart('${dish.title}', ${dish.price})">Add to Order</button>
    `;
    dishMenu.appendChild(card);
  });
}

function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  alert(`${name} added to order!`);
}

// 🧮 Total calculator
function calculateTotal() {
  return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
}

// 🧾 Generates full table HTML
function generateItemTableHTML() {
  const rows = cart.map(item => `
    <tr>
      <td>${item.qty} x ${item.name}</td>
      <td align="right">₱${item.qty * item.price}</td>
    </tr>
  `).join("");

  return `
    <table style="width:100%; border-collapse:collapse;">
      ${rows}
      <tr>
        <td><strong>Total</strong></td>
        <td align="right"><strong>₱${calculateTotal()}</strong></td>
      </tr>
    </table>
  `;
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  this.item_list.value = generateItemTableHTML();
  this.total.value = `₱${calculateTotal()}`;

  emailjs.sendForm("service_epydqmi", "template_vzuexod", this)
    .then(() => {
      alert("Order sent successfully!");
      cart.length = 0; // reset cart
      this.reset();
    }, (error) => {
      console.error("EmailJS failed:", error);
      alert("Failed to send order.");
    });
});
