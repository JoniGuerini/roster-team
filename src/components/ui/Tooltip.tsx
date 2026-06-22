import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

type TooltipSide = 'right' | 'left' | 'top' | 'bottom';

interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  /** Quando true, o tooltip não é exibido (ex.: sidebar expandida). */
  disabled?: boolean;
  children: ReactElement;
}

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): (value: T | null) => void {
  return (value) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(value);
      else (ref as React.MutableRefObject<T | null>).current = value;
    }
  };
}

function posicaoTooltip(
  trigger: DOMRect,
  tooltip: DOMRect,
  side: TooltipSide,
): CSSProperties {
  const gap = 8;

  switch (side) {
    case 'left':
      return {
        top: trigger.top + trigger.height / 2 - tooltip.height / 2,
        left: trigger.left - tooltip.width - gap,
      };
    case 'top':
      return {
        top: trigger.top - tooltip.height - gap,
        left: trigger.left + trigger.width / 2 - tooltip.width / 2,
      };
    case 'bottom':
      return {
        top: trigger.bottom + gap,
        left: trigger.left + trigger.width / 2 - tooltip.width / 2,
      };
    case 'right':
    default:
      return {
        top: trigger.top + trigger.height / 2 - tooltip.height / 2,
        left: trigger.right + gap,
      };
  }
}

export function Tooltip({
  content,
  side = 'right',
  disabled = false,
  children,
}: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  const [estilo, setEstilo] = useState<CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!visivel || !triggerRef.current || !tooltipRef.current) return;

    const atualizar = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const trigger = triggerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const pos = posicaoTooltip(trigger, tooltip, side);
      const padding = 8;

      setEstilo({
        top: Math.min(
          Math.max(padding, pos.top as number),
          window.innerHeight - tooltip.height - padding,
        ),
        left: Math.min(
          Math.max(padding, pos.left as number),
          window.innerWidth - tooltip.width - padding,
        ),
        visibility: 'visible',
      });
    };

    atualizar();
    window.addEventListener('resize', atualizar);
    window.addEventListener('scroll', atualizar, true);
    return () => {
      window.removeEventListener('resize', atualizar);
      window.removeEventListener('scroll', atualizar, true);
    };
  }, [visivel, side, content]);

  useEffect(() => {
    if (!visivel) setEstilo({ visibility: 'hidden' });
  }, [visivel]);

  if (disabled || !content) {
    return children;
  }

  if (!isValidElement(children)) {
    return children;
  }

  const child = children as ReactElement<{
    ref?: React.Ref<HTMLElement>;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onFocus?: (event: React.FocusEvent) => void;
    onBlur?: (event: React.FocusEvent) => void;
    'aria-describedby'?: string;
  }>;

  const trigger = cloneElement(child, {
    ref: mergeRefs(triggerRef, child.props.ref),
    onMouseEnter: (event: React.MouseEvent) => {
      child.props.onMouseEnter?.(event);
      setVisivel(true);
    },
    onMouseLeave: (event: React.MouseEvent) => {
      child.props.onMouseLeave?.(event);
      setVisivel(false);
    },
    onFocus: (event: React.FocusEvent) => {
      child.props.onFocus?.(event);
      setVisivel(true);
    },
    onBlur: (event: React.FocusEvent) => {
      child.props.onBlur?.(event);
      setVisivel(false);
    },
    'aria-describedby': visivel ? id : undefined,
  });

  const tooltip = visivel
    ? createPortal(
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className={`brisa-tooltip brisa-tooltip--${side}`}
          style={estilo}
        >
          {content}
          <span className="brisa-tooltip__arrow" aria-hidden="true" />
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {trigger}
      {tooltip}
    </>
  );
}
