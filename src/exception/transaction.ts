enum TransactionExceptionType {
  GENERAL = 'general',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  INVALID_AMOUNT = 'invalid_amount',
  INVALID_ACCOUNT = 'invalid_account',
  INVALID_PARAMETERS = 'invalid_parameters',
  INVALID_RECEIPT = 'invalid_receipt',
}

class TransactionException extends Error {
  constructor(type = TransactionExceptionType.GENERAL, message?: string) {
    super(`[${type.toString()}] ${message}`);
  }
}

class InvalidTransactionParametersException extends TransactionException {
  constructor() {
    super(TransactionExceptionType.INVALID_PARAMETERS);
  }
}

class InvalidTransactionReceiptException extends TransactionException {
  constructor() {
    super(TransactionExceptionType.INVALID_RECEIPT);
  }
}

export {
  TransactionException,
  InvalidTransactionParametersException,
  InvalidTransactionReceiptException,
  TransactionExceptionType,
};
