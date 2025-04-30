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
        cpf: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        senha: {
            type: String,
            select: false,
            required: true,
        },
        cargo: {
            type: String,
            required: true,
        },
        status: {
            type: Boolean,
            default: "true",
        },
    })
   
}

