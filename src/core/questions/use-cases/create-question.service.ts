import * as questionRepo from "../ports/question.repository";
import { Question, CreateQuestionDTO } from "../domain/question.interface";

export const createQuestion = async (
  dto: CreateQuestionDTO,
): Promise<Question> => {
  return await questionRepo.createQuestion(dto);
};
