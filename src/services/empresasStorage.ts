import {
  RECURSOS_PADRAO,
  type Empresa,
  type EmpresaInput,
  type RecursoEmpresa,
} from '../types/empresa';
import { supabase } from '../lib/supabase';
import { inputParaRow, rowParaEmpresa } from '../lib/empresaMappers';

const ATIVA_KEY = 'roster-team:empresa-ativa';
/** Preferência do admin da plataforma: qual empresa está selecionada no painel. */

export const EVENTO_EMPRESAS = 'brisa:empresas';

function notificar(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTO_EMPRESAS));
  }
}

function erroMensagem(erro: { message: string }): string {
  console.error('[empresas]', erro.message);
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export const empresasStorage = {
  async listar(): Promise<Empresa[]> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw new Error(erroMensagem(error));
    return (data ?? []).map(rowParaEmpresa);
  },

  async obter(id: string): Promise<Empresa | undefined> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(erroMensagem(error));
    return data ? rowParaEmpresa(data) : undefined;
  },

  async criar(input: EmpresaInput): Promise<Empresa> {
    const { data, error } = await supabase
      .from('empresas')
      .insert({
        ...inputParaRow(input),
        recursos: { ...RECURSOS_PADRAO },
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(erroMensagem(error ?? { message: 'insert' }));
    notificar();
    return rowParaEmpresa(data);
  },

  async atualizar(id: string, input: EmpresaInput): Promise<Empresa> {
    const { data, error } = await supabase
      .from('empresas')
      .update(inputParaRow(input))
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error(erroMensagem(error ?? { message: 'update' }));
    notificar();
    return rowParaEmpresa(data);
  },

  async atualizarRecurso(
    id: string,
    recurso: RecursoEmpresa,
    ativo: boolean,
  ): Promise<Empresa> {
    const atual = await this.obter(id);
    if (!atual) throw new Error('Empresa não encontrada.');

    const recursos = { ...atual.recursos, [recurso]: ativo };
    const { data, error } = await supabase
      .from('empresas')
      .update({ recursos })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new Error(erroMensagem(error ?? { message: 'recurso' }));
    notificar();
    return rowParaEmpresa(data);
  },

  async excluir(id: string): Promise<boolean> {
    const { error, count } = await supabase
      .from('empresas')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw new Error(erroMensagem(error));
    if (!count) return false;

    if (this.obterAtivaId() === id) {
      const restantes = await this.listar();
      const proxima = restantes[0]?.id ?? null;
      if (proxima) localStorage.setItem(ATIVA_KEY, proxima);
      else localStorage.removeItem(ATIVA_KEY);
    }
    notificar();
    return true;
  },

  obterAtivaId(): string | null {
    return localStorage.getItem(ATIVA_KEY);
  },

  async obterAtiva(): Promise<Empresa | undefined> {
    const lista = await this.listar();
    const id = this.obterAtivaId();
    return lista.find((e) => e.id === id) ?? lista[0];
  },

  definirAtiva(id: string): void {
    localStorage.setItem(ATIVA_KEY, id);
    notificar();
  },
};
