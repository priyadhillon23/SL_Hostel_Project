const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Hostel Management <noreply@hostel.com>',
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendLeaveApprovalEmail = async ({ parentEmail, parentName, studentName, fromDate, toDate, remark }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
      <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin:0">🏫 Hostel Management System</h1>
      </div>
      <div style="background: white; padding: 25px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #22c55e;">✅ Leave Request Approved</h2>
        <p>Dear <strong>${parentName || 'Parent/Guardian'}</strong>,</p>
        <p>This is to inform you that the leave request for your ward <strong>${studentName}</strong> has been <strong style="color: #22c55e;">APPROVED</strong>.</p>
        <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
          <tr style="background: #f3f4f6;"><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Student Name</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">${studentName}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>From Date</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">${new Date(fromDate).toDateString()}</td></tr>
          <tr style="background: #f3f4f6;"><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>To Date</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">${new Date(toDate).toDateString()}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 12px;">Please ensure your ward returns to the hostel by the approved date. For any queries, contact the warden's office.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="text-align: center; color: #9ca3af; font-size: 12px;">Hostel Management System &bull; Automated Notification</p>
      </div>
    </div>`;
  return sendEmail({ to: parentEmail, subject: `Leave Approved - ${studentName}`, html });
};

const sendLeaveRejectionEmail = async ({ parentEmail, parentName, studentName, fromDate, toDate, remark }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
      <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin:0">🏫 Hostel Management System</h1>
      </div>
      <div style="background: white; padding: 25px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #ef4444;">❌ Leave Request Rejected</h2>
        <p>Dear <strong>${parentName || 'Parent/Guardian'}</strong>,</p>
        <p>The leave request for <strong>${studentName}</strong> has been <strong style="color: #ef4444;">REJECTED</strong>.</p>
        <p><strong>Reason:</strong> ${remark || 'Not specified'}</p>
        <p style="color: #6b7280; font-size: 12px;">For queries, contact the warden's office.</p>
      </div>
    </div>`;
  return sendEmail({ to: parentEmail, subject: `Leave Rejected - ${studentName}`, html });
};

const sendComplaintResolvedEmail = async ({ studentEmail, studentName, complaintType, resolutionNote }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
      <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin:0">🏫 Hostel Management System</h1>
      </div>
      <div style="background: white; padding: 25px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #22c55e;">✅ Complaint Resolved</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your <strong>${complaintType}</strong> complaint has been resolved.</p>
        <p><strong>Resolution Note:</strong> ${resolutionNote || 'Issue has been fixed.'}</p>
      </div>
    </div>`;
  return sendEmail({ to: studentEmail, subject: `Complaint Resolved - ${complaintType}`, html });
};

const sendPasswordResetEmail = async ({ userEmail, userName, resetLink }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
      <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin:0">🏫 Hostel Management System</h1>
      </div>
      <div style="background: white; padding: 25px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #111827;">Reset Your Password</h2>
        <p>Dear <strong>${userName || 'User'}</strong>,</p>
        <p>We received a request to reset the password for your hostel management account.</p>
        <p>You can reset your password by clicking the button below:</p>
        <p style="text-align:center; margin: 24px 0;">
          <a href="${resetLink}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">
            Reset Password
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all; font-size: 12px; color:#4b5563;">${resetLink}</p>
        <p style="font-size: 12px; color:#6b7280;">If you did not request this, you can safely ignore this email. This link will expire in 1 hour.</p>
      </div>
    </div>`;
  return sendEmail({ to: userEmail, subject: 'Reset your hostel account password', html });
};

module.exports = {
  sendEmail,
  sendLeaveApprovalEmail,
  sendLeaveRejectionEmail,
  sendComplaintResolvedEmail,
  sendPasswordResetEmail
};
