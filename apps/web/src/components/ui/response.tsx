import React, { memo } from 'react';
import { Streamdown } from 'streamdown';
import { cn } from '../../lib/utils';

export interface ResponseProps extends React.ComponentProps<typeof Streamdown> {
  children?: string;
  className?: string;
}

export const Response = memo(({ children, className, ...props }: ResponseProps) => {
  return (
    <div className={cn("[&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}>
      <Streamdown {...props}>{children}</Streamdown>
    </div>
  );
});

Response.displayName = "Response";
