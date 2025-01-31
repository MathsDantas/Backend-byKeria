import { Router } from "express";
import { AppDataSource } from "../DataSource";
import { Bike } from "../entity/Bike";
import { Posto } from "../entity/Postos";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();
router.use(authenticateJWT)

// Criar uma nova bike
router.post('/', async (req, res) => {
    const { type, status, postoId } = req.body;

    const bikeRepository = AppDataSource.getRepository(Bike);
    const postoRepository = AppDataSource.getRepository(Posto);

    const posto = await postoRepository.findOne({ where: { id: postoId } });
    if (!posto) {
        return res.status(404).json({ error: 'Posto not found' });
    }

    const newBike = bikeRepository.create({ type, status, posto });
    await bikeRepository.save(newBike);

    res.status(201).json(newBike);
});

// Listar todas as bikes
router.get('/', async (req, res) => {
    const bikeRepository = AppDataSource.getRepository(Bike);
    const bikes = await bikeRepository.find({ relations: ["posto"] });
    res.json(bikes);
});

// Atualizar uma bike
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { type, status } = req.body;

    const bikeRepository = AppDataSource.getRepository(Bike);
    const bike = await bikeRepository.findOne({ where: { id: parseInt(id) } });
    if (!bike) {
        return res.status(404).json({ error: 'Bike not found' });
    }

    bike.type = type ?? bike.type;
    bike.status = status ?? bike.status;
    await bikeRepository.save(bike);

    res.json(bike);
});

// Deletar uma bike
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const bikeRepository = AppDataSource.getRepository(Bike);
    const bike = await bikeRepository.findOne({ where: { id: parseInt(id) } });
    if (!bike) {
        return res.status(404).json({ error: 'Bike not found' });
    }

    await bikeRepository.remove(bike);
    res.status(204).send();
});

export default router;
