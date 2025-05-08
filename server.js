// server.js
import bemSeed from "./src/seeds/bemSeed.js";
import campusSeed from "./src/seeds/campusSeed.js";
import "dotenv/config";
import app from "./src/app.js";

await bemSeed();
await campusSeed();

const port = process.env.API_PORT || 3000;

// retorno no terminal com o link
app.listen(port, () => {
    console.log(`Servidor escutando em http://localhost:${port}`);
});
