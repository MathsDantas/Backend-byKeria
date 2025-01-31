import { Router } from "express";
import { User } from "../entity/User";
import { AppDataSource } from "../DataSource";
import { Role } from "../entity/Role";
import bcrypt from 'bcryptjs';
import { authenticateJWT } from "../middleware/authMiddleware";
import { Bike } from "../entity/Bike";
import { Posto } from "../entity/Postos";

const router = Router();

router.post('/', async (req, res) => {  // Criar Usuário
    const { name, username, email, password, role } = req.body;

    if (!name || !username || !email || !password || !role) {  // Verifica campos obrigatórios
        return res.status(400).json({
            error: {
                status: 400,
                name: 'Validation Error',
                message: 'You missed a required field'
            }
        });
    }

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    // Verifica se o username já existe no banco de dados
    const existingUser = await userRepository.findOne({ where: { username } });

    if (existingUser) {
        return res.status(400).json({
            error: {
                status: 400,
                name: 'Validation Error',
                message: 'Nome de usuário já está em uso'
            }
        });
    }

    let roleInDB = await roleRepository.findOne({ where: { name: role } });

    if (!roleInDB) {
        roleInDB = roleRepository.create({ name: role });
        await roleRepository.save(roleInDB);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser: User = userRepository.create({
        name,
        username,
        email,
        password: hashedPassword,
        role: roleInDB,
    });

    await userRepository.save(newUser);
    res.status(200).json({
        data: newUser
    });
});

router.use(authenticateJWT) // Descomente para bloquear/desbloquear todas as rotas

router.get('/', async (req, res) => {   // Lista todos os Usuários
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({ relations: ['role', 'bikes'] }); 

    res.json({
        data: users
    });
});

router.get('/:id', async (req, res) => {  // Lista um Usuário
    const { id } = req.params;  // Recupera o Id que veio pela URL
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['role', 'bikes'] 
    });

    if (!user) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'NotFound',
                message: 'User not found'
            }
        });
    }

    res.json({
        data: user
    });
});

router.delete('/:id', async (req, res) => {  // Deleta um usuário
    const { id } = req.params;  // Recupera o Id que veio pela URL
    const userRepository = AppDataSource.getRepository(User);
    const bikeRepository = AppDataSource.getRepository(Bike); 

    const user = await userRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['role', 'bikes'] 
    });

    if (!user) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'NotFound',
                message: 'User not found'
            }
        });
    }

    
    if (user.bikes) {
        await bikeRepository.remove(user.bikes); // Removendo as bikes do banco de dados
    }

    await userRepository.remove(user);
    res.status(200).json({
        data: user
    });
});

router.put('/:id', async (req, res) => {   // Atualiza um usuário
    const { id } = req.params;
    const { name, username, email, password, role } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    const user = await userRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['role', 'bikes'], 
    });

    if (!user) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'NotFound',
                message: 'User not found',
            },
        });
    }

    let roleInDB = await roleRepository.findOne({ where: { name: role } });

    if (!roleInDB) {
        roleInDB = roleRepository.create({ name: role });
        await roleRepository.save(roleInDB);
    }

    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;

    if (password) {
        user.password = bcrypt.hashSync(password, 10);  // Atualiza a senha somente se um novo valor for fornecido
    }

    user.role = roleInDB;

    await userRepository.save(user);
    res.status(200).json({
        data: user,
    });
});

router.post('/:userId/devolver/:postoId', async (req, res) => {
    const { userId, postoId } = req.params;

    const userRepository = AppDataSource.getRepository(User);
    const bikeRepository = AppDataSource.getRepository(Bike);
    const postoRepository = AppDataSource.getRepository(Posto);

    // Encontra o usuário
    const user = await userRepository.findOne({
        where: { id: parseInt(userId) },
        relations: ['bikes']  
    });

    if (!user) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'NotFound',
                message: 'User not found',
            }
        });
    }

    // Encontra o posto
    const posto = await postoRepository.findOne({
        where: { id: parseInt(postoId) }
    });

    if (!posto) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'NotFound',
                message: 'Posto not found',
            }
        });
    }

    // Devolve as bikes do usuário para o posto
    const bikesToReturn = user.bikes;  

    for (let bike of bikesToReturn) {
        bike.posto = posto;  // Altera o posto da bike para o posto devolvido
        bike.status = 'disponível';  
        await bikeRepository.save(bike); 
    }

    // Limpa as bikes do usuário
    user.bikes = [];  // Remove as bikes do usuário
    await userRepository.save(user);  

    res.status(200).json({
        message: 'Bikes devolvidas com sucesso!',
        user,
        posto,
    });
});

export default router;
