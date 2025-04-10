// Cai nay thi t nghi nen tao file db roi import
import db from '../db';
import { Message } from '../models/Message';

export const createMessage = async (
  chatSessionId: number,
  sender: string,
  content: string,
): Promise<Message> => {
  const connection = await db.getConnection();
  try {
    const [result]: any = await connection.execute(
      'INSERT INTO message (chat_session_id, sender, content) VALUES (?, ?, ?)',
      [chatSessionId, sender, content],
    );

    const [rows] = await connection.execute(
      'SELECT id, chat_session_id, sender, content, created_at FROM message WHERE id = ?',
      [result.insertId],
    );
    const row = (rows as any[])[0];

    return {
      id: row.id,
      chatSessionId: row.chat_session_id,
      sender: row.sender,
      content: row.content,
      createdAt: new Date(row.created_at),
    };
  } finally {
    connection.release();
  }
};

export const getMessages = async (): Promise<Message[]> => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, chat_session_id, sender, content, created_at FROM message ORDER BY created_at DESC',
    );

    return (rows as any[]).map((row) => ({
      id: row.id,
      chatSessionId: row.chat_session_id,
      sender: row.sender,
      content: row.content,
      createdAt: new Date(row.created_at),
    }));
  } finally {
    connection.release();
  }
};

export const getMessageById = async (id: number): Promise<Message | null> => {
  const connection = db.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, chat_session_id, sender, content, created_at FROM message WHERE id = ?',
      [id],
    );
    const row = (rows as any[])[0];
    return row
      ? {
          id: row.id,
          chatSessionId: row.chat_session_id,
          sender: row.sender,
          content: row.content,
          createdAt: new Date(row.created_at),
        }
      : null;
  } finally {
    connection.release();
  }
};

export const deleteMessage = async (id: number): Promise<boolean> => {
  const connection = await db.getConnection();
  try {
    const [result]: any = await connection.execute(
      'DELETE FROM message WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};
