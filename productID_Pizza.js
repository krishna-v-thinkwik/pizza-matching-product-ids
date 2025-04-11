const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function normalizeString(str) {
    return str.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function getMatchedProductIds(orderString, productsData) {
    const products = Array.isArray(productsData.products) ? productsData.products : [];

    const productMap = new Map();
    products.forEach(product => {
        const normalizedName = normalizeString(product.name);
        productMap.set(normalizedName, product._id);
    });

    const cleanedOrderString = orderString
        .replace(/,\s?(?!and)/g, " and ") // Handle commas not followed by 'and'
        .toLowerCase();

    const orderItems = cleanedOrderString
        .split(/\band\b/)
        .map(item => normalizeString(item.replace(/^\d+\s*/, '')))
        .filter(Boolean);

    console.log("🧾 Cleaned Order Items:", orderItems);

    const matchedProductIds = [];

    for (const orderItem of orderItems) {
        for (const [productName, productId] of productMap.entries()) {
            // Match if the product name is a substring OR vice versa for partial matches
            if (
                orderItem.includes(productName) ||
                productName.includes(orderItem)
            ) {
                matchedProductIds.push(productId);
                break;
            }
        }
    }

    console.log("✅ Matched Product IDs:", matchedProductIds);
    return matchedProductIds;
}

app.post("/match-products", (req, res) => {
    try {
        const { orderString, productsData } = req.body;

        if (!orderString || !productsData || !Array.isArray(productsData.products)) {
            return res.status(400).json({ error: "orderString and productsData.products array are required" });
        }

        const result = getMatchedProductIds(orderString, productsData);
        res.json({ productIds: result });

    } catch (error) {
        console.error("❌ Error matching products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/", (req, res) => {
    res.send("🍕 Match Products API is running!");
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
