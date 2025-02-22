// Table Manager Module using IIFE pattern for encapsulation
const TableManager = (function () {
  // Configuration object defining input types and initial data
  const CONFIG = {
    inputs: {
      gender: {
        type: "select",
        options: ["Male", "Female", "Other"],
        className: "input input--select",
      },
      age: {
        type: "input",
        inputType: "number",
        className: "input",
      },
      name: {
        type: "input",
        inputType: "text",
        className: "input",
      },
    },
    initialData: [{ name: "John Doe", age: 25, gender: "Male" }],
  };

  // Cache for DOM elements
  const elements = {};

  // Initialize the module
  function init() {
    cacheDOM();
    bindEvents();
    loadInitialData();
  }

  // Cache all required DOM elements for better performance
  function cacheDOM() {
    elements.search = document.getElementById("searchInput");
    elements.tbody = document.getElementById("editableTableBody");
    elements.addRowBtn = document.getElementById("addRowBtn");
    elements.addRowBtnBottom = document.getElementById("addRowBtnBottom");
    elements.tableHeadings = {
      name: document.getElementById("nameHeading"),
      age: document.getElementById("ageHeading"),
      gender: document.getElementById("genderHeading"),
    };
  }

  // Bind all event listeners
  function bindEvents() {
    elements.search.addEventListener("input", searchTable);
    elements.addRowBtn.addEventListener("click", addRow);
    elements.addRowBtnBottom.addEventListener("click", addRow);
    elements.tbody.addEventListener("dblclick", handleCellEdit);

    // Add click handlers for column sorting
    Object.values(elements.tableHeadings).forEach((heading) => {
      console.log("heading", heading);
      heading.addEventListener("click", () => sortTable(heading));
    });

    document.addEventListener("click", handleClickOutside);
  }

  // Load initial table data
  function loadInitialData() {
    CONFIG.initialData.forEach(createTableRow);
  }

  // Create a new table row with unique IDs
  function createTableRow(data = {}) {
    const row = document.createElement("tr");
    row.id = `row-${Date.now()}`;
    row.className = "table__row";
    row.innerHTML = generateRowHTML(data);
    attachRowEventListeners(row);
    elements.tbody.appendChild(row);
    return row;
  }

  // Generate HTML for table row cells
  function generateRowHTML(data) {
    const cells = ["name", "age", "gender"]
      .map(
        (type) => `
        <td class="table__cell" id="cell-${type}-${Date.now()}" data-type="${type}">
          <div class="table__cell-content" id="content-${type}-${Date.now()}">
            <span className="table__cell-text">${data[type] || ""}</span>
            <img src="icons/edit-icon.svg" class="table__edit-icon" id="edit-${type}-${Date.now()}" alt="Edit">
          </div>
        </td>
      `
      )
      .join("");

    return `${cells}<td><button class="btn btn--danger" id="delete-${Date.now()}"><img src="icons/trash.svg" alt="" aria-hidden="true" /><span>Delete</span></button></td>`;
  }

  // Attach event listeners to row elements
  function attachRowEventListeners(row) {
    // Add edit icon click handlers
    row.querySelectorAll("[id^='edit-']").forEach((icon) => {
      icon.addEventListener("click", (e) => {
        const cell = e.target.closest(".table__cell");
        handleCellEdit({ target: cell });
        e.stopPropagation();
      });
    });

    // Add delete button handler
    const deleteBtn = row.querySelector("[id^='delete-']");
    deleteBtn.addEventListener("click", () => deleteRow(row));
  }

  // Handle cell editing when clicked
  function handleCellEdit(event) {
    const cell = event.target.closest(".table__cell");
    if (!cell) return;

    const content = cell.querySelector(".table__cell-content");
    const currentValue = content.textContent.trim();
    const dataType = cell.dataset.type;

    const input = createInputElement(dataType, currentValue);
    input.id = `input-${dataType}-${Date.now()}`;
    cell.textContent = "";
    cell.appendChild(input);
    input.focus();

    setupInputEventListeners(cell, input);
  }

  // Create appropriate input element based on data type
  function createInputElement(dataType, currentValue) {
    const config = CONFIG.inputs[dataType];

    if (config.type === "select") {
      const select = document.createElement("select");
      select.className = config.className;
      select.innerHTML = config.options
        .map(
          (option) =>
            `<option value="${option}">${
              option.charAt(0).toUpperCase() + option.slice(1)
            }</option>`
        )
        .join("");
      select.value = currentValue;
      return select;
    }

    const input = document.createElement("input");
    input.className = config.className;
    input.type = config.inputType;
    input.value = currentValue;
    return input;
  }

  // Set up event listeners for input elements
  function setupInputEventListeners(cell, input) {
    const saveAndRestore = () => {
      const content = createCellContent(input.value);
      const editIcon = createEditIcon(cell);
      content.appendChild(editIcon);
      cell.textContent = "";
      cell.appendChild(content);
    };

    input.addEventListener("blur", saveAndRestore);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") input.blur();
    });
  }

  // Create cell content container
  function createCellContent(value) {
    const content = document.createElement("div");
    content.className = "table__cell-content";
    content.id = `content-${Date.now()}`;

    // Create text span with truncation
    const textSpan = document.createElement("span");
    textSpan.className = "table__cell-text";
    textSpan.textContent = value;

    // Add elements to content
    content.appendChild(textSpan);
    return content;
  }

  // Create edit icon with event listener
  function createEditIcon(cell) {
    const editIcon = document.createElement("img");
    editIcon.src = "icons/edit-icon.svg";
    editIcon.className = "table__edit-icon";
    editIcon.id = `edit-${Date.now()}`;
    editIcon.alt = "Edit";
    editIcon.addEventListener("click", (e) => {
      handleCellEdit({ target: cell });
      e.stopPropagation();
    });
    return editIcon;
  }

  // Handle table search functionality
  function searchTable() {
    const searchTerm = elements.search.value.toLowerCase();
    const rows = elements.tbody.querySelectorAll("tr");

    rows.forEach((row, index) => {
      const text = row.textContent.toLowerCase();
      const isVisible = text.includes(searchTerm);
      row.classList.toggle("hide", !isVisible);
      row.style.setProperty("--delay", `${index * 0.04}s`);
    });
  }

  // Handle table column sorting
  function sortTable(heading) {
    const column = heading.dataset.sort;
    const rows = Array.from(elements.tbody.querySelectorAll("tr"));

    // Toggle sort direction
    const currentOrder = heading.classList.contains("asc") ? -1 : 1;

    // Update sort icons and classes
    Object.values(elements.tableHeadings).forEach((th) => {
      th.classList.remove("asc", "desc");
      th.querySelector(".sort-icon").textContent = "↑";
    });

    heading.classList.add(currentOrder === 1 ? "asc" : "desc");
    heading.querySelector(".sort-icon").textContent =
      currentOrder === 1 ? "↓" : "↑";

    // Sort rows
    const sortedRows = rows.sort((a, b) => {
      const aCell = a.querySelector(`[data-type="${column}"]`);
      const bCell = b.querySelector(`[data-type="${column}"]`);

      let aValue = aCell.textContent.trim();
      let bValue = bCell.textContent.trim();

      // Handle number sorting for age column
      if (column === "age") {
        return currentOrder * (Number(aValue) - Number(bValue));
      }

      // String comparison for other columns
      return currentOrder * aValue.localeCompare(bValue);
    });

    // Re-append sorted rows
    sortedRows.forEach((row) => elements.tbody.appendChild(row));
  }

  // Add new row to table
  function addRow() {
    const newRow = createTableRow();
    const firstCell = newRow.querySelector(".table__cell");
    handleCellEdit({ target: firstCell });
  }

  // Delete row from table
  function deleteRow(row) {
    if (confirm("Are you sure you want to delete this row?")) {
      row.remove();
    }
  }

  // Handle clicks outside of input elements
  function handleClickOutside(event) {
    if (!event.target.closest(".table__input")) {
      document
        .querySelectorAll(".table__input")
        .forEach((input) => input.blur());
    }
  }

  // Public API
  return {
    init,
    addRow,
    deleteRow,
    sortTable,
    searchTable,
  };
})();

// Initialize TableManager when DOM is ready
document.addEventListener("DOMContentLoaded", TableManager.init);
