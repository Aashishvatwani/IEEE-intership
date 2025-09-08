import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

// Sample test data for Aadhaar and PAN verification
const sampleUsers = [
  {
    name: "Rajesh Kumar",
    dob: "15/08/1990",
    aadhaar_number: "1234 5678 9012",
    pan_number: "ABCDE1234F",
    gender: "Male",
    fatherName: "Suresh Kumar"
  },
  {
    name: "Priya Sharma", 
    dob: "22/03/1985",
    aadhaar_number: "9876 5432 1098",
    pan_number: "XYZAB5678C",
    gender: "Female",
    fatherName: "Amit Sharma"
  },
  {
    name: "Arjun Patel",
    dob: "10/12/1992",
    aadhaar_number: "5555 6666 7777",
    pan_number: "DEFGH9012I",
    gender: "Male", 
    fatherName: "Vikram Patel"
  },
  {
    name: "Anita Singh",
    dob: "05/07/1988",
    aadhaar_number: "1111 2222 3333",
    pan_number: "PQRST3456U",
    gender: "Female",
    fatherName: "Ravi Singh"
  },
  {
    name: "Kiran Reddy",
    dob: "18/09/1995",
    aadhaar_number: "4444 5555 6666",
    pan_number: "LMNOP7890Q",
    gender: "Male",
    fatherName: "Venkat Reddy"
  },
  {
    name:"Aashish Vatwani",
    dob: "15/05/2005",
    aadhaar_number: "7995 7938 6751",
    pan_number: "UVWXY1234Z",
    gender: "Male",
    fatherName: "Bharat Vatwani"
  }

];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    console.log("🗑️  Cleared existing user data");

    // Insert sample data
    await User.insertMany(sampleUsers);
    console.log("📊 Inserted sample user data:");
    
    sampleUsers.forEach(user => {
      console.log(`   - ${user.name} (Aadhaar: ${user.aadhaar_number}, PAN: ${user.pan_number})`);
    });

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📝 You can now test document verification with these sample documents:");
    console.log("   • Create test documents with the above Aadhaar/PAN numbers");
    console.log("   • Upload them through the frontend");
    console.log("   • The backend will verify against this sample data");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

// Run the seeding if this script is executed directly
seedDatabase();

export { seedDatabase, sampleUsers };
