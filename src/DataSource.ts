import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Role } from "./entity/Role"
import { Posto } from "./entity/Postos"
import { Bike } from "./entity/Bike"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "mydatabase.sqlite",
    synchronize: true,
    entities: [User, Role, Posto, Bike]
})