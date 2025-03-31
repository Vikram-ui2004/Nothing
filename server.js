  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");
  require("dotenv").config();
  
  const app = express();
  const allowedOrigins = [
    "https://nothing-site-ten.vercel.app", // Production Frontend
    "http://localhost:5173", // Development Frontend
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy does not allow this origin!"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }));
  

  app.use(express.json()); // Middleware to parse JSON
  

  // Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));
  
// Define Suggestion Schema
const suggestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    time: { type: Date, default: Date.now }
  })
  // Define Frustration Schema & Model
  const frustrationSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Store name of the person
    text: { type: String, required: true },
    time: { type: Date, default: Date.now },
    suggestions: [suggestionSchema]
  });
  
  const Frustration = mongoose.model("Frustration", frustrationSchema);
  
  // ➤ Submit a New Frustration
  app.post("/api/vent", async (req, res) => {
    try {
      const { name, text } = req.body;
      if (!name || !text) return res.status(400).json({ error: "Name and text are required" });
  
      const newVent = new Frustration({ name, text });
      await newVent.save();
      res.status(201).json(newVent);
    } catch (error) {
      console.error("❌ Error submitting frustration:", error);
      res.status(500).json({ error: "Failed to save frustration" });
    }
  });
  
  // ➤ Get All Frustrations
  app.get("/api/vent", async (req, res) => {
    try {
      const vents = await Frustration.find().sort({ time: -1 });
      res.json(vents);
    } catch (error) {
      console.error("❌ Error fetching frustrations:", error);
      res.status(500).json({ error: "Failed to fetch frustrations" });
    }
  });
  
  // ➤ Update (Edit) Frustration
app.put("/api/vent/:id", async (req, res) => {
    try {
      const updatedVent = await Frustration.findByIdAndUpdate(
        req.params.id,
        { text: req.body.text },
        { new: true }
      );
      if (!updatedVent) {
        return res.status(404).json({ error: "Frustration not found" });
      }
      res.json(updatedVent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update frustration" });
    }
  });
  
  // ➤ Delete a Frustration
  app.delete("/api/vent/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedVent = await Frustration.findByIdAndDelete(id);
  
      if (!deletedVent) return res.status(404).json({ error: "Frustration not found" });
  
      res.json({ message: "Frustration deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting frustration:", error);
      res.status(500).json({ error: "Failed to delete frustration" });
    }
  });
  
  // ➤ Submit a New Suggestion
app.post("/api/vent/:id/suggestion", async (req, res) => {
    try {
      const { text } = req.body;
      const vent = await Frustration.findById(req.params.id);
      if (!vent) return res.status(404).json({ error: "Frustration not found" });
  
      vent.suggestions.push({ text });
      await vent.save();
      res.json(vent);
    } catch (error) {
      res.status(500).json({ error: "Failed to add suggestion" });
    }
  });
  
  app.get("/", (req, res) => {
    res.send("Server running");
  });
  // Start Server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  