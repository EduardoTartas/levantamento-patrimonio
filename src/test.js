import minioClient from './config/minioConnect.js';

export async function uploadTestFileToMinio() {
    try {
        
        const sourceFile = 'teste-importacao-fix.csv';
        const bucket = 'fotos-levantamento';
        const destinationObject = 'my-test-file.csv';

        await minioClient.fPutObject(bucket, destinationObject, sourceFile);
        console.log(`File ${sourceFile} uploaded as object ${destinationObject} in bucket ${bucket}`);
    } catch (error) {
        console.error(`Error uploading file to MinIO: ${error.message}`);
        throw error;
    }
}
