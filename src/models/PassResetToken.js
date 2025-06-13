import mongoose from "mongoose";

class PassResetToken {
    constructor() {
        const passwordResetTokenSchema = new mongoose.Schema({
            usuario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuario",
                required: true
            },
            token: {
                type: String,
                required: true
            },
            expiresAt: {
                type: Date,
                required: true
            },
            used: {
                type: Boolean,
                default: false
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        // Index para deletar tokens expirados automaticamente
        passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

        this.model = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
    }
}

export default new PassResetToken().model