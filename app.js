const express = require("express");
require("express-async-errors");
const cookieParser = require("cookie-parser");

const app = express();
const port = 3000;

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/users");
const postsRouter = require("./routes/posts");

const { errorHandler } = require("./middlewares/errorHandler");

const { sequelize } = require("./models/index");

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(express.json());
app.use(cookieParser());

app.use("/api", [indexRouter, authRouter, postsRouter]);

// 위의 라우터/미들웨어에서 error가 던져졌다면 errorHandler에서 error 처리
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
