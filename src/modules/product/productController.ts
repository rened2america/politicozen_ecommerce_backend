import { Request, Response } from "express";
import { withErrorHandlingDecorator } from "../../decorators/withErrorHandlingDecorator";
import productService from "./productService";
import Stripe from "stripe";
//import { decode } from "base64-arraybuffer"; borrar
// import { Upload } from "@aws-sdk/lib-storage"; borrar
// import { S3Client } from "@aws-sdk/client-s3"; borrar
import AWS from "aws-sdk";
import { prisma } from "../../database/initialConfig";

const create = async (req: Request, res: Response) => {
  const { x, y, angle } = req.body;
  const accessKeyId = "AKIA5V3WMRCAFULV2ZLM";
  const secretAccessKey = "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";
  const region = "us-east-2";
  const Bucket = "politicozen-test";

  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  // Crea un nuevo objeto de servicio S3
  const s3 = new AWS.S3();
  const imgLogo = Buffer.from(req.body.imgLogo, "base64");
  const imgListProducts = req.body.imgListProduct.map((imgProduct: any) => {
    return Buffer.from(imgProduct.split(",")[1], "base64");
  });
  // const imgProduct = Buffer.from(req.body.imgProduct.split(",")[1], "base64");
  const productName = req.body.name;
  const paramsImgLogo = {
    Bucket,
    Key: `${Date.now().toString()}-${productName}-logo`,
    Body: imgLogo,
    ContentType: "image/png", // Cambia esto según el tipo de imagen
  };
  //Primer Producto Verde

  const paramsImgProductGreen = {
    Bucket,
    Key: `${Date.now().toString()}-${productName}-green-product`,
    Body: imgListProducts[0],
    ContentType: "image/png", // Cambia esto según el tipo de imagen
  };
  const paramsImgProductBlue = {
    Bucket,
    Key: `${Date.now().toString()}-${productName}-blue-product`,
    Body: imgListProducts[1],
    ContentType: "image/png", // Cambia esto según el tipo de imagen
  };
  const paramsImgProductRed = {
    Bucket,
    Key: `${Date.now().toString()}-${productName}-red-product`,
    Body: imgListProducts[2],
    ContentType: "image/png", // Cambia esto según el tipo de imagen
  };
  const imgLogoURL = await s3.upload(paramsImgLogo).promise();
  const imgProductURLGreen = await s3.upload(paramsImgProductGreen).promise();
  const imgProductURLBlue = await s3.upload(paramsImgProductBlue).promise();

  const imgProductURLRed = await s3.upload(paramsImgProductRed).promise();

  const stripe = new Stripe(
    "sk_test_51HFtCKDsqhqgulRL3PU0mFSWSEZiCeJQCHhSldDZJKl77sKFAXUrUyfpegHjjV3jFNoiVK6qAIW0T3J2rbILKbJ5008zvuTfYN",
    {
      apiVersion: "2023-08-16",
    }
  );

  const productGreen = await stripe.products.create({
    name: `${productName}-green-product`,
    images: [imgProductURLGreen.Location],
  });
  const productBlue = await stripe.products.create({
    name: `${productName}-blue-product`,
    images: [imgProductURLBlue.Location],
  });
  const productRed = await stripe.products.create({
    name: `${productName}-red-product`,
    images: [imgProductURLRed.Location],
  });

  const priceGreen = await stripe.prices.create({
    product: productGreen.id,
    currency: "usd",
    unit_amount: 3000,
  });
  const priceBlue = await stripe.prices.create({
    product: productBlue.id,
    currency: "usd",
    unit_amount: 3000,
  });
  const priceRed = await stripe.prices.create({
    product: productRed.id,
    currency: "usd",
    unit_amount: 3000,
  });

  const artistId = 6;
  // // validar si el titulo del producto existe si no existe crear el producto
  const newProduct = await productService.create({
    price: priceGreen.unit_amount ? priceGreen.unit_amount / 100 : null,
    title: productName,
    subtitle: "prueba subtitulo",
    artistId: artistId,
  });
  //@ts-ignore
  const productId: number = newProduct.id;
  const createManyDesign = await prisma.design.createMany({
    data: [
      {
        productId: productId,
        positionX: x,
        positionY: y,
        angle: angle,
        variant: "green",
        price: priceGreen.unit_amount ? priceGreen.unit_amount / 100 : 0,
        priceId: priceGreen.id,
        url: imgProductURLGreen.Location,
        urlLogo: imgLogoURL.Location,
        artistId: artistId,
      },
      {
        productId: productId,

        positionX: x,
        positionY: y,
        angle: angle,
        variant: "blue",
        price: priceBlue.unit_amount ? priceBlue.unit_amount / 100 : 0,
        priceId: priceBlue.id,
        url: imgProductURLBlue.Location,
        urlLogo: imgLogoURL.Location,
        artistId: artistId,
      },
      {
        productId: productId,
        positionX: x,
        positionY: y,
        angle: angle,
        variant: "red",
        price: priceRed.unit_amount ? priceRed.unit_amount / 100 : 0,
        priceId: priceRed.id,
        url: imgProductURLRed.Location,
        urlLogo: imgLogoURL.Location,
        artistId: artistId,
      },
    ],
    skipDuplicates: true,
  });

  res
    .status(201)
    .json({ message: "Producto Creado", newProduct, createManyDesign });
};

const getByUser = async (_: Request, res: Response) => {
  const products = await productService.getByUser(1);
  res.status(201).json({ message: "Producto Creado", products });
};

const getAll = async (_: Request, res: Response) => {
  const products = await productService.getAll();
  res.status(201).json({ message: "Productos Obtenidos", products });
};

const getById = async (req: Request, res: Response) => {
  const productId: number = parseInt(req.params.id);
  //@ts-ignore
  const variant: string = req.query.variant ? req.query.variant : "green";
  const products = await productService.getById(productId, variant);
  console.log(products);
  res.status(201).json({ message: "Productos Obtenidos", products });
};

const createWithDecorators = withErrorHandlingDecorator(create);
const getAllWithDecorators = withErrorHandlingDecorator(getAll);
const getByUserWithDecorators = withErrorHandlingDecorator(getByUser);
const getByIdWithDecorators = withErrorHandlingDecorator(getById);

export const productController = {
  create: createWithDecorators,
  getAll: getAllWithDecorators,
  getByUser: getByUserWithDecorators,
  getById: getByIdWithDecorators,
};
