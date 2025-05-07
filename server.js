// server.js
import seedBem from "./src/seeds/seedBem.js";
import seedCampus from "./src/seeds/seedCampus.js";
import "dotenv/config";
import app from "./src/app.js";

await seedBem();
await seedCampus();

const port = process.env.API_PORT || 3000;

// retorno no terminal com o link
app.listen(port, () => {
    console.log(`Servidor escutando em http://localhost:${port}`);
});
