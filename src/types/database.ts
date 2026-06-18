/**
 * Tipos gerados manualmente para a Fase 1.
 * Depois de rodar as migrations, você pode substituir por:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome: string;
          segmento: string;
          logo_url: string | null;
          cor_primaria: string;
          owner_nome: string;
          owner_email: string;
          status: string;
          recursos: Json;
          criada_em: string;
          atualizada_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          segmento?: string;
          logo_url?: string | null;
          cor_primaria?: string;
          owner_nome: string;
          owner_email: string;
          status?: string;
          recursos?: Json;
          criada_em?: string;
          atualizada_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          segmento?: string;
          logo_url?: string | null;
          cor_primaria?: string;
          owner_nome?: string;
          owner_email?: string;
          status?: string;
          recursos?: Json;
          criada_em?: string;
          atualizada_em?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          nome: string;
          email: string;
          empresa_id: string | null;
          is_platform_admin: boolean;
          papel: string | null;
          permissoes: Json;
          perfil_acesso_id: string | null;
          status: string;
          ultimo_acesso: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id: string;
          nome: string;
          email: string;
          empresa_id?: string | null;
          is_platform_admin?: boolean;
          papel?: string | null;
          permissoes?: Json;
          perfil_acesso_id?: string | null;
          status?: string;
          ultimo_acesso?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          empresa_id?: string | null;
          is_platform_admin?: boolean;
          papel?: string | null;
          permissoes?: Json;
          perfil_acesso_id?: string | null;
          status?: string;
          ultimo_acesso?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_perfil_acesso_id_fkey';
            columns: ['perfil_acesso_id'];
            isOneToOne: false;
            referencedRelation: 'perfis_acesso';
            referencedColumns: ['id'];
          },
        ];
      };
      funcionarios: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          profile_id: string | null;
          cpf: string | null;
          local_trabalho: string | null;
          tipo_contrato: string | null;
          funcao_principal: string | null;
          funcoes_secundarias: Json;
          data_admissao: string | null;
          status: string | null;
          dia_folga_semanal: number | null;
          descricao: string | null;
          documentos: Json;
          ausencias: Json;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          profile_id?: string | null;
          cpf?: string | null;
          local_trabalho?: string | null;
          tipo_contrato?: string | null;
          funcao_principal?: string | null;
          funcoes_secundarias?: Json;
          data_admissao?: string | null;
          status?: string | null;
          dia_folga_semanal?: number | null;
          descricao?: string | null;
          documentos?: Json;
          ausencias?: Json;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          profile_id?: string | null;
          cpf?: string | null;
          local_trabalho?: string | null;
          tipo_contrato?: string | null;
          funcao_principal?: string | null;
          funcoes_secundarias?: Json;
          data_admissao?: string | null;
          status?: string | null;
          dia_folga_semanal?: number | null;
          descricao?: string | null;
          documentos?: Json;
          ausencias?: Json;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'funcionarios_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'funcionarios_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      extras: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          cpf: string | null;
          local_trabalho: string | null;
          tipo_contrato: string | null;
          funcao_principal: string | null;
          funcoes_secundarias: Json;
          data_admissao: string | null;
          status: string | null;
          dia_folga_semanal: number | null;
          descricao: string | null;
          documentos: Json;
          ausencias: Json;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          cpf?: string | null;
          local_trabalho?: string | null;
          tipo_contrato?: string | null;
          funcao_principal?: string | null;
          funcoes_secundarias?: Json;
          data_admissao?: string | null;
          status?: string | null;
          dia_folga_semanal?: number | null;
          descricao?: string | null;
          documentos?: Json;
          ausencias?: Json;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          cpf?: string | null;
          local_trabalho?: string | null;
          tipo_contrato?: string | null;
          funcao_principal?: string | null;
          funcoes_secundarias?: Json;
          data_admissao?: string | null;
          status?: string | null;
          dia_folga_semanal?: number | null;
          descricao?: string | null;
          documentos?: Json;
          ausencias?: Json;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'extras_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      turnos: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          tipo: string;
          categoria: string;
          local_trabalho: string;
          hora_inicio: string;
          hora_fim: string;
          dia_semana_recorrente: number | null;
          necessidades: Json;
          funcionarios_sugeridos: Json;
          sugestoes_por_funcao: Json | null;
          observacoes: string | null;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          tipo: string;
          categoria: string;
          local_trabalho: string;
          hora_inicio: string;
          hora_fim: string;
          dia_semana_recorrente?: number | null;
          necessidades?: Json;
          funcionarios_sugeridos?: Json;
          sugestoes_por_funcao?: Json | null;
          observacoes?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          tipo?: string;
          categoria?: string;
          local_trabalho?: string;
          hora_inicio?: string;
          hora_fim?: string;
          dia_semana_recorrente?: number | null;
          necessidades?: Json;
          funcionarios_sugeridos?: Json;
          sugestoes_por_funcao?: Json | null;
          observacoes?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'turnos_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      escala_turnos: {
        Row: {
          id: string;
          empresa_id: string;
          data: string;
          turno_id: string;
          alocacoes: Json;
          observacao: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          data: string;
          turno_id: string;
          alocacoes?: Json;
          observacao?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          data?: string;
          turno_id?: string;
          alocacoes?: Json;
          observacao?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'escala_turnos_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'escala_turnos_turno_id_fkey';
            columns: ['turno_id'];
            isOneToOne: false;
            referencedRelation: 'turnos';
            referencedColumns: ['id'];
          },
        ];
      };
      atividades: {
        Row: {
          id: string;
          empresa_id: string;
          autor_profile_id: string | null;
          autor_nome: string;
          autor_papel: string | null;
          acao: string;
          modulo: string;
          alvo: string;
          detalhe: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          autor_profile_id?: string | null;
          autor_nome: string;
          autor_papel?: string | null;
          acao: string;
          modulo: string;
          alvo?: string;
          detalhe?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          autor_profile_id?: string | null;
          autor_nome?: string;
          autor_papel?: string | null;
          acao?: string;
          modulo?: string;
          alvo?: string;
          detalhe?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'atividades_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'atividades_autor_profile_id_fkey';
            columns: ['autor_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notificacoes: {
        Row: {
          id: string;
          empresa_id: string;
          chave: string;
          tipo: string;
          severidade: string;
          titulo: string;
          mensagem: string;
          data: string;
          funcionario_id: string | null;
          turno_escalado_id: string | null;
          turno_id: string | null;
          status: string;
          detectada_em: string;
          atualizada_em: string;
          resolvida_em: string | null;
          snooze_ate: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          chave: string;
          tipo: string;
          severidade: string;
          titulo: string;
          mensagem: string;
          data: string;
          funcionario_id?: string | null;
          turno_escalado_id?: string | null;
          turno_id?: string | null;
          status?: string;
          detectada_em?: string;
          atualizada_em?: string;
          resolvida_em?: string | null;
          snooze_ate?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          chave?: string;
          tipo?: string;
          severidade?: string;
          titulo?: string;
          mensagem?: string;
          data?: string;
          funcionario_id?: string | null;
          turno_escalado_id?: string | null;
          turno_id?: string | null;
          status?: string;
          detectada_em?: string;
          atualizada_em?: string;
          resolvida_em?: string | null;
          snooze_ate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notificacoes_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notificacoes_turno_escalado_id_fkey';
            columns: ['turno_escalado_id'];
            isOneToOne: false;
            referencedRelation: 'escala_turnos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notificacoes_turno_id_fkey';
            columns: ['turno_id'];
            isOneToOne: false;
            referencedRelation: 'turnos';
            referencedColumns: ['id'];
          },
        ];
      };
      perfis_acesso: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          descricao: string;
          permissoes: Json;
          eh_sistema: boolean;
          ordem: number;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          descricao?: string;
          permissoes?: Json;
          eh_sistema?: boolean;
          ordem?: number;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nome?: string;
          descricao?: string;
          permissoes?: Json;
          eh_sistema?: boolean;
          ordem?: number;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'perfis_acesso_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_remover_usuario: {
        Args: { target_user_id: string; p_empresa_id: string };
        Returns: undefined;
      };
      admin_limpar_usuarios_empresa: {
        Args: { p_empresa_id: string };
        Returns: number;
      };
      admin_redefinir_senha_usuario: {
        Args: {
          target_user_id: string;
          p_empresa_id: string;
          nova_senha: string;
        };
        Returns: undefined;
      };
      admin_vincular_usuario_empresa: {
        Args: {
          target_user_id: string;
          p_empresa_id: string;
          p_nome: string;
          p_email: string;
          p_papel: string;
          p_permissoes: import('./database').Json;
          p_status: string;
          p_perfil_acesso_id?: string | null;
        };
        Returns: {
          id: string;
          nome: string;
          email: string;
          empresa_id: string | null;
          is_platform_admin: boolean;
          papel: string | null;
          permissoes: Json;
          perfil_acesso_id: string | null;
          status: string;
          ultimo_acesso: string | null;
          criado_em: string;
          atualizado_em: string;
        };
      };
      seed_perfis_acesso_empresa: {
        Args: { p_empresa_id: string };
        Returns: undefined;
      };
      sync_funcionarios_dos_usuarios: {
        Args: { p_empresa_id: string };
        Returns: undefined;
      };
      ensure_funcionario_para_profile: {
        Args: {
          p_profile_id: string;
          p_empresa_id: string;
          p_nome: string;
        };
        Returns: undefined;
      };
      empresa_vincular_usuario_empresa: {
        Args: {
          target_user_id: string;
          p_empresa_id: string;
          p_nome: string;
          p_email: string;
          p_papel: string;
          p_permissoes: import('./database').Json;
          p_status: string;
          p_perfil_acesso_id?: string | null;
        };
        Returns: {
          id: string;
          nome: string;
          email: string;
          empresa_id: string | null;
          is_platform_admin: boolean;
          papel: string | null;
          permissoes: Json;
          perfil_acesso_id: string | null;
          status: string;
          ultimo_acesso: string | null;
          criado_em: string;
          atualizado_em: string;
        };
      };
      empresa_remover_usuario: {
        Args: { target_user_id: string; p_empresa_id: string };
        Returns: undefined;
      };
      empresa_redefinir_senha_usuario: {
        Args: {
          target_user_id: string;
          p_empresa_id: string;
          nova_senha: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
