import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import './SenhaGeradaModal.css';

interface SenhaGeradaModalProps {
  open: boolean;
  titulo?: string;
  nomeUsuario: string;
  email: string;
  senha: string;
  onClose: () => void;
}

export function SenhaGeradaModal({
  open,
  titulo = 'Senha gerada',
  nomeUsuario,
  email,
  senha,
  onClose,
}: SenhaGeradaModalProps) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!open) setCopiado(false);
  }, [open]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      description={`Credenciais de acesso para ${nomeUsuario}.`}
      size="md"
      footer={
        <Button variant="primary" onClick={onClose}>
          Concluir
        </Button>
      }
    >
      <div className="brisa-senha">
        <p className="brisa-senha__aviso">
          Esta senha provisória aparece apenas neste momento. Copie e compartilhe
          com a pessoa por um canal seguro. Depois do primeiro acesso, ela poderá
          definir uma senha própria no app.
        </p>

        <div className="brisa-senha__campo">
          <span className="brisa-senha__rotulo">Usuário (e-mail)</span>
          <span className="brisa-senha__valor brisa-senha__valor--email">
            {email}
          </span>
        </div>

        <div className="brisa-senha__campo">
          <span className="brisa-senha__rotulo">Senha temporária</span>
          <div className="brisa-senha__senha-linha">
            <code className="brisa-senha__senha">{senha}</code>
            <button
              type="button"
              className="brisa-senha__copiar"
              onClick={copiar}
              aria-label="Copiar senha"
            >
              {copiado ? (
                <>
                  <Icon name="check" size={15} />
                  Copiado
                </>
              ) : (
                <>
                  <Icon name="copy" size={15} />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
