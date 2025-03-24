db.users.insertOne({
    email: "admin@example.com",
    password: "$2b$10$YourHashedPasswordHere", // Use bcrypt to hash "admin123"
    username: "admin",
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date()
}) 