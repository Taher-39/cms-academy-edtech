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
      type: "course" | "session";
      userId: string;
      amount: number;
      discount: number;
      tran_id: string;
      couponCode?: string;
      // course purchases
      courseId?: string;
      // one-to-one session bookings
      teacherId?: string;
      subject?: string;
      topics?: string;
      requestedSchedule?: string;
      durationHours?: number;
      pricePerHour?: number;
    }
  >;
}

export {};
