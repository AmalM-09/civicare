const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors"); // Import CORS

const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'AIzaSyC6_e97nidXaauPWFGxEfUOjFVz6_DClTY' }); 


app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const mongoUrl = "mongodb+srv://amalkvlr2003_db_user:civicare@cluster0.riskisu.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoUrl)
  .then(() => { console.log("Database Connected"); })
  .catch((e) => { console.log("Database Error:", e); });

require('./user_schema');
require('./issue_schema');
require('./worker_schema');

const User = mongoose.model("UserInfo");
const Issue = mongoose.model("IssueInfo");
const Worker = mongoose.model("WorkerInfo");

// ---------------- API ROUTES ----------------

app.post('/register', async (req, res) => {
    const { role, name, mobile, password, aadhaar, location, department, empId } = req.body;
    
    console.log(`Received ${role} Registration:`, req.body);

    try {
        // --- CITIZEN REGISTRATION ---
        if (role === 'Citizen' || role === 'citizen') {
            const oldUser = await User.findOne({ mobile: mobile });
            if (oldUser) {
                return res.send({ status: "error", data: "Citizen already exists with this mobile number!" });
            }

            await User.create({
                name,
                mobile,
                aadhaar,
                password,
                location 
            });
            return res.send({ status: "ok", data: "Citizen Created Successfully" });
        } 
        
        // --- WORKER REGISTRATION ---
        else if (role === 'Worker' || role === 'worker') {
            const oldWorker = await Worker.findOne({ 
                $or: [{ mobile: mobile }, { empId: empId }] 
            });
            
            if (oldWorker) {
                return res.send({ status: "error", data: "Worker already exists with this mobile or Employee ID!" });
            }

            await Worker.create({
                name,
                mobile,
                password,
                department, 
                empId,
                assigned_issues: [] 
            });
            return res.send({ status: "ok", data: "Worker Created Successfully" });
        } 
        
        else {
            return res.send({ status: "error", data: "Invalid or missing Role" });
        }

    } catch (e) {
        console.log("Error Creating Account:", e);
        res.send({ status: "error", data: e.message });
    }
});



// --- CREATE ISSUE API (WITH AI PRIORITY) ---
app.post('/create-issue', async (req, res) => {
    const { category, description, locationName, coordinates, image, user_id } = req.body;

    let assignedPriority = "Low"; 

    try {
        const prompt = `
        You are an AI assistant for a smart city civic reporting app. 
        Analyze the following issue and assign a priority level of High, Medium, or Low.
        
        Category: ${category}
        Description: ${description}
        
        Respond with EXACTLY ONE WORD: High, Medium, or Low. Do not add any punctuation or extra text.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
        });

        // NO PARENTHESES AFTER TEXT!
        const aiResponse = response.text.trim(); 
        
        if (['High', 'Medium', 'Low'].includes(aiResponse)) {
            assignedPriority = aiResponse;
        } else {
            if (aiResponse.includes('High')) assignedPriority = 'High';
            else if (aiResponse.includes('Medium')) assignedPriority = 'Medium';
        }
        
        console.log(`AI assigned priority: ${assignedPriority} for issue: ${category}`);

    } catch (aiError) {
        console.log("Gemini API Error (Falling back to default):", aiError.message);
    }

    try {
        await Issue.create({
            category,
            description,
            locationName,
            coordinates,
            image,
            user_id: user_id,
            status: "Pending",
            priority: assignedPriority,
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

app.post('/login-user', async (req, res) => {
    const { mobile, password } = req.body;

    try {
        const citizen = await User.findOne({ mobile });
        if (citizen && citizen.password === password) {
            return res.send({ status: "ok", data: citizen, role: "citizen" });
        }
        const worker = await Worker.findOne({ mobile });
        if (worker && worker.password === password) {
            return res.send({ status: "ok", data: worker, role: "worker" });
        }
        return res.send({ status: "error", data: "Invalid Credentials" });

    } catch (error) {
        res.send({ status: "error", data: "Server Error" });
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


// --- ENHANCE DESCRIPTION API (GEMINI) ---
app.post('/enhance-description', async (req, res) => {
    const { text } = req.body;

    if (!text) return res.send({ status: "error", data: "No text provided" });

    try {
        const prompt = `
        You are an AI assistant helping a citizen report a civic issue to the government. 
        Please rewrite the following description to make it sound highly professional, clear, and concise. 
        Do not invent new facts, just improve the grammar, tone, and clarity. Keep it under 3 sentences.
        
        Original description: "${text}"
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const enhancedText = response.text.trim();
        res.send({ status: "ok", data: enhancedText });
    } catch (error) {
        console.log("Error enhancing text:", error);
        res.send({ status: "error", data: "Could not enhance text at this time." });
    }
});

