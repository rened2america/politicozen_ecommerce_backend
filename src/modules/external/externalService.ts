import externalDAO from "./externalDAO";

class ExternalService {

    createRequest = async (request: any) => {
        const newRequest = await externalDAO.createRequest(request);
        return newRequest;
    };

    createToken = async (token: any) => {
        const newToken = await externalDAO.createToken(token);
        return newToken;
    };

    updateToken = async (tokenId:number, token: any) => {
        const newToken = await externalDAO.updateToken(tokenId, token);
        return newToken;
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

export default new ExternalService();