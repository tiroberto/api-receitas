import { Schema, VirtualType, model } from 'mongoose';
import * as Yup from 'yup';
const SALT_WORK_FACTOR = 10;
import bcrypt from 'bcryptjs';

const UsuarioSchema = new Schema({
    nome: String,
    email: { type: String, required: true, index: { unique: true } },
    senhaHash: { type: String, default: '' }
});

//virtuals
UsuarioSchema.virtual('senha').set(function (senha) {
    this._senha = senha;
});

UsuarioSchema.pre("save", function (next) {
    const usuario = this;
    if (usuario._senha === undefined)
        return next()

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) console.log(err);

        bcrypt.hash(usuario._senha, salt, function (err, hash) {
            if (err) console.log(err);
            usuario.senhaHash = hash;
            next();
        });
    });
});

//methods
UsuarioSchema.methods = {
    compararSenha: function (senha) {
        return bcrypt.compare(senha, this.senhaHash);
    }
}

export const validarUsuario = async (objeto) => {
    const schema = Yup.object().shape({
        nome: Yup.string().required(),
        email: Yup.string().email().required(),
        senha: Yup.string().min(6).required()
    });

    return await schema.isValid(objeto);
}

export default model('Usuario', UsuarioSchema);