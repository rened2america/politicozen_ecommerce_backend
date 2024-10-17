import express from "express";
import routes from "./route/route";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import cron from 'node-cron';
import productDAO from "./modules/product/productDAO";
// import bodyParser from "body-parser";
const app = express();

app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://politicozen-dashboard-frontend-p5fagpv5f-rened2america.vercel.app",
      "https://frontend-politicozen-renemeza.vercel.app",
      "https://politicozen-dev-frontend.vercel.app",
      "https://beta.politicozen.com/",
      "https://beta.politicozen.com",
      "http://beta.politicozen.com",
      "https://www.politicozen.com/",
      "https://www.politicozen.com",
      "http://www.politicozen.com",
      "https://app.politicozen.com/",
      "https://app.politicozen.com",
      "http://app.politicozen.com",
    ],
  })
);
// app.use(express.json());
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use("/api/1", routes);
const PORT = 4000;

cron.schedule('0 0 */2 * *', productDAO.generateRandomArt);

app.listen(PORT, () => {
  console.log("Server running on PORT: ", PORT);
});
