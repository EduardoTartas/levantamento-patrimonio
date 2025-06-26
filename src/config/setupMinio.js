import minioClient from './minioConnect.js';
import logger from '../utils/logger.js';

async function setupMinio() {
    const bucketName = process.env.MINIO_BUCKET_FOTOS;

    if (!bucketName) {
        logger.error('Nome do bucket do MinIO não definido na variável de ambiente MINIO_BUCKET_FOTOS.');
        process.exit(1); 
    }

    try {
        logger.info(`Verificando a existência do bucket: ${bucketName}`);
        const exists = await minioClient.bucketExists(bucketName);

        if (!exists) {
            await minioClient.makeBucket(bucketName);
            logger.info(`Bucket "${bucketName}" criado com sucesso no MinIO.`);
        } else {
            logger.info(`Bucket "${bucketName}" já existe no MinIO.`);
        }
    } catch (err) {
        logger.error(`Erro ao configurar o bucket do MinIO: ${err.message}`);
        process.exit(1);
    }
}

export default setupMinio;