// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

print('Starting MongoDB initialization...');

// Switch to badminton_db database
db = db.getSiblingDB('badminton_db');

print('Database switched to: badminton_db');

// Create users collection with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'password', 'name', 'role'],
      properties: {
        username: {
          bsonType: 'string',
          description: 'Username must be a string and is required'
        },
        password: {
          bsonType: 'string',
          description: 'Password must be a string and is required'
        },
        name: {
          bsonType: 'string',
          description: 'Name must be a string and is required'
        },
        role: {
          enum: ['user', 'admin'],
          description: 'Role must be either user or admin'
        }
      }
    }
  }
});

print('Users collection created');

// Create indexes
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ deletedAt: 1 });

print('Indexes created');

print('MongoDB initialization completed!');
