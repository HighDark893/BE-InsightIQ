import { myDataSource } from '../config/database.config';
import { DocumentEntity } from '../entity/document.entity';

export class DocumentRepository {
  private readonly documentRepository =
    myDataSource.getRepository(DocumentEntity);

  public async save(document: DocumentEntity): Promise<DocumentEntity> {
    return await this.documentRepository.save(document);
  }

  public async findAll(): Promise<DocumentEntity[]> {
    return await this.documentRepository.find();
  }

  public async findByTenantId(tenantId: number): Promise<DocumentEntity[]> {
    return await this.documentRepository.find({
      where: { tenantId: tenantId },
    });
  }

  public async findById(id: number): Promise<DocumentEntity | null> {
    return await this.documentRepository.findOne({
      where: { id: id },
    });
  }
}
