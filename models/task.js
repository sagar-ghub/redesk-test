const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    task_name: {
      type: String,
      required: true,
    },

    task_no: {
      type: String,
    },
    task_description: {
      type: String,
      required: true,
    },
    // task_attachment: {
    //   type: String,
    // },
    // task_subscribers: {
    //   type: String,
    // },
    // task_list: {
    //   type: String,
    //   enum: ["To Do", "Doing", "Client Review", "Done"],
    //   required: true,
    // },
    task_status: {
      type: Number,
      // enum: ["ACTIVE", "HOLD", "COMPLETED"],
      default: 1,
      required: true,
    },
    task_assignee: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
    },

    task_due_on: {
      type: String,
      required: true,
    },
    task_labels: {
      type: String,
      enum: [
        "NEW",
        "FIXED",
        "ASSIGNED",
        "WORKS FOR ME",
        "VERIFIED",
        "IN PROGRESS",
        "WONT FIX",
        "CONFIRMED",
        "APPROVED BY CLIENT",
      ],
      required: true,
    },
    task_time_estimation: {
      type: Number,
    },
    task_priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      required: true,
      default: "MEDIUM",
    },
    comments: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comment: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
