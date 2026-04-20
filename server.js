import express from "express";
import cors from "cors";
import routes from "./src/routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
// export default app;