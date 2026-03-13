import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    description: { type: String, required: true },
    locationName: { type: String, required: true },
    coordinates: {
      lat: Number,
      long: Number,
    },
    image: { type: String },    
    status: { type: String, default: "Pending" }, 
    date: { type: Date, default: Date.now },      
    
    priority: { type: String, default: "Low" },
   
    user_id: {
      type: String, 
      required: true,
    },
    assigned_worker_name: { type: String, default: null },
    assigned_worker_id: { type: String, default: null },

    completed_image: { type: String, default: null },
    resolved_date: { type: Date, default: null },
  },
  {
    collection: "Issues", 
  }
);

mongoose.model("IssueInfo", IssueSchema);