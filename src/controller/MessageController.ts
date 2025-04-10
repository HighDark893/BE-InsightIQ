import { Request, Response } from 'express';
import { MessageService } from '../services/MessageService';

const messageService = new MessageService();

export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await messageService.getAllMessages();
    res.json(messageService);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error });
  }
};

export const getMessage = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const message = await messageService.getMessageById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch message', error });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { userChatbotId, tenantId, sender, content } = req.body;

    if (
      typeof userChatbotId !== 'number' ||
      typeof tenantId !== 'number' ||
      typeof sender !== 'string' ||
      typeof content !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const message = await messageService.createChatSession(
      userChatbotId,
      tenantId,
      sender,
      content,
    );
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat session', error });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await messageService.deleteMessage(id);
    if (!success) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message', error });
  }
};
