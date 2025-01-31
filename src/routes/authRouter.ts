import { Router } from "express";
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from "../DataSource";
import { User } from "../entity/User";

const router = Router()

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
        where: { username },
        relations: ['role'] 
    });

    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({
            userId: user.id,
            userRole: user.role.name 
        }, 'meu_segredo_mais_importante', { expiresIn: '1h' });

        res.status(200).json({
            data: {
                username: user.username,
                email: user.email,
                role: user.role.name,
                id: user.id,
                jwt: token 
            }
        });
    } else {
        return res.status(401).json({
            status: 401,
            name: 'Authorization Error',
            message: 'Username or Password invalid'
        });
    }
});



router.get('/logout', (req, res) => {
    res.status(200).json({
        data: {
            message: 'Logout realized with sucess'
        }
    })
})

export default router