import express from "express";
import routes from "./route/route";
import cookieParser from "cookie-parser";
import "dotenv/config";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/1", routes);
const PORT = 4000;

app.listen(PORT, () => {
  console.log("Se ejecuto en el puerto: ", PORT);
});
