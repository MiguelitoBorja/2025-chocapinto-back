// server.js
const app = require("./app_nuevo");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server en http://localhost:${PORT}`));