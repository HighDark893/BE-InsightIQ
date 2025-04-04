export class Document {
  id: number;
  tenantId: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;

  constructor(id: number, tenantId: number, fileName: string, fileUrl: string) {
    this.id = id;
    this.tenantId = tenantId;
    this.fileName = fileName;
    this.fileUrl = fileUrl;
    this.uploadedAt = new Date();
  }
}
