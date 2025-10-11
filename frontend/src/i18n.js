import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      courses: 'Courses',
      about: 'About',
      contact: 'Contact',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      dashboard: 'Dashboard',
      myCourses: 'My Courses',
      
      // Common
      welcome: 'Welcome',
      search: 'Search',
      loading: 'Loading...',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      
      // Home Page
      heroTitle: 'Transform Your Future with GreenDye Academy',
      heroSubtitle: 'Access world-class training and qualification programs',
      getStarted: 'Get Started',
      exploreCourses: 'Explore Courses',
      
      // Courses
      allCourses: 'All Courses',
      courseDetail: 'Course Details',
      enroll: 'Enroll Now',
      enrolled: 'Enrolled',
      instructor: 'Instructor',
      duration: 'Duration',
      level: 'Level',
      language: 'Language',
      
      // Verification
      verifyCertificate: 'Verify Certificate',
      verifyTrainer: 'Verify Trainer',
      certificateValid: 'Certificate is valid',
      certificateInvalid: 'Certificate is invalid',
      trainerVerified: 'Trainer is verified',
      
      // Auth
      email: 'Email',
      password: 'Password',
      name: 'Name',
      forgotPassword: 'Forgot Password?',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',
      
      // Footer
      footerText: '© 2025 GreenDye Academy. All rights reserved.',
    }
  },
  ar: {
    translation: {
      // Navigation
      home: 'الرئيسية',
      courses: 'الدورات',
      about: 'من نحن',
      contact: 'اتصل بنا',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      dashboard: 'لوحة التحكم',
      myCourses: 'دوراتي',
      
      // Common
      welcome: 'مرحباً',
      search: 'بحث',
      loading: 'جاري التحميل...',
      submit: 'إرسال',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      view: 'عرض',
      
      // Home Page
      heroTitle: 'حوّل مستقبلك مع أكاديمية جرين داي',
      heroSubtitle: 'احصل على برامج تدريب وتأهيل عالمية المستوى',
      getStarted: 'ابدأ الآن',
      exploreCourses: 'استكشف الدورات',
      
      // Courses
      allCourses: 'جميع الدورات',
      courseDetail: 'تفاصيل الدورة',
      enroll: 'سجل الآن',
      enrolled: 'مسجل',
      instructor: 'المدرب',
      duration: 'المدة',
      level: 'المستوى',
      language: 'اللغة',
      
      // Verification
      verifyCertificate: 'التحقق من الشهادة',
      verifyTrainer: 'التحقق من المدرب',
      certificateValid: 'الشهادة صالحة',
      certificateInvalid: 'الشهادة غير صالحة',
      trainerVerified: 'المدرب معتمد',
      
      // Auth
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      name: 'الاسم',
      forgotPassword: 'نسيت كلمة المرور؟',
      dontHaveAccount: 'ليس لديك حساب؟',
      alreadyHaveAccount: 'لديك حساب بالفعل؟',
      
      // Footer
      footerText: '© 2025 أكاديمية جرين داي. جميع الحقوق محفوظة.',
    }
  },
  fr: {
    translation: {
      // Navigation
      home: 'Accueil',
      courses: 'Cours',
      about: 'À propos',
      contact: 'Contact',
      login: 'Connexion',
      register: "S'inscrire",
      logout: 'Déconnexion',
      dashboard: 'Tableau de bord',
      myCourses: 'Mes cours',
      
      // Common
      welcome: 'Bienvenue',
      search: 'Rechercher',
      loading: 'Chargement...',
      submit: 'Soumettre',
      cancel: 'Annuler',
      save: 'Sauvegarder',
      delete: 'Supprimer',
      edit: 'Modifier',
      view: 'Voir',
      
      // Home Page
      heroTitle: 'Transformez votre avenir avec GreenDye Academy',
      heroSubtitle: 'Accédez à des programmes de formation de classe mondiale',
      getStarted: 'Commencer',
      exploreCourses: 'Explorer les cours',
      
      // Courses
      allCourses: 'Tous les cours',
      courseDetail: 'Détails du cours',
      enroll: "S'inscrire maintenant",
      enrolled: 'Inscrit',
      instructor: 'Instructeur',
      duration: 'Durée',
      level: 'Niveau',
      language: 'Langue',
      
      // Verification
      verifyCertificate: 'Vérifier le certificat',
      verifyTrainer: "Vérifier l'instructeur",
      certificateValid: 'Le certificat est valide',
      certificateInvalid: "Le certificat n'est pas valide",
      trainerVerified: "L'instructeur est vérifié",
      
      // Auth
      email: 'Email',
      password: 'Mot de passe',
      name: 'Nom',
      forgotPassword: 'Mot de passe oublié?',
      dontHaveAccount: "Vous n'avez pas de compte?",
      alreadyHaveAccount: 'Vous avez déjà un compte?',
      
      // Footer
      footerText: '© 2025 GreenDye Academy. Tous droits réservés.',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
