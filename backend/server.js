const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const recruiterRoutes = require("./routes/recruitRoutes");
const studentRoutes = require("./routes/studentRoutes");
const nodemailer = require("nodemailer");
const connectDB = require("./config/db");

const app = express();
const PORT = 5000;

connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/recruiter", recruiterRoutes);
app.use("/api/student", studentRoutes);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "handler088@gmail.com",
    pass: "sbdu lbiu krxk qmbf",
  },
});

// Color scheme for emails
const colors = {
  primary: "#3498db",
  accent: "#2ecc71",
  white: "#ffffff",
  lightBg: "#f8f9fa",
  textDark: "#343a40",
  textLight: "#6c757d",
};

app.post("/api/send-mail", async (req, res) => {
  try {
    const { recruiterEmail, jobTitle, jobDescription, students } = req.body;

    if (
      !recruiterEmail ||
      !jobTitle ||
      !jobDescription ||
      !students ||
      students.length === 0
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const studentItems = students
      .map(
        (student) => `
      <div style="background-color: ${
        colors.lightBg
      }; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
        <h3 style="color: ${colors.primary}; margin-top: 0;">${
          student.name
        }</h3>
        <p><strong>Email:</strong> ${student.email}</p>
        <p><strong>Skills:</strong> ${student.skills || "Not specified"}</p>
        <p><strong>Experience:</strong> ${
          student.experience || "Not specified"
        }</p>
        ${
          student.resumeUrl
            ? `<p><a href="${student.resumeUrl}" style="color: ${colors.accent}; text-decoration: none;">Download Resume</a></p>`
            : ""
        }
      </div>
    `
      )
      .join("");

    const mailOptions = {
      from: `AJC Career Portal <handler088@gmail.com>`,
      to: recruiterEmail,
      subject: `Top Candidates for ${jobTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Top Candidates for ${jobTitle}</title>
            <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.6; color: ${
                  colors.textDark
                }; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background-color: ${
                  colors.primary
                }; padding: 30px; text-align: center; }
                .header h1 { color: ${
                  colors.white
                }; margin: 0; font-size: 24px; }
                .content { padding: 30px; background-color: ${colors.white}; }
                .job-card { background-color: ${
                  colors.lightBg
                }; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
                .student-card { background-color: ${
                  colors.lightBg
                }; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: ${
                  colors.textLight
                }; background-color: ${colors.lightBg}; }
                .divider { height: 2px; background: linear-gradient(90deg, ${
                  colors.primary
                }, ${colors.accent}); margin: 20px 0; border: none; }
                .btn { display: inline-block; padding: 10px 20px; background-color: ${
                  colors.accent
                }; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
                .highlight { color: ${colors.primary}; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Top Candidates for Your Job Posting</h1>
                </div>
                
                <div class="content">
                    <h2 style="margin-top: 0; color: ${
                      colors.primary
                    };">${jobTitle}</h2>
                    <div class="job-card">
                        <h3 style="margin-top: 0;">Job Description</h3>
                        <p>${jobDescription}</p>
                    </div>
                    
                    <hr class="divider">
                    
                    <h3>Top <span class="highlight">3</span> Recommended Candidates</h3>
                    ${studentItems}
                    
                    <hr class="divider">
                    
                    <p style="text-align: center;">
                        <a href="#" class="btn">View All Applicants</a>
                    </p>
                    
                    <p style="color: ${colors.textLight}; font-size: 14px;">
                        These candidates were automatically selected based on their skills and experience matching your job requirements.
                    </p>
                </div>
                
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} AJC Career Portal. All rights reserved.</p>
                    <p>This email was sent automatically. Please do not reply directly to this message.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      attachments: students
        .map((student) => ({
          filename: `${student.name}_Resume.pdf`,
          path: student.resumeUrl,
        }))
        .filter((attachment) => attachment.path),
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
