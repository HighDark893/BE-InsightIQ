import { myDataSource } from '../config/database.config';
import { DocumentEntity } from '../entity/document.entity';

export class DocumentRepository {
  private readonly documentRepository =
    myDataSource.getRepository(DocumentEntity);

  public async save(document: DocumentEntity): Promise<DocumentEntity> {
    return await this.documentRepository.save(document);
  }
}
