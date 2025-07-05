const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    // Check if admin user exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (!admin) {
      console.log('Admin user not found. Creating new admin user...');
      
      // Create admin with default password
      const hashedPassword = await bcrypt.hash('123456', 10);
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      
      console.log('Admin user created successfully:', newAdmin.email);
      return;
    }

    // Reset password for existing admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
      },
    });

    console.log('Admin password reset successfully. New password: 123456');
    console.log('Admin details:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    // Test the password
    const isPasswordValid = await bcrypt.compare('123456', hashedPassword);
    console.log('Password verification test:', isPasswordValid ? 'PASSED' : 'FAILED');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin(); 