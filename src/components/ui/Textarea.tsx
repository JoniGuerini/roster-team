import { forwardRef, type TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', invalid, ...rest }, ref) => {
    const classes = [
      'brisa-textarea',
      invalid ? 'brisa-textarea--invalid' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');
    return <textarea ref={ref} className={classes} {...rest} />;
  },
);

Textarea.displayName = 'Textarea';
