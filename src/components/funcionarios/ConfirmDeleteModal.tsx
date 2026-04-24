import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
  open: boolean;
  nome: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  open,
  nome,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Excluir funcionário"
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
        Tem certeza que deseja excluir <strong>{nome}</strong>? Esta ação não
        pode ser desfeita.
      </p>
    </Modal>
  );
}
