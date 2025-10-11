/**
 * Seed script to populate database with sample data
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Trainer = require('./models/Trainer');

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const seedData = async () => {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Course.deleteMany({});
    // await Trainer.deleteMany({});

    // Create Admin User
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@greendye.com',
      password: 'admin123',
      role: 'admin',
      language: 'en',
      isVerified: true,
      isActive: true
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Create Trainer User
    const trainerUser = await User.create({
      name: 'Dr. Ahmed Hassan',
      email: 'trainer@greendye.com',
      password: 'trainer123',
      role: 'trainer',
      language: 'ar',
      isVerified: true,
      isActive: true
    });
    console.log('✅ Trainer user created:', trainerUser.email);

    // Create Student User
    const studentUser = await User.create({
      name: 'Sarah Johnson',
      email: 'student@greendye.com',
      password: 'student123',
      role: 'student',
      language: 'en',
      isVerified: true,
      isActive: true
    });
    console.log('✅ Student user created:', studentUser.email);

    // Create Trainer Profile
    const trainer = await Trainer.create({
      user: trainerUser._id,
      fullName: 'Dr. Ahmed Hassan',
      title: {
        en: 'Senior Software Engineer & Educator',
        ar: 'مهندس برمجيات أول ومعلم',
        fr: 'Ingénieur logiciel senior et éducateur'
      },
      expertise: ['Web Development', 'Mobile Development', 'Database Design'],
      bio: {
        en: 'Experienced software engineer with 10+ years in web development',
        ar: 'مهندس برمجيات ذو خبرة تزيد عن 10 سنوات في تطوير الويب',
        fr: 'Ingénieur logiciel expérimenté avec plus de 10 ans en développement web'
      },
      experience: 10,
      languages: [
        { language: 'en', proficiency: 'advanced' },
        { language: 'ar', proficiency: 'native' }
      ],
      isVerified: true,
      isActive: true
    });
    console.log('✅ Trainer profile created:', trainer.trainerId);

    // Create Sample Courses
    const course1 = await Course.create({
      title: {
        en: 'Introduction to Web Development',
        ar: 'مقدمة في تطوير الويب',
        fr: 'Introduction au développement Web'
      },
      description: {
        en: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript',
        ar: 'تعلم أساسيات تطوير الويب بما في ذلك HTML و CSS و JavaScript',
        fr: 'Apprenez les fondamentaux du développement web y compris HTML, CSS et JavaScript'
      },
      shortDescription: {
        en: 'Beginner-friendly web development course',
        ar: 'دورة تطوير الويب للمبتدئين',
        fr: 'Cours de développement web pour débutants'
      },
      category: 'technology',
      level: 'beginner',
      language: ['en', 'ar', 'fr'],
      instructor: trainerUser._id,
      price: 0, // Free course
      duration: 40,
      requirements: {
        en: ['Basic computer skills', 'Internet connection'],
        ar: ['مهارات الكمبيوتر الأساسية', 'اتصال بالإنترنت'],
        fr: ['Compétences informatiques de base', 'Connexion Internet']
      },
      whatYouWillLearn: {
        en: ['HTML basics', 'CSS styling', 'JavaScript fundamentals', 'Build your first website'],
        ar: ['أساسيات HTML', 'تصميم CSS', 'أساسيات JavaScript', 'بناء موقعك الأول'],
        fr: ['Bases HTML', 'Style CSS', 'Fondamentaux JavaScript', 'Construire votre premier site']
      },
      isFeatured: true,
      isPublished: true,
      publishDate: new Date(),
      deliveryMode: 'asynchronous'
    });
    console.log('✅ Course created:', course1.title.get('en'));

    const course2 = await Course.create({
      title: {
        en: 'Advanced JavaScript Programming',
        ar: 'برمجة JavaScript المتقدمة',
        fr: 'Programmation JavaScript avancée'
      },
      description: {
        en: 'Master advanced JavaScript concepts including async/await, closures, and more',
        ar: 'اتقان مفاهيم JavaScript المتقدمة بما في ذلك async/await والإغلاقات والمزيد',
        fr: 'Maîtrisez les concepts avancés de JavaScript incluant async/await, les closures et plus'
      },
      shortDescription: {
        en: 'Take your JavaScript skills to the next level',
        ar: 'انتقل بمهاراتك في JavaScript إلى المستوى التالي',
        fr: 'Élevez vos compétences JavaScript au niveau supérieur'
      },
      category: 'technology',
      level: 'advanced',
      language: ['en'],
      instructor: trainerUser._id,
      price: 99,
      duration: 60,
      isPublished: true,
      publishDate: new Date(),
      deliveryMode: 'hybrid'
    });
    console.log('✅ Course created:', course2.title.get('en'));

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Sample Accounts:');
    console.log('Admin: admin@greendye.com / admin123');
    console.log('Trainer: trainer@greendye.com / trainer123');
    console.log('Student: student@greendye.com / student123');
    console.log('\n🚀 You can now start the application!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
