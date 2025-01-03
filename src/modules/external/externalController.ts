import { Request, Response } from "express";
import { prisma } from "../../database/initialConfig";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import { validateRequestBody } from "../../utils/validation";
import { connectionAws } from "../../utils/configAws";
import externalService from "./externalService";
import jwt from "jsonwebtoken";
import artistDAO from "../artist/artistDAO";

const generateToken = async (req: Request, res: Response) => {
  try {
    // Obtener el ID del artista del cuerpo de la solicitud
    // const artistId = parseInt(req.params.artistId);
    const artistId = req.user.artistId;

    // Buscar el artista en la base de datos
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, email: true }, // Seleccionar solo los campos necesarios
    });

    if (!artist) {
      res.status(404).json({ message: "Artist not found" });
    }

    // Verificar si ya existe un token para este artista
    let existingToken = await prisma.tokens.findUnique({
      where: { artistId },
    });

    // Generar el token JWT con los datos del artista como payload
    const token = jwt.sign(
      {
        id: artist.id,
        email: artist.email,
        date: new Date().toISOString().split(".")[0],
      },
      process.env.JWT_SECRET_KEY!
    );

    // Si ya existe un token, actualizarlo con el nuevo token generado
    if (existingToken) {
      existingToken = await externalService.updateToken(existingToken.id, {
        token,
      });
    } else {
      // Si no existe un token, crear uno nuevo
      existingToken = await externalService.createToken({
        token,
        artistId: artist.id,
      });
    }

    // Devolver el token en la respuesta
    res.status(200).json({ token: existingToken.token });
  } catch (error) {
    console.error(error.message);
  }
};

const getAllRequests = async (req: Request, res: Response) => {

  const requests = await externalService.getAllRequests();

  res.status(200).json(requests)
};

const deleteRequest = async (req: Request, res: Response) => {

  const requestID = parseInt(req.params.requestID);
  const deleted = await externalService.deleteRequest(requestID);

  if (!deleted) {
    res.status(400).json({ message: "Cannot delete this request!" })
    return;
  }

  res.status(200).json({ message: "Request deleted successfully!" })
};

const getAllRequestsExternal = async (req: Request, res: Response) => {

  const token = req.header("Authorization");
  if (!token) {
    res.status(404).json({
      message: `Unauthorized: Token not valid`,
    });
    return;
  }

  // Gets Token from Database
  const tokenData = await prisma.tokens.findUnique({
    where: {
      token: token,
    },
    include: {
      artist: true,
    },
  });

  if (!tokenData) {
    res.status(404).json({
      message: `Unauthorized: Token not valid`,
    });
    return;
  }

  const requests = await externalService.getAllRequests();

  res.status(200).json(requests)
};

const uploadRequest = async (req: Request, res: Response) => {
  const s3 = connectionAws();
  let imageUrlLocation = "";
  const artistId = req.user.artistId;

  // const bufferArt = req.file.buffer;
  const imageCrop = req.body.urlImage;
  console.log("imgcrop: ", imageCrop)
  if (!imageCrop || !imageCrop.includes(";base64,")) {
    console.log("ERROR: Invalid base64 image")
    res.status(400).json({ message: "Invalid base64 image" });
    return;
  }
  if (!req.body.templates || typeof req.body.templates !== "string") {
    console.log("ERROR: Invalid or missing templates")
    res.status(400).json({ message: "Invalid or missing templates" });
    return;
  }
  if (!req.body.colors || typeof req.body.colors !== "string") {
    console.log("ERROR: Invalid or missing colors")
    res.status(400).json({ message: "Invalid or missing colors" });
    return;
  }
  const base64Image = imageCrop.split(";base64,").pop();
  const imgCropBuffer = Buffer.from(base64Image, "base64");

  const artist = await artistDAO.getArtistById(artistId);

  req.body.templates = req.body.templates.includes(',')
    ? req.body.templates.split(',')
    : [req.body.templates];

  req.body.colors = req.body.colors.includes(',')
    ? req.body.colors.split(',')
    : [req.body.colors];

  try {

    const validationError = validateRequestBody(req.body);

    if (validationError) {
      console.log("ERROR: ", validationError)
      res.status(500).json({
        message: `${validationError}`,
      });
      return;
    }

    const uploadedImage = await externalService.uploadOneImage(
      imgCropBuffer,
      `${req.body.artistName}-from-${artist.name}`,
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
      genero: "",
      sizes: ""

    });

    console.log("Success: Request created successfully!")
    res.status(200).json({
      message: "Request created successfully!",
      urlLocation: imageUrlLocation,
      request: newRequest,
    });
    return;

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
    return;
  }
};

