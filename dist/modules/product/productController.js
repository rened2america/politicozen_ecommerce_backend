"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const withErrorHandlingDecorator_1 = require("../../decorators/withErrorHandlingDecorator");
const productService_1 = __importDefault(require("./productService"));
const stripe_1 = __importDefault(require("stripe"));
//import { decode } from "base64-arraybuffer"; borrar
// import { Upload } from "@aws-sdk/lib-storage"; borrar
// import { S3Client } from "@aws-sdk/client-s3"; borrar
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const initialConfig_1 = require("../../database/initialConfig");
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { x, y, angle } = req.body;
    const accessKeyId = "AKIA5V3WMRCAFULV2ZLM";
    const secretAccessKey = "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";
    const region = "us-east-2";
    const Bucket = "politicozen-test";
    aws_sdk_1.default.config.update({
        accessKeyId,
        secretAccessKey,
        region,
    });
    // Crea un nuevo objeto de servicio S3
    const s3 = new aws_sdk_1.default.S3();
    const imgLogo = Buffer.from(req.body.imgLogo, "base64");
    const imgListProducts = req.body.imgListProduct.map((imgProduct) => {
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
    const imgLogoURL = yield s3.upload(paramsImgLogo).promise();
    const imgProductURLGreen = yield s3.upload(paramsImgProductGreen).promise();
    const imgProductURLBlue = yield s3.upload(paramsImgProductBlue).promise();
    const imgProductURLRed = yield s3.upload(paramsImgProductRed).promise();
    const stripe = new stripe_1.default("sk_test_51HFtCKDsqhqgulRL3PU0mFSWSEZiCeJQCHhSldDZJKl77sKFAXUrUyfpegHjjV3jFNoiVK6qAIW0T3J2rbILKbJ5008zvuTfYN", {
        apiVersion: "2023-08-16",
    });
    const productGreen = yield stripe.products.create({
        name: `${productName}-green-product`,
        images: [imgProductURLGreen.Location],
    });
    const productBlue = yield stripe.products.create({
        name: `${productName}-blue-product`,
        images: [imgProductURLBlue.Location],
    });
    const productRed = yield stripe.products.create({
        name: `${productName}-red-product`,
        images: [imgProductURLRed.Location],
    });
    const priceGreen = yield stripe.prices.create({
        product: productGreen.id,
        currency: "usd",
        unit_amount: 3000,
    });
    const priceBlue = yield stripe.prices.create({
        product: productBlue.id,
        currency: "usd",
        unit_amount: 3000,
    });
    const priceRed = yield stripe.prices.create({
        product: productRed.id,
        currency: "usd",
        unit_amount: 3000,
    });
    const artistId = 6;
    // // validar si el titulo del producto existe si no existe crear el producto
    const newProduct = yield productService_1.default.create({
        price: priceGreen.unit_amount ? priceGreen.unit_amount / 100 : null,
        title: productName,
        subtitle: "prueba subtitulo",
        artistId: artistId,
    });
    //@ts-ignore
    const productId = newProduct.id;
    const createManyDesign = yield initialConfig_1.prisma.design.createMany({
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
});
const getByUser = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield productService_1.default.getByUser(1);
    res.status(201).json({ message: "Producto Creado", products });
});
const getAll = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield productService_1.default.getAll();
    res.status(201).json({ message: "Productos Obtenidos", products });
});
const getById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productId = parseInt(req.params.id);
    //@ts-ignore
    const variant = req.query.variant ? req.query.variant : "green";
    const products = yield productService_1.default.getById(productId, variant);
    console.log(products);
    res.status(201).json({ message: "Productos Obtenidos", products });
});
const createWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(create);
const getAllWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getAll);
const getByUserWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getByUser);
const getByIdWithDecorators = (0, withErrorHandlingDecorator_1.withErrorHandlingDecorator)(getById);
exports.productController = {
    create: createWithDecorators,
    getAll: getAllWithDecorators,
    getByUser: getByUserWithDecorators,
    getById: getByIdWithDecorators,
};
