import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class Levantamento{
    constructor() {
        const levantamentoSchema = new mongoose.Schema({
            inventario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "inventario",
                required: true,
            },
            bem: {
                type: mongoose.Schema.Types.ObjectId,
                salaID:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "sala",
                    required: true,
                },
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
                ocioso: {
                    type: Boolean,
                    default: "false",
                },
                ref: "bem",
                required: true,
            },
            sala: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "sala",
                required: true,
            },
            usuario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuario",
                required: true,
            },
            imagem: {
                type: String,
            },
            estado: {
                type: String,
                required: true,
                enum: {
                    values: ["Em condições de uso", "Inservível", "Danificado"]
                }
            },
            data: {
                type: Date,
                required: true,
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        levantamentoSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('levantamento', levantamentoSchema);
    }
}

export default new Levantamento().model;