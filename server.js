const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Detect if running on Render
const isRender = process.env.RENDER === "true";

// ✅ Use /tmp for Render (writable), else use /data for local dev
const LOCAL_DATA_PATH = path.join(__dirname, "data", "students.json");
const RENDER_DATA_PATH = path.join("/tmp", "students.json");
const DATA_PATH = isRender ? RENDER_DATA_PATH : LOCAL_DATA_PATH;

// ✅ If running on Render, make sure the JSON file exists in /tmp
(async () => {
  if (isRender) {
    try {
      // Try copying from original data location on first boot
      await fs.copyFile(LOCAL_DATA_PATH, RENDER_DATA_PATH);
      console.log("✅ Copied students.json to /tmp for Render");
    } catch (err) {
      console.log("⚠ No initial students.json copy needed or failed:", err.message);
    }
  }
})();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Helper: read students
async function readStudents() {
  try {
    const content = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading students.json:", err);
    return [];
  }
}

// Helper: write students
async function writeStudents(arr) {
  try {
    await fs.writeFile(DATA_PATH, JSON.stringify(arr, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing students.json:", err);
    throw err;
  }
}

/**
 * Routes
 */

// ✅ GET /students
app.get("/students", async (req, res) => {
  const students = await readStudents();
  res.json(students);
});

// ✅ POST /students
app.post("/students", async (req, res) => {
  const {
    "Student ID": StudentID,
    "Full Name": FullName,
    Gender,
    Gmail,
    Program,
    "Year Level": YearLevel,
    University
  } = req.body;

  if (!StudentID || !FullName || !Gender || !Gmail || !Program || YearLevel === undefined || !University) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const students = await readStudents();

  if (students.some(s => s["Student ID"] === StudentID)) {
    return res.status(409).json({ error: "Student ID already exists." });
  }

  const newStudent = {
    "Student ID": StudentID,
    "Full Name": FullName,
    Gender,
    Gmail,
    Program,
    "Year Level": YearLevel,
    University
  };

  students.push(newStudent);

  try {
    await writeStudents(students);
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: "Could not save student." });
  }
});

// ✅ DELETE /students/:id
app.delete("/students/:id", async (req, res) => {
  const id = req.params.id;
  const students = await readStudents();
  const index = students.findIndex(s => s["Student ID"] === id);

  if (index === -1) {
    return res.status(404).json({ error: "Student not found." });
  }

  const removed = students.splice(index, 1)[0];

  try {
    await writeStudents(students);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: "Could not delete student." });
  }
});

// ✅ Serve frontend fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ SIMS server running on http://localhost:${PORT}`);
  if (isRender) {
    console.log("🚀 Running in Render environment — using /tmp/students.json for write access.");
  }
});
