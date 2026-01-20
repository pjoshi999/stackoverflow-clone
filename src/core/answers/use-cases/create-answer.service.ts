import * as answerRepo from "../ports/answer.repository";
import { CreateAnswerDTO, Answer } from "../domain/answer.interface";

export const createAnswer = async (dto: CreateAnswerDTO): Promise<Answer> => {
  return await answerRepo.createAnswer(dto);
};
