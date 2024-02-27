import externalDAO from "./externalDAO";

class ProductService {

    create = async (product: any) => {
        const newRequest = await externalDAO.create(product);
        return newRequest;
    };

    uploadOneImage = async (
        imgBuffer: Buffer,
        productName: string,
        s3: any
    ) => {
        const paramsImg = {
            Bucket: process.env.BUCKET_IMG,
            Key: `${Date.now().toString()}-${productName}-product`,
            Body: imgBuffer,
            ContentType: "image/png", // Cambia esto según el tipo de imagen
        };
        const uploadedImage = await s3.upload(paramsImg).promise();

        return uploadedImage;
    };
}

export default new ProductService();