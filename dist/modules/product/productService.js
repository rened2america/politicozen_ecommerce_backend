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
        this.getAll = () => __awaiter(this, void 0, void 0, function* () {
            const getProducts = yield productDAO_1.default.getAll();
            return getProducts;
        });
        this.getById = (id, variant) => __awaiter(this, void 0, void 0, function* () {
            const getProducts = yield productDAO_1.default.getById(id, variant);
            return getProducts;
        });
    }
}
exports.default = new ProductService();
