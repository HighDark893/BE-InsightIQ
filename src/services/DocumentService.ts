import { DocumentDto } from '../dto/document.dto';
import { CreateDocumentDto } from '../dto/createDocument.dto';
import { DocumentEntity } from '../entity/document.entity';
import { DocumentRepository } from '../repository/document.repository';

export class DocumentService {
  private readonly documentRepository = new DocumentRepository();

  public async create(
    createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentDto> {
    const documentEntity = new DocumentEntity();

    documentEntity.fileName = createDocumentDto.fileName;
    documentEntity.fileUrl = createDocumentDto.fileUrl;
    documentEntity.tenantId = createDocumentDto.tenantId;

    const savedDocumentEntity =
      await this.documentRepository.save(documentEntity);

    return this.mapDocumentEntityToDto(savedDocumentEntity);
  }

  private mapDocumentEntityToDto(entity: DocumentEntity): DocumentDto {
    const documentDto = new DocumentDto();

    documentDto.fileName = entity.fileName;
    documentDto.fileUrl = entity.fileUrl;
    documentDto.tenantId = entity.tenantId;
    documentDto.createdAt =
      entity.createdAt.toTimeString() + entity.createdAt.toDateString();

    return documentDto;
  }
}
