import type { ReactNode } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
  open: boolean;
  nome: string;
  /** Padrão: excluir funcionário. */
  titulo?: string;
  /** Se omitido, usa o texto padrão de exclusão. */
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  open,
  nome,
  titulo = 'Excluir funcionário',
  children,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={titulo}
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
      {children ?? (
        <p className="brisa-confirm__text">
          Tem certeza que deseja excluir <strong>{nome}</strong>? Esta ação não
          pode ser desfeita.
        </p>
      )}
    </Modal>
  );
}
