export interface PartSpec {
  keywords: string[]
  title: string
  description: string
  specs: string[]
}

const PART_SPECS: PartSpec[] = [
  // ── Motor ──
  {
    keywords: ['yağ filtre', 'oil filter', 'yag filtre'],
    title: 'Yağ Filtresi',
    description: 'Motor yağındaki partikülleri süzerek motorun temiz yağ ile çalışmasını sağlar.',
    specs: ['Değişim: 10.000-15.000 km', 'Filtrasyon: 20-40 mikron'],
  },
  {
    keywords: ['hava filtre', 'air filter'],
    title: 'Hava Filtresi',
    description: 'Motora giren havadaki toz ve kirli partikülleri temizler. Motorun verimli çalışması için düzenli değişim önerilir.',
    specs: ['Değişim: 15.000-30.000 km', 'Tip: Panel / Silindirik'],
  },
  {
    keywords: ['yakıt filtre', 'fuel filter', 'yakit filtre', 'mazot filtre'],
    title: 'Yakıt Filtresi',
    description: 'Yakıttaki kirleri ve suyu ayırarak enjektörlerin temiz kalmasını sağlar.',
    specs: ['Değişim: 20.000-40.000 km', 'Filtrasyon: 3-5 mikron'],
  },
  {
    keywords: ['polen filtre', 'kabin filtre', 'cabin filter', 'pollen filter'],
    title: 'Polen / Kabin Filtresi',
    description: 'Araç kabinine giren havadaki polen, toz ve kötü kokuları filtreler.',
    specs: ['Değişim: 15.000-20.000 km', 'Tip: Aktif karbon / Standart'],
  },
  {
    keywords: ['buji', 'spark plug', 'ateşleme'],
    title: 'Buji',
    description: 'Silindir içindeki yakıt-hava karışımını ateşleyerek motorun çalışmasını sağlar.',
    specs: ['Değişim: 30.000-60.000 km', 'Tip: Nikel / İridyum / Platin'],
  },
  {
    keywords: ['triger', 'timing belt', 'eksantrik'],
    title: 'Triger Kayışı / Seti',
    description: 'Motor zamanlamasını sağlayarak supap ve pistonların senkron çalışmasını kontrol eder.',
    specs: ['Değişim: 60.000-120.000 km', 'Set: Kayış + gergi + rulo'],
  },
  {
    keywords: ['v kayış', 'kanallı kayış', 'serpantin', 'multi v belt', 'alternator kayış'],
    title: 'V Kayışı / Kanallı Kayış',
    description: 'Motor aksesuarlarını (alternatör, klima, direksiyon pompası) tahrik eder.',
    specs: ['Değişim: 40.000-80.000 km', 'Kontrol: Çatlak ve gerginlik'],
  },
  {
    keywords: ['termostat', 'thermostat'],
    title: 'Termostat',
    description: 'Motor soğutma sıvısının sıcaklık dolaşımını düzenler. Motorun çalışma sıcaklığına hızlı ulaşmasını sağlar.',
    specs: ['Açılma: 82-92°C', 'Malzeme: Balmumu / Elektronik'],
  },
  {
    keywords: ['devirdaim', 'su pompa', 'water pump', 'su pompası'],
    title: 'Devirdaim (Su Pompası)',
    description: 'Soğutma sıvısını motor ve radyatör arasında dolaştırarak motorun aşırı ısınmasını engeller.',
    specs: ['Değişim: Triger seti ile birlikte', 'Tip: Mekanik / Elektrikli'],
  },
  {
    keywords: ['radyatör', 'radiator'],
    title: 'Radyatör',
    description: 'Motor soğutma sıvısını rüzgar yardımıyla soğutarak motorun optimum sıcaklıkta çalışmasını sağlar.',
    specs: ['Malzeme: Alüminyum / Bakır', 'Bakım: Sıvı seviyesi kontrolü'],
  },
  {
    keywords: ['yağ pompa', 'oil pump'],
    title: 'Yağ Pompası',
    description: 'Motor yağını basınçlı olarak tüm hareketli parçalara ileterek sürtünmeyi azaltır.',
    specs: ['Tip: Dişli / Kanatlı', 'Basınç: 3-5 bar'],
  },
  {
    keywords: ['karter', 'oil pan', 'yağ karteri'],
    title: 'Karter',
    description: 'Motor yağının depolandığı alt kısımdır. Darbe sonucu çatlama veya sızıntı oluşabilir.',
    specs: ['Malzeme: Çelik / Alüminyum', 'Kapasitesi: Araca göre değişir'],
  },
  {
    keywords: ['conta', 'gasket', 'karter contası', 'kapak conta'],
    title: 'Conta',
    description: 'Motor bölümlerinin birleşim noktalarında sızdırmazlık sağlar.',
    specs: ['Tip: Silindir kapak / Karter / Supap kapağı', 'Malzeme: Metal / Kompozit'],
  },
  {
    keywords: ['turbo', 'turbocharger', 'turboşarj'],
    title: 'Turbo (Turboşarj)',
    description: 'Egzoz gazlarının enerjisini kullanarak motora daha fazla hava göndererek performansı artırır.',
    specs: ['Devir: 150.000-250.000 rpm', 'Bakım: Yağ değişimine dikkat'],
  },

  // ── Fren ──
  {
    keywords: ['balata', 'brake pad', 'fren balata'],
    title: 'Fren Balatası',
    description: 'Fren diskine basarak aracın yavaşlamasını ve durmasını sağlayan sürtünme elemanıdır.',
    specs: ['Değişim: 30.000-50.000 km', 'Kalınlık min: 2-3 mm'],
  },
  {
    keywords: ['fren disk', 'brake disc', 'brake rotor'],
    title: 'Fren Diski',
    description: 'Balatanın bastığı döner disk. Isı ve sürtünme ile zaman içinde aşınır.',
    specs: ['Malzeme: Dökme demir / Seramik', 'Minimum kalınlık: Diske özel'],
  },
  {
    keywords: ['fren kaliper', 'brake caliper', 'kaliper'],
    title: 'Fren Kaliperi',
    description: 'Balatayı disk üzerine bastıran hidrolik piston sistemidir.',
    specs: ['Tip: Sabit / Yüzen', 'Bakım: Piston ve körük kontrolü'],
  },
  {
    keywords: ['fren hortum', 'brake hose'],
    title: 'Fren Hortumu',
    description: 'Fren hidrolik sıvısını kalipere ileten esnek hortum. Çatlama riski nedeniyle periyodik kontrol gerektirir.',
    specs: ['Değişim: 4-6 yıl', 'Malzeme: Kauçuk / Çelik örgülü'],
  },
  {
    keywords: ['abs sensör', 'abs sensor', 'hız sensör'],
    title: 'ABS Sensörü',
    description: 'Tekerlek dönüş hızını ölçerek ABS sistemine bilgi gönderir.',
    specs: ['Tip: İndüktif / Hall-effect', 'Konum: Her tekerlekte 1 adet'],
  },

  // ── Süspansiyon ──
  {
    keywords: ['amortisör', 'shock absorber', 'amortiseur'],
    title: 'Amortisör',
    description: 'Yol darbelerini sönümleyerek konforlu ve güvenli sürüş sağlar.',
    specs: ['Değişim: 60.000-80.000 km', 'Tip: Gaz / Yağ'],
  },
  {
    keywords: ['bijon', 'viraj denge', 'stabilizer', 'viraj çubuğu'],
    title: 'Viraj Denge Çubuğu / Biyel Kolu',
    description: 'Virajlarda aracın dengesini korur ve yalpalamayı engeller.',
    specs: ['Konum: Ön / Arka', 'Kontrol: Burç ve bağlantı aşınması'],
  },
  {
    keywords: ['rotil', 'rot başı', 'tie rod', 'rot'],
    title: 'Rot Başı / Rotil',
    description: 'Direksiyon hareketini tekerleklere ileten bağlantı elemanıdır.',
    specs: ['Kontrol: Boşluk testi', 'Değişim sonrası: Rot ayarı gerekir'],
  },
  {
    keywords: ['salıncak', 'wishbone', 'alt tabla', 'üst tabla', 'control arm'],
    title: 'Salıncak (Kontrol Kolu)',
    description: 'Tekerleği gövdeye bağlayan ve süspansiyon geometrisini koruyan yapısal elemandır.',
    specs: ['Malzeme: Çelik / Alüminyum', 'Kontrol: Burç ve bilyalı mafsal'],
  },
  {
    keywords: ['yay', 'spring', 'helezon', 'coil spring'],
    title: 'Helezon Yay',
    description: 'Aracın ağırlığını taşır ve yol darbelerini emer. Amortisör ile birlikte çalışır.',
    specs: ['Tip: Standart / Spor / Takviyeli', 'Değişim: Çift olarak önerilir'],
  },

  // ── Aydınlatma ──
  {
    keywords: ['far', 'headlight', 'headlamp', 'head lamp'],
    title: 'Far',
    description: 'Aracın ön aydınlatma ünitesi. Gece sürüşünde görüş mesafesini sağlar.',
    specs: ['Tip: Halojen / Xenon / LED / Lazer', 'Yön: Sol / Sağ'],
  },
  {
    keywords: ['stop lamba', 'tail light', 'tail lamp', 'arka lamba', 'arka stop'],
    title: 'Arka Stop Lambası',
    description: 'Aracın arkasındaki fren, sinyal ve park lambalarını içeren aydınlatma ünitesi.',
    specs: ['Tip: LED / Ampullü', 'Yön: Sol / Sağ'],
  },
  {
    keywords: ['sinyal', 'indicator', 'dönüş lambası'],
    title: 'Sinyal Lambası',
    description: 'Dönüş ve şerit değiştirme sırasında diğer sürücüleri uyaran lamba.',
    specs: ['Tip: LED / Ampullü', 'Konum: Ön / Arka / Ayna'],
  },
  {
    keywords: ['sis far', 'fog light', 'sis lambası'],
    title: 'Sis Farı / Lambası',
    description: 'Sisli havalarda yol yüzeyini aydınlatarak görüşü artırır.',
    specs: ['Tip: Halojen / LED', 'Konum: Ön / Arka'],
  },

  // ── Elektrik ──
  {
    keywords: ['alternatör', 'alternator', 'şarj dinamosu'],
    title: 'Alternatör',
    description: 'Motor çalışırken elektrik üreterek aküyü şarj eder ve elektrik sistemini besler.',
    specs: ['Çıkış: 12V / 80-180A', 'Kontrol: Kayış gerginliği ve karbon'],
  },
  {
    keywords: ['marş motoru', 'starter', 'marş', 'starter motor'],
    title: 'Marş Motoru',
    description: 'Motor ilk çalıştırmada volana bağlanarak krank milini döndürür.',
    specs: ['Güç: 1.0-2.5 kW', 'Voltaj: 12V'],
  },
  {
    keywords: ['akü', 'batarya', 'battery'],
    title: 'Akü',
    description: 'Aracın elektrik enerjisi deposu. Motor çalıştırma ve elektronik sistemleri besler.',
    specs: ['Kapasite: 45-100 Ah', 'Voltaj: 12V', 'Ömür: 3-5 yıl'],
  },

  // ── Kaporta & Dış ──
  {
    keywords: ['tampon', 'bumper', 'ön tampon', 'arka tampon'],
    title: 'Tampon',
    description: 'Aracın ön ve arka kısmında darbe emici koruma elemanı.',
    specs: ['Malzeme: PP plastik', 'Konum: Ön / Arka'],
  },
  {
    keywords: ['çamurluk', 'fender', 'kaput', 'hood', 'bonnet'],
    title: 'Kaporta Parçası',
    description: 'Aracın dış gövde panelleri. Darbe, korozyon veya kaza sonrası değişim gerekebilir.',
    specs: ['Malzeme: Çelik / Alüminyum / Plastik', 'Boyama: Araç rengine uygun'],
  },
  {
    keywords: ['ayna', 'mirror', 'dikiz ayna', 'dış ayna'],
    title: 'Dış Ayna',
    description: 'Sürücünün arkayı görmesini sağlayan yan ayna.',
    specs: ['Tip: Elektrikli / Manuel', 'Özellik: Isıtmalı / Katlanır'],
  },
  {
    keywords: ['cam', 'glass', 'ön cam', 'windshield'],
    title: 'Araç Camı',
    description: 'Ön cam lamine, yan ve arka camlar temperli (sertleştirilmiş) cam üretilir.',
    specs: ['Tip: Lamine / Temperli', 'Konum: Ön / Arka / Yan'],
  },
  {
    keywords: ['silecek', 'wiper', 'silecek kolu'],
    title: 'Silecek',
    description: 'Ön cam üzerindeki yağmur, kar ve kirleri temizleyen lastik bıçak.',
    specs: ['Değişim: 6-12 ay', 'Tip: Konvansiyonel / Düz (flat)'],
  },

  // ── Şanzıman ──
  {
    keywords: ['debriyaj', 'clutch', 'baskı', 'balata seti'],
    title: 'Debriyaj Seti',
    description: 'Motordaki dönme hareketini şanzımana aktaran/kesen mekanizma.',
    specs: ['Set: Baskı + balata + rulman', 'Değişim: 80.000-150.000 km'],
  },
  {
    keywords: ['şaft', 'aks', 'drive shaft', 'ön aks', 'arka aks'],
    title: 'Aks / Şaft',
    description: 'Motor gücünü tekerleklere ileten döner mil. Mafsallar (CV joint) ile dönüş açısı sağlar.',
    specs: ['Kontrol: Körük yırtılması', 'Tip: İç / Dış mafsal'],
  },

  // ── Klima ──
  {
    keywords: ['klima kompresör', 'ac compressor', 'klima'],
    title: 'Klima Kompresörü',
    description: 'Klima sisteminde soğutucu gazı sıkıştırarak soğutma döngüsünü başlatan ana bileşen.',
    specs: ['Tip: Pistonlu / Scroll', 'Gaz: R134a / R1234yf'],
  },
  {
    keywords: ['kalorifer', 'heater core', 'ısıtıcı radyatör'],
    title: 'Kalorifer Radyatörü',
    description: 'Motor soğutma sıvısının ısısını kabine aktararak ısınmayı sağlar.',
    specs: ['Malzeme: Alüminyum', 'Arıza belirtisi: Buğu + sıvı kaçağı'],
  },
]

