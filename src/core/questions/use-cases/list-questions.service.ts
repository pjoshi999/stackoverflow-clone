import * as questionRepo from "../ports/question.repository";
import { SearchQuestionQuery } from "../domain/question.interface";

export const listQuestions = async (
  query: SearchQuestionQuery,
  userId?: number,
) => {
  return await questionRepo.listQuestions(query, userId);
};
