import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ConfirmDeleteTurnoModalProps {
  open: boolean;
  nome: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteTurnoModal({
  open,
  nome,
  onCancel,
  onConfirm,
}: ConfirmDeleteTurnoModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Excluir turno"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Excluir
          </Button>
        </>
      }
    >
      <p className="brisa-confirm__text">
        Tem certeza que deseja excluir o turno <strong>{nome}</strong>? Esta
        ação não pode ser desfeita.
      </p>
    </Modal>
  );
}
