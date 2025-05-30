import User from '../models/User';
import Project from '../models/Project';
import Story from '../models/Story';
import Task from '../models/Task';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded. Skipping.');
      return;
    }

    console.log('Seeding database with initial data...');

    // Create users with hashed passwords
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    await admin.save();

    const developer = new User({
      firstName: 'John',
      lastName: 'Developer',
      email: 'developer@example.com',
      passwordHash: await bcrypt.hash('developer123', 10),
      role: 'developer'
    });
    await developer.save();

    const devops = new User({
      firstName: 'Jane',
      lastName: 'DevOps',
      email: 'devops@example.com',
      passwordHash: await bcrypt.hash('devops123', 10),
      role: 'devops'
    });
    await devops.save();

    const guest = new User({
      firstName: 'Guest',
      lastName: 'User',
      email: 'guest@example.com',
      passwordHash: await bcrypt.hash('guest123', 10),
      role: 'guest'
    });
    await guest.save();

    // Create sample project
    const project = new Project({
      nazwa: 'Sample Project',
      opis: 'This is a sample project for testing the ManagMe application',
      ownerId: admin._id,
      members: [
        { userId: developer._id, assignedAt: new Date() },
        { userId: devops._id, assignedAt: new Date() }
      ],
      viewers: [
        { userId: guest._id, assignedAt: new Date() }
      ]
    });
    await project.save();

    // Create sample stories
    const story1 = new Story({
      projectId: project._id,
      name: 'User Authentication',
      description: 'Implement user login and registration functionality',
      status: 'in-progress',
      priority: 'high',
      ownerId: developer._id
    });
    await story1.save();

    const story2 = new Story({
      projectId: project._id,
      name: 'Project Management',
      description: 'Create project CRUD operations',
      status: 'todo',
      priority: 'medium',
      ownerId: developer._id
    });
    await story2.save();

    // Create sample tasks
    const task1 = new Task({
      name: 'Create login form',
      description: 'Design and implement the login form UI',
      status: 'done',
      priority: 'high',
      projectId: project._id,
      storyId: story1._id,
      assignedUserId: developer._id,
      estimatedTime: 8,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      timeLogs: [
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          hours: 4,
          comment: 'Created login form layout',
          userId: developer._id
        },
        {
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          hours: 4,
          comment: 'Added validation and styling',
          userId: developer._id
        }
      ],
      loggedHours: 8
    });
    await task1.save();

    const task2 = new Task({
      name: 'Implement JWT authentication',
      description: 'Set up JWT token-based authentication system',
      status: 'in-progress',
      priority: 'high',
      projectId: project._id,
      storyId: story1._id,
      assignedUserId: devops._id,
      estimatedTime: 12,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      timeLogs: [
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          hours: 6,
          comment: 'Research and setup JWT library',
          userId: devops._id
        }
      ],
      loggedHours: 6
    });
    await task2.save();

    const task3 = new Task({
      name: 'Create project list view',
      description: 'Display list of projects with filtering',
      status: 'todo',
      priority: 'medium',
      projectId: project._id,
      storyId: story2._id,
      estimatedTime: 6
    });
    await task3.save();

    console.log('✅ Database seeded successfully!');
    console.log('\n📧 Test Users:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Developer: developer@example.com / developer123');
    console.log('DevOps: devops@example.com / devops123');
    console.log('Guest: guest@example.com / guest123');
    console.log(`\n📋 Created 1 project, 2 stories, and 3 tasks`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}