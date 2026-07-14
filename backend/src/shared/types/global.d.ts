/* eslint-disable no-var */
import type mongoose from "mongoose";

declare global {
  var __mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };

  var __tempRegStore: Map<
    string,
    { name: string; email: string; password: string }
  >;

  var __trxStore: Map<
    string,
    {
      userId: string;
      courseId: string;
      amount: number;
      discount: number;
      tran_id: string;
      couponCode?: string;
    }
  >;
}

export {};
