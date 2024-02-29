import { Request, Response } from "express";
import { prisma } from "../../database/initialConfig";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import { validateRequestBody } from "../../utils/validation";
import { connectionAws } from "../../utils/configAws";
import externalService from "./externalService";
import jwt from 'jsonwebtoken';

const generateToken = async (req: Request, res: Response) => {
    try {
        // Obtener el ID del artista del cuerpo de la solicitud
        const artistId = parseInt(req.params.artistId);

        // Buscar el artista en la base de datos
        const artist = await prisma.artist.findUnique({
            where: { id: artistId },
            select: { id: true, name: true, email: true } // Seleccionar solo los campos necesarios
        });

        if (!artist) {
            res.status(404).json({ message: 'Artist not found' });
        }

        // Verificar si ya existe un token para este artista
        let existingToken = await prisma.tokens.findUnique({
            where: { artistId }
        });

        // Generar el token JWT con los datos del artista como payload
        const token = jwt.sign(
            { id: artist.id, email: artist.email, date: new Date().toISOString().split('.')[0] },
            process.env.JWT_SECRET_KEY!
        );

        // Si ya existe un token, actualizarlo con el nuevo token generado
        if (existingToken) {
            existingToken = await externalService.updateToken(existingToken.id, { token });
        } else {
            // Si no existe un token, crear uno nuevo
            existingToken = await externalService.createToken({
                token,
                artistId: artist.id
            });
        }

        // Devolver el token en la respuesta
        res.status(200).json({ token: existingToken.token });
    } catch (error) {
        console.error(error.message);
    }
}

const uploadRequest = async (req: Request, res: Response) => {
    const token = req.header('Authorization');
    const s3 = connectionAws();
    let imageUrlLocation = '';

    try {
        // Verificar que el token este activo y a quien le pertenece ()
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

            // Verificamos que los datos del body cumplan con las especificaciones del un producto ()
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
            } else {
                const imageBuffer = await response.arrayBuffer();

                const uploadedImage = await externalService.uploadOneImage(
                    Buffer.from(imageBuffer),
                    `${tokenData.artist.name} by ${req.body.artistName}`,
                    s3
                );

                imageUrlLocation = uploadedImage.Location;

                // Guardamos en la base de datos la solicitud
                const newRequest = await externalService.createRequest({
                    urlImage: imageUrlLocation,
                    artistName: req.body.artistName,
                    templates: req.body.templates.join(','),
                    position: req.body.position,
                    color: req.body.colors.join(','),
                    genero: req.body.genders.join(','),
                    sizes: req.body.sizes.join(',')
                });

                res.status(200).json({
                    message: `Authorized token: ${tokenData.token}, successful request`,
                    urlLocation: imageUrlLocation,
                    request: newRequest

                })
            }

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
    const token = req.header('Authorization');
    try {
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

            // Definir el filtro inicial
            const filter: any = {
                artistId: tokenData.artist.id
            };

            // Obtener fechas de inicio y fin de los parámetros de la solicitud
            const startDate = req.query.startDate ? new Date(req.query.startDate.toString()) : null;
            const endDate = req.query.endDate ? new Date(req.query.endDate.toString()) : null;

            // Verificar si se proporcionaron fechas de inicio y fin
            if (startDate && endDate) {
                filter.createdAt = {
                    gte: startDate,
                    lte: endDate,
                };
            }

            // Obtener todas las órdenes que cumplen con los filtros
            const artistOrders = await prisma.order.findMany({
                where: filter,
            });

            res.status(200).json({
                message: `Orders fetched successfully for artist: ${tokenData.artist.name}`,
                orders: artistOrders
            });

        } else {
            res.status(500).json({
                message: `Unauthorized: Token not provided`,
            });
        }
    } catch (error) {
        console.error(error.message);
    }
};

const generateTokenWithDecorators = withErrorHandlingDecorator(generateToken);
const uploadOrderWithDecorators = withErrorHandlingDecorator(uploadRequest);
const getSalesWithDecorators = withErrorHandlingDecorator(getSales);

export const externalController = {
    generateToken: generateTokenWithDecorators,
    uploadRequest: uploadOrderWithDecorators,
    getSales: getSalesWithDecorators
};