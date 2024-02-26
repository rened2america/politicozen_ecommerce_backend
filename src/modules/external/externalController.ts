import { Request, Response } from "express";
import { prisma } from "../../database/initialConfig";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import { validateRequestBody } from "../../utils/validation";
import { connectionAws } from "../../utils/configAws";
import productService from "../product/productService";

const uploadRequest = async (req: Request, res: Response) => {
    const token = req.header('Authorization');
    const s3 = connectionAws();
    let imageUrlLocation = '';

    try {
        // Verificar que el token este activo y a quien le pertenece (middleware)
        if (token) {
            const tokenData = await prisma.tokens.findUnique({
                where: {
                    token: token
                },
                include: {
                    artist: true
                }
            });

            if (!tokenData) {
                res.status(404).json({
                    message: `Unauthorized: Token not valid`,
                });
            }

            // Verificamos que los datos del body cumplan con las especificaciones del un producto (middleware)
            const validationError = validateRequestBody(req.body);

            if (validationError) {
                res.status(500).json({
                    message: `${validationError}`,
                });
            }

            // Guardar la imagen en la AWS - S3
            const response = await fetch(req.body.urlImage);
            if (!response.ok) {
                res.status(500).json({
                    message: `Failed to fetch image`,
                });
            }

            const imageBuffer = await response.arrayBuffer();

            const uploadedImage = await productService.uploadOneImage(
                Buffer.from(imageBuffer),
                `${tokenData.artist.name} by ${req.body.artistName}`,
                s3
            );

            imageUrlLocation = uploadedImage.Location;

            // Guardamos en la base de datos la solicitud

            res.status(200).json({
                message: `Authorized token: ${tokenData.token}, successful request`,
                urlLocation: imageUrlLocation
            })

        } else {
            res.status(500).json({
                message: `Unauthorized: Token not provided`,
            });
        }
    } catch (error) {
        console.error(error.message);
    }







};

const getSales = async (req: Request, res: Response) => {

};


const uploadOrderWithDecorators = withErrorHandlingDecorator(uploadRequest);
const getSalesWithDecorators = withErrorHandlingDecorator(getSales);

export const externalController = {
    uploadRequest: uploadOrderWithDecorators,
    getSales: getSalesWithDecorators,
};