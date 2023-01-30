import * as Yup from 'yup';
import Usuario, { validarUsuario } from '../models/Usuario';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import authConfig from '../../config/auth';

class UsuarioController {
    async cadastro(req, res) {
        const { nome, email, senha } = req.body;

        //validando campos do model
        if (!(await validarUsuario(req.body)))
            return res.status(400).json({ error: 'Falha na validação' });

        //verificando se já existe o usuario com o email
        let usuario = await Usuario.findOne({ email });
        if (usuario)
            return res.status(400).json({ error: 'Usuario já cadastrado' });

        usuario = await Usuario.create({ nome, email, senha });

        return res.json(usuario);
    }

    async buscarUsuario(req, res) {
        const { usuario_id } = req.query;

        if (!mongoose.isValidObjectId(usuario_id))
            return res.status(400).json({ error: 'Chave de cadastro inválida' });

        return res.json(await Usuario.findById(usuario_id));
    }

    async realizarLogin(req, res) {
        const schema = Yup.object().shape({
            email: Yup.string().email().required(),
            senha: Yup.string().min(6).required()
        });
        //validando campos recebidos
        if (!(await schema.isValid(req.body)))
            return res.status(400).json({ error: 'Falha na validação' });


        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ email });

        //verificando se não existe usuario
        if (!usuario)
            return res.status(401).json({ error: 'Usuário não existe' });

        //verificando se a senha está correta
        if (!(await usuario.compararSenha(senha)))
            return res.status(401).json({ error: 'Senha incorreta' });

        const { id, nome } = usuario;

        return res.json({
            usuario: {
                id,
                nome,
                email
            },
            token: jwt.sign({ id }, authConfig.secret, {
                expiresIn: authConfig.expiresIn
            })
        });
    }

    async atualizarCadastro(req, res) {
        //schema já configurado para que a senha e a confirmarSenha estejam iguais
        const schema = Yup.object().shape({
            nome: Yup.string(),
            email: Yup.string().email(),
            senhaAntiga: Yup.string().min(6),
            senha: Yup.string()
                .min(6)
                .when('senhaAntiga', (senhaAntiga, field) =>
                    senhaAntiga ? field.required() : field
                ),
            confirmarSenha: Yup.string().when('senha', (senha, field) =>
                senha ? field.required().oneOf([Yup.ref('senha')]) : field
            ),
        });
        if (!(await schema.isValid(req.body)))
            return res.status(400).json({ error: 'Falha na validação' });


        const { nome, email, senhaAntiga, senha } = req.body;
        const { usuario_id } = req.params;

        //verificando se foi enviado o id do usuario
        if (!mongoose.isValidObjectId(usuario_id))
            return res.status(400).json({ error: 'Chave de cadastro inválida' });

        const usuario = await Usuario.findById(usuario_id);

        //verificando se o email que o usuario deseja alterar já tem no banco de dados
        if ((email !== usuario.email) && (await Usuario.findOne({ email })))
            return res.status(400).json({ error: 'Usuário já existe' });

        //verificando se a senha antiga digitada está correta
        if (senhaAntiga && !(await usuario.compararSenha(senhaAntiga)))
            return res.status(401).json({ error: 'Senha incorreta' });


        //salvando os dados novos do usuário
        usuario.nome = nome;
        usuario.email = email;
        usuario.senha = senha;
        await usuario.save();

        return res.json(usuario);
    }
}

export default new UsuarioController();
