const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_PASSWORD = process.env.ODOO_PASSWORD;


async function odooRequest(service, method, args = []) {
  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service,
        method,
        args
      },

      id: Date.now()
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(
      data.error.data?.message ||
      data.error.message ||
      "Odoo request failed"
    );
  }

  return data.result;
}


async function authenticate() {
  return await odooRequest(
    "common",
    "authenticate",
    [
      ODOO_DB,
      ODOO_USERNAME,
      ODOO_PASSWORD,
      {}
    ]
  );
}


async function getProducts(uid) {
  return await odooRequest(
    "object",
    "execute_kw",
    [
      ODOO_DB,
      uid,
      ODOO_PASSWORD,

      "product.template",
      "search_read",

      [
        [
          ["sale_ok", "=", true]
        ]
      ],

      {
        fields: [
          "name",
          "list_price"
        ],

        limit: 20
      }
    ]
  );
}


exports.handler = async (event) => {
  try {
    if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_PASSWORD) {
      return {
        statusCode: 500,

        body: JSON.stringify({
          error: "Odoo environment variables are not configured."
        })
      };
    }

    const uid = await authenticate();

    if (!uid) {
      return {
        statusCode: 401,

        body: JSON.stringify({
          error: "Odoo authentication failed."
        })
      };
    }


    // GET /products
    if (event.httpMethod === "GET") {
      const products = await getProducts(uid);

      return {
        statusCode: 200,

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          success: true,

          products: products.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.list_price
          }))
        })
      };
    }


    // POST
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      if (body.action === "contact") {

        // Starter response.
        // Later we can create an Odoo CRM lead/contact here.

        return {
          statusCode: 200,

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            success: true,
            message: "Contact form received."
          })
        };
      }
    }


    return {
      statusCode: 405,

      body: JSON.stringify({
        error: "Method not allowed"
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        error: error.message || "Server error"
      })
    };
  }
};
