import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Device {
    @PrimaryColumn()
    id!: number;

    @Column({ nullable: true })
    name!: string;

    @Column({ nullable: true })
    type!: string;

    @Column({ type: 'integer', nullable: true })
    zoneId!: number | null;

    @Column({ type: 'text', nullable: true })
    zoneName!: string | null;
}
