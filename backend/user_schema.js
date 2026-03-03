import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
    },

    aadhaar: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    location: mongoose.Schema.Types.Mixed,
    
    warnings: { type: Number, default: 0 },

  },
  { timestamps: true }
);

export default mongoose.model("UserInfo", userSchema);
