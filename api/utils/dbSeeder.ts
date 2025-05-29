import User from '../models/User';

export async function seedDatabase() {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      console.log('Database already seeded. Skipping.');
      return;
    }
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('Database seeded with default admin user:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}