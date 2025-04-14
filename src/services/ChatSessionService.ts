// Cai nay thi t nghi nen tao file db roi import
import db from '../db';
import { ChatSession } from '../models/ChatSession';

export const createChatSession = async (
  userChatbotId: number,
  tenantId: number,
  sessionToken: string,
): Promise<ChatSession> => {
  const connection = await db.getConnection();
  try {
    const [result]: any = await connection.execute(
      'INSERT INTO chat_session (user_chatbot_id, tenant_id, session_token) VALUES (?, ?, ?)',
      [userChatbotId, tenantId, sessionToken],
    );

    const [rows] = await connection.execute(
      'SELECT id, user_chatbot_id, tenant_id, session_token, created_at FROM chat_session WHERE id = ?',
      [result.insertId],
    );
    const row = (rows as any[])[0];

    return {
      id: row.id,
      userChatbotId: row.user_chatbot_id,
      tenantId: row.tenant_id,
      sessionToken: row.session_token,
      createdAt: new Date(row.created_at),
    };
  } finally {
    connection.release();
  }
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, user_chatbot_id, tenant_id, session_token, created_at FROM chat_session ORDER BY created_at DESC',
    );

    return (rows as any[]).map((row) => ({
      id: row.id,
      userChatbotId: row.user_chatbot_id,
      tenantId: row.tenant_id,
      sessionToken: row.session_token,
      createdAt: new Date(row.created_at),
    }));
  } finally {
    connection.release();
  }
};

export const getChatSessionById = async (
  id: number,
): Promise<ChatSession | null> => {
  const connection = db.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, user_chatbot_id, tenant_id, session_token, created_at FROM chat_session WHERE id = ?',
      [id],
    );
    const row = (rows as any[])[0];
    return row
      ? {
          id: row.id,
          userChatbotId: row.user_chatbot_id,
          tenantId: row.tenant_id,
          sessionToken: row.session_token,
          createdAt: new Date(row.created_at),
        }
      : null;
  } finally {
    connection.release();
  }
};

export const deleteChatSession = async (id: number): Promise<boolean> => {
  const connection = await db.getConnection();
  try {
    const [result]: any = await connection.execute(
      'DELETE FROM chat_session WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};
