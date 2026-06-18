import { useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import type { Sessao } from '../services/authSession';
import { authSession } from '../services/authSession';
import type { Empresa } from '../types/empresa';
import { iniciaisDoNome } from '../utils/funcionarioLabels';
import './PerfilContaPage.css';

interface PerfilContaPageProps {
  sessao: Sessao;
  empresa?: Empresa;
}

export function PerfilContaPage({ sessao, empresa }: PerfilContaPageProps) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarAtual, setMostrarAtual] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const papelLabel = authSession.rotuloPermissoes(sessao) ?? 'Usuário';

  async function handleAlterarSenha(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (!senhaAtual.trim()) {
      setErro('Informe sua senha atual.');
      return;
    }
    if (novaSenha.length < 8) {
      setErro('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação não coincide com a nova senha.');
      return;
    }

    setEnviando(true);
    const resultado = await authSession.alterarSenha(senhaAtual, novaSenha);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setSucesso(true);
  }

  return (
    <div className="brisa-page brisa-perfil-conta">
      <header className="brisa-page__header brisa-perfil-conta__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Conta</span>
          <h1 className="brisa-page__title">Meu perfil</h1>
          <p className="brisa-page__subtitle">
            Seus dados de acesso e preferências de segurança.
          </p>
        </div>
      </header>

      <div className="brisa-perfil-conta__layout">
        <section className="brisa-perfil-conta__identity" aria-label="Resumo da conta">
          <div className="brisa-perfil-conta__avatar" aria-hidden="true">
            {iniciaisDoNome(sessao.nome)}
          </div>
          <div className="brisa-perfil-conta__identity-body">
            <h2 className="brisa-perfil-conta__nome">{sessao.nome}</h2>
            <p className="brisa-perfil-conta__email">{sessao.email}</p>
            <div className="brisa-perfil-conta__tags">
              <Badge tone="info">{papelLabel}</Badge>
              {!sessao.isPlatformAdmin && empresa ? (
                <Badge tone="neutral">{empresa.nome}</Badge>
              ) : null}
              {sessao.isPlatformAdmin ? (
                <Badge tone="neutral">Plataforma</Badge>
              ) : null}
            </div>
          </div>
        </section>

        <section
          className="brisa-perfil-conta__panel"
          aria-labelledby="perfil-senha-titulo"
        >
          <div className="brisa-perfil-conta__panel-head">
            <span className="brisa-perfil-conta__panel-icon" aria-hidden="true">
              <Icon name="lock" size={20} />
            </span>
            <div>
              <h2 id="perfil-senha-titulo" className="brisa-perfil-conta__panel-title">
                Alterar senha
              </h2>
              <p className="brisa-perfil-conta__panel-sub">
                Defina uma senha pessoal para os seus próximos acessos.
              </p>
            </div>
          </div>

          <form className="brisa-perfil-conta__form" onSubmit={handleAlterarSenha} noValidate>
            {erro ? (
              <div
                className="brisa-perfil-conta__alert brisa-perfil-conta__alert--erro"
                role="alert"
              >
                <Icon name="alert-circle" size={16} />
                <span>{erro}</span>
              </div>
            ) : null}

            {sucesso ? (
              <div
                className="brisa-perfil-conta__alert brisa-perfil-conta__alert--ok"
                role="status"
              >
                <Icon name="check" size={16} />
                <span>Senha alterada com sucesso.</span>
              </div>
            ) : null}

            <div className="brisa-perfil-conta__campos">
              <Field label="Senha atual" htmlFor="perfil-senha-atual" required>
                <div className="brisa-perfil-conta__password">
                  <Input
                    id="perfil-senha-atual"
                    type={mostrarAtual ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={senhaAtual}
                    disabled={enviando}
                    onChange={(e) => {
                      setSenhaAtual(e.target.value);
                      setErro(null);
                      setSucesso(false);
                    }}
                  />
                  <button
                    type="button"
                    className="brisa-perfil-conta__password-toggle"
                    onClick={() => setMostrarAtual((v) => !v)}
                    aria-label={mostrarAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                  >
                    <Icon name={mostrarAtual ? 'eye-off' : 'eye'} size={16} />
                  </button>
                </div>
              </Field>

              <div className="brisa-perfil-conta__campos-novas">
                <Field label="Nova senha" htmlFor="perfil-nova-senha" required>
                  <div className="brisa-perfil-conta__password">
                    <Input
                      id="perfil-nova-senha"
                      type={mostrarNova ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={novaSenha}
                      disabled={enviando}
                      onChange={(e) => {
                        setNovaSenha(e.target.value);
                        setErro(null);
                        setSucesso(false);
                      }}
                    />
                    <button
                      type="button"
                      className="brisa-perfil-conta__password-toggle"
                      onClick={() => setMostrarNova((v) => !v)}
                      aria-label={mostrarNova ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                    >
                      <Icon name={mostrarNova ? 'eye-off' : 'eye'} size={16} />
                    </button>
                  </div>
                </Field>

                <Field label="Confirmar nova senha" htmlFor="perfil-confirmar-senha" required>
                  <div className="brisa-perfil-conta__password">
                    <Input
                      id="perfil-confirmar-senha"
                      type={mostrarNova ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmarSenha}
                      disabled={enviando}
                      onChange={(e) => {
                        setConfirmarSenha(e.target.value);
                        setErro(null);
                        setSucesso(false);
                      }}
                    />
                    <button
                      type="button"
                      className="brisa-perfil-conta__password-toggle"
                      onClick={() => setMostrarNova((v) => !v)}
                      aria-label={
                        mostrarNova
                          ? 'Ocultar confirmação de senha'
                          : 'Mostrar confirmação de senha'
                      }
                    >
                      <Icon name={mostrarNova ? 'eye-off' : 'eye'} size={16} />
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="brisa-perfil-conta__acoes">
              <Button type="submit" variant="primary" disabled={enviando}>
                {enviando ? 'Salvando…' : 'Salvar nova senha'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
