import * as React from 'react';
import { useController, type Control, type ControllerRenderProps, type FieldPath, type FieldValues } from 'react-hook-form';
import { Label } from '@shared/ui/label';
import { cn } from '@shared/lib/utils';

type FormFieldShellProps = {
  id?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

function FormFieldShell({ id, label, hint, error, required, className, children }: FormFieldShellProps) {
  const hintId = id ? `${id}-hint` : undefined;
  const errorId = id ? `${id}-error` : undefined;

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id} className={cn(error && 'text-[var(--ui-danger-text)]')}>
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-[var(--ui-danger-text)]">*</span> : null}
      </Label>
      {children}
      {hint ? <p id={hintId} className="text-xs leading-5 text-[var(--ui-text-muted)]">{hint}</p> : null}
      {error ? <p id={errorId} className="text-xs leading-5 text-[var(--ui-danger-text)]">{error}</p> : null}
    </div>
  );
}

type ControlledFormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  render: (field: ControllerRenderProps<TFieldValues, TName>) => React.ReactNode;
};

function ControlledFormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ control, name, label, hint, required, className, render }: ControlledFormFieldProps<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name });
  const id = field.name;

  return (
    <FormFieldShell
      id={id}
      label={label}
      hint={hint}
      error={fieldState.error?.message}
      required={required}
      className={className}
    >
      {render(field)}
    </FormFieldShell>
  );
}

export { FormFieldShell as FormField, ControlledFormField };
