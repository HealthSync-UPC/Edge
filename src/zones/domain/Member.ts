import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Member {
    @PrimaryColumn({ type: 'integer' })
    id!: number;

    @Column({ nullable: true })
    fullName!: string;
}
