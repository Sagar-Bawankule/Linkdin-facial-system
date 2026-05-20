// Quick diagnostic: check all students and their embeddings
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const User = require('../model/user');
  const Embedding = require('../model/embedding');

  // Get all students
  const students = await User.find({ role: 'student' }).select('firstName lastName email rollNumber faceEmbedding');
  console.log(`\n=== Found ${students.length} student(s) ===\n`);

  for (const s of students) {
    console.log(`Student: ${s.firstName} ${s.lastName} (${s.email})`);
    console.log(`  ID: ${s._id}`);
    console.log(`  Roll: ${s.rollNumber}`);
    console.log(`  faceEmbedding ref: ${s.faceEmbedding || 'NONE'}`);

    // Check embeddings collection
    const embeddings = await Embedding.find({ user: s._id, isActive: true });
    console.log(`  Active embeddings in DB: ${embeddings.length}`);
    
    if (embeddings.length > 0) {
      embeddings.forEach((emb, i) => {
        console.log(`    Embedding ${i+1}: id=${emb._id}, length=${emb.embedding.length}, first3=[${emb.embedding.slice(0,3).map(v=>v.toFixed(4)).join(', ')}]`);
      });
    } else {
      console.log(`  ⚠️  NO EMBEDDINGS FOUND - face verification will ALWAYS fail for this student!`);
    }
    console.log('');
  }

  await mongoose.disconnect();
}

check().catch(err => { console.error(err); process.exit(1); });