// Kategori bazlı genel açıklamalar (keyword eşleşmezse)
const CATEGORY_SPECS: Record<string, PartSpec> = {
  engine: {
    keywords: [],
    title: 'Motor Parçası',
    description: 'Motorun verimli ve güvenilir çalışması için kritik öneme sahip parçadır.',
    specs: ['Düzenli bakım ve periyodik kontrol önerilir'],
  },
  brake: {
    keywords: [],
    title: 'Fren Sistemi Parçası',
    description: 'Sürüş güvenliğinin temel unsuru olan fren sistemine ait parçadır.',
    specs: ['Periyodik kontrol ve zamanında değişim önerilir'],
  },
  suspension: {
    keywords: [],
    title: 'Süspansiyon Parçası',
    description: 'Sürüş konforu ve yol tutuşu için kritik öneme sahip süspansiyon bileşenidir.',
    specs: ['Düzenli kontrol ve gerektiğinde çift değişim önerilir'],
  },
  lighting: {
    keywords: [],
    title: 'Aydınlatma Parçası',
    description: 'Gece sürüşü ve trafik güvenliği için hayati öneme sahip aydınlatma bileşenidir.',
    specs: ['Arızalı lambaların acil değişimi önerilir'],
  },
  electrical: {
    keywords: [],
    title: 'Elektrik Parçası',
    description: 'Aracın elektrik sistemine ait bileşendir. Doğru voltaj ve akım değerlerinde çalışması gerekir.',
    specs: ['Profesyonel arıza tespiti önerilir'],
  },
  body_exterior: {
    keywords: [],
    title: 'Kaporta / Dış Parça',
    description: 'Aracın dış gövde ve koruma elemanlarına ait parçadır.',
    specs: ['Orijinal ölçü uyumu önemlidir'],
  },
  transmission: {
    keywords: [],
    title: 'Şanzıman Parçası',
    description: 'Güç aktarma organına ait kritik bileşendir.',
    specs: ['Uzman servis değişimi önerilir'],
  },
  climate: {
    keywords: [],
    title: 'Klima & Isıtma Parçası',
    description: 'Araç içi iklim konforunu sağlayan sisteme ait bileşendir.',
    specs: ['Yıllık klima bakımı önerilir'],
  },
  fuel: {
    keywords: [],
    title: 'Yakıt Sistemi Parçası',
    description: 'Yakıt iletim ve enjeksiyon sistemine ait bileşendir.',
    specs: ['Kaliteli yakıt ve düzenli filtre değişimi önerilir'],
  },
  exhaust: {
    keywords: [],
    title: 'Egzoz Parçası',
    description: 'Egzoz gazlarının güvenli tahliyesi ve emisyon kontrolü sağlayan bileşendir.',
    specs: ['Paslanma ve sızıntı kontrolü önerilir'],
  },
  glass_mirror: {
    keywords: [],
    title: 'Cam & Ayna Parçası',
    description: 'Görüş açısı ve güvenlik için kritik cam veya ayna bileşenidir.',
    specs: ['Çatlak veya kırık durumunda acil değişim önerilir'],
  },
  interior: {
    keywords: [],
    title: 'İç Aksam Parçası',
    description: 'Araç kabininde yer alan iç donanım ve aksesuar parçasıdır.',
    specs: ['Orijinal uyum kontrolü önerilir'],
  },
  turbo_intake: {
    keywords: [],
    title: 'Turbo & Emme Sistemi Parçası',
    description: 'Motorun hava emme ve turbo şarj sistemine ait bileşendir.',
    specs: ['Düzenli bakım ve yağlama önerilir'],
  },
  wheel_tyre: {
    keywords: [],
    title: 'Jant & Lastik Parçası',
    description: 'Tekerlekler ve lastiklerle ilgili bileşendir.',
    specs: ['Balans ve rot ayarı önerilir'],
  },
}

/**
 * Parça adı ve kategori ID'sine göre açıklama bul.
 * Önce keyword match, sonra kategori bazlı, hiçbiri yoksa null.
 */
export function findPartSpec(partName: string, categoryId?: string): PartSpec | null {
  const lower = partName.toLowerCase()

  // Keyword eşleştirmesi
  for (const spec of PART_SPECS) {
    if (spec.keywords.some(kw => lower.includes(kw))) {
      return spec
    }
  }

  // Kategori bazlı genel açıklama
  if (categoryId && CATEGORY_SPECS[categoryId]) {
    return CATEGORY_SPECS[categoryId]
  }

  return null
}
