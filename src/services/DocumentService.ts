import Document from '../models/document.ts';

export class DocumentService {
  static async getAllDocuments() {
    return await Document.findAll();
  }

  static async getDocumentById(id: number) {
    return await Document.findByPk(id);
  }

  static async createDocument(data: any) {
    return await Document.create(data);
  }

  static async updateDocument(id: number, data: any) {
    await Document.update(data, { where: { id } });
    return await Document.findByPk(id);
  }

  static async deleteDocument(id: number) {
    return await Document.destroy({ where: { id } });
  }
}
