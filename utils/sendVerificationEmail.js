const sendEmail = require("./sendEmail");

const sendVerificationEmail = async ({
  name,
  email,
  verificationToken,
  origin,
}) => {
  const message = `<p> Please confirm your email address:
   <a href="localhost:3000/${verificationToken}">Verify here</a> </p>`;
  await sendEmail({
    to: email,
    subject: "Email verification",
    html: `<p>Hello ${name}</p>
  ${message}`,
  });
};

module.exports = sendVerificationEmail;
