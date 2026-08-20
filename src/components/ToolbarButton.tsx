import React from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

export interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  ariaLabel?: string;
  onClick: () => void;
  loading?: boolean;
  variant?: 'outline' | 'destructive' | 'default' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = React.memo(({ 
  icon, 
  label, 
  ariaLabel, 
  onClick, 
  loading = false,
  variant = 'outline',
  className = '',
  disabled = false
}) => {
  return (
    <Button 
      variant={variant}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel || label}
      className={`flex items-center gap-2 ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span className="toolbar-button-label">{label}</span>
    </Button>
  );
});

ToolbarButton.displayName = 'ToolbarButton';

export default ToolbarButton;
