const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    notification: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["READ", "UNREAD"],
      required: true,
    },
    send_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    send_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
