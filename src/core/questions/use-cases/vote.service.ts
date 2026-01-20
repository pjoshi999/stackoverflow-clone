import * as voteRepo from "../ports/vote.repository";
import * as questionRepo from "../ports/question.repository";
import * as answerRepo from "../../answers/ports/answer.repository";
import { VoteType, VotableType } from "../domain/question.interface";

export const vote = async (
  userId: number,
  votableType: VotableType,
  votableId: number,
  voteType: VoteType,
): Promise<void> => {
  // Prevent self-voting
  let ownerId: number;

  if (votableType === "question") {
    const question = await questionRepo.findQuestionById(votableId);
    if (!question) throw new Error("Question not found");
    ownerId = question.user_id;
  } else {
    // Answer
    const answer = await answerRepo.findAnswerById(votableId);
    if (!answer) throw new Error("Answer not found");
    ownerId = answer.user_id;
  }

  if (ownerId === userId) {
    throw new Error("Cannot vote on your own content");
  }

  const existingVote = await voteRepo.findVoteByUserAndVotable(
    userId,
    votableType,
    votableId,
  );

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      await voteRepo.deleteVote(existingVote.id);
    } else {
      await voteRepo.updateVote(existingVote.id, voteType);
    }
  } else {
    await voteRepo.createVote(
      userId,
      votableType,
      votableId,
      voteType,
      ownerId,
    );
  }
};
