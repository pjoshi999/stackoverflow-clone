import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./interfaces/http/routes/auth.routes";
import questionsRoutes from "./interfaces/http/routes/questions.routes";
import answersRoutes from "./interfaces/http/routes/answers.routes";
import commentsRoutes from "./interfaces/http/routes/comments.routes";
import usersRoutes from "./interfaces/http/routes/users.routes";
import { errorHandler } from "./interfaces/http/middlewares/error.middleware";
import { appConfig } from "./config/env";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/questions", questionsRoutes);
app.use("/api/v1/answers", answersRoutes);
app.use("/api/v1/comments", commentsRoutes);
app.use("/api/v1/users", usersRoutes);

app.use(errorHandler);

app.listen(appConfig.port, () => {
  console.log(`Server running on port ${appConfig.port}`);
  console.log(`Environment: ${appConfig.env}`);
});

export default app;
