require('dotenv').config();
const mongoose  = require('mongoose');
const User      = require('./models/User');
const connectDB = require('./config/db');

const mentors = [
  { name:'Priya Sharma',  email:'priya@demo.com',  password:'demo123', role:'mentor', isEmailVerified:true, company:'Google',     domain:'Engineering', experience:'8 years',  skills:['System Design','DSA','Machine Learning','Python'],    bio:'Staff Engineer at Google helping engineers crack FAANG interviews.', rating:4.9, totalSessions:142, isVerified:true,  verificationStatus:'approved' },
  { name:'James Walker',  email:'james@demo.com',  password:'demo123', role:'mentor', isEmailVerified:true, company:'OpenAI',     domain:'AI/ML',       experience:'10 years', skills:['LLMs','Python','Research','PyTorch','NLP'],           bio:'ML Lead at OpenAI. I help engineers transition into AI/ML roles.',   rating:5.0, totalSessions:87,  isVerified:true,  verificationStatus:'approved' },
  { name:'Ananya Roy',    email:'ananya@demo.com', password:'demo123', role:'mentor', isEmailVerified:true, company:'Amazon',     domain:'Engineering', experience:'6 years',  skills:['React','Node.js','AWS','TypeScript'],                  bio:'Senior SDE at Amazon. Full-stack and cloud architecture.',           rating:4.8, totalSessions:203, isVerified:true,  verificationStatus:'approved' },
  { name:'Carlos Mendes', email:'carlos@demo.com', password:'demo123', role:'mentor', isEmailVerified:true, company:'Meta',       domain:'Product',     experience:'7 years',  skills:['Product Strategy','Roadmapping','Analytics'],         bio:'PM at Meta with 7 years of product experience.',                    rating:4.7, totalSessions:64,  isVerified:false, verificationStatus:'none'     },
  { name:'Yuki Tanaka',   email:'yuki@demo.com',   password:'demo123', role:'mentor', isEmailVerified:true, company:'Netflix',    domain:'Data',        experience:'5 years',  skills:['SQL','Python','Tableau','Statistics'],                 bio:'Data Scientist at Netflix.',                                        rating:4.9, totalSessions:115, isVerified:true,  verificationStatus:'approved' },
  { name:'Raj Krishnan',  email:'raj@demo.com',    password:'demo123', role:'mentor', isEmailVerified:true, company:'Stripe',     domain:'Leadership',  experience:'12 years', skills:['Engineering Management','System Architecture'],       bio:'Engineering Manager at Stripe. Coaching future tech leaders.',      rating:4.8, totalSessions:91,  isVerified:true,  verificationStatus:'approved' },
];

const mentees = [
  { name:'Alex Chen',  email:'demo@mentorbridge.io', password:'demo123', role:'mentee', isEmailVerified:true, skills:['JavaScript','React','Node.js'], goals:['Get a job at a FAANG company','Learn system design'] },
  { name:'Sam Taylor', email:'sam@demo.com',          password:'demo123', role:'mentee', isEmailVerified:true, skills:['Python','SQL'],                 goals:['Transition to ML engineering']                        },
];

const seed = async () => {
  await connectDB();
  try {
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');
    await User.insertMany([...mentors, ...mentees]);
    console.log(`✅ Seeded ${mentors.length} mentors and ${mentees.length} mentees`);
    console.log('\nDemo credentials:');
    console.log('  Mentee: demo@mentorbridge.io / demo123');
    console.log('  Mentor: priya@demo.com / demo123\n');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
  process.exit();
};

seed();
