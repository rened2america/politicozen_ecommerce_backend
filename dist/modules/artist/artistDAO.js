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
// import { Artist } from "@prisma/client";
const initialConfig_1 = require("../../database/initialConfig");
class ArtistDAO {
    constructor() {
        this.getArtistByEmail = (email) => __awaiter(this, void 0, void 0, function* () {
            const artist = yield initialConfig_1.prisma.artist.findUnique({
                where: {
                    email,
                },
            });
            return artist;
        });
        this.getArtistById = (id) => __awaiter(this, void 0, void 0, function* () {
            const artist = yield initialConfig_1.prisma.artist.findUnique({
                where: {
                    id,
                },
            });
            return artist;
        });
        this.updateArtist = (id, data) => __awaiter(this, void 0, void 0, function* () {
            const artist = yield initialConfig_1.prisma.artist.update({
                where: {
                    id,
                },
                data,
            });
            return artist;
        });
        this.getAll = (page, limit) => __awaiter(this, void 0, void 0, function* () {
            console.log(page);
            const [artists, count] = yield initialConfig_1.prisma.$transaction([
                initialConfig_1.prisma.artist.findMany(),
                initialConfig_1.prisma.artist.count(),
            ]);
            return {
                artists: artists,
                count: count,
            };
        });
        this.getProfileAndProducts = (id, page, limit) => __awaiter(this, void 0, void 0, function* () {
            console.log(id);
            const [products, count, profile] = yield initialConfig_1.prisma.$transaction([
                initialConfig_1.prisma.product.findMany({
                    skip: (page - 1) * limit,
                    take: limit,
                    where: {
                        artist: {
                            name: id,
                        },
                    },
                    include: {
                        types: true,
                    },
                }),
                initialConfig_1.prisma.product.count(),
                initialConfig_1.prisma.artist.findFirst({
                    where: {
                        name: id,
                    },
                }),
            ]);
            return {
                products,
                count,
                profile,
            };
        });
    }
}
exports.default = new ArtistDAO();
