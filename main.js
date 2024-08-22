document.getElementById('eventForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Get the input values
    const eventName = document.getElementById('eventName').value.trim();
    const eventDate = document.getElementById('eventDate').value.trim();
    const eventTime = document.getElementById('eventTime').value.trim();
    const eventLocation = document.getElementById('eventLocation').value.trim();

    // Validate the form: check if any field is empty
    if (!eventName || !eventDate || !eventTime || !eventLocation) {
        alert("Please fill in all fields before creating an event.");
        return;
    }

    // Check if we are editing an event
    const editingIndex = document.getElementById('eventForm').getAttribute('data-editing-index');

    // Get events from localStorage
    const events = JSON.parse(localStorage.getItem('events')) || [];

    if (editingIndex !== null) {
        // If editing, update the event in the array
        events[editingIndex] = { name: eventName, date: eventDate, time: eventTime, location: eventLocation };
        document.getElementById('eventForm').removeAttribute('data-editing-index');
    } else {
        // If not editing, add the new event to the events array
        events.push({ name: eventName, date: eventDate, time: eventTime, location: eventLocation });
    }

    // Save the updated events array back to localStorage
    localStorage.setItem('events', JSON.stringify(events));

    // Reload the events list
    loadEvents();

    // Clear the form inputs
    document.getElementById('eventForm').reset();
});

// Function to load events from localStorage and display them
function loadEvents() {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    const eventList = document.getElementById('events');
    eventList.innerHTML = ''; // Clear the current list

    events.forEach((event, index) => addEventToDOM(event, index));
}

// Function to add event to the DOM
function addEventToDOM(event, index) {
    const eventItem = document.createElement('li');
    eventItem.classList.add('event-item');

    const eventDateTime = new Date(`${event.date}T${event.time}`);
    const now = new Date();

    // Check if the event date and time have passed
    if (eventDateTime < now) {
        eventItem.style.backgroundColor = '#808080'; // Set the background color to gray
    }

    eventItem.innerHTML = `
        <div>
            <strong>${event.name}</strong><br>
            Date: ${event.date}<br>
            Time: ${event.time}<br>
            Location: ${event.location}
        </div>
    `;

    // Create Edit and Delete icons
    const editIcon = document.createElement('i');
    editIcon.className = 'fas fa-edit edit-icon';
    editIcon.addEventListener('click', function () {
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time;
        document.getElementById('eventLocation').value = event.location;

        // Set the editing index so the form knows we are editing an event
        document.getElementById('eventForm').setAttribute('data-editing-index', index);
    });

    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fas fa-trash delete-icon';
    deleteIcon.addEventListener('click', function () {
        deleteEvent(index);
    });

    // Create a container for icons and append them
    const iconContainer = document.createElement('div');
    iconContainer.classList.add('icon-container');
    iconContainer.appendChild(editIcon);
    iconContainer.appendChild(deleteIcon);

    // Append the icon container to the event item
    eventItem.appendChild(iconContainer);

    // Append the new event to the list
    document.getElementById('events').appendChild(eventItem);
}

// Function to delete an event
function deleteEvent(index) {
    if (confirm("Are you sure you want to delete this event?")) {
        // Get events from localStorage
        const events = JSON.parse(localStorage.getItem('events')) || [];

        // Remove the event at the specified index
        events.splice(index, 1);

        // Save the updated events array back to localStorage
        localStorage.setItem('events', JSON.stringify(events));

        // Reload the events list
        loadEvents();
    }
}

// Set minimum date to today
const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format
document.getElementById('eventDate').setAttribute('min', today);

// Listen to date changes to update the minimum time if today is selected
document.getElementById('eventDate').addEventListener('change', function() {
    const selectedDate = this.value;
    const eventTime = document.getElementById('eventTime');

    if (selectedDate === today) {
        // Set the minimum time to the current time if today is selected
        const currentTime = new Date().toTimeString().split(' ')[0].slice(0, 5);
        eventTime.setAttribute('min', currentTime);
    } else {
        // If a future date is selected, remove the min attribute
        eventTime.removeAttribute('min');
    }
});

// Load events when the page loads
window.addEventListener('load', loadEvents);
// Function to notify the user (example with alert)
function notifyUser(eventName, eventTime) {
    if (Notification.permission === "granted") {
        new Notification(`Reminder: ${eventName}`, {
            body: `Event is scheduled at ${eventTime}`,
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(`Reminder: ${eventName}`, {
                    body: `Event is scheduled at ${eventTime}`,
                });
            }
        });
    }
}

// Function to check for due tasks and notify the user
function checkDueTasks() {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    const now = new Date();

    events.forEach(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const oneDayBefore = new Date(eventDateTime);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);

        const oneHourBefore = new Date(eventDateTime);
        oneHourBefore.setHours(oneHourBefore.getHours() - 1);

        // Check if the event is one day before and not yet notified
        if (now >= oneDayBefore && now < oneHourBefore && !event.notifiedDayBefore) {
            alert(`Reminder: Task "${event.name}" is due tomorrow!`);
            notifyUser(event.name, `due tomorrow at ${event.time}`);
            event.notifiedDayBefore = true; // Mark as notified for one day before
        }

        // Check if the event is one hour before and not yet notified
        if (now >= oneHourBefore && now < eventDateTime && !event.notifiedHourBefore) {
            alert(`Reminder: Task "${event.name}" is due in one hour!`);
            notifyUser(event.name, `due in one hour at ${event.time}`);
            event.notifiedHourBefore = true; // Mark as notified for one hour before
        }

        // Check if the event is due and not yet notified
        if (now >= eventDateTime && !event.notified) {
            alert(`Task "${event.name}" is due!`);
            notifyUser(event.name, event.time);
            event.notified = true; // Mark as notified
        }
    });

    // Save updated events back to localStorage
    localStorage.setItem('events', JSON.stringify(events));
}

// Request notification permission on page load
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

// Call checkDueTasks periodically (e.g., every minute)
setInterval(checkDueTasks, 60000); // 60000 ms = 1 minute

// Initial call to check for due tasks on page load
checkDueTasks();
