import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { type } from "os";

class InventarioModel {
    constructor() {
        const inventarioSchema = new mongoose.Schema({
            nome: {
                type: String,
                index: true,
                required: true,
            },
            data: {
                type: Date,
                required: true,
            },
            status: {
                type: Boolean,
                default: "false",
            },
        });
    }
}