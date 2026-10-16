// ===== Student Attendance Management System =====
// Data model (both saved in localStorage as JSON text):
//   students   = [ { roll, name, cls, dept }, ... ]
//   attendance = { "2026-10-15": { "101": "Present", "102": "Absent" }, ... }
// Because each date holds one entry per roll number, a student can never
// have two records for the same date (this prevents duplicates).

var students = [];
var attendance = {};

// ---------- Small helper functions ----------
function $(id) { return document.getElementById(id); }

function todayString() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

function daysAgo(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

// Stops names like <b> from being treated as HTML
function safe(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

var messageTimer;
function showMessage(text, type) {
  var box = $("message");
  box.textContent = text;
  box.className = "message " + type;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(function () { box.className = "message hidden"; }, 4000);
}

// ---------- localStorage ----------
function saveData() {
  localStorage.setItem("students", JSON.stringify(students));
  localStorage.setItem("attendance", JSON.stringify(attendance));
}

function loadData() {
  var s = localStorage.getItem("students");
  var a = localStorage.getItem("attendance");
  if (s === null) {
    loadSampleData();           // first time: add demo records
  } else {
    students = JSON.parse(s);
    attendance = a ? JSON.parse(a) : {};
  }
}

function loadSampleData() {
  students = [
    { roll: "101", name: "Aarav Sharma", cls: "TYIT", dept: "Information Technology" },
    { roll: "102", name: "Diya Patil", cls: "TYIT", dept: "Information Technology" },
    { roll: "103", name: "Rohan Deshmukh", cls: "TYIT", dept: "Information Technology" },
    { roll: "201", name: "Sneha Kulkarni", cls: "SYIT", dept: "Information Technology" },
    { roll: "202", name: "Karan Joshi", cls: "SYIT", dept: "Information Technology" }
  ];
  attendance = {};
  attendance[daysAgo(2)] = { "101": "Present", "102": "Present", "103": "Absent", "201": "Present", "202": "Present" };
  attendance[daysAgo(1)] = { "101": "Present", "102": "Absent", "103": "Present", "201": "Absent", "202": "Present" };
  saveData();
}

// ---------- Page navigation ----------
function showPage(pageId) {
  var pages = document.querySelectorAll(".page");
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove("active");
  $(pageId).classList.add("active");

  var buttons = document.querySelectorAll(".nav-btn[data-page]");
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].classList.toggle("active", buttons[j].getAttribute("data-page") === pageId);
  }
  $("sidebar").classList.remove("open");   // close menu on mobile

  if (pageId === "dashboard") updateDashboard();
  if (pageId === "students") renderStudents();
  if (pageId === "attendance") fillClassDropdown();
  if (pageId === "reports") renderReport();
}

// ---------- Dashboard ----------
function updateDashboard() {
  var today = attendance[todayString()] || {};
  var present = 0, absent = 0;
  for (var i = 0; i < students.length; i++) {
    var status = today[students[i].roll];
    if (status === "Present") present++;
    if (status === "Absent") absent++;
  }

  // Overall percentage = all Present records / all records of current students
  var totalRecords = 0, presentRecords = 0;
  for (var date in attendance) {
    for (var k = 0; k < students.length; k++) {
      var s = attendance[date][students[k].roll];
      if (s) { totalRecords++; if (s === "Present") presentRecords++; }
    }
  }
  var percent = totalRecords === 0 ? 0 : Math.round((presentRecords / totalRecords) * 100);

  $("cardTotal").textContent = students.length;
  $("cardPresent").textContent = present;
  $("cardAbsent").textContent = absent;
  $("cardPercent").textContent = percent + "%";
  $("todayLabel").textContent = "(" + todayString() + ")";
}

// ---------- Student management ----------
function renderStudents() {
  var html = "";
  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    html += "<tr><td>" + safe(s.roll) + "</td><td>" + safe(s.name) + "</td><td>" +
      safe(s.cls) + "</td><td>" + safe(s.dept) + "</td><td>" +
      "<button class='btn btn-small' onclick=\"editStudent('" + i + "')\">Edit</button>" +
      "<button class='btn btn-small btn-danger' onclick=\"deleteStudent('" + i + "')\">Delete</button>" +
      "</td></tr>";
  }
  if (html === "") html = "<tr><td colspan='5' class='empty'>No students yet. Add one using the form above.</td></tr>";
  $("studentTable").innerHTML = html;
}

function resetStudentForm() {
  $("studentForm").reset();
  $("editingRoll").value = "";
  $("roll").disabled = false;
  $("saveStudentBtn").textContent = "Add Student";
  $("cancelEditBtn").classList.add("hidden");
}

