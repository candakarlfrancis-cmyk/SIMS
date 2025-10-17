const studentsTbody = document.getElementById("studentsTbody");
const recordCount = document.getElementById("recordCount");
const searchInput = document.getElementById("searchInput");
const genderFilter = document.getElementById("genderFilter");
const programFilter = document.getElementById("programFilter");
const addStudentBtn = document.getElementById("addStudentBtn");

let students = [];

// ✅ Toast Function (Bottom Right)
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;

  // Apply base class + dynamic color
  toast.className =
    "fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg transition duration-300 pointer-events-none " +
    (type === "success" ? "bg-green-600" : "bg-red-600");

  // Show toast
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)"; // slides in clean

  // Hide after 2 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)"; // smooth slide down
  }, 2000);
}

// ✅ Fetch Students
async function fetchStudents() {
  try {
    const res = await fetch("/students");
    students = await res.json();
    populateProgramFilter(students);
    renderTable(students);
  } catch (err) {
    studentsTbody.innerHTML = `<tr><td colspan="8" class="px-3 py-4 text-center text-slate-500">Could not load students.</td></tr>`;
  }
}

// ✅ Render Table
function renderTable(list) {
  if (!Array.isArray(list) || list.length === 0) {
    studentsTbody.innerHTML = `<tr><td colspan="8" class="px-3 py-4 text-center text-slate-500">No records found</td></tr>`;
    recordCount.textContent = 0;
    return;
  }

  recordCount.textContent = list.length;
  studentsTbody.innerHTML = list
    .map(
      (s) => `
      <tr class="hover:bg-slate-100">
        <td class="px-2 py-1.5 border truncate" title="${s["Student ID"]}">${s["Student ID"]}</td>
        <td class="px-2 py-1.5 border truncate" title="${s["Full Name"]}">${s["Full Name"]}</td>
        <td class="px-2 py-1.5 border truncate" title="${s.Gender}">${s.Gender}</td>
        <td class="px-2 py-1.5 border truncate" title="${s.Gmail}">${s.Gmail}</td>
        <td class="px-2 py-1.5 border truncate" title="${s.Program}">${s.Program}</td>
        <td class="px-2 py-1.5 border truncate" title="${s["Year Level"]}">${s["Year Level"]}</td>
        <td class="px-2 py-1.5 border truncate" title="${s.University}">${s.University}</td>
        <td class="px-2 py-1.5 border text-center">
          <button 
            data-id="${encodeURIComponent(s["Student ID"])}"
            class="deleteBtn px-2 py-1 border border-slate-400 rounded text-xs bg-slate-100 hover:bg-red-600 hover:text-white hover:border-red-600">
            Delete
          </button>
        </td>
      </tr>
    `
    )
    .join("");

  // ✅ Reattach delete events
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", handleDelete);
  });
}

// ✅ Populate Program Filter
function populateProgramFilter(data) {
  const uniquePrograms = [...new Set(data.map((s) => s.Program))];
  programFilter.innerHTML =
    `<option value="">All Programs</option>` +
    uniquePrograms.map((p) => `<option>${p}</option>`).join("");
}

// ✅ Handle Add Student + Toast + Field Clear
addStudentBtn.addEventListener("click", async () => {
  const newStudent = {
    "Student ID": document.getElementById("studentID").value.trim(),
    "Full Name": document.getElementById("fullName").value.trim(),
    Gender: document.getElementById("gender").value.trim(),
    Gmail: document.getElementById("gmail").value.trim(),
    Program: document.getElementById("program").value.trim(),
    "Year Level": document.getElementById("yearLevel").value.trim(),
    University: document.getElementById("university").value.trim(),
  };

  try {
    const res = await fetch("/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStudent),
    });

    if (res.ok) {
      showToast("✅ Student added successfully!", "success");

      // ✅ Auto Clear Fields
      document.getElementById("studentID").value = "";
      document.getElementById("fullName").value = "";
      document.getElementById("gender").value = "";
      document.getElementById("gmail").value = "";
      document.getElementById("program").value = "";
      document.getElementById("yearLevel").value = "";
      document.getElementById("university").value = "";

      fetchStudents(); // refresh table
    } else {
      const errorData = await res.json();
      showToast("❌ " + (errorData.error || "Failed to add student"), "error");
    }
  } catch (err) {
    showToast("❌ Server error. Please try again.", "error");
  }
});

// ✅ Handle Delete + Toast
async function handleDelete(e) {
  const id = decodeURIComponent(e.target.getAttribute("data-id"));
  if (!confirm("Are you sure you want to delete this student?")) return;

  try {
    const res = await fetch(`/students/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("🗑️ Student deleted successfully!", "success");
      fetchStudents(); // refresh table
    } else {
      showToast("❌ Failed to delete student.", "error");
    }
  } catch (err) {
    showToast("❌ Server error on delete.", "error");
  }
}

// ✅ Live Search & Filter
[searchInput, genderFilter, programFilter].forEach((el) => {
  el.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const genderTerm = genderFilter.value;
    const programTerm = programFilter.value;

    const filtered = students.filter((s) => {
      return (
        (s["Full Name"].toLowerCase().includes(searchTerm) ||
          s.Program.toLowerCase().includes(searchTerm)) &&
        (genderTerm === "" || s.Gender === genderTerm) &&
        (programTerm === "" || s.Program === programTerm)
      );
    });

    renderTable(filtered);
  });
});

// ✅ Initial Load
fetchStudents();
