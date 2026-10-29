export const site = {
  name: 'أكاديمية ديما',
  nameEn: 'Deema Academy',
  handle: '@deema.academy',
  domain: 'deema.academy',
  tagline: 'فكّر خارج الصندوق.. تخصصك هو البداية، مش حدود مستقبلك',
  description:
    'أكاديمية ديما: مساحة عربية لطلاب وخريجي التخصصات الصحية، تجمع بين الصيدلة والذكاء الاصطناعي والبحث العلمي وصناعة المحتوى الطبي.',
} as const;

export const nav = [
  { href: '/#about', label: 'من نحن' },
  { href: '/#story', label: 'رحلة د. ديما' },
  { href: '/#tracks', label: 'المسارات' },
  { href: '/#workshop', label: 'الورشة' },
  { href: '/#faq', label: 'أسئلة شائعة' },
] as const;
