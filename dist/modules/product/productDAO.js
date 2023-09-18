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
Object.defineProperty(exports, "__esModule", { value: true });
const initialConfig_1 = require("../../database/initialConfig");
class ProductDAO {
    constructor() {
        this.create = (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const newProduct = yield initialConfig_1.prisma.product.create({
                    data,
                });
                return newProduct;
            }
            catch (error) {
                console.log("localError", error);
                return error;
            }
        });
        this.getByUser = (artistId) => __awaiter(this, void 0, void 0, function* () {
            console.log(artistId);
            const allProducts = yield initialConfig_1.prisma.product.findMany();
            return allProducts;
        });
        this.getAll = () => __awaiter(this, void 0, void 0, function* () {
            const allProducts = yield initialConfig_1.prisma.product.findMany({
                include: {
                    design: true,
                },
            });
            return allProducts;
        });
        this.getById = (id, variant) => __awaiter(this, void 0, void 0, function* () {
            const allProducts = yield initialConfig_1.prisma.product.findUnique({
                where: {
                    id,
                },
                include: {
                    design: {
                        where: {
                            variant,
                        },
                    },
                },
            });
            return allProducts;
        });
    }
}
exports.default = new ProductDAO();
