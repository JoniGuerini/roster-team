import {
  inputParaFuncionarioRow,
  rowParaFuncionario,
} from '../lib/funcionarioMappers';
import { supabase } from '../lib/supabase';
import type { Funcionario, FuncionarioInput } from '../types/funcionario';
import { authSession } from './authSession';
import { registrarAtividade } from './atividadesStorage';

function erroMensagem(erro: { message: string }, fallback: string): string {
  console.error('[funcionarios]', erro.message);
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
    return 'Já existe um funcionário com este CPF nesta empresa.';
  }
  return null;
}

export const funcionariosStorage = {
  async listar(): Promise<Funcionario[]> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível carregar os funcionários.'),
      );
    }

    return (data ?? []).map(rowParaFuncionario);
  },

  async obter(id: string): Promise<Funcionario | undefined> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error || !data) return undefined;
    return rowParaFuncionario(data);
  },

  async criar(input: FuncionarioInput): Promise<Funcionario> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('funcionarios')
      .insert(inputParaFuncionarioRow(empresaId, input))
      .select('*')
      .single();

    if (error || !data) {
      const duplicado = error ? mensagemErroUnico(error.message) : null;
      if (duplicado) throw new Error(duplicado);
      throw new Error(
        erroMensagem(
          error ?? { message: 'insert' },
          'Não foi possível cadastrar o funcionário.',
        ),
      );
    }

    const funcionario = rowParaFuncionario(data);
    registrarAtividade({
      acao: 'criou',
      modulo: 'funcionario',
      alvo: funcionario.nome,
    });
    return funcionario;
  },

  async atualizar(
    id: string,
    input: FuncionarioInput,
  ): Promise<Funcionario | undefined> {
    const empresaId = empresaIdAtual();
    const row = inputParaFuncionarioRow(empresaId, input);
    const { data, error } = await supabase
      .from('funcionarios')
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
          erroMensagem(error, 'Não foi possível salvar o funcionário.'),
        );
      }
      return undefined;
    }

    const funcionario = rowParaFuncionario(data);
    registrarAtividade({
      acao: 'editou',
      modulo: 'funcionario',
      alvo: funcionario.nome,
    });
    return funcionario;
  },

  async excluir(id: string): Promise<boolean> {
    const empresaId = empresaIdAtual();
    const existente = await this.obter(id);
    const { error, count } = await supabase
      .from('funcionarios')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível excluir o funcionário.'),
      );
    }

    if ((count ?? 0) > 0 && existente) {
      registrarAtividade({
        acao: 'excluiu',
        modulo: 'funcionario',
        alvo: existente.nome,
      });
    }

    return (count ?? 0) > 0;
  },
};
