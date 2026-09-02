import React from 'react';
import PayAndPlayPay from './PayAndPlayPay';

// Pay & Play has exactly two end-user experiences.
// The single entry URL opens the existing Xedruo PAY experience first.
// PLAY remains the second experience at /pay-and-play/app.
export default function PayAndPlayEntry(){
  return <PayAndPlayPay />;
}
