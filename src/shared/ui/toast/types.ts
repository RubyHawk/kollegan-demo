export type ToastColor = 'amber' | 'emerald' | 'red' | 'indigo' | 'gray';

export interface Toast {
  id: string;
  message: string;
  color: ToastColor;
  icon: React.ReactNode;
}
