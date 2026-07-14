import SSLCommerzPayment from "sslcommerz-lts";

// Lazily construct the client on first use (mirrors cloudinary.ts) — module
// imports are hoisted above index.ts's dotenv.config() call, so reading
// process.env at module top-level here would always see undefined values.
let instance: InstanceType<typeof SSLCommerzPayment> | null = null;

function getClient() {
  if (!instance) {
    const store_id = process.env.SSLCOMERZ_STORE_ID!;
    const store_passwd = process.env.SSLCOMERZ_STORE_PASSWORD!;
    const is_live = process.env.SSLCOMERZ_IS_LIVE === "true";
    instance = new SSLCommerzPayment(store_id, store_passwd, is_live);
  }
  return instance;
}

export const sslcommerz = new Proxy({} as InstanceType<typeof SSLCommerzPayment>, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});

export function getSslcommerzInitData({
  total_amount,
  tran_id,
  success_url,
  fail_url,
  cancel_url,
  cus_name,
  cus_email,
  cus_phone = "01XXXXXXX",
  product_name,
}: {
  total_amount: number;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  cus_name: string;
  cus_email: string;
  cus_phone?: string;
  product_name: string;
}) {
  return {
    total_amount,
    currency: "BDT",
    tran_id,
    success_url,
    fail_url,
    cancel_url,
    ipn_url: `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`}/api/payment/ipn`,
    cus_name,
    cus_email,
    cus_phone,
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name,
    product_category: "Course",
    product_profile: "general",
  };
}
