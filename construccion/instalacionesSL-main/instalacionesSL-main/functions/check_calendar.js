require('dotenv').config();
const { getCalendarClient } = require('./services/googleAuth');

async function testCalendar() {
    console.log("=== Probando Calendar ===");
    try {
        console.log("1. Probando Service Account...");
        const calendarSA = await getCalendarClient();
        console.log("Service Account autenticado.");

        // Intentar listar eventos del calendar
        const response = await calendarSA.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            maxResults: 1
        });
        console.log("Service Account TIENE ACCESO al calendario. OK!");
    } catch (e) {
        console.error("Error en Service Account:", e.message);
        if (e.message.includes("Not Found")) {
            console.error("El calendario no existe o no ha sido compartido con la Service Account.");
        }
    }
}

testCalendar();
