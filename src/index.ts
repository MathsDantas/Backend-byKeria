import  express  from 'express'
import userRoutes from './routes/userRoutes'
import { AppDataSource } from './DataSource'
import authRotes from './routes/authRouter'
import postoRoutes from './routes/postoRoutes'
import bikeRoutes from './routes/bikeRoutes';
import cors from 'cors'


async function startServer () {
    try{
        await AppDataSource.initialize()

    
        const app = express()
        const port = 3000
        


        app.use(cors({
            origin: 'http://localhost:5173', // Permite apenas o frontend local
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));        

        app.use(express.json())
        app.use('/', authRotes)
        app.use('/users', userRoutes)
        app.use('/postos', postoRoutes)    
        app.use('/bikes', bikeRoutes)
        app.get('/status', (req, res) => {
            res.status(200).json({ status: 'OK' });
        });    
        
        app.listen(port, () => {
            console.log(`Servidor escutanto na porta ${port} em http://localhost:${port}`)
        })
    }
    catch(e) {
        throw e
    }
         
    }


startServer()

