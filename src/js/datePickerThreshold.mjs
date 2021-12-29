"use strict";
import { userData, translations } from "../render.js";
import { _paq } from "./matomo.mjs";
import { resizeInput } from "./form.mjs";
import { formatDate } from "./helper.mjs";
import { items, currentTodo, editTodo } from "./todos.mjs";
import { RecExtension, SugarDueExtension, ThresholdExtension } from "./todotxtExtensions.mjs";
import "jstodotxt/jsTodoExtensions";
import "jstodotxt";
import Datepicker from "vanillajs-datepicker/js/Datepicker";
import de from "vanillajs-datepicker/js/i18n/locales/de";
import it from "vanillajs-datepicker/js/i18n/locales/it";
import es from "vanillajs-datepicker/js/i18n/locales/es";
import fr from "vanillajs-datepicker/js/i18n/locales/fr";

const autoCompleteContainer = document.getElementById("autoCompleteContainer");
const datePickerInput = document.getElementById("thresholdPickerInput");
const datePickerContainer = document.querySelector(".datepicker.datepicker-dropdown");

datePickerInput.onfocus = function () {
  datePicker.show();
  autoCompleteContainer.classList.remove("is-active");
  resizeInput(datePickerInput);
};
datePickerInput.addEventListener("changeDate", function (e) {
  // we only update the object if there is a date selected. In case of a refresh it would throw an error otherwise
  if(document.getElementById("modalForm").classList.contains("is-active")) {
    // generate the object on what is written into input, so we don't overwrite previous inputs of user
    let todo = new TodoTxtItem(document.getElementById("modalFormInput").value, [ new SugarDueExtension(), new HiddenExtension(), new RecExtension(), new ThresholdExtension() ]);
    if(datePicker.getDate()) {
      todo.threshold = datePicker.getDate();
      todo.thresholdString = formatDate(datePicker.getDate());
    } else {
      // in case delete button is pushed
      todo.threshold = undefined;
      todo.thresholdString = undefined;
    }
    // if suggestion box was open, it needs to be closed
    autoCompleteContainer.classList.remove("is-active");
    autoCompleteContainer.blur();
    // if a due date is set, the recurrence picker will be shown);
    document.getElementById("modalFormInput").value = todo.toString();
    document.getElementById("modalFormInput").focus();
    resizeInput(datePickerInput);
    datePicker.hide();
    // trigger matomo event
    if(userData.matomoEvents) _paq.push(["trackEvent", "Form", "Datepicker used to add date to input"]);
  } else {
    // get position of current todo in array
    const index = items.objects.map(function(item) {return item.toString(); }).indexOf(currentTodo.toString());
    // change the date
    if(datePicker.getDate()) {
      currentTodo.threshold = datePicker.getDate();
      currentTodo.thresholdString = formatDate(datePicker.getDate());
    } else {
      // in case delete button is pushed
      currentTodo.threshold = undefined;
      currentTodo.thresholdString = undefined;
    }
    // finally pass new todo on for changing
    editTodo(index, currentTodo);
    // trigger matomo event
    if(userData.matomoEvents) _paq.push(["trackEvent", "Todo-Table", "Datepicker used to change a date"]);
  }
  document.querySelector(".datepicker.datepicker-dropdown").classList.remove("visible");
});
datePickerInput.placeholder = translations.formSelectDueDate;
Object.assign(Datepicker.locales, de, it, es, fr);
const datePicker = new Datepicker(datePickerInput, {
  autohide: true,
  language: userData.language,
  format: "yyyy-mm-dd",
  clearBtn: true,
  calendarWeeks: true,
  weekStart: 1,
  beforeShowDay: function(date) {
    let today = new Date();
    if (date.getDate() == today.getDate() &&
        date.getMonth() == today.getMonth() &&
        date.getFullYear() == today.getFullYear()) {
      return { classes: 'today'};
    }
  }
});
// document.querySelector(".datepicker .clear-btn").onclick = function() {
//   let todo = new TodoTxtItem(document.getElementById("modalFormInput").value, [ new SugarDueExtension(), new HiddenExtension(), new RecExtension(), new ThresholdExtension() ]);
//   todo.due = undefined;
//   todo.dueString = undefined;
//   document.getElementById("modalFormInput").value = todo.toString();
//   resizeInput(datePickerInput);
//   datePicker.hide();
// }
export { datePickerInput, datePicker };
