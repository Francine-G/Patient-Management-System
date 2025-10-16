# Patient-Management-System
CC-206 Final Project


<html>
    <body>
        <h1>header ah</h1>
        <br>
        <h1>Description</h1>
        <h2>Purpose</h2>
        <br>
        <h1>Tech-Stack</h1>
        <p>PHP</p>
        <p>CSS</p>
        <p>HTML</p>
        <p>MySQL</p>
        <br>
        <h1>Features</h1>
        <section class="card">
            <h2>👨‍⚕️ Doctor View</h2>
            <h3 class="sub">Admin Dashboard</h3>
            <p class="note">Overview includes:</p>
            <ul>
                <li>Summary of Schedule</li>
                <li>Patient Count of the Week <em>(Bar Graph by Walk-in or Appointment)</em></li>
                <li>Queue Status</li>
                <li>Quick Access Buttons</li>
            </ul>
            <h3 class="sub">List of Patient Records</h3>
            <ul>
                <li>Queue List</li>
                <li>Doctor Schedule
                    <ul>
                        <li>Availability of the Doctor</li>
                        <li>View and Edit Schedule</li>
                    </ul>
                </li>
            </ul>
            <h3 class="sub">Patient History Record</h3>
            <ul>
                <li>Editable, Updatable, Addable</li>
                <li>Filter by Date or Alphabet (A–Z)</li>
            </ul>
            <h3 class="sub">Current Queuing</h3>
            <p class="note"><strong>Queue Board (Right Side):</strong></p>
            <ul>
                <li>Sorted A–Z</li>
                <li>Patient Name</li>
                <li>Company Affiliation (if applicable)</li>
                <li>Appointment Type <em>(Booked / Walk-in)</em></li>
                <li>Consultation Description</li>
            </ul>
            <p class="note"><strong>Current Patient Info (Left Side):</strong></p>
            <ul>
                <li>Name</li>
                <li>Patient Data</li>
            </ul>
            <h3 class="sub">Audit Logs</h3>
            <ul>
                <li>Track of Consultation Schedules</li>
                <li>Track of Actions</li>
                <li>Filter by: Username, User ID, Date</li>
            </ul>
            <h3 class="sub">Settings</h3>
            <ul>
                <li>Account Info</li>
                <li>Add a Person <em>(e.g., Secretary)</em>
                <ul>
                    <li>Name</li>
                    <li>Role</li>
                    <li>Restrictions</li>
                </ul>
                </li>
                <li>Edit Information</li>
                <li>Change Password</li>
            </ul>
        </section>
        <section class="card">
        <h2>👩‍💼 Secretary View</h2>
        <h3 class="sub">Admin Dashboard</h3>
        <p class="note">Overview includes:</p>
        <ul>
            <li>Summary of Schedule</li>
            <li>Patient Count of the Week <em>(Bar Graph by Walk-in or Appointment)</em></li>
            <li>Queue Status</li>
            <li>Quick Access Buttons</li>
        </ul>
        <h3 class="sub">List of Patient Records</h3>
        <ul>
            <li>Queue List</li>
            <li>Doctor Schedule
                <ul>
                    <li>Availability of the Doctor</li>
                    <li>View Schedule</li>
                    <li>Edit and Update <em>(Access granted by the Doctor)</em></li>
                </ul>
            </li>
        </ul>
        <h3 class="sub">Patient History Record</h3>
        <ul>
            <li>Editable, Updatable, Addable <em>(Access granted by the Doctor)</em></li>
            <li>Limited Record View
            <ul>
                <li>Name</li>
                <li>Last Visit Date</li>
            </ul>
            </li>
            <li><strong>Drag and Drop to Queue Board</strong>
            <p class="note">Once information is dropped, the system automatically updates the patient’s history to reflect the visit date.</p>
            </li>
            <li>Filter by Date or Alphabet (A–Z)</li>
        </ul>
        <h3 class="sub">Current Queuing</h3>
        <p class="note"><strong>Queue Board (Right Side):</strong></p>
        <ul>
            <li>Sorted A–Z</li>
            <li>Patient Name</li>
            <li>Company Affiliation (if applicable)</li>
            <li>Appointment Type <em>(Booked / Walk-in)</em></li>
            <li>Consultation Description</li>
        </ul>
        <p class="note"><strong>Current Patient Info (Left Side):</strong></p>
        <ul>
            <li>Name</li>
            <li>Patient Data</li>
        </ul>
        <h3 class="sub">Appointment / Consultation Logs</h3>
        <ul>
            <li>Track Consultation Schedules</li>
            <li>Track Actions</li>
            <li>Filter by: Username, User ID, Date</li>
        </ul>
        <h3 class="sub">Settings</h3>
        <ul>
            <li>Account Info</li>
            <li>Add a Person <em>(e.g., Secretary)</em>
            <ul>
                <li>Name</li>
                <li>Role</li>
                <li>Restrictions</li>
            </ul>
            </li>
            <li>Edit Information</li>
            <li>Change Password</li>
        </ul>
    </section>
    </body>
</html>
