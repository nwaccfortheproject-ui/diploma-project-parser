const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Explicit route for products (optional since static covers it, but good for testing)
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'products.json'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
