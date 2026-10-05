const healthButton = document.getElementById("healthButton");
const statusElement = document.getElementById("status");

healthButton.addEventListener("click", async () => {
  statusElement.textContent = "Checking backend...";

  try {
    const response = await fetch("/.netlify/functions/health");
    const data = await response.json();

    statusElement.textContent = data.message;
  } catch (error) {
    console.error(error);

    statusElement.textContent = "Backend connection failed.";
  }
});


const loadProductsButton = document.getElementById("loadProducts");
const productsList = document.getElementById("productsList");

loadProductsButton.addEventListener("click", async () => {
  productsList.innerHTML = "<p>Loading products...</p>";

  try {
    const response = await fetch("/.netlify/functions/odoo");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load products");
    }

    if (!data.products || data.products.length === 0) {
      productsList.innerHTML = "<p>No products found.</p>";
      return;
    }

    productsList.innerHTML = "";

    data.products.forEach((product) => {
      const element = document.createElement("div");

      element.className = "product";

      element.innerHTML = `
        <h3>${escapeHtml(product.name)}</h3>
        <p>Price: ${product.price}</p>
      `;

      productsList.appendChild(element);
    });

  } catch (error) {
    console.error(error);

    productsList.innerHTML = `
      <p>Could not load products.</p>
    `;
  }
});


const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const message = document.getElementById("message").value;

  formStatus.textContent = "Sending...";

  try {
    const response = await fetch("/.netlify/functions/odoo", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        action: "contact",
        name,
        email,
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit form");
    }

    formStatus.textContent = "Message sent successfully.";

    contactForm.reset();

  } catch (error) {
    console.error(error);

    formStatus.textContent =
      "Something went wrong. Please try again.";
  }
});


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
