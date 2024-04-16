import express from "express"
import bodyParser from "body-parser";
import cors from "cors";
import Router from "./routes.js";
const app = express();
const port = 3000;


app.use(bodyParser.json());

app.use(cors());

app.use(Router);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});