import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class Sala{
    constructor() {
        const salaSchema = new mongoose.Schema({
            campus: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "campus",
                required: true,
            },
            nome: {
                type: String,
                index: true,
                required: true,
            },
            bloco: {
                type: String,
                required: true,
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        salaSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('sala', salaSchema);
    }
}

export default new Sala().model;