function findStudentIndex(roll) {
  for (var i = 0; i < students.length; i++) {
    if (students[i].roll.toLowerCase() === roll.toLowerCase()) return i;
  }
  return -1;
}

function handleStudentSubmit(event) {
  event.preventDefault();
  var roll = $("roll").value.trim();
  var name = $("name").value.trim();
  var cls = $("className").value.trim();
  var dept = $("dept").value.trim();
  var editing = $("editingRoll").value;

  // Validation
  if (roll === "" || name === "" || cls === "" || dept === "") {
    showMessage("Error: please fill in all four fields.", "error");
    return;
  }

  if (editing !== "") {
    // Edit mode: roll number cannot change, so there is no duplicate risk
    var index = findStudentIndex(editing);
    students[index] = { roll: editing, name: name, cls: cls, dept: dept };
    saveData();
    resetStudentForm();
    renderStudents();
    showMessage("Student details updated successfully.", "success");
    return;
  }

  // Add mode: block duplicate roll numbers
  if (findStudentIndex(roll) !== -1) {
    showMessage("Error: roll number " + roll + " already exists.", "error");
    return;
  }
  students.push({ roll: roll, name: name, cls: cls, dept: dept });
  saveData();
  resetStudentForm();
  renderStudents();
  showMessage("Student added successfully.", "success");
}

function editStudent(i) {
  var s = students[i];
  $("roll").value = s.roll;
  $("roll").disabled = true;          // roll number is the unique ID, keep it fixed
  $("name").value = s.name;
  $("className").value = s.cls;
  $("dept").value = s.dept;
  $("editingRoll").value = s.roll;
  $("saveStudentBtn").textContent = "Update Student";
  $("cancelEditBtn").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function deleteStudent(i) {
  var s = students[i];
  if (!confirm("Delete " + s.name + " (Roll " + s.roll + ")? Their attendance records will also be removed.")) return;
  for (var date in attendance) delete attendance[date][s.roll];
  students.splice(i, 1);
  saveData();
  renderStudents();
  showMessage("Student deleted.", "success");
}

// ---------- Mark attendance ----------
function fillClassDropdown() {
  var classes = [];
  for (var i = 0; i < students.length; i++) {
    if (classes.indexOf(students[i].cls) === -1) classes.push(students[i].cls);
  }
  var current = $("attClass").value;
  var html = "";
  for (var j = 0; j < classes.length; j++) html += "<option>" + safe(classes[j]) + "</option>";
  if (html === "") html = "<option value=''>No classes available</option>";
  $("attClass").innerHTML = html;
  if (classes.indexOf(current) !== -1) $("attClass").value = current;
  if ($("attDate").value === "") $("attDate").value = todayString();
}

function loadAttendanceList() {
  var date = $("attDate").value;
  var cls = $("attClass").value;
  if (date === "") { showMessage("Error: please select a date.", "error"); return; }
  if (cls === "") { showMessage("Error: please add students first.", "error"); return; }

  var saved = attendance[date] || {};   // show earlier choices if this date was already saved
  var html = "";
  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    if (s.cls !== cls) continue;
    var status = saved[s.roll] || "Present";
    html += "<tr><td>" + safe(s.roll) + "</td><td>" + safe(s.name) + "</td><td>" +
      "<select class='status-select' data-roll='" + safe(s.roll) + "'>" +
      "<option" + (status === "Present" ? " selected" : "") + ">Present</option>" +
      "<option" + (status === "Absent" ? " selected" : "") + ">Absent</option>" +
      "</select></td></tr>";
  }
  $("attTable").innerHTML = html;
  $("saveAttBtn").classList.remove("hidden");
  $("allPresentBtn").classList.remove("hidden");
}

function markAllPresent() {
  var selects = document.querySelectorAll(".status-select");
  for (var i = 0; i < selects.length; i++) selects[i].value = "Present";
}

function saveAttendance() {
  var date = $("attDate").value;
  var selects = document.querySelectorAll(".status-select");
  if (date === "" || selects.length === 0) {
    showMessage("Error: load a student list before saving.", "error");
    return;
  }
  if (!attendance[date]) attendance[date] = {};
  // Writing to the same key again replaces the old value, so no duplicates
  for (var i = 0; i < selects.length; i++) {
    attendance[date][selects[i].getAttribute("data-roll")] = selects[i].value;
  }
  saveData();
  showMessage("Attendance saved for " + date + ".", "success");
}

// ---------- Reports ----------
function getWorkingDays() {
  // A working day = any date that has saved attendance
  return Object.keys(attendance).sort();
}

