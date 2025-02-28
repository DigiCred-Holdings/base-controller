import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Si {
    @PrimaryGeneratedColumn()
    studentId: number;

    @Column()
    studentName:string;

    @Column()
    transcript:string;
}
