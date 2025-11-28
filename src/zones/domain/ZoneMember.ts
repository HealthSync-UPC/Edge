import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Zone } from './Zone';
import { Member } from './Member';

@Entity()
export class ZoneMember {
    @PrimaryColumn({ type: 'integer' })
    zoneId!: number;

    @PrimaryColumn({ type: 'integer' })
    memberId!: number;

    @ManyToOne(() => Zone, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'zoneId' })
    zone?: Zone;

    @ManyToOne(() => Member, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'memberId' })
    member?: Member;
}
