import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { Bike } from "./Bike";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  username!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @ManyToOne(() => Role, role => role.users)
  role!: Role;

  @OneToMany(() => Bike, bike => bike.user)
  bikes!: Bike[]; 
}
