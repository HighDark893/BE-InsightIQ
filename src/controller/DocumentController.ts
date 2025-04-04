import { Request, Response } from "express";
import { DocumentService } from "../services/DocumentService";

export class DocumentController {
  static async getAll(req: Request, res: Response) {
    const documents = await DocumentService.getAllDocuments();
    res.json(documents);
  }

  static async getById(req: Request, res: Response) {
    const document = await DocumentService.getDocumentById(
      Number(req.params.id)
    );
    document
      ? res.json(document)
      : res.status(404).json({ message: "Not found" });
  }

  static async create(req: Request, res: Response) {
    const document = await DocumentService.createDocument(req.body);
    res.status(201).json(document);
  }

  static async update(req: Request, res: Response) {
    const document = await DocumentService.updateDocument(
      Number(req.params.id),
      req.body
    );
    res.json(document);
  }

  static async delete(req: Request, res: Response) {
    await DocumentService.deleteDocument(Number(req.params.id));
    res.json({ message: "Deleted successfully" });
  }
}
