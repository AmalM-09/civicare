const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors"); // Import CORS

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const mongoUrl = "mongodb+srv://amalkvlr2003_db_user:civicare@cluster0.riskisu.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoUrl)
  .then(() => { console.log("Database Connected"); })
  .catch((e) => { console.log("Database Error:", e); });

require('./user_schema');
require('./issue_schema');

const User = mongoose.model("UserInfo");
const Issue = mongoose.model("IssueInfo");

// ---------------- API ROUTES ----------------

// Register API
app.post('/register', async (req, res) => {
    const { name, mobile, aadhaar, password, location } = req.body;
    console.log("Received Registration:", req.body);
    const oldUser = await User.findOne({ mobile: mobile });
    if (oldUser) {
        return res.send({ status: "error", data: "User already exists with this mobile number!" });
    }
    try {
        await User.create({
            name,
            mobile,
            aadhaar,
            password,
            location 
        });
        res.send({ status: "ok", data: "User Created Successfully" });
    } catch (e) {
        console.log("Error Creating User:", e);
        res.send({ status: "error", data: e.message });
    }
});

app.post('/create-issue', async (req, res) => {
    const { category, description, locationName, coordinates, image, user_id } = req.body;

    try {
        const validObjectId = new mongoose.Types.ObjectId(user_id);
        await Issue.create({
            category,
            description,
            locationName,
            coordinates,
            image,
            user_id: validObjectId, 
            status: "Pending",
            date: new Date()
        });
        res.send({ status: "ok", data: "Issue Reported Successfully" });
    } catch (error) {
        console.log("Error Creating Issue:", error);
        res.send({ status: "error", data: error.message });
    }
});


app.get('/get-issues', async (req, res) => {
    try {
        const issues = await Issue.find({}).sort({ date: -1 }).lean();
        for (let i = 0; i < issues.length; i++) {
            try {
                const user = await User.findById(issues[i].user_id);
                
                if (user) {
                    issues[i].user_name = user.name; 
                } else {
                    issues[i].user_name = "Citizen"; 
                }
            } catch (err) {
                issues[i].user_name = "Citizen";
            }
        }
        res.send({ status: "ok", data: issues });
    } catch (error) {
        console.log("Error Fetching Issues:", error);
        res.send({ status: "error", data: error.message });
    }
});

app.post("/login-user", async (req, res) => {
  const { mobile, password } = req.body;

  const user = await User.findOne({ mobile: mobile });

  if (!user) {
    return res.send({ status: "error", data: "User not found" });
  }

  if (user.password === password) {
    return res.send({ status: "ok", data: user }); 
  } else {
    return res.send({ status: "error", data: "Invalid Password" });
  }
});

app.post('/get-profile-data', async (req, res) => {
    const { user_id } = req.body;
    
    try {
        const user = await User.findById(user_id);
        if (!user) {
            return res.send({ status: "error", data: "User not found" });
        }
        const userIssues = await Issue.find({ user_id: user_id });
        const totalReported = userIssues.length;
        const totalSolved = userIssues.filter(issue => issue.status === 'Solved').length;
        const totalPending = totalReported - totalSolved;

        res.send({ 
            status: "ok", 
            data: {
                user: {
                    name: user.name,
                    mobile: user.mobile,
                    aadhaar: user.aadhaar,
                    location: user.location,    
                    warnings: user.warnings || 0,
                    joined: "2026" 
                },
                stats: {
                    reported: totalReported,
                    solved: totalSolved,
                    pending: totalPending
                }
            } 
        });
    } catch (error) {
        console.log("Error Fetching Profile:", error);
        res.send({ status: "error", data: error.message });
    }
});

app.post('/update-profile', async (req, res) => {
    const { user_id, name, mobile, location } = req.body;

    try {
        const user = await User.findById(user_id);
        if (!user) {
            return res.send({ status: "error", data: "User not found." });
        }
        user.name = name;
        user.mobile = mobile;
        if (location) user.location = location;
        await user.save();
        res.send({ status: "ok", data: user });

    } catch (error) {
        console.log("Error Updating Profile:", error);
        res.send({ status: "error", data: error.message });
    }
});


app.post('/get-user-history', async (req, res) => {
    const { user_id } = req.body;
    try {
        const data = await Issue.find({ user_id: user_id }).sort({ date: -1 });
        res.send({ status: "ok", data: data });
    } catch (error) {
        console.log("Error Fetching History:", error);
        res.send({ status: "error", data: error.message });
    }
});

app.post('/update-issue-status', async (req, res) => {
    const { issue_id, status } = req.body;

    try {
        const issue = await Issue.findById(issue_id);
        if (!issue) {
            return res.send({ status: "error", data: "Issue not found" });
        }

        issue.status = status;
        await issue.save();

        res.send({ status: "ok", data: "Status updated successfully" });
    } catch (error) {
        console.log("Error Updating Status:", error);
        res.send({ status: "error", data: error.message });
    }
});

app.post('/warn-user', async (req, res) => {
    const { user_id } = req.body;
    try {
        const user = await User.findById(user_id);
        if (!user) {
            return res.send({ status: "error", data: "User not found" });
        }
        user.warnings = (user.warnings || 0) + 1;
        await user.save();
        
        res.send({ status: "ok", data: "Warning issued successfully", warnings: user.warnings });
    } catch (error) {
        console.log("Error Warning User:", error);
        res.send({ status: "error", data: error.message });
    }
});

app.listen(8001, '0.0.0.0', () => {
    console.log("Node.js Server Started on Port 8001");
});