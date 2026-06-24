import {
  inputParaPessoaExtraRow,
  rowParaPessoaExtra,
} from '../lib/pessoaExtraMappers';
import { supabase } from '../lib/supabase';
import type { PessoaExtra, PessoaExtraInput } from '../types/pessoaExtra';
import type { PayloadSalvarPessoaForm } from '../types/funcionario';
import { authSession } from './authSession';
import { registrarAtividade } from './atividadesStorage';
import {
  excluirDocumentosPessoa,
  sincronizarDocumentosPessoa,
} from './pessoaDocumentosStorage';

function erroMensagem(erro: { message: string }, fallback: string): string {
  console.error('[extras]', erro.message);
  return fallback;
}

function empresaIdAtual(): string {
  const id = authSession.obter()?.empresaId;
  if (!id) {
    throw new Error('Empresa não identificada na sessão.');
  }
  return id;
}

function mensagemErroUnico(message: string): string | null {
  const msg = message.toLowerCase();
  if (msg.includes('unique') || msg.includes('duplicate')) {
    return 'Já existe um extra com este CPF nesta empresa.';
  }
  return null;
}

export const extrasStorage = {
  async listar(): Promise<PessoaExtra[]> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível carregar os extras.'),
      );
    }

    return (data ?? []).map(rowParaPessoaExtra);
  },

  async obter(id: string): Promise<PessoaExtra | undefined> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error || !data) return undefined;
    return rowParaPessoaExtra(data);
  },

  /** Cadastro mínimo (ex.: a partir do turno). */
  async criarSóNome(nome: string): Promise<PessoaExtra> {
    return this.criar({
      nome: nome.trim(),
      funcoesSecundarias: [],
    });
  },

  async criar(input: PessoaExtraInput): Promise<PessoaExtra> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('extras')
      .insert(inputParaPessoaExtraRow(empresaId, input))
      .select('*')
      .single();

    if (error || !data) {
      const duplicado = error ? mensagemErroUnico(error.message) : null;
      if (duplicado) throw new Error(duplicado);
      throw new Error(
        erroMensagem(
          error ?? { message: 'insert' },
          'Não foi possível cadastrar o extra.',
        ),
      );
    }

    const extra = rowParaPessoaExtra(data);
    registrarAtividade({
      acao: 'criou',
      modulo: 'extra',
      alvo: extra.nome,
    });
    return extra;
  },

  async atualizar(
    id: string,
    input: PessoaExtraInput,
  ): Promise<PessoaExtra | undefined> {
    const empresaId = empresaIdAtual();
    const row = inputParaPessoaExtraRow(empresaId, input);
    const { data, error } = await supabase
      .from('extras')
      .update({
        nome: row.nome,
        cpf: row.cpf,
        local_trabalho: row.local_trabalho,
        tipo_contrato: row.tipo_contrato,
        funcao_principal: row.funcao_principal,
        funcoes_secundarias: row.funcoes_secundarias,
        data_admissao: row.data_admissao,
        status: row.status,
        dia_folga_semanal: row.dia_folga_semanal,
        descricao: row.descricao,
        documentos: row.documentos,
        ausencias: row.ausencias,
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select('*')
      .single();

    if (error || !data) {
      const duplicado = error ? mensagemErroUnico(error.message) : null;
      if (duplicado) throw new Error(duplicado);
      if (error) {
        throw new Error(
          erroMensagem(error, 'Não foi possível salvar o extra.'),
        );
      }
      return undefined;
    }

    const extra = rowParaPessoaExtra(data);
    registrarAtividade({
      acao: 'editou',
      modulo: 'extra',
      alvo: extra.nome,
    });
    return extra;
  },

  async salvarComDocumentos(
    editando: PessoaExtra | undefined,
    payload: PayloadSalvarPessoaForm<PessoaExtraInput>,
  ): Promise<PessoaExtra> {
    if (editando) {
      const documentos = await sincronizarDocumentosPessoa({
        tipo: 'extra',
        pessoaId: editando.id,
        documentos: payload.input.documentos ?? [],
        arquivosPendentes: payload.arquivosPendentes,
        storagePathsRemovidos: payload.storagePathsRemovidos,
        documentosAnteriores: editando.documentos ?? [],
      });
      const atualizado = await this.atualizar(editando.id, {
        ...payload.input,
        documentos,
      });
      if (!atualizado) {
        throw new Error('Não foi possível salvar o extra.');
      }
      return atualizado;
    }

    const criado = await this.criar({
      ...payload.input,
      documentos: [],
    });
    const documentos = await sincronizarDocumentosPessoa({
      tipo: 'extra',
      pessoaId: criado.id,
      documentos: payload.input.documentos ?? [],
      arquivosPendentes: payload.arquivosPendentes,
      storagePathsRemovidos: payload.storagePathsRemovidos,
      documentosAnteriores: [],
    });

    if (documentos.length === 0) {
      return criado;
    }

    const atualizado = await this.atualizar(criado.id, {
      ...payload.input,
      documentos,
    });
    return atualizado ?? criado;
  },

  async excluir(id: string): Promise<boolean> {
    const empresaId = empresaIdAtual();
    const existente = await this.obter(id);
    if (existente) {
      await excluirDocumentosPessoa(existente.documentos);
    }
    const { error, count } = await supabase
      .from('extras')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível excluir o extra.'),
      );
    }

    if ((count ?? 0) > 0 && existente) {
      registrarAtividade({
        acao: 'excluiu',
        modulo: 'extra',
        alvo: existente.nome,
      });
    }

    return (count ?? 0) > 0;
  },
};
