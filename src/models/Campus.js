import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class Campus{
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
                type: String
            },
            rua: {
                type: String
            },
            numeroResidencia: {
                type: String
            },
            status: {
                type: Boolean,
                default: true
            },
        }, {
            timestamps: true,
            versionKey: false
        });

        campusSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('campus', campusSchema);
    }
}

export default new Campus().model;
