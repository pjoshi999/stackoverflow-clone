import * as authController from "./controllers/auth.controller";
import * as questionsController from "./controllers/questions.controller";
import * as answersController from "./controllers/answers.controller";
import * as commentsController from "./controllers/comments.controller";
import * as usersController from "./controllers/users.controller";

export const controllers = {
  auth: authController,
  questions: questionsController,
  answers: answersController,
  comments: commentsController,
  users: usersController,
};
