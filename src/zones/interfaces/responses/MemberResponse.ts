import { Member } from '../../../zones/domain/Member';

export class MemberResponse {
    id!: number;
    fullName!: string;

    static fromEntity(m: Member): MemberResponse {
        const r = new MemberResponse();
        r.id = m.id;
        r.fullName = m.fullName ?? '';
        return r;
    }
}

export const MemberResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'number', example: 1 },
        fullName: { type: 'string', example: 'Juan Perez' },
    },
};
