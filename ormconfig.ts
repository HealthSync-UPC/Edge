import path from 'path';

export default {
    type: 'sqlite',
    database: path.join(process.cwd(), 'data', 'edge.db'),
    synchronize: true,
    logging: false,
    entities: [path.join(__dirname, 'src', 'entities', '*.ts')],
};
