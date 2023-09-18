"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const route_1 = __importDefault(require("./route/route"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
// import bodyParser from "body-parser";
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ credentials: true, origin: "http://localhost:3000" }));
// app.use(express.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb" }));
app.use("/api/1", route_1.default);
const PORT = 4000;
app.listen(PORT, () => {
    console.log("Se ejecuto en el puerto: ", PORT);
});
