import mongoose from 'mongoose';
import { createRequire } from 'module';
import AdminAccount from './models/AdminAccount.js';
import { DB } from './config.js';

const require = createRequire(import.meta.url);

async function createFirstAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(DB);
    console.log('Connected to MongoDB');

    // Check if any admin already exists
    const existingAdmin = await AdminAccount.findOne();
    if (existingAdmin) {
      console.log('❌ Admin account already exists. Cannot create first admin.');
      process.exit(1);
    }

    // Prompt for admin details
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, (answer) => {
          resolve(answer);
        });
      });
    };

    console.log('\n🔐 Creating first Super Admin account...\n');

    const name = await askQuestion('Enter admin name: ');
    const email = await askQuestion('Enter admin email: ');

    let password = '';
    while (password.length < 8) {
      password = await askQuestion('Enter admin password (min 8 characters): ');
      if (password.length < 8) {
        console.log('❌ Password must be at least 8 characters long');
      }
    }

    rl.close();

    // Create the first admin with super_admin role
    const superAdminPermissions = [
      'read_users',
      'write_users',
      'delete_users',
      'ban_users',
      'read_pages',
      'delete_pages',
      'read_analytics',
      'manage_admins',
      'system_config',
    ];

    const firstAdmin = new AdminAccount({
      email: email.toLowerCase(),
      password,
      name,
      role: 'super_admin',
      permissions: superAdminPermissions,
      active: true,
    });

    // Add creation audit log
    firstAdmin.addAuditLog('FIRST_ADMIN_CREATED', '127.0.0.1', 'create-admin-script', {
      email: email.toLowerCase(),
      role: 'super_admin',
      createdBy: 'system',
    });

    await firstAdmin.save();

    console.log('\n✅ First Super Admin account created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔑 Role: Super Admin`);
    console.log(`\n🌐 You can now login at: http://localhost:3000/admin/login`);
  } catch (error) {
    console.error('❌ Error creating first admin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the script
createFirstAdmin();
