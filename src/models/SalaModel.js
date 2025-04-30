import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { type } from "os";

class SalaModel {
    constructor() {}
    const = salaSchema = new mongoose.Schema({
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