// --- ASSIGN ISSUE TO WORKER ---
app.post('/assign-issue', async (req, res) => {
    const { issue_id, worker_id, worker_name } = req.body;

    try {
        const issue = await Issue.findById(issue_id);
        if (!issue) return res.send({ status: "error", data: "Issue not found" });

        issue.assigned_worker_id = worker_id;
        issue.assigned_worker_name = worker_name;
        
        // Optionally, auto-change status to Processing when assigned
        if (issue.status === "Pending") {
            issue.status = "Processing";
        }

        await issue.save();
        res.send({ status: "ok", data: "Issue Assigned Successfully" });
    } catch (error) {
        console.log("Error Assigning Issue:", error);
        res.send({ status: "error", data: error.message });
    }
});


// --- WORKER: GET ASSIGNED ISSUES ---
app.post('/get-worker-issues', async (req, res) => {
    const { worker_id } = req.body;
    try {
        const issues = await Issue.find({ assigned_worker_id: worker_id }).sort({ date: -1 });
        res.send({ status: "ok", data: issues });
    } catch (error) {
        res.send({ status: "error", data: error.message });
    }
});

// --- WORKER: UPLOAD PROOF & RESOLVE ---
app.post('/resolve-issue', async (req, res) => {
    const { issue_id, completed_image } = req.body;
    try {
        const issue = await Issue.findById(issue_id);
        if (!issue) return res.send({ status: "error", data: "Issue not found" });

        // Update the fields
        issue.completed_image = completed_image;
        issue.status = "Solved";
        issue.resolved_date = new Date();

        await issue.save();
        res.send({ status: "ok", data: "Issue marked as Solved with proof!" });
    } catch (error) {
        console.log("Error Resolving Issue:", error);
        res.send({ status: "error", data: error.message });
    }
});

// --- ADMIN: REJECT WORKER RESOLUTION ---
app.post('/reject-issue-resolution', async (req, res) => {
    const { issue_id } = req.body;

    try {
        const issue = await Issue.findById(issue_id);
        if (!issue) return res.send({ status: "error", data: "Issue not found" });

        // Revert the issue back to processing and delete the proof image
        issue.status = "Processing";
        issue.completed_image = null;
        if (issue.resolved_date) {
            issue.resolved_date = null; // Clear the resolved date if you added it
        }

        await issue.save();
        res.send({ status: "ok", data: "Resolution rejected. Issue sent back to Processing." });
    } catch (error) {
        console.log("Error Rejecting Resolution:", error);
        res.send({ status: "error", data: error.message });
    }
});

// --- CANCEL / DELETE ISSUE (CITIZEN API) ---
app.post('/delete-issue', async (req, res) => {
    const { issue_id } = req.body;

    try {
        // 1. Find the issue in the database
        const issue = await Issue.findById(issue_id);
        
        if (!issue) {
            return res.send({ status: "error", data: "Issue not found." });
        }

        // 2. Security Check: Only allow deletion if it is still "Pending"
        if (issue.status !== "Pending") {
            return res.send({ 
                status: "error", 
                data: "Cannot cancel. This issue is already being processed or has been solved." 
            });
        }

        // 3. Delete the issue permanently
        await Issue.findByIdAndDelete(issue_id);
        res.send({ status: "ok", data: "Issue cancelled successfully." });

    } catch (error) {
        console.log("Error Cancelling Issue:", error);
        res.send({ status: "error", data: error.message });
    }
});

app.get('/get-workers', async (req, res) => {
    try {
        const activeWorkers = await Worker.find({ status: "Active" });
        
        res.send({ status: "ok", data: activeWorkers });
    } catch (error) {
        console.log("Error fetching active workers:", error);
        res.send({ status: "error", message: error.message });
    }
});

// Get Worker Profile
app.post('/get-worker-profile', async (req, res) => {
    const { worker_id } = req.body;
    try {
        const worker = await Worker.findById(worker_id);
        if (!worker) return res.send({ status: "error", data: "Worker not found" });
        
        res.send({ status: "ok", data: worker });
    } catch (error) {
        res.send({ status: "error", data: error.message });
    }
});

// Update Worker Status
app.post('/update-worker-status', async (req, res) => {
    const { worker_id, status } = req.body;
    try {
        const validStatuses = ["Active", "Inactive"];
        if (!validStatuses.includes(status)) {
            return res.send({ status: "error", data: "Invalid status state" });
        }

        await Worker.findByIdAndUpdate(worker_id, { status: status });
        res.send({ status: "ok", data: "Status updated successfully" });
    } catch (error) {
        res.send({ status: "error", data: error.message });
    }
});


app.listen(8001, '0.0.0.0', () => {
    console.log("Node.js Server Started on Port 8001");
});