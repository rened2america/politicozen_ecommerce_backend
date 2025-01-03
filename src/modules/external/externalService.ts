import externalDAO from "./externalDAO";

class ExternalService {

    createRequest = async (request: any) => {
        const newRequest = await externalDAO.createRequest(request);
        return newRequest;
    };

    requestExist = async (requestID: number) => {
        const isRequest = await externalDAO.requestExist(requestID);
        return isRequest;
    }

    createToken = async (token: any) => {
        const newToken = await externalDAO.createToken(token);
        return newToken;
    };

    updateToken = async (tokenId: number, token: any) => {
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
            Key: `${Date.now().toString()}-${productName}-Art`,
            Body: imgBuffer,
            ContentType: "image/png", // Cambia esto según el tipo de imagen
        };
        const uploadedImage = await s3.upload(paramsImg).promise();

        return uploadedImage;
    };

    getAllRequests = async () => {
        const requests = await externalDAO.getAllRequests();
        return requests;
    }

    deleteRequest = async (requestID: number) => {
        const deleted = await externalDAO.deleteRequest(requestID);
        return deleted;
    };
}

export default new ExternalService();