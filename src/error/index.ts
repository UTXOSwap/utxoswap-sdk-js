export enum ErrorCodes {
  UNKNOWN = 0,
  INSUFFICIENT_CKB_CAPACITY,
  INSUFFICIENT_FREE_UDT_BALANCE,
}

export const ErrorMessages = {
  [ErrorCodes.UNKNOWN]: 'Unknown error',
  [ErrorCodes.INSUFFICIENT_CKB_CAPACITY]:
    'Insufficient CKB capacity. Please try again.',
  [ErrorCodes.INSUFFICIENT_FREE_UDT_BALANCE]: 'Insufficient free UDT balance',
};

export class InsufficientCKBCapacityError extends Error {
  code = ErrorCodes.INSUFFICIENT_CKB_CAPACITY;
  constructor() {
    super(ErrorMessages[ErrorCodes.INSUFFICIENT_CKB_CAPACITY]);
  }
}

export class InsufficientFreeUDTBalanceError extends Error {
  code = ErrorCodes.INSUFFICIENT_FREE_UDT_BALANCE;
  constructor() {
    super(ErrorMessages[ErrorCodes.INSUFFICIENT_FREE_UDT_BALANCE]);
  }
}
