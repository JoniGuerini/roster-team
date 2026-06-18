import './Switch.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Switch({ checked, onChange, disabled, label, id }: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`brisa-switch ${checked ? 'brisa-switch--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="brisa-switch__thumb" />
    </button>
  );
}
