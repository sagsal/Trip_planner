// Shared mock data for authentication
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

// Initial mock users
const initialMockUsers: User[] = [
  {
    id: '1',
    email: 'demo@example.com',
    name: 'Demo User',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    email: 'john@example.com',
    name: 'John Doe',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// Use a mutable array for mock users
let mockUsers: User[] = [...initialMockUsers];

// Helper functions
export const findUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(u => u.email === email);
};

export const addUser = (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
  const newUser: User = {
    id: Date.now().toString(),
    ...user,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockUsers.push(newUser);
  return newUser;
};

export const getAllUsers = (): User[] => {
  return mockUsers;
};

// Function to reset mock users (useful for testing)
export const resetMockUsers = () => {
  mockUsers = [...initialMockUsers];
};
