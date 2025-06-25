import { createPortal } from 'react-dom';
import React from 'react';

const PortalMenuItems = React.forwardRef(function PortalMenuItems({ children, ...props }, ref) {
  if (typeof window === 'undefined') return null;
  return createPortal(
    <div ref={ref} {...props}>{children}</div>,
    document.body
  );
});

export default PortalMenuItems;   