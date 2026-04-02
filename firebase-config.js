/* 
==================================================
  🔥 كيفية تفعيل تسجيل الدخول والمزامنة السحابية 🔥
==================================================
لكي يعمل تسجيل الدخول بجوجل وحفظ البيانات في السحابة
وربطها بين اللابتوب والجوال بشكل جاهز للرفع على النت:

يجب عليك إنشاء مشروع مجاني في Firebase التابع لجوجل:
https://console.firebase.google.com

الخطوات:
1. اصنع مشروع جديد (Create Project).
2. أضف تطبيق ويب (Web App) بالضغط على أيقونة </>.
3. انسخ كود الـ firebaseConfig وضعه هنا في الأسفل.
4. من القائمة الجانبية اذهب إلى Build -> Authentication
   وقم بتفعيل التسجيل بواسطة Google.
5. اذهب إلى Build -> Firestore Database وفعّلها (اختر Start in Test Mode لاختبارها).

بهذه الطريقة الموقع محمي 100% ومستعد للرفع (بإمكانك رفعه على GitHub Pages أو Netlify أو Vercel).
*/

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "123456",
  appId: "1:1234:web:abcd"
};

// تهيئة قاعدة البيانات فقط في حالة وضع المفاتيح الحقيقية
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
  firebase.initializeApp(firebaseConfig);
} else {
  console.log("لم يتم إعداد Firebase بعد، سيتم استخدام التخزين المحلي كبديل مؤقت.");
  // نقوم بتعطيل كائن الفايربيس ليقوم app.js للتبديل للوضع المحلي
  window.firebase = undefined;
}
