const dishMenu = document.getElementById("dish-menu");
const form = document.getElementById("order-form");
const cartTable = document.getElementById("cart-table").querySelector("tbody");
const cartTotal = document.getElementById("cart-total");
const allCards = document.querySelectorAll(".dish-card");
emailjs.init("AqvkFhQnxowOJda9J");

const tagMap = {};

allCards.forEach(card => {
  const tags = [...card.querySelectorAll(".tag")].map(tag => tag.textContent.trim());
  tags.forEach(tag => {
    if (!tagMap[tag]) tagMap[tag] = [];
    tagMap[tag].push(card);
  });
});

Object.keys(tagMap).forEach(tag => {
  const btn = document.createElement("button");
  btn.textContent = tag;
  btn.setAttribute("data-tag", tag);
  document.querySelector(".tag-filters").appendChild(btn);
});

document.querySelector(".tag-filters").addEventListener("click", e => {
  if (e.target.tagName !== "BUTTON") return;

  const selectedTag = e.target.dataset.tag;
  allCards.forEach(card => card.style.display = "none");

  if (selectedTag === "All") {
    allCards.forEach(card => card.style.display = "block");
  } else {
    tagMap[selectedTag].forEach(card => card.style.display = "block");
  }
});

const cart = [];

function renderDishes() {
  dishMenu.innerHTML = "";
  dishes.forEach((dish) => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow hover:scale-105 transition cursor-pointer w-full sm:w-[48%] lg:w-[30%] mb-4";
    card.innerHTML = `
      <img src="${dish.image_url}" alt="${dish.title}" class="rounded mb-2 w-full h-40 object-cover" />
      <h3 class="text-lg font-semibold">${dish.title}</h3>
      <p class="text-gray-600 text-sm mb-2">${dish.story}</p>
      <button class="bg-indigo-600 text-white px-3 py-1 rounded" onclick="addToCart('${dish.title}', ${dish.price})">Add to Order</button>
    `;
    dishMenu.appendChild(card);
  });
}
function updateCartPreview() {
  cartTable.innerHTML = cart.map(item => `
    <tr>
      <td>${item.qty} x ${item.name}</td>
      <td class="text-right">₱${item.qty * item.price}</td>
    </tr>
  `).join("");

  cartTotal.textContent = `₱${calculateTotal()}`;
}
function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  alert(`${name} added to order!`);
  updateCartPreview();
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
      updateCartPreview();
      this.reset();
    }, (error) => {
      console.error("EmailJS failed:", error);
      alert("Failed to send order.");
    });
});
// 🔑 Supabase Auth client
const supabase = createClient('https://bcmibfnrydyzomootwcb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I');

// ✍️ Sign Up
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) console.error(error.message);
  else console.log('User created:', data);
}

// 🔓 Login
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) console.error(error.message);
  else window.location.href = 'profile.html';
}

// 👤 Check Auth on `profile.html`
supabase.auth.getSession().then(({ data }) => {
  if (!data.session) window.location.href = 'auth.html';
  else document.getElementById('welcome').innerText = `Welcome back, ${data.session.user.email}`;
});
