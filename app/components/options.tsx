export const CURRENCIES = [
  // --- العملات العالمية الأساسية ---
  { id: 'usd', label: 'الدولار الأمريكي (USD)', value: 'USD' },
  { id: 'eur', label: 'اليورو (EUR)', value: 'EUR' },
  { id: 'gbp', label: 'الجنيه الإسترليني (GBP)', value: 'GBP' },
  { id: 'cny', label: 'اليوان الصيني (CNY)', value: 'CNY' },
  { id: 'try', label: 'الليرة التركية (TRY)', value: 'TRY' },
  { id: 'idr', label: 'الروبية الإندونيسية (IDR)', value: 'IDR' },

  // --- دول مجلس التعاون الخليجي ---
  { id: 'sar', label: 'الريال السعودي (SAR)', value: 'SAR' },
  { id: 'aed', label: 'الدرهم الإماراتي (AED)', value: 'AED' },
  { id: 'kwd', label: 'الدينار الكويتي (KWD)', value: 'KWD' },
  { id: 'qar', label: 'الريال القطري (QAR)', value: 'QAR' },
  { id: 'bhd', label: 'الدينار البحريني (BHD)', value: 'BHD' },
  { id: 'omr', label: 'الريال العماني (OMR)', value: 'OMR' },

  // --- دول حوض النيل والقرن الأفريقي ---
  { id: 'egp', label: 'الجنيه المصري (EGP)', value: 'EGP' },
  { id: 'sdg', label: 'الجنيه السوداني (SDG)', value: 'SDG' },
  { id: 'djf', label: 'الفرنك الجيبوتي (DJF)', value: 'DJF' },
  { id: 'sos', label: 'الشلن الصومالي (SOS)', value: 'SOS' },
  { id: 'kmf', label: 'الفرنك القمري (KMF)', value: 'KMF' },

  // --- دول المشرق العربي والعراق ---
  { id: 'iqd', label: 'الدينار العراقي (IQD)', value: 'IQD' },
  { id: 'jod', label: 'الدينار الأردني (JOD)', value: 'JOD' },
  { id: 'lbp', label: 'الليرة اللبنانية (LBP)', value: 'LBP' },
  { id: 'syp', label: 'الليرة السورية (SYP) ', value: 'SYP' },
  { id: 'pab', label: 'الدينار الفلسطيني', value: 'ILS' },

  // --- دول المغرب العربي ---
  { id: 'mad', label: 'الدرهم المغربي (MAD)', value: 'MAD' },
  { id: 'dzd', label: 'الدينار الجزائري (DZD)', value: 'DZD' },
  { id: 'tnd', label: 'الدينار التونسي (TND)', value: 'TND' },
  { id: 'lyd', label: 'الدينار الليبي (LYD)', value: 'LYD' },
  { id: 'mru', label: 'الأوقية الموريتانية (MRU)', value: 'MRU' },

  // --- اليمن ---
  { id: 'yer', label: 'الريال اليمني (YER)', value: 'YER' },
];

