const bcrypt = require('bcryptjs');

async function hashPassword() {
  const plainPassword = "admin123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  console.log("Hashed password:", hashedPassword);
}

hashPassword();