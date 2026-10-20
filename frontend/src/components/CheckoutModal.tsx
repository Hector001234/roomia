import React from 'react';
import { Checkout } from './Checkout';

interface CheckoutModalProps {
  isOpen: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen }) => {
  if (!isOpen) {
    return null;
  }
  return (
    <div role="dialog" aria-modal="true" aria-label="Checkout Modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <Checkout />
      </div>
    </div>
  );
};
