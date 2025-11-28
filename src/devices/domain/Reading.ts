import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('readings')
export class Reading {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  deviceId!: number;

  @Column('float')
  value!: number;

  @Column({ type: 'text' })
  createdAt!: string;

  @Column({ type: 'text', nullable: true })
  sentAt!: string | null;

  @Column({ type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ type: 'boolean', default: false })
  alert!: boolean;
}
