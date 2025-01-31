import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Posto } from "./Postos";

@Entity()
export class Bike {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string; // 'adulto' ou 'infantil'

  @ManyToOne(() => User, user => user.bikes, { nullable: true })
  user!: User | null;  

  @ManyToOne(() => Posto, posto => posto.bikes, { nullable: true })  
  posto!: Posto | null; 
  
  @Column() 
  status!: string; 
}
