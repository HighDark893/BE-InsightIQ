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

  public async getAll(): Promise<DocumentDto[]> {
    const documentEntities = await this.documentRepository.findAll();
    const documentDtos: DocumentDto[] = [];

    documentEntities.forEach((d) => {
      documentDtos.push(this.mapDocumentEntityToDto(d));
    });

    return documentDtos;
  }

  public async getById(id: number): Promise<DocumentDto | null> {
    const documentEntity = await this.documentRepository.findById(id);

    if (!documentEntity) {
      return null;
    }

    return this.mapDocumentEntityToDto(documentEntity);
  }

  public async getByTenantId(tenantId: number): Promise<DocumentDto[]> {
    const documentEntities =
      await this.documentRepository.findByTenantId(tenantId);
    const documentDtos: DocumentDto[] = [];

    documentEntities.forEach((d) => {
      documentDtos.push(this.mapDocumentEntityToDto(d));
    });

    return documentDtos;
  }

  public async delete(id: number): Promise<Boolean> {
    const documentEntity = await this.documentRepository.findById(id);

    if (!documentEntity) {
      return false;
    }

    this.documentRepository.remove(documentEntity);
    return true;
  }

  private mapDocumentEntityToDto(entity: DocumentEntity): DocumentDto {
    const documentDto = new DocumentDto();

    documentDto.id = entity.id;
    documentDto.fileName = entity.fileName;
    documentDto.fileUrl = entity.fileUrl;
    documentDto.tenantId = entity.tenantId;
    documentDto.createdAt =
      entity.createdAt.toTimeString() + entity.createdAt.toDateString();

    return documentDto;
  }
}
