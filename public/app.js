const studentsTbody = document.getElementById("studentsTbody");
const recordCount = document.getElementById("recordCount");
const searchInput = document.getElementById("searchInput");
const genderFilter = document.getElementById("genderFilter");
const programFilter = document.getElementById("programFilter");
const addStudentBtn = document.getElementById("addStudentBtn");

let students = [];

// ✅ Fetch Students from Backend
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

// ✅ Render Table (with truncate + no horizontal scroll)
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

// ✅ Populate Program Filter Dropdown
function populateProgramFilter(data) {
  const uniquePrograms = [...new Set(data.map(s => s.Program))];
  programFilter.innerHTML = `<option value="">All Programs</option>` + uniquePrograms.map(p => `<option>${p}</option>`).join("");
}

// ✅ Handle Add
addStudentBtn.addEventListener("click", async () => {
  const newStudent = {
    "Student ID": document.getElementById("studentID").value,
    "Full Name": document.getElementById("fullName").value,
    "Gender": document.getElementById("gender").value,
    Gmail: document.getElementById("gmail").value,
    Program: document.getElementById("program").value,
    "Year Level": document.getElementById("yearLevel").value,
    University: document.getElementById("university").value,
  };

  const res = await fetch("/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newStudent),
  });

  if (res.ok) fetchStudents(); // refresh table
});

// ✅ Handle Delete
async function handleDelete(e) {
  const id = e.target.getAttribute("data-id");
  await fetch(`/students/${id}`, { method: "DELETE" });
  fetchStudents(); // refresh
}

// ✅ Live Search & Filter
[searchInput, genderFilter, programFilter].forEach((el) => {
  el.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const genderTerm = genderFilter.value;
    const programTerm = programFilter.value;

    const filtered = students.filter((s) => {
      return (
        (s["Full Name"].toLowerCase().includes(searchTerm) || s.Program.toLowerCase().includes(searchTerm)) &&
        (genderTerm === "" || s.Gender === genderTerm) &&
        (programTerm === "" || s.Program === programTerm)
      );
    });

    renderTable(filtered);
  });
});

// ✅ Initial Load
fetchStudents();
