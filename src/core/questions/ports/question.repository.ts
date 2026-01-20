import pool from "../../../infrastructure/db/db";
import {
  cacheGet,
  cacheSet,
  cacheInvalidatePattern,
} from "../../../infrastructure/cache";
import {
  Question,
  QuestionWithDetails,
  CreateQuestionDTO,
  SearchQuestionQuery,
} from "../domain/question.interface";

export const createQuestion = async (
  dto: CreateQuestionDTO,
): Promise<Question> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const questionResult = await client.query<Question>(
      "INSERT INTO questions (user_id, title, body) VALUES ($1, $2, $3) RETURNING *",
      [dto.userId, dto.title, dto.body],
    );

    const question = questionResult.rows[0];

    for (const tagName of dto.tags) {
      let tagResult = await client.query(
        "SELECT id FROM tags WHERE name = $1",
        [tagName.toLowerCase()],
      );

      let tagId: number;
      if (tagResult.rows.length === 0) {
        const newTag = await client.query(
          "INSERT INTO tags (name) VALUES ($1) RETURNING id",
          [tagName.toLowerCase()],
        );
        tagId = newTag.rows[0].id;
      } else {
        tagId = tagResult.rows[0].id;
      }

      await client.query(
        "INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2)",
        [question.id, tagId],
      );
    }

    await client.query("COMMIT");
    await cacheInvalidatePattern("questions:*");

    return question;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findQuestionById = async (
  questionId: number,
  userId?: number,
): Promise<QuestionWithDetails | null> => {
  await pool.query("UPDATE questions SET views = views + 1 WHERE id = $1", [
    questionId,
  ]);

  const queryText = `
    WITH question_data AS (
      SELECT 
        q.id, q.title, q.body, q.views, q.created_at, q.updated_at, q.user_id,
        u.username,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) 
          FILTER (WHERE t.id IS NOT NULL), '[]'::jsonb
        ) as tags,
        COALESCE(SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 WHEN v.vote_type = 'downvote' THEN -1 ELSE 0 END), 0) as vote_count
        ${userId ? `, MAX(CASE WHEN v.user_id = ${userId} THEN v.vote_type::text ELSE NULL END) as user_vote` : ""}
      FROM questions q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN question_tags qt ON q.id = qt.question_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      LEFT JOIN votes v ON q.id = v.votable_id AND v.votable_type = 'question'
      WHERE q.id = $1
      GROUP BY q.id, u.username
    ),
    answers_data AS (
      SELECT 
        a.id, a.body, a.is_accepted, a.created_at, a.updated_at, a.user_id,
        u.username,
        COALESCE(SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 WHEN v.vote_type = 'downvote' THEN -1 ELSE 0 END), 0) as vote_count
        ${userId ? `, MAX(CASE WHEN v.user_id = ${userId} THEN v.vote_type::text ELSE NULL END) as user_vote` : ""}
      FROM answers a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN votes v ON a.id = v.votable_id AND v.votable_type = 'answer'
      WHERE a.question_id = $1
      GROUP BY a.id, u.username
      ORDER BY a.is_accepted DESC, vote_count DESC, a.created_at ASC
    ),
    comments_data AS (
      SELECT 
        c.id, c.commentable_type, c.commentable_id, c.body, c.created_at, c.user_id,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE (c.commentable_type = 'question' AND c.commentable_id = $1)
         OR (c.commentable_type = 'answer' AND c.commentable_id IN (
           SELECT id FROM answers WHERE question_id = $1
         ))
      ORDER BY c.created_at ASC
    )
    SELECT 
      qd.*,
      COALESCE(json_agg(DISTINCT ad.*) FILTER (WHERE ad.id IS NOT NULL), '[]') as answers,
      COALESCE(json_agg(DISTINCT cd.*) FILTER (WHERE cd.id IS NOT NULL), '[]') as all_comments
    FROM question_data qd
    LEFT JOIN answers_data ad ON true
    LEFT JOIN comments_data cd ON true
    GROUP BY qd.id, qd.title, qd.body, qd.views, qd.created_at, qd.updated_at, qd.user_id,
             qd.username, qd.tags, qd.vote_count${userId ? ", qd.user_vote" : ""}
  `;

  const result = await pool.query(queryText, [questionId]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const questionComments = row.all_comments.filter(
    (c: any) => c.commentable_type === "question",
  );

  const answers = row.answers.map((a: any) => ({
    ...a,
    comments: row.all_comments.filter(
      (c: any) => c.commentable_type === "answer" && c.commentable_id === a.id,
    ),
  }));

  delete row.all_comments;

  return {
    ...row,
    comments: questionComments,
    answers,
  };
};

export const listQuestions = async (
  query: SearchQuestionQuery,
  userId?: number,
) => {
  const { q, tags, page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const cacheKey = `questions:${q || ""}:${tags || ""}:${page}:${limit}:${userId || "anon"}`;
  const cached = await cacheGet<{
    questions: QuestionWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }>(cacheKey);

  if (cached) return cached;

  let whereClause = "";
  const params: any[] = [];
  let paramCount = 0;

  if (q) {
    paramCount++;
    whereClause = `WHERE q.search_vector @@ plainto_tsquery('english', $${paramCount})`;
    params.push(q);
  }

  if (tags) {
    const tagArray = tags.split(",").map((t) => t.trim().toLowerCase());
    paramCount++;
    const tagCondition = q ? "AND" : "WHERE";
    whereClause += ` ${tagCondition} EXISTS (
      SELECT 1 FROM question_tags qt
      JOIN tags t ON qt.tag_id = t.id
      WHERE qt.question_id = q.id AND t.name = ANY($${paramCount})
    )`;
    params.push(tagArray);
  }

  const rankClause = q
    ? `, ts_rank(q.search_vector, plainto_tsquery('english', $1)) as rank`
    : "";
  const orderClause = q
    ? "ORDER BY rank DESC, q.created_at DESC"
    : "ORDER BY q.created_at DESC";

  paramCount++;
  params.push(limit);
  paramCount++;
  params.push(offset);

  const queryText = `
    SELECT 
      q.id, q.title, q.body, q.views, q.created_at, q.updated_at,
      u.username,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) 
        FILTER (WHERE t.id IS NOT NULL), '[]'
      ) as tags,
      COUNT(DISTINCT a.id) as answer_count,
      COALESCE(SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 WHEN v.vote_type = 'downvote' THEN -1 ELSE 0 END), 0) as vote_count
      ${userId ? `, MAX(CASE WHEN v.user_id = ${userId} THEN v.vote_type::text ELSE NULL END) as user_vote` : ""}
      ${rankClause}
    FROM questions q
    JOIN users u ON q.user_id = u.id
    LEFT JOIN question_tags qt ON q.id = qt.question_id
    LEFT JOIN tags t ON qt.tag_id = t.id
    LEFT JOIN answers a ON q.id = a.question_id
    LEFT JOIN votes v ON q.id = v.votable_id AND v.votable_type = 'question'
    ${whereClause}
    GROUP BY q.id, u.username
    ${orderClause}
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT q.id) as total
    FROM questions q
    LEFT JOIN question_tags qt ON q.id = qt.question_id
    LEFT JOIN tags t ON qt.tag_id = t.id
    ${whereClause}
  `;

  const [dataResult, countResult] = await Promise.all([
    pool.query(queryText, params),
    pool.query(countQuery, params.slice(0, -2)),
  ]);

  const result = {
    questions: dataResult.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    totalPages: Math.ceil(countResult.rows[0].total / limit),
  };

  await cacheSet(cacheKey, result);
  return result;
};
