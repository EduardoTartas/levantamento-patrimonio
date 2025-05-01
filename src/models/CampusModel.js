import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class CampusModel {
    constructor() {
        const campusSchema = new mongoose.Schema({
            nome: {
                type: String,
                index: true,
                required: true,
            },
            telefone: {
                type: String,
            },
            cidade: {
                type: String,
                required: true,
            },
            bairro: {
                type: String,
                required: true,
            },
            rua: {
                type: String,
                required: true,
            },
            numeroResidencia: {
                type: String,
                required: true,
            },
        }, {
            timestamps: true,
            versionKey: false
        });

        campusSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('campus', campusSchema);
    }
}