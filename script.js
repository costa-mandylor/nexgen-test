/**
 * Table Manager Module - Handles all table operations and interactions
 * Uses IIFE pattern for encapsulation and private scope
 * @module TableManager
 */
const TableManager = (function () {
  /* Configuration Block
   * Defines structure for input types and default data
   * - inputs: specifies UI elements for editing
   * - initialData: provides starting table content
   */
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

  /* DOM Cache
   * Stores frequently accessed elements to improve performance
   * Prevents repeated DOM queries
   */
  const elements = {};

  /* Core Initialization Functions
   * Sets up the module and prepares for user interaction
   */
  function init() {
    cacheDOM();
    bindEvents();
    loadInitialData();
  }

  /* DOM Caching
   * Stores references to key DOM elements used throughout the module
   * Improves performance by reducing DOM queries
   */
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

  /* Event Binding
   * Sets up all event listeners for table interactions
   * Handles: search, add/delete rows, cell editing, sorting
   */
  function bindEvents() {
    elements.search.addEventListener("input", searchTable);
    elements.addRowBtn.addEventListener("click", addRow);
    elements.addRowBtnBottom.addEventListener("click", addRow);
    elements.tbody.addEventListener("dblclick", handleCellEdit);

    Object.values(elements.tableHeadings).forEach((heading) => {
      console.log("heading", heading);
      heading.addEventListener("click", () => sortTable(heading));
    });

    document.addEventListener("click", handleClickOutside);
  }

  /**
   * Loads initial data into the table
   * @function loadInitialData
   * @private
   */
  function loadInitialData() {
    CONFIG.initialData.forEach(createTableRow);
  }

  /**
   * Creates a new table row with unique identifiers
   * @function createTableRow
   * @param {Object} [data={}] - Data to populate the row
   * @returns {HTMLElement} The created row element
   * @private
   */
  function createTableRow(data = {}) {
    const row = document.createElement("tr");
    row.id = `row-${Date.now()}`;
    row.className = "table__row";
    row.innerHTML = generateRowHTML(data);
    attachRowEventListeners(row);
    elements.tbody.appendChild(row);
    return row;
  }

  /**
   * Generates HTML structure for table row
   * @function generateRowHTML
   * @param {Object} data - Data for row cells
   * @returns {string} HTML string for row
   * @private
   */
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

  /**
   * Attaches event listeners to row elements
   * @function attachRowEventListeners
   * @param {HTMLElement} row - Row element to attach listeners to
   * @private
   */
  function attachRowEventListeners(row) {
    row.querySelectorAll("[id^='edit-']").forEach((icon) => {
      icon.addEventListener("click", (e) => {
        const cell = e.target.closest(".table__cell");
        handleCellEdit({ target: cell });
        e.stopPropagation();
      });
    });

    const deleteBtn = row.querySelector("[id^='delete-']");
    deleteBtn.addEventListener("click", () => deleteRow(row));
  }

  /**
   * Handles cell editing interaction
   * @function handleCellEdit
   * @param {Event} event - Click event object
   * @private
   */
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

  /**
   * Creates appropriate input element based on cell type
   * @function createInputElement
   * @param {string} dataType - Type of data (name, age, gender)
   * @param {string} currentValue - Current cell value
   * @returns {HTMLElement} Created input element
   * @private
   */
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

  /**
   * Sets up event listeners for input elements
   * @function setupInputEventListeners
   * @param {HTMLElement} cell - Cell containing input
   * @param {HTMLElement} input - Input element
   * @private
   */
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

  /**
   * Creates cell content container
   * @function createCellContent
   * @param {string} value - Cell value
   * @returns {HTMLElement} Cell content container
   * @private
   */
  function createCellContent(value) {
    const content = document.createElement("div");
    content.className = "table__cell-content";
    content.id = `content-${Date.now()}`;

    const textSpan = document.createElement("span");
    textSpan.className = "table__cell-text";
    textSpan.textContent = value;

    content.appendChild(textSpan);
    return content;
  }

  /**
   * Creates edit icon with event listener
   * @function createEditIcon
   * @param {HTMLElement} cell - Cell element
   * @returns {HTMLElement} Edit icon element
   * @private
   */
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

  /**
   * Handles table search functionality
   * @function searchTable
   * @private
   */
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

  /**
   * Handles table column sorting
   * @function sortTable
   * @param {HTMLElement} heading - Column heading element
   * @private
   */
  function sortTable(heading) {
    const column = heading.dataset.sort;
    const rows = Array.from(elements.tbody.querySelectorAll("tr"));

    const currentOrder = heading.classList.contains("asc") ? -1 : 1;

    Object.values(elements.tableHeadings).forEach((th) => {
      th.classList.remove("asc", "desc");
      th.querySelector(".sort-icon").textContent = "↑";
    });

    heading.classList.add(currentOrder === 1 ? "asc" : "desc");
    heading.querySelector(".sort-icon").textContent =
      currentOrder === 1 ? "↓" : "↑";

    const sortedRows = rows.sort((a, b) => {
      const aCell = a.querySelector(`[data-type="${column}"]`);
      const bCell = b.querySelector(`[data-type="${column}"]`);

      let aValue = aCell.textContent.trim();
      let bValue = bCell.textContent.trim();

      if (column === "age") {
        return currentOrder * (Number(aValue) - Number(bValue));
      }

      return currentOrder * aValue.localeCompare(bValue);
    });

    sortedRows.forEach((row) => elements.tbody.appendChild(row));
  }

  /**
   * Adds new row to table
   * @function addRow
   * @public
   */
  function addRow() {
    const newRow = createTableRow();
    const firstCell = newRow.querySelector(".table__cell");
    handleCellEdit({ target: firstCell });
  }

  /**
   * Deletes row from table
   * @function deleteRow
   * @param {HTMLElement} row - Row to delete
   * @public
   */
  function deleteRow(row) {
    if (confirm("Are you sure you want to delete this row?")) {
      row.remove();
    }
  }

  /**
   * Handles clicks outside of input elements
   * @function handleClickOutside
   * @param {Event} event - Click event object
   * @private
   */
  function handleClickOutside(event) {
    if (!event.target.closest(".table__input")) {
      document
        .querySelectorAll(".table__input")
        .forEach((input) => input.blur());
    }
  }

  /** @public {Object} Public API */
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
