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
    
   
    user_id: {
      type: String, 
      required: true,
    },
  },
  {
    collection: "Issues", 
  }
);

mongoose.model("IssueInfo", IssueSchema);