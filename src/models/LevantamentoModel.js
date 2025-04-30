import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { type } from "os";

class LevantamentoModel {
    constructor() {
        const levantamentoSchema = new mongoose.Schema({
            imagem: {
                type: String,
            },
            estado: {
                type: String,
                required: true,
            },
            data: {
                type: Date,
                required: true,
            }
        });
    }
}

