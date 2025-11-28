import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Zone {
    @PrimaryColumn()
    id!: number;

    @Column({ nullable: true })
    name!: string;

    @Column({ type: 'real', nullable: true })
    minTemperature!: number;

    @Column({ type: 'real', nullable: true })
    maxTemperature!: number;

    @Column({ type: 'real', nullable: true })
    minHumidity!: number;

    @Column({ type: 'real', nullable: true })
    maxHumidity!: number;

    @Column({ type: 'integer', nullable: true })
    totalDevices!: number;

    @Column({ type: 'integer', nullable: true })
    totalMembers!: number;
}
