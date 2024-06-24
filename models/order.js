const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const orderSchema = new Schema({
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  user: {
    email: {
      type: String,
      requires: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
  },
});

module.exports = mongoose.model("order", orderSchema);
