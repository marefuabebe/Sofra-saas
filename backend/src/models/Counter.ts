import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document<string> {
  _id: string; // e.g., restaurantId_YYYYMMDD
  seq: number;
}

const CounterSchema: Schema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model<ICounter>("Counter", CounterSchema);
