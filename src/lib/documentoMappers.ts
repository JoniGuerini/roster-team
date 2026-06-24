import type { DocumentoPdf } from '../types/funcionario';

export function mapDocumentos(valor: unknown): DocumentoPdf[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(
      (d): d is DocumentoPdf =>
        typeof d === 'object' &&
        d !== null &&
        typeof (d as DocumentoPdf).id === 'string' &&
        typeof (d as DocumentoPdf).nome === 'string',
    )
    .map((d) => ({
      id: d.id,
      nome: d.nome,
      tamanho: typeof d.tamanho === 'number' ? d.tamanho : 0,
      dataUpload:
        typeof d.dataUpload === 'string'
          ? d.dataUpload
          : new Date().toISOString(),
      storagePath:
        typeof d.storagePath === 'string' ? d.storagePath : undefined,
      mimeType: typeof d.mimeType === 'string' ? d.mimeType : undefined,
    }));
}
