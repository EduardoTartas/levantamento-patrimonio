import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class LevantamentoModel {
    constructor() {
        const levantamentoSchema = new mongoose.Schema({
            inventario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "inventarios",
                required: true,
            },
            bem: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "bens",
                required: true,
            },
            sala: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "salas",
                required: true,
            },
            usuario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuarios",
                required: true,
            },
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
        }, {
            timestamps: true,
            versionKey: false
        });

        levantamentoSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('levantamentos', levantamentoSchema);
    }
}