module.exports = {
  packagerConfig: {
    asar: true,
    icon: './public/logo512',  // تأكد من أن لديك ملف أيقونة
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'NileMix',
        authors: 'Your Name',  // ضع اسمك هنا
        description: 'NileMix Desktop Application',  // وصف مختصر
        exe: 'nilemix.exe',    // هذا هو اسم الملف التنفيذي الذي سيتم إنشاؤه
        icon: './public/logo512',  // نفس الأيقونة في الإعدادات الأخرى
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
