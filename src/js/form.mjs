"use strict";
import { showMore, resetModal, handleError, userData, setUserData, translations, _paq } from "../render.js";
import { RecExtension } from "./todotxtExtensions.mjs";
import { generateFilterData } from "./filters.mjs";
import { items, item, setTodoComplete } from "./todos.mjs";
import { datePickerInput } from "./datePicker.mjs";
import * as recurrencePicker from "./recurrencePicker.mjs";
const autoCompleteContainer = document.getElementById("autoCompleteContainer");
const recurrencePickerInput = document.getElementById("recurrencePickerInput");
const modalTitle = document.getElementById("modalTitle");
const modalFormAlert = document.getElementById("modalFormAlert");
const modalForm = document.getElementById("modalForm");
modalForm.addEventListener("submit", function(e) {
  // intercept submit
  if (e.preventDefault) e.preventDefault();
  submitForm().then(response => {
    console.log(response);
  }).catch(error => {
    handleError(error);
  });
});
modalForm.addEventListener ("keydown", function(e) {
  if(event.ctrlKey && event.shiftKey && event.key.length===1 && event.key.match(/[a-z]/i)) {
    e.preventDefault();
    setPriority(event.key.substr(0,1)).then(response => {
      console.log(response);
    }).catch(error => {
      handleError(error);
    });
  } else if(event.ctrlKey && event.shiftKey && event.key.length===1 && event.key.match(/[_]/i)) {
    setPriority(null).then(response => {
      console.log(response);
    }).catch(error => {
      handleError(error);
    });
  } else if(e.key==="Enter" && e.ctrlKey) {
    submitForm().then(response => {
      console.log(response);
    }).catch(error => {
      handleError(error);
    });
  } else if(event.key === "Escape" && !autoCompleteContainer.classList.contains("is-active")) {
    resetModal().then(function(result) {
      console.log(result);
    }).catch(function(error) {
      handleError(error);
    });
    //this.classList.remove("is-active");
  } else if(event.key === "Escape" && autoCompleteContainer.classList.contains("is-active")) {
    autoCompleteContainer.classList.remove("is-active");
  }
});
modalForm.addEventListener ("click", function() {
  // close recurrence picker if click is outside of recurrence container
  if(!event.target.closest("#recurrencePickerContainer") && event.target!=recurrencePickerInput) document.getElementById("recurrencePickerContainer").classList.remove("is-active")
});
const modalFormInputResize = document.getElementById("modalFormInputResize");
modalFormInputResize.onclick = function() {
  toggleInputSize(this.getAttribute("data-input-type"));
  // trigger matomo event
  if(userData.matomoEvents) _paq.push(["trackEvent", "Form", "Click on Resize"]);
}
const modalBackground = document.querySelectorAll('.modal-background');
const modalClose = document.querySelectorAll('.close');
modalClose.forEach(function(el) {
  el.onclick = function() {
    if(el.getAttribute("data-message")) {
      // persist closed message, so it won't show again
      if(!userData.dismissedMessages.includes(el.getAttribute("data-message"))) userData.dismissedMessages.push(el.getAttribute("data-message"))
      setUserData("dismissedMessages", userData.dismissedMessages);
      // trigger matomo event
      if(userData.matomoEvents) _paq.push(["trackEvent", "Message", "Click on Close"]);
    } else {
      // trigger matomo event
      if(userData.matomoEvents) _paq.push(["trackEvent", "Modal", "Click on Close"]);
    }
    el.parentElement.parentElement.classList.remove("is-active");
  }
});
document.getElementById("modalFormInput").addEventListener("keyup", e => {
  modalFormInputEvent();
  // do not show suggestion container if Escape has been pressed
  if(e.key==="Escape") return false;
});
document.getElementById("modalFormInput").placeholder = translations.formTodoInputPlaceholder;
modalBackground.forEach(function(el) {
  el.onclick = function() {
    resetModal().then(function(result) {
      console.log(result);
    }).catch(function(error) {
      handleError(error);
    });
    el.parentElement.classList.remove("is-active");
    autoCompleteContainer.classList.remove("is-active");
    autoCompleteContainer.blur();
    // trigger matomo event
    if(userData.matomoEvents) _paq.push(["trackEvent", "Modal", "Click on Background"]);
  }
});
const priorityPicker = document.getElementById("priorityPicker");
priorityPicker.addEventListener("change", e => {
  setPriority(e.target.value).then(response => {
    console.log(response);
  }).catch(error => {
    handleError(error);
  });
});
priorityPicker.onfocus = function() {
  // close suggestion box if focus comes to priority picker
  autoCompleteContainer.classList.remove("is-active");
};
const btnItemStatus = document.getElementById("btnItemStatus");
btnItemStatus.onclick = function() {
  setTodoComplete(this.parentElement.parentElement.parentElement.parentElement.getAttribute("data-item")).then(response => {
    modalForm.classList.remove("is-active");
    resetModal().then(function(result) {
      console.log(result);
    }).catch(function(error) {
      handleError(error);
    });
    console.log(response);
    // trigger matomo event
    if(userData.matomoEvents) _paq.push(["trackEvent", "Form", "Click on Done/In progress"]);
  }).catch(error => {
    handleError(error);
  });
}
function resizeInput(input) {
  if(input.value) {
    input.style.width = input.value.length + 6 + "ch";
  } else if(!input.value && input.placeholder) {
    input.style.width = input.placeholder.length + 6 + "ch";
  }
}
function show(todo, templated) {
  try {
    // adjust size of recurrence picker input field
    if(userData.useTextarea) toggleInputSize("input");
    // in case the more toggle menu is open we close it
    showMore(false);
    datePickerInput.value = null;
    modalForm.classList.toggle("is-active");
    document.getElementById("modalFormInput").value = null;
    document.getElementById("modalFormInput").focus();
    modalFormAlert.innerHTML = null;
    modalFormAlert.parentElement.classList.remove("is-active", 'is-warning', 'is-danger');
    // here we configure the headline and the footer buttons
    if(todo) {
      // replace invisible multiline ascii character with new line
      todo = todo.replaceAll(String.fromCharCode(16),"\r\n");
      // we need to check if there already is a due date in the object
      todo = new TodoTxtItem(todo, [ new DueExtension(), new HiddenExtension(), new RecExtension() ]);
      // set the priority
      setPriority(todo.priority);
      //
      if(templated === true) {
        // this is a new templated todo task
        // erase the original creation date and description
        todo.date = null;
        todo.text = "____________";
        document.getElementById("modalFormInput").value = todo.toString();
        modalTitle.innerHTML = translations.addTodo;
        // automatically select the placeholder description
        let selectStart = document.getElementById("modalFormInput").value.indexOf(todo.text);
        let selectEnd = selectStart + todo.text.length;
        document.getElementById("modalFormInput").setSelectionRange(selectStart, selectEnd);
        btnItemStatus.classList.remove("is-active");
      } else {
        // this is an existing todo task to be edited
        // put the initially passed todo to the modal data field
        modalForm.setAttribute("data-item", todo.toString());
        document.getElementById("modalFormInput").value = todo;
        modalTitle.innerHTML = translations.editTodo;
        btnItemStatus.classList.add("is-active");
      }
      //btnItemStatus.classList.add("is-active");
      // only show the complete button on open items
      if(todo.complete === false) {
        btnItemStatus.innerHTML = translations.done;
      } else {
        btnItemStatus.innerHTML = translations.inProgress;
      }
      // if there is a recurrence
      if(todo.rec) {
        recurrencePicker.setInput(todo.rec).then(function(result) {
          console.log(result);
        }).catch(function(error) {
          handleError(error);
        });
      }
      // if so we paste it into the input field
      if(todo.dueString) {
        datePickerInput.value = todo.dueString;
      }
    } else {
      modalTitle.innerHTML = translations.addTodo;
      btnItemStatus.classList.remove("is-active");
    }
    // adjust size of picker inputs
    resizeInput(datePickerInput);
    resizeInput(recurrencePickerInput);
    // in any case put focus into the input field
    document.getElementById("modalFormInput").focus();
    // if textarea, resize to content length
    if(document.getElementById("modalFormInput").tagName==="TEXTAREA") {
      document.getElementById("modalFormInput").style.height="auto";
      document.getElementById("modalFormInput").style.height= document.getElementById("modalFormInput").scrollHeight+"px";
    }
    return Promise.resolve("Info: Show/Edit todo window opened");
  } catch (error) {
    error.functionName = show.name;
    return Promise.reject(error);
  }
}
function positionAutoCompleteContainer() {
  // Adjust position of suggestion box to input field
  let modalFormInputPosition = document.getElementById("modalFormInput").getBoundingClientRect();
  autoCompleteContainer.style.width = document.getElementById("modalFormInput").offsetWidth + "px";
  autoCompleteContainer.style.top = modalFormInputPosition.top + document.getElementById("modalFormInput").offsetHeight+2 + "px";
  autoCompleteContainer.style.left = modalFormInputPosition.left + "px";
}
function getCaretPosition(inputId) {
  var content = inputId;
  if((content.selectionStart!=null)&&(content.selectionStart!=undefined)){
    var position = content.selectionStart;
    return position;
  } else {
    return false;
  }
}
function modalFormInputEvent() {
  positionAutoCompleteContainer();
  // if textarea, resize to content length
  if(document.getElementById("modalFormInput").tagName==="TEXTAREA") {
    document.getElementById("modalFormInput").style.height="auto";
    document.getElementById("modalFormInput").style.height= document.getElementById("modalFormInput").scrollHeight+"px";
  }
  let autoCompleteValue ="";
  let autoCompletePrefix = "";
  let caretPosition = getCaretPosition(modalFormInput);
  let autoCompleteCategory = "";
  if((document.getElementById("modalFormInput").value.charAt(caretPosition-2) === " " || document.getElementById("modalFormInput").value.charAt(caretPosition-2) === "\n") && (document.getElementById("modalFormInput").value.charAt(caretPosition-1) === "@" || document.getElementById("modalFormInput").value.charAt(caretPosition-1) === "+")) {
    autoCompleteValue = document.getElementById("modalFormInput").value.substr(caretPosition, document.getElementById("modalFormInput").value.lastIndexOf(" ")).split(" ").shift();
    autoCompletePrefix = document.getElementById("modalFormInput").value.charAt(caretPosition-1);
  } else if(document.getElementById("modalFormInput").value.charAt(caretPosition) === " ") {
    autoCompleteValue = document.getElementById("modalFormInput").value.substr(document.getElementById("modalFormInput").value.lastIndexOf(" ", caretPosition-1)+2).split(" ").shift();
    autoCompletePrefix = document.getElementById("modalFormInput").value.charAt(document.getElementById("modalFormInput").value.lastIndexOf(" ", caretPosition-1)+1);
  } else if(document.getElementById("modalFormInput").value.charAt(document.getElementById("modalFormInput").value.lastIndexOf(" ", caretPosition)+1) === "@" || document.getElementById("modalFormInput").value.charAt(document.getElementById("modalFormInput").value.lastIndexOf(" ", caretPosition)+1) === "+") {
    autoCompleteValue = document.getElementById("modalFormInput").value.substr(document.getElementById("modalFormInput").value.lastIndexOf(" ", caretPosition)+2).split(" ").shift();
    autoCompletePrefix = document.getElementById("modalFormInput").value.charAt(document.getElementById("modalFormInput").value.lastIndexOf(" ", caretPosition)+1);
  } else {
    autoCompleteContainer.classList.remove("is-active");
    autoCompleteContainer.blur();
    return false;
  }
  // suppress suggestion box if caret is at the end of word
  if(autoCompletePrefix==="+" || autoCompletePrefix==="@") {
    if(autoCompletePrefix=="+") {
      autoCompleteCategory = "projects";
    } else if(autoCompletePrefix=="@") {
      autoCompleteCategory = "contexts";
    }
    // parsed data will be passed to generate filter data and build the filter buttons
    generateFilterData(autoCompleteCategory, autoCompleteValue, autoCompletePrefix, caretPosition).then(response => {
      console.log(response);
    }).catch (error => {
      handleError(error);
    });
  } else {
    autoCompleteContainer.classList.remove("is-active");
    autoCompleteContainer.blur();
  }
}
function setPriorityInput(priority) {
  if(priority===null) {
    priorityPicker.selectedIndex = 0;
  } else {
    Array.from(priorityPicker.options).forEach(function(option) {
      if(option.value===priority) {
        priorityPicker.selectedIndex = option.index;
      }
    });
  }
}
function setPriority(priority) {
  try {
    const modalFormInput = document.getElementById("modalFormInput");
    if(priority) {
      priority = priority.toUpperCase();
    } else {
      priority = null;
    }
    let todo = new TodoTxtItem(document.getElementById("modalFormInput").value, [ new DueExtension(), new HiddenExtension(), new RecExtension() ]);
    todo.priority = priority;
    document.getElementById("modalFormInput").value = todo.toString();
    setPriorityInput(priority);

    // trigger matomo event
    if(userData.matomoEvents) _paq.push(["trackEvent", "Form", "Priority changed to: " + priority]);
    return Promise.resolve("Success: Priority changed to " + priority)
  } catch(error) {
    error.functionName = setPriority.name;
    return Promise.reject(error);
  }
}
function toggleInputSize(type) {
  let newInputElement;
  switch (type) {
    case "input":
      console.log("create textarea");
      newInputElement = document.createElement('textarea');
      modalFormInputResize.setAttribute("data-input-type", "textarea");
      modalFormInputResize.innerHTML = "<i class=\"fas fa-compress-alt\"></i>";
      setUserData("useTextarea", true);
      break;
    case "textarea":
    console.log("create input");
      newInputElement = document.createElement('input');
      newInputElement.type = "text";
      modalFormInputResize.setAttribute("data-input-type", "input");
      modalFormInputResize.innerHTML = "<i class=\"fas fa-expand-alt\"></i>";
      setUserData("useTextarea", false);
      break;
  }
  newInputElement.id = "modalFormInput";
  newInputElement.value = document.getElementById("modalFormInput").value;
  newInputElement.setAttribute("tabindex", 300);
  newInputElement.setAttribute("class", "input is-medium");
  newInputElement.setAttribute("placeholder", translations.formTodoInputPlaceholder);
  document.getElementById("modalFormInput").replaceWith(newInputElement);
  // if input is a textarea, adjust height to content length
  if(document.getElementById("modalFormInput").tagName==="TEXTAREA") {
    document.getElementById("modalFormInput").style.height="auto";
    document.getElementById("modalFormInput").style.height = document.getElementById("modalFormInput").scrollHeight+"px";
  }
  positionAutoCompleteContainer();
  document.getElementById("modalFormInput").addEventListener("keyup", e => {
    modalFormInputEvent();
    // do not show suggestion container if Escape has been pressed
    if(e.key==="Escape") return false;
  });
  document.getElementById("modalFormInput").focus();
}
//needs refactoring
function submitForm() {
  try {
    // check if there is an input in the text field, otherwise indicate it to the user
    // input value and data item are the same, nothing has changed, nothing will be written
    if (modalForm.getAttribute("data-item")===modalForm.elements[0].value) {
      // close and reset any modal
      resetModal().then(function(result) {
        console.log(result);
      }).catch(function(error) {
        handleError(error);
      });
      return Promise.resolve("Info: Nothing has changed, won't write anything.");
    // Edit todo
    } else if(modalForm.getAttribute("data-item")!=null) {
      // get index of todo
      const index = items.objects.map(function(item) {return item.toString(); }).indexOf(modalForm.getAttribute("data-item"));
      // create a todo.txt object
      // replace new lines with spaces (https://stackoverflow.com/a/34936253)
      let todo = new TodoTxtItem(modalForm.elements[0].value.replaceAll(/[\r\n]+/g, String.fromCharCode(16)), [ new DueExtension(), new HiddenExtension(), new RecExtension() ]);
      // check and prevent duplicate todo
      if(items.objects.map(function(item) {return item.toString(); }).indexOf(todo.toString())!=-1) {
        modalFormAlert.innerHTML = translations.formInfoDuplicate;
        modalFormAlert.parentElement.classList.remove("is-active", 'is-danger');
        modalFormAlert.parentElement.classList.add("is-active", 'is-warning');
        return Promise.resolve("Info: Todo already exists in file, won't write duplicate");
      // check if todo text is empty
      } else if(!todo.text) {
        modalFormAlert.innerHTML = translations.formInfoIncomplete;
        modalFormAlert.parentElement.classList.remove("is-active", 'is-danger');
        modalFormAlert.parentElement.classList.add("is-active", 'is-warning');
        return Promise.resolve("Info: Todo is incomplete");
      }
      // jump to index, remove 1 item there and add the value from the input at that position
      items.objects.splice(index, 1, todo);
    // Add todo
    } else if(modalForm.getAttribute("data-item")==null && modalForm.elements[0].value!="") {
      // in case there hasn't been a passed data item, we just push the input value as a new item into the array
      // replace new lines with spaces (https://stackoverflow.com/a/34936253)
      let todo = new TodoTxtItem(modalForm.elements[0].value.replaceAll(/[\r\n]+/g, String.fromCharCode(16)), [ new DueExtension(), new HiddenExtension(), new RecExtension() ]);
      // we add the current date to the start date attribute of the todo.txt object
      todo.date = new Date();
      // check and prevent duplicate todo
      if(items.objects.map(function(item) {return item.toString(); }).indexOf(todo.toString())!=-1) {
        modalFormAlert.innerHTML = translations.formInfoDuplicate;
        modalFormAlert.parentElement.classList.remove("is-active", 'is-danger');
        modalFormAlert.parentElement.classList.add("is-active", 'is-warning');
        return Promise.resolve("Info: Todo already exists in file, won't write duplicate");
      // check if todo text is empty
      } else if(!todo.text) {
        modalFormAlert.innerHTML = translations.formInfoIncomplete;
        modalFormAlert.parentElement.classList.remove("is-active", 'is-danger');
        modalFormAlert.parentElement.classList.add("is-active", 'is-warning');
        return Promise.resolve("Info: Todo is incomplete");
      }
      // we build the array
      items.objects.push(todo);
      // mark the todo for anchor jump after next reload
      item.previous = todo.toString();
    } else if(modalForm.elements[0].value=="") {
      modalFormAlert.innerHTML = translations.formInfoNoInput;
      modalFormAlert.parentElement.classList.remove("is-active", 'is-danger');
      modalFormAlert.parentElement.classList.add("is-active", 'is-warning');
      return Promise.resolve("Info: Will not write empty todo");
    }
    //write the data to the file
    // a newline character is added to prevent other todo.txt apps to append new todos to the last line
    window.api.send("writeToFile", [items.objects.join("\n").toString() + "\n", userData.file]);
    // close and reset any modal
    resetModal().then(function(result) {
      console.log(result);
    }).catch(function(error) {
      handleError(error);
    });
    // trigger matomo event
    if(userData.matomoEvents) _paq.push(["trackEvent", "Form", "Submit"]);
    return Promise.resolve("Success: Changes written to file: " + userData.file);
  // if the input field is empty, let users know
  } catch (error) {
    // if writing into file is denied throw alert
    modalFormAlert.innerHTML = translations.formErrorWritingFile + userData.file;
    modalFormAlert.parentElement.classList.add("is-active", 'is-danger');
    error.functionName = submitForm.name;
    return Promise.reject(error);
  }
}
window.onresize = function() {
  try {
    positionAutoCompleteContainer();
  } catch(error) {
    error.functionName = "window.onresize";
    handleError(error);
    return Promise.reject(error);
  }
}

export { show, positionAutoCompleteContainer, resizeInput};