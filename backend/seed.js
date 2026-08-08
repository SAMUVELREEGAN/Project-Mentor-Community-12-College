const User = require('./models/User');
const Admin = require('./models/Admin');

async function seedDatabase() {
  const adminEmail = 'test@gamil.com';
  const userEmail = 'user@example.com';

  let admin = await Admin.findOne({ email: adminEmail });
  if (!admin) {
    admin = await Admin.create({
      name: 'System Admin',
      email: adminEmail,
      password: '123',
    });
    console.log(`Seeded admin: ${adminEmail} / 123`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  let user = await User.findOne({ email: userEmail });
  if (!user) {
    user = await User.create({
      name: 'Demo Mentor',
      email: userEmail,
      password: '123',
      role: 'both',
      college: 'Demo College',
      year: '4th Year',
      bio: 'Default mentor account for exploring the Project Mentor Community.',
      skills: ['React', 'Node.js', 'MongoDB'],
    });
    console.log(`Seeded user: ${userEmail} / 123`);
  } else {
    console.log(`User already exists: ${userEmail}`);
  }

  let junior = await User.findOne({ email: 'junior@example.com' });
  if (!junior) {
    junior = await User.create({
      name: 'Demo Junior',
      email: 'junior@example.com',
      password: '123',
      role: 'junior',
      college: 'Demo College',
      year: '2nd Year',
      bio: 'Default junior student account for browsing and asking questions.',
      skills: ['HTML', 'CSS', 'JavaScript'],
    });
    console.log('Seeded junior: junior@example.com / 123');
  } else {
    console.log('Junior already exists: junior@example.com');
  }

  return { admin, user, junior };
}

module.exports = seedDatabase;
