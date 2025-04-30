import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { type } from "os";

class UsuarioModel {
    constructor() {}
    const = usuarioSchema = new mongoose.Schema({
        nome: {
            type: String,
            index: true,
            required: true,
        },
        bloco: {
            type: String,
            required: true,
        }
    })
   
}
