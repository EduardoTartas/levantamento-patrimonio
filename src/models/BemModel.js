import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { type } from "os";

class BemModel {
    constructor() {
        const bemSchema = new mongoose.Schema({
            nome: {
                type: String,
                index: true,
                required: true,
            },
            tombo: {
                type: String,
                required: true,
                unique: true,
            },
            responsavel: {
                type: String,
                required: true,
            },
            descricao: {
                type: String,
            },
            valor: {
                type: Number,
                required: true,
            }, 
            auditado: {
                type: Boolean,
                default: "false",
            },
            ocioso: {
                type: Boolean,
                default: "false",
            }
        });
    }
}