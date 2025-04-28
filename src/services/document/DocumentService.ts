// src/services/document/DocumentService.ts

import { DocumentDto } from '../../dto/document.dto';
import { CreateDocumentDto } from '../../dto/createDocument.dto';
import { DocumentEntity } from '../../entity/document.entity';
import { DocumentRepository } from '../../repository/document.repository';

export class DocumentService {
  private readonly documentRepository = new DocumentRepository();

  // Hàm create này vẫn giữ nguyên, hữu ích nếu bạn chỉ muốn tạo record DB
  // mà không cần upload file (ví dụ: link file đã có sẵn từ nguồn khác)
  public async create(
    createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentDto> {
    const documentEntity = new DocumentEntity();
    documentEntity.fileName = createDocumentDto.fileName;
    documentEntity.fileUrl = createDocumentDto.fileUrl;
    documentEntity.tenantId = createDocumentDto.tenantId;
    const savedDocumentEntity = await this.documentRepository.save(documentEntity);
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

  // --- Hàm delete giữ nguyên như ban đầu (không gọi UploadService) ---
  // Logic xóa file Supabase sẽ nằm trong Service Delete riêng của bạn
  public async delete(id: number): Promise<boolean> {
    const documentEntity = await this.documentRepository.findById(id);
    if (!documentEntity) {
      return false;
    }
    // Chỉ xóa record trong DB
    await this.documentRepository.remove(documentEntity); // Thêm await
    return true;
  }

  // Hàm map giữ nguyên (đã sửa format createdAt)
  private mapDocumentEntityToDto(entity: DocumentEntity): DocumentDto {
    const documentDto = new DocumentDto();
    documentDto.id = entity.id;
    documentDto.fileName = entity.fileName;
    documentDto.fileUrl = entity.fileUrl;
    documentDto.tenantId = entity.tenantId;
    // Đảm bảo format ngày tháng chuẩn
    documentDto.createdAt = entity.createdAt ? entity.createdAt.toISOString() : new Date().toISOString();
    return documentDto;
  }
}