function renderReport() {
  var search = $("searchBox").value.trim().toLowerCase();
  var filterDate = $("filterDate").value;
  var days = getWorkingDays();
  $("workingDays").textContent = "Total working days (dates with saved attendance): " + days.length;
  $("historyBox").classList.add("hidden");

  var head, html = "";
  if (filterDate === "") {
    head = "<tr><th>Roll No</th><th>Name</th><th>Class</th><th>Working Days</th><th>Present</th><th>Absent</th><th>Attendance %</th><th class='no-print'>History</th></tr>";
  } else {
    head = "<tr><th>Roll No</th><th>Name</th><th>Class</th><th>Status on " + safe(filterDate) + "</th></tr>";
  }
  $("reportHead").innerHTML = head;

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    if (search !== "" && s.roll.toLowerCase().indexOf(search) === -1 && s.name.toLowerCase().indexOf(search) === -1) continue;

    if (filterDate !== "") {
      var st = attendance[filterDate] ? attendance[filterDate][s.roll] : null;
      var label = st ? "<span class='tag-" + st.toLowerCase() + "'>" + st + "</span>" : "Not marked";
      html += "<tr><td>" + safe(s.roll) + "</td><td>" + safe(s.name) + "</td><td>" + safe(s.cls) + "</td><td>" + label + "</td></tr>";
    } else {
      var p = 0, a = 0;
      for (var d = 0; d < days.length; d++) {
        var v = attendance[days[d]][s.roll];
        if (v === "Present") p++;
        if (v === "Absent") a++;
      }
      var total = p + a;
      var pct = total === 0 ? 0 : Math.round((p / total) * 100);
      html += "<tr><td>" + safe(s.roll) + "</td><td>" + safe(s.name) + "</td><td>" + safe(s.cls) + "</td><td>" +
        total + "</td><td>" + p + "</td><td>" + a + "</td><td>" + pct + "%</td>" +
        "<td class='no-print'><button class='btn btn-small' onclick=\"showHistory('" + safe(s.roll) + "')\">View</button></td></tr>";
    }
  }
  if (html === "") html = "<tr><td colspan='8' class='empty'>No matching records found.</td></tr>";
  $("reportTable").innerHTML = html;
}

function showHistory(roll) {
  var s = students[findStudentIndex(roll)];
  var days = getWorkingDays().reverse();   // newest first
  var html = "";
  for (var i = 0; i < days.length; i++) {
    var v = attendance[days[i]][roll];
    if (v) html += "<tr><td>" + days[i] + "</td><td class='tag-" + v.toLowerCase() + "'>" + v + "</td></tr>";
  }
  if (html === "") html = "<tr><td colspan='2' class='empty'>No attendance saved for this student yet.</td></tr>";
  $("historyTitle").textContent = "Attendance history: " + s.name + " (Roll " + s.roll + ")";
  $("historyTable").innerHTML = html;
  $("historyBox").classList.remove("hidden");
  $("historyBox").scrollIntoView({ behavior: "smooth" });
}

function clearFilters() {
  $("searchBox").value = "";
  $("filterDate").value = "";
  renderReport();
}

// ---------- Clear demo data ----------
function clearAllData() {
  if (!confirm("This will delete ALL students and attendance records. Continue?")) return;
  students = [];
  attendance = {};
  saveData();
  $("attTable").innerHTML = "";
  updateDashboard();
  renderStudents();
  showMessage("All data cleared. You can now add your own students.", "success");
}

// ---------- Connect buttons to functions ----------
function setup() {
  var navButtons = document.querySelectorAll(".nav-btn[data-page]");
  for (var i = 0; i < navButtons.length; i++) {
    navButtons[i].addEventListener("click", function () { showPage(this.getAttribute("data-page")); });
  }
  $("menuBtn").addEventListener("click", function () { $("sidebar").classList.toggle("open"); });
  $("studentForm").addEventListener("submit", handleStudentSubmit);
  $("cancelEditBtn").addEventListener("click", resetStudentForm);
  $("loadListBtn").addEventListener("click", loadAttendanceList);
  $("saveAttBtn").addEventListener("click", saveAttendance);
  $("allPresentBtn").addEventListener("click", markAllPresent);
  $("searchBox").addEventListener("input", renderReport);
  $("filterDate").addEventListener("change", renderReport);
  $("clearFilterBtn").addEventListener("click", clearFilters);
  $("printBtn").addEventListener("click", function () { window.print(); });
  $("clearDataBtn").addEventListener("click", clearAllData);

  $("attDate").value = todayString();
  loadData();
  updateDashboard();
}

setup();
