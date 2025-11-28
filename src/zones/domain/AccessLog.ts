import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class AccessLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'integer' })
    zoneId!: number;

    @Column({ type: 'integer' })
    memberId!: number;

    @Column({ type: 'text' })
    timestamp!: string;

    @Column({ type: 'boolean' })
    accessGranted!: boolean;

    @Column({ type: 'text', nullable: true })
    sentAt!: string | null;

    @Column({ type: 'integer', default: 0 })
    retryCount!: number;
}
