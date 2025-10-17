const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, "data", "students.json");

// Middleware
app.use(express.json());
app.use(cors()); // safe because frontend is served from same server; kept for flexibility
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
  await fs.writeFile(DATA_PATH, JSON.stringify(arr, null, 2), "utf8");
}

/**
 * Routes
 */

// GET /students -> return all students
app.get("/students", async (req, res) => {
  const students = await readStudents();
  res.json(students);
});

// POST /students -> add a student
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

  // Basic validation
  if (!StudentID || !FullName || !Gender || !Gmail || !Program || YearLevel === undefined || !University) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Optional: Year Level numeric check if user wants numeric
  // (We allow string or number, but can enforce if necessary)
  // if (isNaN(Number(YearLevel))) { ... }

  const students = await readStudents();

  // Check unique Student ID
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
    console.error("Error writing students:", err);
    res.status(500).json({ error: "Could not save student." });
  }
});

// DELETE /students/:id -> delete by Student ID
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
    console.error("Error writing students:", err);
    res.status(500).json({ error: "Could not delete student." });
  }
});

// Fallback: serve index.html for any other route (SPA style)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`SIMS server running on http://localhost:${PORT}`);
});
