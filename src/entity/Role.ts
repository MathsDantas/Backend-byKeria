import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { User } from "./User";


@Entity()
export class Role {
    @PrimaryColumn()
    id!: number

    @Column()
    name!: string

    @OneToMany(() => User, user => user.role)
    users!: User[]
}