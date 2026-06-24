import { supabase, supabaseConfigurado } from '../lib/supabase';
import type { DocumentoPdf } from '../types/funcionario';
import { authSession } from './authSession';

export const BUCKET_PESSOA_DOCUMENTOS = 'pessoa-documentos';
export const LIMITE_ARQUIVO_DOCUMENTO_BYTES = 10 * 1024 * 1024;
export const LIMITE_DOCUMENTOS_POR_PESSOA = 30;
const URL_ASSINADA_SEGUNDOS = 60 * 60;

export type TipoPessoaDocumento = 'funcionario' | 'extra';

export interface SincronizarDocumentosPessoaOpts {
  tipo: TipoPessoaDocumento;
  pessoaId: string;
  documentos: DocumentoPdf[];
  arquivosPendentes: Map<string, File>;
  storagePathsRemovidos: string[];
  documentosAnteriores: DocumentoPdf[];
}

function empresaIdAtual(): string {
  const id = authSession.obter()?.empresaId;
  if (!id) {
    throw new Error('Empresa não identificada na sessão.');
  }
  return id;
}

function pastaTipo(tipo: TipoPessoaDocumento): string {
  return tipo === 'funcionario' ? 'funcionarios' : 'extras';
}

function sanitizarNomeArquivo(nome: string): string {
  const base = nome.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_');
  return (base || 'arquivo').slice(0, 120);
}

export function montarStoragePathDocumento(
  empresaId: string,
  tipo: TipoPessoaDocumento,
  pessoaId: string,
  documentoId: string,
  nomeArquivo: string,
): string {
  return `${empresaId}/${pastaTipo(tipo)}/${pessoaId}/${documentoId}/${sanitizarNomeArquivo(nomeArquivo)}`;
}

function garantirSupabase(): void {
  if (!supabaseConfigurado) {
    throw new Error(
      'Armazenamento de documentos indisponível. Configure o Supabase no ambiente.',
    );
  }
}

export function validarArquivoDocumento(arquivo: File): string | null {
  if (arquivo.size > LIMITE_ARQUIVO_DOCUMENTO_BYTES) {
    return 'Arquivo muito grande (máx. 10 MB).';
  }
  return null;
}

async function uploadArquivo(
  storagePath: string,
  arquivo: File,
): Promise<void> {
  garantirSupabase();
  const { error } = await supabase.storage
    .from(BUCKET_PESSOA_DOCUMENTOS)
    .upload(storagePath, arquivo, {
      upsert: true,
      contentType: arquivo.type || undefined,
    });

  if (error) {
    console.error('[documentos] upload', error.message);
    throw new Error(`Não foi possível enviar "${arquivo.name}".`);
  }
}

async function excluirPaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  garantirSupabase();
  const unicos = [...new Set(paths.filter(Boolean))];
  const { error } = await supabase.storage
    .from(BUCKET_PESSOA_DOCUMENTOS)
    .remove(unicos);

  if (error) {
    console.error('[documentos] remove', error.message);
    throw new Error('Não foi possível remover um ou mais documentos.');
  }
}

export async function sincronizarDocumentosPessoa(
  opts: SincronizarDocumentosPessoaOpts,
): Promise<DocumentoPdf[]> {
  const empresaId = empresaIdAtual();
  const resultado: DocumentoPdf[] = [];

  for (const doc of opts.documentos) {
    const pendente = opts.arquivosPendentes.get(doc.id);
    if (pendente) {
      const erro = validarArquivoDocumento(pendente);
      if (erro) throw new Error(`${doc.nome}: ${erro}`);
      const storagePath = montarStoragePathDocumento(
        empresaId,
        opts.tipo,
        opts.pessoaId,
        doc.id,
        doc.nome,
      );
      await uploadArquivo(storagePath, pendente);
      resultado.push({
        ...doc,
        storagePath,
        mimeType: pendente.type || doc.mimeType,
        tamanho: pendente.size,
      });
      continue;
    }

    if (doc.storagePath) {
      resultado.push(doc);
    }
  }

  const pathsAtuais = new Set(
    resultado.map((d) => d.storagePath).filter(Boolean) as string[],
  );
  const pathsExcluir = new Set(opts.storagePathsRemovidos);

  for (const anterior of opts.documentosAnteriores) {
    if (anterior.storagePath && !pathsAtuais.has(anterior.storagePath)) {
      pathsExcluir.add(anterior.storagePath);
    }
  }

  await excluirPaths([...pathsExcluir]);
  return resultado;
}

export async function excluirDocumentosPessoa(
  documentos: DocumentoPdf[] | undefined,
): Promise<void> {
  const paths = (documentos ?? [])
    .map((d) => d.storagePath)
    .filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;
  try {
    await excluirPaths(paths);
  } catch {
    console.warn('[documentos] falha ao limpar arquivos ao excluir pessoa');
  }
}

export async function urlAssinadaDocumento(
  storagePath: string,
): Promise<string> {
  garantirSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET_PESSOA_DOCUMENTOS)
    .createSignedUrl(storagePath, URL_ASSINADA_SEGUNDOS);

  if (error || !data?.signedUrl) {
    console.error('[documentos] signed url', error?.message);
    throw new Error('Não foi possível abrir o documento.');
  }

  return data.signedUrl;
}