export const PRODUCT_UNITS = [
  // --- التعبئة والتجزئة (شامل الكرتونة والرزمة) ---
  { id: 'carton', label: 'كرتونة (Carton)', value: 'كرتونة' },
  { id: 'ream', label: 'رزمة (Ream)', value: 'رزمة' },
  { id: 'bundle', label: 'حزمة / شدة (Bundle)', value: 'حزمة' },
  { id: 'bale', label: 'بالة (Bale)', value: 'بالة' },
  { id: 'pack', label: 'باكيت / عبوة (Pack)', value: 'باكيت' },
  { id: 'box', label: 'صندوق (Box)', value: 'صندوق' },
  { id: 'shrink', label: 'شدة بلاستيك (Shrink)', value: 'شدة' },
  { id: 'sack', label: 'شوال / خيش (Sack)', value: 'شوال' },

  // --- الأوزان والكميات الكبيرة ---
  { id: 'ton', label: 'طن (Metric Ton)', value: 'طن' },
  { id: 'kg', label: 'كيلوجرام (KG)', value: 'كيلو' },
  { id: 'gram', label: 'جرام (Gram)', value: 'جرام' },
  { id: 'lb', label: 'رطل (Pound)', value: 'رطل' },

  // --- الشحن واللوجستيات ---
  { id: 'container_20', label: 'حاوية 20 قدم', value: 'حاوية 20' },
  { id: 'container_40', label: 'حاوية 40 قدم', value: 'حاوية 40' },
  { id: 'pallet', label: 'طبلية (Pallet)', value: 'طبلية' },
  { id: 'drum', label: 'برميل (Drum)', value: 'برميل' },

  // --- القياس والحجم ---
  { id: 'cbm', label: 'متر مكعب (CBM)', value: 'متر مكعب' },
  { id: 'liter', label: 'لتر (Liter)', value: 'لتر' },
  { id: 'gallon', label: 'جالون (Gallon)', value: 'جالون' },
  { id: 'meter', label: 'متر (Meter)', value: 'متر' },
  { id: 'sqm', label: 'متر مربع (SQM)', value: 'متر مربع' },

  // --- وحدات العدد ---
  { id: 'pc', label: 'قطعة (Piece)', value: 'قطعة' },
  { id: 'dozen', label: 'درزن (Dozen)', value: 'درزن' },
  { id: 'set', label: 'طقم (Set)', value: 'طقم' },
  { id: 'pair', label: 'زوج (Pair)', value: 'زوج' },
];
export const COUNTRIES = [
  // --- دول مجلس التعاون الخليجي ---
  { id: 'SA', label: 'المملكة العربية السعودية', value: 'السعودية' },
  { id: 'AE', label: 'الإمارات العربية المتحدة', value: 'الإمارات' },
  { id: 'KW', label: 'الكويت', value: 'الكويت' },
  { id: 'QA', label: 'قطر', value: 'قطر' },
  { id: 'BH', label: 'البحرين', value: 'البحرين' },
  { id: 'OM', label: 'سلطنة عمان', value: 'عمان' },

  // --- دول آسيوية رئيسية (مهمة لعملك) ---
  { id: 'ID', label: 'إندونيسيا', value: 'إندونيسيا' },
  { id: 'CN', label: 'الصين', value: 'الصين' },
  { id: 'TR', label: 'تركيا', value: 'تركيا' },
  { id: 'MY', label: 'ماليزيا', value: 'ماليزيا' },

  // --- دول حوض النيل والقرن الأفريقي ---
  { id: 'EG', label: 'مصر', value: 'مصر' },
  { id: 'SD', label: 'السودان', value: 'السودان' },
  { id: 'DJ', label: 'جيبوتي', value: 'جيبوتي' },
  { id: 'SO', label: 'الصومال', value: 'الصومال' },
  { id: 'KM', label: 'جزر القمر', value: 'جزر القمر' },

  // --- دول المشرق العربي والعراق ---
  { id: 'IQ', label: 'العراق', value: 'العراق' },
  { id: 'JO', label: 'الأردن', value: 'الأردن' },
  { id: 'LB', label: 'لبنان', value: 'لبنان' },
  { id: 'SY', label: 'سوريا', value: 'سوريا' },
  { id: 'PS', label: 'فلسطين', value: 'فلسطين' },

  // --- دول المغرب العربي ---
  { id: 'MA', label: 'المغرب', value: 'المغرب' },
  { id: 'DZ', label: 'الجزائر', value: 'الجزائر' },
  { id: 'TN', label: 'تونس', value: 'تونس' },
  { id: 'LY', label: 'ليبيا', value: 'ليبيا' },
  { id: 'MR', label: 'موريتانيا', value: 'موريتانيا' },

  // --- اليمن ---
  { id: 'YE', label: 'اليمن', value: 'اليمن' },

  // --- دول عالمية أخرى ---
  { id: 'US', label: 'الولايات المتحدة الأمريكية', value: 'أمريكا' },
  { id: 'GB', label: 'المملكة المتحدة', value: 'بريطانيا' },
  { id: 'CA', label: 'كندا', value: 'كندا' },
  { id: 'AU', label: 'أستراليا', value: 'أستراليا' },
];
export const PRODUCT_CATEGORIES = [
{ id: 'Food', label: ' المنتجات الغذائية (Food products)', value: '  المنتجات الغذائية' },
{ id: 'oils', label: 'الزيوت والدهون (Oils & Fats)', value: 'زيوت ودهون غذائية' },
{ id: 'poultry', label: 'الدواجن واللحوم (Poultry & Meats)', value: 'دواجن ولحوم' },
{ id: 'seafood', label: 'الأسماك والمأكولات البحرية (Seafood)', value: 'أسماك ومأكولات بحرية' },
{ id: 'dairy', label: 'منتجات الألبان (Dairy Products)', value: 'منتجات ألبان' },
{ id: 'grains', label: 'الحبوب الغذائية (Grains)', value: 'حبوب غذائية' },
{ id: 'fruits', label: 'الفواكه الطازجة (Fresh Fruits)', value: 'فواكه' },
{ id: 'vegetables', label: 'الخضروات الطازجة (Fresh Vegetables)', value: 'خضروات' },
{ id: 'spices', label: 'التوابل والأعشاب (Spices & Herbs)', value: 'توابل وأعشاب' },
{ id: 'sugar', label: 'السكر والمحليات (Sugar & Sweeteners)', value: 'سكر ومحليات' },
{ id: 'flour', label: 'الدقيق ومنتجات القمح (Flour Products)', value: 'دقيق ومنتجات قمح' },

{ id: 'paper', label: 'الورق ومنتجات الطباعة (Paper & Printing)', value: 'ورق ومنتجات طباعة' },
{ id: 'stationery', label: 'القرطاسية والمستلزمات المكتبية (Stationery)', value: 'قرطاسية ومستلزمات مكتبية' },
{ id: 'printers', label: 'الطابعات وملحقاتها (Printers)', value: 'طابعات وملحقاتها' },
{ id: 'electronics', label: 'الأجهزة الإلكترونية (Electronics)', value: 'أجهزة إلكترونية' },
{ id: 'computers', label: 'أجهزة الكمبيوتر واللابتوب (Computers)', value: 'كمبيوتر ولابتوب' },
{ id: 'mobile', label: 'الهواتف المحمولة (Mobile Phones)', value: 'هواتف محمولة' },
{ id: 'network', label: 'معدات الشبكات والاتصالات (Networking)', value: 'معدات شبكات' },
{ id: 'security', label: 'أنظمة المراقبة والأمن (Security Systems)', value: 'أنظمة مراقبة وأمن' },
{ id: 'software', label: 'البرمجيات والأنظمة (Software)', value: 'برمجيات وأنظمة' },
{ id: 'servers', label: 'الخوادم ومعدات مراكز البيانات (Servers)', value: 'خوادم ومراكز بيانات' },

{ id: 'building', label: 'مواد البناء (Building Materials)', value: 'مواد بناء' },
{ id: 'cement', label: 'الأسمنت ومواد الخرسانة (Cement)', value: 'أسمنت وخرسانة' },
{ id: 'steel', label: 'الحديد والصلب (Steel)', value: 'حديد وصلب' },
{ id: 'wood', label: 'الأخشاب ومنتجات الخشب (Wood)', value: 'أخشاب' },
{ id: 'paint', label: 'الدهانات والطلاء (Paints)', value: 'دهانات وطلاء' },
{ id: 'tiles', label: 'السيراميك والبلاط (Tiles)', value: 'سيراميك وبلاط' },
{ id: 'stones', label: 'الأحجار والرخام والجرانيت (Stones & Marble)', value: 'أحجار ورخام' },
{ id: 'glass', label: 'الزجاج ومنتجاته (Glass)', value: 'زجاج' },
{ id: 'aluminum', label: 'الألومنيوم ومنتجاته (Aluminum)', value: 'ألمنيوم' },
{ id: 'insulation', label: 'مواد العزل الحراري والمائي (Insulation)', value: 'مواد عزل' },

{ id: 'furniture', label: 'الأثاث والديكور (Furniture)', value: 'أثاث وديكور' },
{ id: 'office_furniture', label: 'أثاث المكاتب والشركات (Office Furniture)', value: 'أثاث مكاتب' },
{ id: 'home_furniture', label: 'الأثاث المنزلي (Home Furniture)', value: 'أثاث منزلي' },
{ id: 'decor', label: 'الديكور والإضاءة (Decor & Lighting)', value: 'ديكور وإضاءة' },
{ id: 'carpets', label: 'السجاد والمفروشات (Carpets)', value: 'سجاد ومفروشات' },

{ id: 'agriculture', label: 'المنتجات الزراعية (Agricultural Products)', value: 'منتجات زراعية' },
{ id: 'seeds', label: 'البذور الزراعية (Seeds)', value: 'بذور زراعية' },
{ id: 'fertilizers', label: 'الأسمدة الزراعية (Fertilizers)', value: 'أسمدة زراعية' },
{ id: 'pesticides', label: 'المبيدات الزراعية (Pesticides)', value: 'مبيدات زراعية' },
{ id: 'animal_feed', label: 'أعلاف الحيوانات والدواجن (Animal Feed)', value: 'أعلاف حيوانية' },

{ id: 'packaging', label: 'مواد التعبئة والتغليف (Packaging)', value: 'تعبئة وتغليف' },
{ id: 'plastic', label: 'المنتجات البلاستيكية (Plastic Products)', value: 'منتجات بلاستيكية' },
{ id: 'rubber', label: 'منتجات المطاط (Rubber Products)', value: 'منتجات مطاطية' },
{ id: 'chemicals', label: 'المواد الكيميائية الصناعية (Chemicals)', value: 'مواد كيميائية' },
{ id: 'industrial', label: 'المعدات الصناعية (Industrial Equipment)', value: 'معدات صناعية' },

{ id: 'automotive', label: 'السيارات وقطع الغيار (Automotive)', value: 'سيارات وقطع غيار' },
{ id: 'motorcycles', label: 'الدراجات النارية (Motorcycles)', value: 'دراجات نارية' },
{ id: 'batteries', label: 'البطاريات ومصادر الطاقة (Batteries)', value: 'بطاريات' },
{ id: 'tires', label: 'إطارات السيارات (Tires)', value: 'إطارات سيارات' },
{ id: 'lubricants', label: 'زيوت السيارات (Lubricants)', value: 'زيوت سيارات' },

{ id: 'textiles', label: 'الأقمشة والمنسوجات (Textiles)', value: 'أقمشة ومنسوجات' },
{ id: 'clothing', label: 'الملابس الجاهزة (Clothing)', value: 'ملابس جاهزة' },
{ id: 'shoes', label: 'الأحذية (Shoes)', value: 'أحذية' },
{ id: 'bags', label: 'الحقائب (Bags)', value: 'حقائب' },
{ id: 'accessories', label: 'الإكسسوارات (Accessories)', value: 'إكسسوارات' },

{ id: 'cosmetics', label: 'مستحضرات التجميل (Cosmetics)', value: 'مستحضرات تجميل' },
{ id: 'perfumes', label: 'العطور (Perfumes)', value: 'عطور' },
{ id: 'personal_care', label: 'منتجات العناية الشخصية (Personal Care)', value: 'عناية شخصية' },
{ id: 'cleaning', label: 'مواد التنظيف (Cleaning Supplies)', value: 'مواد تنظيف' },

{ id: 'transport', label: 'خدمات النقل (Transportation)', value: 'خدمات نقل' },
{ id: 'shipping', label: 'خدمات الشحن (Shipping)', value: 'شحن بضائع' },
{ id: 'logistics', label: 'الخدمات اللوجستية (Logistics)', value: 'خدمات لوجستية' },
{ id: 'warehousing', label: 'خدمات التخزين (Warehousing)', value: 'تخزين بضائع' },
{ id: 'consulting', label: 'الخدمات الاستشارية (Consulting)', value: 'استشارات أعمال' },
{ id: 'marketing', label: 'خدمات التسويق (Marketing)', value: 'خدمات تسويق' },

{ id: 'medical', label: 'المعدات الطبية (Medical Equipment)', value: 'معدات طبية' },
{ id: 'pharma', label: 'المنتجات الدوائية (Pharmaceuticals)', value: 'منتجات دوائية' },
{ id: 'lab', label: 'معدات المختبرات (Laboratory Equipment)', value: 'معدات مختبرات' },

{ id: 'education', label: 'المستلزمات التعليمية (Education Supplies)', value: 'مستلزمات تعليمية' },
{ id: 'books', label: 'الكتب والمطبوعات (Books)', value: 'كتب ومطبوعات' },

{ id: 'energy', label: 'قطاع الطاقة (Energy)', value: 'قطاع الطاقة' },
{ id: 'solar', label: 'معدات الطاقة الشمسية (Solar Energy)', value: 'طاقة شمسية' },

{ id: 'other', label: 'فئات أخرى (Other)', value: 'فئات أخرى' }
];
