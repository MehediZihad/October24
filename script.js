"use strict";

const STORAGE_KEY = "student-desk-records";

const studentForm = document.querySelector("#student-form");
const studentNameInput = document.querySelector("#student-name");
const studentIdInput = document.querySelector("#student-id");
const studentEmailInput = document.querySelector("#student-email");
const studentCourseInput = document.querySelector("#student-course");
const studentSearchInput = document.querySelector("#student-search");
const studentList = document.querySelector("#student-list");
const studentCount = document.querySelector("#student-count");
const emptyState = document.querySelector("#empty-state");
const statusMessage = document.querySelector("#status-message");

let students = loadStudents();

function loadStudents() {
  try {
    const savedRecords = localStorage.getItem(STORAGE_KEY);

    if (savedRecords === null) {
      return [];
    }

    const parsedRecords = JSON.parse(savedRecords);
    const validRecords =
      Array.isArray(parsedRecords) &&
      parsedRecords.every(
        (student) =>
          student &&
          typeof student.name === "string" &&
          typeof student.studentId === "string" &&
          typeof student.email === "string" &&
          typeof student.course === "string",
      );

    if (!validRecords) {
      throw new Error("Saved student records have an invalid format.");
    }

    return parsedRecords;
  } catch (error) {
    showStatus(
      "Saved records could not be loaded. Add a student to start a new list.",
      true,
    );
    console.error("Could not load student records:", error);
    return [];
  }
}

function saveStudents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    return true;
  } catch (error) {
    showStatus(
      "Your change could not be saved. Check your browser storage settings and try again.",
      true,
    );
    console.error("Could not save student records:", error);
    return false;
  }
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function renderStudents() {
  const searchTerm = studentSearchInput.value.trim().toLowerCase();
  const matchingStudents = students.filter((student) =>
    [student.name, student.studentId, student.email, student.course].some((value) =>
      value.toLowerCase().includes(searchTerm),
    ),
  );

  studentList.replaceChildren();
  studentCount.textContent = String(students.length);
  emptyState.classList.toggle("visible", matchingStudents.length === 0);

  const emptyTitle = emptyState.querySelector("h3");
  const emptyCopy = emptyState.querySelector("p");
  if (students.length === 0) {
    emptyTitle.textContent = "No students yet";
    emptyCopy.textContent = "Add your first student using the form to get started.";
  } else if (matchingStudents.length === 0) {
    emptyTitle.textContent = "No matching students";
    emptyCopy.textContent = "Try a different name, ID, email, or course.";
  }

  matchingStudents.forEach((student) => {
    const row = document.createElement("tr");

    const studentCell = document.createElement("td");
    const studentDetails = document.createElement("div");
    studentDetails.className = "student-cell";

    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = getInitials(student.name);

    const studentInfo = document.createElement("div");
    const name = document.createElement("p");
    name.className = "student-name";
    name.textContent = student.name;
    const email = document.createElement("p");
    email.className = "student-email";
    email.textContent = student.email;

    studentInfo.append(name, email);
    studentDetails.append(avatar, studentInfo);
    studentCell.append(studentDetails);

    const idCell = document.createElement("td");
    idCell.textContent = student.studentId;

    const courseCell = document.createElement("td");
    courseCell.textContent = student.course;

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${student.name}`);
    deleteButton.addEventListener("click", () => deleteStudent(student.studentId));
    actionCell.append(deleteButton);

    row.append(studentCell, idCell, courseCell, actionCell);
    studentList.append(row);
  });
}

function deleteStudent(studentId) {
  const studentIndex = students.findIndex(
    (student) => student.studentId === studentId,
  );

  if (studentIndex === -1) {
    showStatus("That student could not be found.", true);
    return;
  }

  const [deletedStudent] = students.splice(studentIndex, 1);
  if (!saveStudents()) {
    students.splice(studentIndex, 0, deletedStudent);
    return;
  }

  showStatus(`${deletedStudent.name} was deleted.`);
  renderStudents();
}

studentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const student = {
    name: studentNameInput.value.trim(),
    studentId: studentIdInput.value.trim(),
    email: studentEmailInput.value.trim(),
    course: studentCourseInput.value.trim(),
  };

  if (Object.values(student).some((value) => value === "")) {
    showStatus("Please complete every field before adding a student.", true);
    return;
  }

  const duplicateId = students.some(
    (savedStudent) =>
      savedStudent.studentId.toLowerCase() === student.studentId.toLowerCase(),
  );

  if (duplicateId) {
    showStatus("That student ID is already in use. Enter a unique ID.", true);
    studentIdInput.focus();
    return;
  }

  students.push(student);
  if (!saveStudents()) {
    students.pop();
    return;
  }

  studentForm.reset();
  showStatus(`${student.name} was added successfully.`);
  renderStudents();
  studentNameInput.focus();
});

studentSearchInput.addEventListener("input", renderStudents);

renderStudents();
