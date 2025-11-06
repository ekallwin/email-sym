/**
 * Google Apps Script Web App
 * Handles form submissions from React frontend.
 * - Stores data in Google Sheets
 * - Sends confirmation email
 * - Returns JSON response
 * 
 * Author: Allwin E K
 */

// Spreadsheet configuration
const SHEET_ID = '1fC1jmTVZh5-X_BdEDCGR-YTlGGeF9pqN8QC9pH8kjQM';
const SHEET_NAME = 'Sheet1';

/**
 * Handle POST requests from React App
 */
function doPost(e) {
  try {
    // Parse incoming JSON body
    const data = JSON.parse(e.postData.contents);
    Logger.log('Received submission: ' + JSON.stringify(data));

    // Validate required fields
    if (!data.name || !data.email) {
      throw new Error('Missing required fields: name and email.');
    }

    // Save data to Google Sheets
    saveToSheets(data);

    // Send confirmation email
    const emailSent = sendConfirmationEmail(data);

    // Respond to frontend
    return jsonResponse({
      success: true,
      message: 'Registration successful! Confirmation email sent.',
      emailSent: emailSent
    });

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return jsonResponse({
      success: false,
      message: 'Error: ' + error.toString()
    });
  }
}

/**
 * Handle preflight OPTIONS request for CORS
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(corsHeaders());
}

/**
 * Save submitted data to Google Sheets
 */
function saveToSheets(data) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME) || SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const timestamp = new Date();

    const row = [
      timestamp,
      data.name,
      data.email,
      data.phone || '',
      data.year || '',
      data.department || '',
      data.college || '',
      data.events || '',
      data.food || '',
    ];

    sheet.appendRow(row);
    Logger.log('Saved data for ' + data.email);
  } catch (err) {
    Logger.log('Error saving to sheet: ' + err);
    throw new Error('Failed to save to Google Sheets: ' + err);
  }
}

/**
 * Send confirmation email to participant
 */
function sendConfirmationEmail(data) {
  try {
    const participant = formatName(data.name);
    const subject = `${participant}, your registration for Symposium is confirmed!`;
    const htmlBody = createEmailTemplate(participant, data);

    GmailApp.sendEmail(data.email, subject, '', {
      htmlBody: htmlBody,
      name: 'Symposium 2k26',
      noReply: true
    });


    Logger.log('Email sent to ' + data.email);
    return true;
  } catch (err) {
    Logger.log('Error sending email: ' + err);
    return false;
  }
}

/**
 * Format name capitalization
 */
function formatName(name) {
  return name.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Create HTML confirmation email
 */
function createEmailTemplate(participant, data) {
  const currentYear = new Date().getFullYear();

  return `
<div style="margin: 0; padding: 0; background-color: #F0F0F0; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="background-color: #F0F0F0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border-radius: 6px; overflow: hidden;">
      
      <!-- Gradient Top Border -->
      <div style="height: 3px; background: linear-gradient(to right, #1491FE, #7B2FF7, #E70268);"></div>

      <div style="padding: 30px 20px;">
        <h3 style="color: #333;">Dear <span style="text-transform: capitalize;">${participant},</span></h3>
        
        <p style="font-size: 16px; color: #444;">
          Thank you for registering for the Symposium organized by the Department of Computer Science and Engineering at Ponjesly College of Engineering, Nagercoil.
        </p>

        <p style="font-size: 15px; color: #444;">
          We're thrilled to have you join us for this exciting event. We look forward to your participation and an engaging session ahead!
        </p>

        <div style="width: 100%; font-size: 15px; color: #333; border: 1px solid #ccc; border-radius: 6px; overflow: hidden; margin: 20px 0;">
          <div style="background-color: #e9eef6; padding: 10px; font-weight: bold;">Participant Details</div>
          <div style="padding: 10px; border-top: 1px solid #ccc;">
            <strong>Participant's Name</strong><br>${data.name || 'Not provided'}
          </div>
          <div style="padding: 10px; border-top: 1px solid #ccc;">
            <strong>Email Address</strong><br>${data.email || 'Not provided'}
          </div>
          <div style="padding: 10px; border-top: 1px solid #ccc;">
            <strong>Phone Number</strong><br>+91 ${data.phone || 'Not provided'}
          </div>
          <div style="padding: 10px; border-top: 1px solid #ccc;">
            <strong>Year & Department</strong><br>${data.year || 'Not provided'} - ${data.department || 'Not provided'}
          </div>
          <div style="padding: 10px; border-top: 1px solid #ccc;">
            <strong>College</strong><br>${data.college || 'Not provided'}
          </div>
          <div style="padding: 10px; border-top: 1px solid #ccc;">
            <strong>Event(s) Registered</strong><br>${data.events || 'No events selected'}
          </div>
          <div style="padding: 10px; border-top: 1px solid #ccc;">
            <strong>Food preference</strong><br>${data.food || 'No food preference selected'}
          </div>
        </div>

        <p style="font-size: 15px; color: #444;">If you have any questions, feel free to contact us.</p>

        <p style="font-size: 15px; color: #444;">For more updates</p>

        <div style="margin-top: 20px;">
          <a href="#" style="background: linear-gradient(90deg, #1491FE, #7B2FF7, #E70268); color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 100px; font-weight: 500; display: inline-block;">Visit Our Webpage</a>
        </div>

        <div style="margin-top: 25px;">
          <p style="font-size: 15px; color: #444;">
            Regards,<br>
            Symposium Team<br>
          </p>
        </div>
      </div>

      <!-- Gradient Bottom Border -->
      <div style="height: 3px; background: linear-gradient(to right, #1491FE, #7B2FF7, #E70268);"></div>
    </div>
  </div>
</div>
  `;
}

/**
 * JSON response helper
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(corsHeaders());
}

/**
 * Common CORS headers
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

/**
 * Health check endpoint
 */
function checkScriptHealth() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    Logger.log('Connected to sheet: ' + sheet.getName());
    return 'Script is healthy and ready for live submissions.';
  } catch (error) {
    Logger.log('Health check failed: ' + error);
    return 'Script failed: ' + error;
  }
}
