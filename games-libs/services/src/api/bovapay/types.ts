export type BovapayPaymentMethod =
  | 'card'
  | 'sberpay'
  | 'sbp'
  | 'account_number'
  | 'click'

export type BovapayPayoutMethod = 'bank_transfer' | 'card'

export type BovapayPayeerType = 'ftd' | 'trust'
export type BovapayCurrency = 'crypto' | 'rub' | 'uzs' | 'krw' | 'kgs'
export type BovapayBankName = 'sberbank' | 'tinkoff' | 'alfabank' | 'vtb'
export type BovapayStatus =
  | 'paid'
  | 'processing'
  | 'waiting_payment'
  | 'failed'
  | 'timeout'
  | 'rejected'
export type BovapaySourceTransactionClass = 'P2pTransaction'
export type BovapayBankColors = Record<string, string>

export type BovapayCreatePayoutRequest = {
  user_id: string
  amount: number
  currency: BovapayCurrency
  method: BovapayPayoutMethod
  description?: string
}

export type BovapayCreatePayoutResponse = {
  data: {
    payout_id: string
    status: BovapayStatus
    created_at: string
  }
  errors: Record<string, string>
  message: string | null
  status: 'ok' | 'error'
  meta: Record<string, unknown>
}

export type BovapayCreateDepositRequest = {
  user_uuid: string
  merchant_id: string
  payeer_identifier: string
  payeer_ip: string
  payeer_type: BovapayPayeerType
  currency: BovapayCurrency
  payment_method: BovapayPaymentMethod
  payeer_bank_name?: BovapayBankName
  amount: number
  callback_url: string
  redirect_url?: string
  email?: string
  customer_name?: string
}

export type BovapaySourceTransaction = {
  id: string
  merchant_id: string
  currency: string
  state: BovapayStatus
  created_at: string
  updated_at: string
  close_at: string
  redirect_url?: string
  email?: string
  customer_name?: string
  rate: string
  amount: string
  fiat_amount: string
  old_fiat_amount: string
  payment_method: BovapayPaymentMethod
  payeer_bank_name: BovapayBankName | null
}

export type BovapayCreateDepositResponse = {
  data: {
    uuid: string
    merchant_id: string
    amount: string
    fiat_amount: string
    currency: string
    state: BovapayStatus
    callback_url: string
    redirect_url?: string
    created_at: string
    updated_at: string
    form_url: string
    source_transaction_class: BovapaySourceTransactionClass
    source_transaction: BovapaySourceTransaction
  }
  errors: Record<string, string>
  message: string | null
  status: 'ok' | 'error'
  meta: Record<string, unknown>
}

export type BovapayRecipientCard = {
  id: string
  number: string
  bank_name: string
  bank_full_name: string
  bank_colors: BovapayBankColors
  brand: string | null
  card_holder: string
  payment_method: BovapayPaymentMethod
  updated_at: string
  created_at: string
  sberpay_url: string | null
}

export type BovapayTransactionStatusResponse = {
  result_code: 'ok' | 'error'
  payload: {
    id: string
    merchant_id: string
    currency: string
    form_url: string
    state: BovapayStatus
    created_at: string
    updated_at: string
    close_at: string
    callback_url: string
    redirect_url?: string
    email?: string
    customer_name?: string
    rate: string
    amount: string
    fiat_amount: string
    old_fiat_amount: string
    service_commission: string
    total_amount: string
    payment_method: BovapayPaymentMethod
    recipient_card: BovapayRecipientCard
  }
}
