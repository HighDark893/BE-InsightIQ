// Cai nay thi t nghi nen tao file db roi import
import db from '../db';
import { Feedback } from '../models/Feedback';

export const createFeedback = async (
  chatSessionId: number,
  rating: string,
  comment: string,
): Promise<Feedback> => {
  const connection = await db.getConnection();
  try {
    const [result]: any = await connection.execute(
      'INSERT INTO feedback (chat_session_id, rating, comment) VALUES (?, ?, ?)',
      [chatSessionId, rating, comment],
    );

    const [rows] = await connection.execute(
      'SELECT id, chat_session_id, rating, comment, created_at FROM feedback WHERE id = ?',
      [result.insertId],
    );
    const row = (rows as any[])[0];

    return {
      id: row.id,
      chatSessionId: row.chat_session_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: new Date(row.created_at),
    };
  } finally {
    connection.release();
  }
};

export const getFeedbacks = async (): Promise<Feedback[]> => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, chat_session_id, rating, comment, created_at FROM feedback ORDER BY created_at DESC',
    );

    return (rows as any[]).map((row) => ({
      id: row.id,
      chatSessionId: row.chat_session_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: new Date(row.created_at),
    }));
  } finally {
    connection.release();
  }
};

export const getFeedbackById = async (id: number): Promise<Feedback | null> => {
  const connection = db.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, chat_session_id, rating, comment, created_at FROM chat_session WHERE id = ?',
      [id],
    );
    const row = (rows as any[])[0];
    return row
      ? {
          id: row.id,
          chatSessionId: row.chat_session_id,
          rating: row.rating,
          comment: row.comment,
          createdAt: new Date(row.created_at),
        }
      : null;
  } finally {
    connection.release();
  }
};

export const deleteFeedback = async (id: number): Promise<boolean> => {
  const connection = await db.getConnection();
  try {
    const [result]: any = await connection.execute(
      'DELETE FROM feedback WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};
