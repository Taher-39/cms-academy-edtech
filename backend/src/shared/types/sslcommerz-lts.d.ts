declare module "sslcommerz-lts" {
  interface SSLCommerzInitResponse {
    status: string;
    GatewayPageURL?: string;
    [key: string]: unknown;
  }

  interface SSLCommerzValidationResponse {
    status: string;
    [key: string]: unknown;
  }

  interface SSLCommerzRefundResponse {
    status: string;
    refund_ref_id?: string;
    [key: string]: unknown;
  }

  interface SSLCommerzRefundQueryResponse {
    status: string;
    [key: string]: unknown;
  }

  class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive: boolean);
    init(data: Record<string, unknown>): Promise<SSLCommerzInitResponse>;
    validate(valId: string, tranId: string): Promise<SSLCommerzValidationResponse>;
    initiateRefund(data: {
      refund_amount: number;
      refund_remarks: string;
      bank_tran_id: string;
      refe_id: string;
    }): Promise<SSLCommerzRefundResponse>;
    refundQuery(data: { refund_ref_id: string }): Promise<SSLCommerzRefundQueryResponse>;
  }

  export default SSLCommerzPayment;
}
