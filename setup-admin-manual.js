// Manual Admin Setup Script for Frontend
// This script will help you set up the first admin account

const adminCredentials = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123'
};

console.log('🔧 Manual Admin Setup Instructions');
console.log('=====================================');
console.log('');
console.log('1. Make sure your backend server is running on http://localhost:5000');
console.log('2. Open your browser and go to http://localhost:5173/admin/login');
console.log('3. You should see a registration form (if no admin exists)');
console.log('4. Use these credentials to register:');
console.log('');
console.log('   Username:', adminCredentials.username);
console.log('   Email:', adminCredentials.email);
console.log('   Password:', adminCredentials.password);
console.log('');
console.log('5. If you see a login form instead, try logging in with these credentials');
console.log('');
console.log('🔍 Troubleshooting:');
console.log('- If you see "Failed to check admin status", the backend is not running');
console.log('- Start backend: cd pawnbackend-main/pawnbackend-main && node server.js');
console.log('- Start frontend: cd pawnadmin-main/pawnadmin-main && npm run dev');
console.log('');
console.log('📝 Alternative: Use backend setup script');
console.log('cd pawnbackend-main/pawnbackend-main && node setup-admin.js');
console.log('');
console.log('✅ After setup, you can change the password in the admin profile section');
