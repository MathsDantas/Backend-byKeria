import { Router } from "express";
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from "../DataSource";
import { Posto } from "../entity/Postos";
import { Bike } from "../entity/Bike";
import { User } from "../entity/User";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router()

router.use(authenticateJWT)

router.get('/', async (req, res) => {   // Lista todos os Postos de Aluguel
    const postoRepository = AppDataSource.getRepository(Posto);
    
    try {
        const postos = await postoRepository.find();  

        res.json({
            data: postos
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar postos de aluguel' });
    }
});

router.post('/', async (req, res) => {  // Criar um Posto de Aluguel de Bikes
    const { nameUnidade, endereco, bikesAdu, bikesInf } = req.body;
  
    // Validação dos campos
    if (!nameUnidade || !endereco || bikesAdu == null || bikesInf == null) {
      return res.status(400).json({
        error: {
          status: 400,
          name: 'Validation Error',
          message: 'You missed a required field'
        }
      });
    }
  
    const postoRepository = AppDataSource.getRepository(Posto);
    const bikeRepository = AppDataSource.getRepository(Bike);
  
    // Criação do posto
    const newPosto: Posto = postoRepository.create({ nameUnidade, endereco });
    await postoRepository.save(newPosto);
  
    // Adicionar as bikes de adulto ao posto
    for (let i = 0; i < bikesAdu; i++) {
      const newBikeAdu = bikeRepository.create({
        type: 'adulto',
        status: 'disponível', 
        posto: newPosto  
      });
      await bikeRepository.save(newBikeAdu);
    }
  
    // Adicionar as bikes de crianças ao posto
    for (let i = 0; i < bikesInf; i++) {
      const newBikeInf = bikeRepository.create({
        type: 'infantil',
        status: 'disponível', 
        posto: newPosto  
      });
      await bikeRepository.save(newBikeInf);
    }
  
    
    const postoComBikes = await postoRepository.findOne({
      where: { id: newPosto.id },
      relations: ['bikes']  
    });
  
    res.status(200).json({
      data: postoComBikes
    });
  });

router.put('/:id', async (req, res) => {   // Atualiza um Posto 
    const { id } = req.params;
    const { nameUnidade, endereco, bikes } = req.body;

    const postoRepository = AppDataSource.getRepository(Posto);
    const bikeRepository = AppDataSource.getRepository(Bike);

    try {
        const posto = await postoRepository.findOne({
            where: { id: parseInt(id) },
            relations: ['bikes']  
        });

        if (!posto) {
            return res.status(404).json({
                error: {
                    status: 404,
                    name: 'NotFound',
                    message: 'Posto not found',
                },
            });
        }

        // Atualiza o nome da unidade e endereço se fornecidos
        posto.nameUnidade = nameUnidade ?? posto.nameUnidade;
        posto.endereco = endereco ?? posto.endereco;

        // Atualiza ou adiciona bikes se fornecidas
        if (bikes && Array.isArray(bikes)) {
            for (let bikeData of bikes) {
                let bike = await bikeRepository.findOne({ where: { id: bikeData.id } });
        
                if (bike) {
                    // Atualiza a bike existente
                    bike.type = bikeData.type ?? bike.type;
                    bike.status = bikeData.status ?? bike.status;
                    bike.posto = posto;  
                    await bikeRepository.save(bike);
                } else {
                    // Cria nova bike se não existir
                    const newBike: Bike = bikeRepository.create({
                        type: bikeData.type,   
                        status: bikeData.status, 
                        posto: posto           
                    });
                    await bikeRepository.save(newBike);
                }
            }
        }
        
        

        await postoRepository.save(posto);

        res.status(200).json({
            data: posto,
        });
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                name: 'InternalServerError',
                message: 'An error occurred while updating the posto.',
            },
        });
    }
});


router.delete('/:id', async (req, res) => {  // Deleta um Posto
    const { id } = req.params;
    const postoRepository = AppDataSource.getRepository(Posto);
    
    const posto = await postoRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['bikes']  
    });

    if (!posto) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'NotFound',
                message: 'Posto not found',
            },
        });
    }

    
    await postoRepository.remove(posto);

    res.status(200).json({
        data: posto
    });
});


router.get('/:id', async (req, res) => {  // Lista uma Unidade dos Postos

    const { id } = req.params;  // Recupera o Id que veio pela URL
    const postoRepository = AppDataSource.getRepository(Posto);

    const posto = await postoRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['bikes']  
    });

    if (!posto) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'NotFound',
                message: 'Posto not found'  
            }
        });
    }

    res.json({
        data: posto
    });
});


router.post('/:id/alugar', async (req, res) => {
    const { userId, bikesAdu, bikesInf } = req.body;
    const { id: postoId } = req.params; // ID do posto

    // Validação dos campos obrigatórios
    if (!userId || bikesAdu == null || bikesInf == null) {
        return res.status(400).json({
            error: {
                status: 400,
                name: 'Validation Error',
                message: 'User ID, number of adult bikes, and number of infant bikes are required'
            }
        });
    }

    const postoRepository = AppDataSource.getRepository(Posto);
    const bikeRepository = AppDataSource.getRepository(Bike);
    const userRepository = AppDataSource.getRepository(User);

    // Busca o posto pelo ID
    const posto = await postoRepository.findOne({
        where: { id: parseInt(postoId) },
        relations: ['bikes'] 
    });
    if (!posto) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'Not Found',
                message: 'Posto not found'
            }
        });
    }

    // Busca o usuário pelo ID
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
        return res.status(404).json({
            error: {
                status: 404,
                name: 'Not Found',
                message: 'User not found'
            }
        });
    }

    // Verifica quantas bikes de adulto estão disponíveis
    const availableAdultBikes = posto.bikes.filter(bike => bike.type === 'adulto' && bike.status === 'disponível');
    if (availableAdultBikes.length < bikesAdu) {
        return res.status(400).json({
            error: {
                status: 400,
                name: 'Not Enough Bikes',
                message: 'Not enough adult bikes available'
            }
        });
    }

    // Verifica quantas bikes infantis estão disponíveis
    const availableInfantBikes = posto.bikes.filter(bike => bike.type === 'infantil' && bike.status === 'disponível');
    if (availableInfantBikes.length < bikesInf) {
        return res.status(400).json({
            error: {
                status: 400,
                name: 'Not Enough Bikes',
                message: 'Not enough infant bikes available'
            }
        });
    }

    // Atualiza o status das bikes e associa ao usuário
    for (let i = 0; i < bikesAdu; i++) {
        const bike = availableAdultBikes[i];
        bike.status = 'alugada';
        bike.user = user; 
        await bikeRepository.save(bike);
    }

    for (let i = 0; i < bikesInf; i++) {
        const bike = availableInfantBikes[i];
        bike.status = 'alugada';
        bike.user = user; 
        await bikeRepository.save(bike);
    }

    res.status(200).json({
        message: 'Bikes rented successfully',
        userId,
        postoId,
        bikes: {
            adult: bikesAdu,
            infant: bikesInf
        }
    });
});





export default router