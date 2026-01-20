import * as questionRepo from "../ports/question.repository";

export const getQuestionDetails = async (
  questionId: number,
  userId?: number,
) => {
  return await questionRepo.findQuestionById(questionId, userId);
};
