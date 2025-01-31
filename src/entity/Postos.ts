import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Bike } from "./Bike";

@Entity()
export class Posto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nameUnidade!: string;

  @Column()
  endereco!: string; 

  @OneToMany(() => Bike, bike => bike.posto, { cascade: true }) 
  bikes!: Bike[];  // Um posto tem várias bikes
}
