import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true, 
    },
    password: {
      type: String,
      required: true,
    },
    empId: {
      type: String,
      required: true,
      unique: true, 
    },
    department: {
      type: String,
      required: true, 
    },
    // ✨ FIXED REFERENCE ✨
    assigned_issues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issues", // MUST match mongoose.model("IssueInfo", ...)
      }
    ],
    profileImage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("WorkerInfo", workerSchema);