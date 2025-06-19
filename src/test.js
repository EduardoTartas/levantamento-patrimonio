import minioClient from './config/minioConnect.js';

export async function uploadTestFileToMinio() {
    try {
        // Predefined variables
        const sourceFile = 'teste-importacao-fix.csv';
        const bucket = 'fotos-levantamento';
        const destinationObject = 'my-test-file.csv';
        const region = 'us-east-1';

        // Check if the bucket exists
        const exists = await minioClient.bucketExists(bucket);
        if (exists) {
            console.log(`Bucket ${bucket} exists.`);
        } else {
            await minioClient.makeBucket(bucket, region);
            console.log(`Bucket ${bucket} created in "${region}".`);
        }

        // Upload the file with fPutObject
        await minioClient.fPutObject(bucket, destinationObject, sourceFile);
        console.log(`File ${sourceFile} uploaded as object ${destinationObject} in bucket ${bucket}`);
    } catch (error) {
        console.error(`Error uploading file to MinIO: ${error.message}`);
        throw error;
    }
}

// Usage example:
// await uploadTestFileToMinio();