const uploadRequestExternal = async (req: Request, res: Response) => {
  const token = req.header("Authorization");
  const s3 = connectionAws();
  let imageUrlLocation = "";

  try {
    // Verificar que el token este activo y a quien le pertenece ()
    if (token) {
      const tokenData = await prisma.tokens.findUnique({
        where: {
          token: token,
        },
        include: {
          artist: true,
        },
      });

      if (!tokenData) {
        res.status(404).json({
          message: `Unauthorized: Token not valid`,
        });
        return;
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
          templates: req.body.templates.join(","),
          position: req.body.position,
          color: req.body.colors.join(","),
          genero: req.body.genders.join(","),
          sizes: req.body.sizes.join(","),
        });

        res.status(200).json({
          message: `Authorized token: ${tokenData.token}, successful request`,
          urlLocation: imageUrlLocation,
          request: newRequest,
        });
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

const updateRequest = async (req: Request, res: Response) => {

  let { requestID, artistName, templates, position, colors } = req.body;

  if (!requestID || !externalService.requestExist(requestID)) {
    res.status(404).json({ message: "Request does not exist" });
    return;
  }


  if (!templates || typeof templates !== "string") {
    console.log("ERROR: Invalid or missing templates")
    res.status(400).json({ message: "Invalid or missing templates" });
    return;
  }
  if (!colors || typeof colors !== "string") {
    console.log("ERROR: Invalid or missing colors")
    res.status(400).json({ message: "Invalid or missing colors" });
    return;
  }

  req.body.templates = templates.includes(',')
    ? templates.split(',')
    : [templates];

  req.body.colors = colors.includes(',')
    ? colors.split(',')
    : [colors];

  try {

    const validationError = validateRequestBody(req.body);

    if (validationError) {
      console.log("ERROR: ", validationError)
      res.status(500).json({
        message: `${validationError}`,
      });
      return;
    }

    const updatedRequest = await prisma.requests.update({
      where: {
        id: requestID,
      },
      data: {
        artistName: artistName,
        templates: templates,
        position: position,
        color: colors,
      }
    });

    console.log("Success: Request updated successfully!")
    res.status(200).json({
      message: "Request updated successfully!",
      request: updatedRequest,
    });
    return;

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
    return;
  }
};

// const updateRequest = async (req: Request, res: Response) => {
//   const { requestID, artistName,templates, categoryId } = req.body;

//   if (!requestID || !externalService.requestExist(requestID)) {
//     res.status(404).json({ message: "Request does not exist" });
//     return;
//   }

//   const updatedRequest = await prisma.requests.update({
//     where: {
//       id: requestID,
//     },
//     data: {
//       artistName: artistName,      
//     }
//   });

//   if (!updatedRequest) {
//     res.status(500).json({ message: "Cannot update request.. please contact Admin" })
//     return;
//   }

//   res.status(200).json({ message: "Request updated Successfully" })
// };

const getSales = async (req: Request, res: Response) => {
  const token = req.header("Authorization");
  console.log(token);
  try {
    if (token) {
      const tokenData = await prisma.tokens.findUnique({
        where: {
          token: token,
        },
        include: {
          artist: true,
        },
      });

      if (!tokenData) {
        res.status(404).json({
          message: `Unauthorized: Token not valid`,
        });
      }

      // Definir el filtro inicial
      const filter: any = {
        artistId: tokenData.artist.id,
      };

      // Obtener fechas de inicio y fin de los parámetros de la solicitud
      const startDate = req.query.startDate
        ? new Date(req.query.startDate.toString())
        : null;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate.toString())
        : null;

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
        select: {
          id: true,
          city: true,
          state: true,
          amount: true,
          quantity: true,
          priceId: true,
          productName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        message: `Orders fetched successfully for artist: ${tokenData.artist.name}`,
        orders: artistOrders,
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
const uploadRequestExternalWithDecorators = withErrorHandlingDecorator(uploadRequestExternal);
const updateRequestWithDecorators = withErrorHandlingDecorator(updateRequest);
const getSalesWithDecorators = withErrorHandlingDecorator(getSales);
const getAllRequestsWithDecorators = withErrorHandlingDecorator(getAllRequests);
const deleteRequestWithDecorators = withErrorHandlingDecorator(deleteRequest);
const getAllRequestsExternalWithDecorators = withErrorHandlingDecorator(getAllRequestsExternal);

export const externalController = {
  generateToken: generateTokenWithDecorators,
  uploadRequest: uploadOrderWithDecorators,
  uploadRequestExternal: uploadRequestExternalWithDecorators,
  updateRequest: updateRequestWithDecorators,
  getSales: getSalesWithDecorators,
  getAllRequests: getAllRequestsWithDecorators,
  deleteRequest: deleteRequestWithDecorators,
  getAllRequestsExternal: getAllRequestsExternalWithDecorators,
};
