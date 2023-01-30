import { Router } from 'express';
import multer from 'multer';
import uploadConfig from './config/upload';
import UsuarioController from '../src/app/controllers/UsuarioController';
import ReceitaController from './app/controllers/ReceitaController';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(uploadConfig);

routes.post('/signup', UsuarioController.cadastro);
routes.post('/signin', UsuarioController.realizarLogin);


//todas as rotas abaixo deste middleware precisa estar autenticado
routes.use(authMiddleware);

routes.get('/usuarios', UsuarioController.buscarUsuario);
routes.put('/usuarios/:usuario_id/atualizar', UsuarioController.atualizarCadastro);

routes.post('/receitas', upload.single('foto'), ReceitaController.cadastro);
routes.get('/receitas', ReceitaController.buscarReceita);
routes.get('/receitas/minhas-receitas', ReceitaController.buscarReceitasPorUsuario);
routes.delete('/receitas', ReceitaController.deletarReceita);
routes.put('/receitas/:receita_id/atualizar', upload.single('foto'), ReceitaController.atualizarReceita);

export default routes;