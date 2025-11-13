import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "vp1246194@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Send email to admin when NGO/Hotel registers
export const sendAdminNotification = async (userType, userData, licensePath) => {
  try {
    const subject = `New ${userType} Registration - License Verification Required`;
    
    let htmlContent = `
      <h2>New ${userType} Registration</h2>
      <p>A new ${userType} has registered and requires license verification.</p>
      <br>
      <h3>Registration Details:</h3>
      <ul>
    `;

    if (userType === "NGO") {
      htmlContent += `
        <li><strong>Organization Name:</strong> ${userData.organizationName}</li>
        <li><strong>Contact Person:</strong> ${userData.contactPerson}</li>
        <li><strong>Email:</strong> ${userData.email}</li>
        <li><strong>Phone:</strong> ${userData.phone}</li>
        <li><strong>Address:</strong> ${userData.address}</li>
        <li><strong>City:</strong> ${userData.city}</li>
        <li><strong>License Number:</strong> ${userData.licenseNumber}</li>
      `;
    } else {
      htmlContent += `
        <li><strong>Hotel Name:</strong> ${userData.hotelName}</li>
        <li><strong>Manager Name:</strong> ${userData.managerName}</li>
        <li><strong>Email:</strong> ${userData.email}</li>
        <li><strong>Phone:</strong> ${userData.phone}</li>
        <li><strong>Address:</strong> ${userData.address}</li>
        <li><strong>City:</strong> ${userData.city}</li>
        <li><strong>License Number:</strong> ${userData.licenseNumber}</li>
      `;
    }

    htmlContent += `
      </ul>
      <br>
      <p><strong>License Document:</strong> ${licensePath ? 'Attached' : 'Not provided'}</p>
      <br>
      <p>Please review the license document and verify the registration through the admin panel.</p>
    `;

    const mailOptions = {
      from: "SEWA Admin <vp1246194@gmail.com>",
      to: "vp1246194@gmail.com",
      subject: subject,
      html: htmlContent,
      attachments: licensePath ? [{
        filename: `license_${userData.licenseNumber}.pdf`,
        path: licensePath
      }] : []
    };

    await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent for ${userType} registration: ${userData.email}`);
  } catch (error) {
    console.error("Error sending admin notification:", error);
    throw error;
  }
};

// Send verification email to NGO/Hotel
export const sendVerificationEmail = async (userType, userData, action) => {
  try {
    const subject = action === "verify" 
      ? `Your ${userType} Registration has been Verified!` 
      : `Your ${userType} Registration has been Rejected`;

    const htmlContent = action === "verify" ? `
      <h2>Registration Verified!</h2>
      <p>Dear ${userType === "NGO" ? userData.contactPerson : userData.managerName},</p>
      <p>Congratulations! Your ${userType} registration has been successfully verified.</p>
      <br>
      <p><strong>Organization Details:</strong></p>
      <ul>
        <li><strong>Name:</strong> ${userType === "NGO" ? userData.organizationName : userData.hotelName}</li>
        <li><strong>Email:</strong> ${userData.email}</li>
        <li><strong>License Number:</strong> ${userData.licenseNumber}</li>
      </ul>
      <br>
      <p>You can now log in to your account and start using our platform.</p>
      <p>Thank you for joining SEWA!</p>
    ` : `
      <h2>Registration Rejected</h2>
      <p>Dear ${userType === "NGO" ? userData.contactPerson : userData.managerName},</p>
      <p>We regret to inform you that your ${userType} registration has been rejected.</p>
      <br>
      <p>Please review your license document and registration details. You may re-register with correct information.</p>
      <p>If you have any questions, please contact our support team.</p>
    `;

    const mailOptions = {
      from: "SEWA Admin <vp1246194@gmail.com>",
      to: userData.email,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${userType}: ${userData.email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const sendHotelReviewStatusEmail = async (hotelData, status, context = {}) => {
  try {
    let subject = "";
    let bodyIntro = "";
    let bodyMessage = "";

    switch (status) {
      case "under-review":
        subject = "Your account is under review";
        bodyIntro = `Dear ${hotelData.managerName || hotelData.hotelName},`;
        bodyMessage = `Multiple poor ratings have been reported against ${hotelData.hotelName}. To ensure food safety, your donation account has been placed under review. Our admin team will study the submitted evidence and inform you about the final decision via email.`;
        break;
      case "blacklisted":
        subject = "Your account has been blacklisted";
        bodyIntro = `Dear ${hotelData.managerName || hotelData.hotelName},`;
        bodyMessage = `After reviewing the submitted evidence, we have blacklisted ${hotelData.hotelName}. ${context.reason ? `Reason: ${context.reason}` : ""} If you have additional clarification, please reply to this email.`;
        break;
      case "cleared":
      default:
        subject = "Review completed";
        bodyIntro = `Dear ${hotelData.managerName || hotelData.hotelName},`;
        bodyMessage = context.message || `Your account review has been completed. You may continue posting donations on SEWA.`;
        break;
    }

    const htmlContent = `
      <h2>${subject}</h2>
      <p>${bodyIntro}</p>
      <p>${bodyMessage}</p>
      ${context.nextSteps ? `<p>${context.nextSteps}</p>` : ""}
      <br/>
      <p>Regards,<br/>SEWA Admin Team</p>
    `;

    await transporter.sendMail({
      from: "SEWA Admin <vp1246194@gmail.com>",
      to: hotelData.email,
      subject,
      html: htmlContent,
    });
    console.log(`Hotel review status email (${status}) sent to ${hotelData.email}`);
  } catch (error) {
    console.error("Error sending hotel review status email:", error);
  }
};

export const sendComplaintSubmittedEmail = async ({ complaint, ngo, hotel }) => {
  try {
    const baseInfo = `
      <p><strong>Hotel:</strong> ${hotel?.hotelName || "N/A"}</p>
      <p><strong>NGO:</strong> ${ngo?.organizationName || "N/A"}</p>
      <p><strong>Donation ID:</strong> ${complaint?.donationId?._id || complaint?.donationId}</p>
      <p><strong>Description:</strong> ${complaint?.description}</p>
      <p><strong>Submitted On:</strong> ${complaint?.createdAt?.toLocaleString?.() || complaint?.createdAt}</p>
    `;

    const hotelMailOptions = {
      from: "SEWA Admin <vp1246194@gmail.com>",
      to: hotel?.email,
      subject: "Complaint submitted against your recent donation",
      html: `
        <h2>Your account is under review</h2>
        <p>Dear ${hotel?.managerName || hotel?.hotelName},</p>
        <p>An NGO has reported an issue with a recent donation. Your account is temporarily disabled until our admin team completes the review.</p>
        ${baseInfo}
        <p>We will reach out once the investigation is completed.</p>
        <br/>
        <p>Regards,<br/>SEWA Admin Team</p>
      `,
    };

    const ngoMailOptions = {
      from: "SEWA Admin <vp1246194@gmail.com>",
      to: ngo?.email,
      subject: "Complaint submitted successfully",
      html: `
        <h2>Complaint received</h2>
        <p>Dear ${ngo?.organizationName || "NGO Partner"},</p>
        <p>We've received your complaint and notified the hotel and admin review team. We'll keep you posted once the investigation is complete.</p>
        ${baseInfo}
        <p>Thank you for helping us maintain safe food distribution.</p>
      `,
    };

    const adminMailOptions = {
      from: "SEWA Platform <vp1246194@gmail.com>",
      to: "vp1246194@gmail.com",
      subject: "New NGO complaint pending review",
      html: `
        <h2>Complaint requires review</h2>
        ${baseInfo}
        <p>Please review the submitted evidence and update the complaint status from the admin panel.</p>
      `,
    };

    await Promise.all([
      hotel?.email ? transporter.sendMail(hotelMailOptions) : Promise.resolve(),
      transporter.sendMail(adminMailOptions),
      ngo?.email ? transporter.sendMail(ngoMailOptions) : Promise.resolve(),
    ]);

    console.log("Complaint submission notifications sent.");
  } catch (error) {
    console.error("Error sending complaint submission emails:", error);
  }
};

export const sendComplaintResolutionEmail = async ({ complaint, ngo, hotel }) => {
  try {
    const decisionText =
      complaint.status === "verified"
        ? "After reviewing the submitted evidence, the complaint has been marked as genuine."
        : "After reviewing the submitted evidence, the complaint has been rejected and the hotel account has been reactivated.";

    const baseInfo = `
      <p><strong>Hotel:</strong> ${hotel?.hotelName || "N/A"}</p>
      <p><strong>NGO:</strong> ${ngo?.organizationName || "N/A"}</p>
      <p><strong>Donation ID:</strong> ${complaint?.donationId?._id || complaint?.donationId}</p>
      <p><strong>Complaint Status:</strong> ${complaint.status.toUpperCase()}</p>
      ${complaint.resolutionNote ? `<p><strong>Admin Note:</strong> ${complaint.resolutionNote}</p>` : ""}
    `;

    const ngoMailOptions = {
      from: "SEWA Admin <vp1246194@gmail.com>",
      to: ngo?.email,
      subject: `Complaint ${complaint.status === "verified" ? "Approved" : "Rejected"}`,
      html: `
        <h2>Complaint review completed</h2>
        <p>Dear ${ngo?.organizationName || "NGO"},</p>
        <p>${decisionText}</p>
        ${baseInfo}
        <p>Thank you for helping us maintain food safety standards.</p>
      `,
    };

    const hotelMailOptions = {
      from: "SEWA Admin <vp1246194@gmail.com>",
      to: hotel?.email,
      subject: "Complaint review decision",
      html: `
        <h2>Complaint review completed</h2>
        <p>Dear ${hotel?.managerName || hotel?.hotelName},</p>
        <p>${decisionText}</p>
        ${baseInfo}
        <p>Please reach out if you need any clarification regarding this decision.</p>
      `,
    };

    await Promise.all([
      ngo?.email ? transporter.sendMail(ngoMailOptions) : Promise.resolve(),
      hotel?.email ? transporter.sendMail(hotelMailOptions) : Promise.resolve(),
    ]);

    console.log("Complaint resolution notifications sent.");
  } catch (error) {
    console.error("Error sending complaint resolution emails:", error);
  }
};

export default transporter;
