const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// السماح للمتصفح بقراءة كل الملفات (كالصور، وملفات الستايل والجافاسكريبت)
app.use(express.static(path.join(__dirname)));

// عند الدخول لأي مسار في الموقع، قم بإرجاع الصفحة الرئيسية (مهم جداً لتطبيقات الصفحة الواحدة)
// نتأكد أننا لا نرجع الصفحة الرئيسية لطلبات الملفات المفقودة (مثل .css أو .js)
app.get(/^(?!\/css|\/js|\/assets|\/TheYearofHandicrafts).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
