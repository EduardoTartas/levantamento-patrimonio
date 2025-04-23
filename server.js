// server.js

import "dotenv/config";
import app from "./src/app.js";

const port = process.env.PORT || 5011;

// retorno no terminal com o link
app.listen(port, () => {
    console.log(`Servidor escutando em http://localhost:${port}`)
})