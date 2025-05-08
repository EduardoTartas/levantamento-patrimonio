import "dotenv/config";
import app from "./src/app.js";

const port = process.env.API_PORT || 3000;

// retorno no terminal com o link
app.listen(port, () => {
    console.log(`Servidor escutando em http://localhost:${port}`);
});