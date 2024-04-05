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
const productDAO_1 = __importDefault(require("./productDAO"));
class ProductService {
    constructor() {
        this.create = (product) => __awaiter(this, void 0, void 0, function* () {
            const newProduct = yield productDAO_1.default.create(product);
            return newProduct;
        });
        this.getByUser = (artistId) => __awaiter(this, void 0, void 0, function* () {
            const getProducts = yield productDAO_1.default.getByUser(artistId);
            return getProducts;
        });
        this.getAll = (filters, page) => __awaiter(this, void 0, void 0, function* () {
            const getProducts = yield productDAO_1.default.getAll(filters, page);
            return getProducts;
        });
        this.getById = (id, variant, size, product) => __awaiter(this, void 0, void 0, function* () {
            const getProducts = yield productDAO_1.default.getById(id, variant, size, product);
            return getProducts;
        });
        this.uploadLogo = (logo, s3, productName) => __awaiter(this, void 0, void 0, function* () {
            const paramsImgLogo = {
                Bucket: process.env.BUCKET_IMG,
                Key: `${Date.now().toString()}-${productName}-logo`,
                Body: Buffer.from(logo, "base64"),
                ContentType: "image/png", // Cambia esto según el tipo de imagen
            };
            const imgLogoURL = yield s3.upload(paramsImgLogo).promise();
            return imgLogoURL.Location;
        });
        this.uploadImages = (images, productName, s3) => __awaiter(this, void 0, void 0, function* () {
            const uploadedImages = images.map((image) => __awaiter(this, void 0, void 0, function* () {
                const paramsImg = {
                    Bucket: process.env.BUCKET_IMG,
                    Key: `${Date.now().toString()}-${productName}-product-${image.color}`,
                    Body: image.imgBuffer,
                    ContentType: "image/png", // Cambia esto según el tipo de imagen
                };
                const imgProductURL = yield s3.upload(paramsImg).promise();
                return Object.assign(Object.assign({}, image), { imgProductURL: imgProductURL.Location });
            }));
            return Promise.all(uploadedImages);
        });
        this.transformImagesFromBase64ToBuffer = (images) => __awaiter(this, void 0, void 0, function* () {
            return Object.keys(images).map((keyValue) => {
                const imgBuffer = Buffer.from(images[keyValue].split(",")[1], "base64");
                return {
                    imgBuffer,
                    color: keyValue,
                };
            });
        });
        // createProductInStripe = async (
        //   products: any,
        //   stripe: any,
        //   productName: string,
        //   price: number,
        //   sizeOptions: string[]
        // ) => {
        //   const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        //   const productsCreated = products.map(async (product: any) => {
        //     const productsWithSize = sizeOptions.map(async (size) => {
        //       await delay(500);
        //       const newProduct = await stripe.products.create({
        //         name: `${productName}-${product.color}-${size}-product`,
        //         images: [product.imgProductURL],
        //       });
        //       const priceProduct = await stripe.prices.create({
        //         product: newProduct.id,
        //         currency: "usd",
        //         unit_amount: price * 100,
        //       });
        //       return {
        //         size,
        //         ...product,
        //         ...priceProduct,
        //       };
        //     });
        //     return Promise.all(productsWithSize);
        //   });
        //   return Promise.all(productsCreated);
        // };
        this.createProductInStripe = (products, stripe, productName, price, sizeOptions) => __awaiter(this, void 0, void 0, function* () {
            const delay = (ms) => new Promise((res) => setTimeout(res, ms));
            const productsCreated = [];
            for (const product of products) {
                const productsWithSize = [];
                yield delay(500); // Espera 500 ms antes de cada llamada a la API
                for (const size of sizeOptions) {
                    const newProduct = yield stripe.products.create({
                        name: `${productName}-${product.color}-${size}-product`,
                        images: [product.imgProductURL],
                    });
                    const priceProduct = yield stripe.prices.create({
                        product: newProduct.id,
                        currency: "usd",
                        unit_amount: price * 100,
                    });
                    productsWithSize.push(Object.assign(Object.assign({ size }, product), priceProduct));
                }
                productsCreated.push(Promise.all(productsWithSize));
            }
            return Promise.all(productsCreated);
        });
    }
}
exports.default = new ProductService();
