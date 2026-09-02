import React from 'react';
import PayAndPlayPay from './PayAndPlayPay';

// Pay & Play opens the Xedruo PAY (bank/financial) experience first.
// PLAY remains a separate experience at /pay-and-play/app.
export default function PayAndPlayEntry(){
  return <PayAndPlayPay />;
}
