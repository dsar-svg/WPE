
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'es' | 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Nav
    'nav.about': 'Sobre Nosotros',
    'nav.featured': 'Platos',
    'nav.locations': 'Sedes',
    'nav.reviews': 'Reseñas',
    'nav.socials': 'Redes',
    'nav.orderNow': 'Pedir Ahora',
    'nav.home': 'Inicio',
    'nav.menu': 'Menú',

    // Hero
    'hero.tagline': '¡LA MEJOR COMIDA DIRECTA A TU MESA!',
    'hero.cta': 'Hacer Pedido',

    // About
    'about.title': 'Sobre Nosotros',
    'about.default': 'En Panda Express, nos apasiona brindar la mejor experiencia gastronómica. Frescura, calidad y el sabor que nos caracteriza en cada pedido.',

    // Featured
    'featured.badge': 'Favoritos del Panda',
    'featured.title': 'Platos Destacados',
    'featured.viewAll': 'Ver todo el menú',

    // Locations
    'locations.badge': 'Encuéntranos',
    'locations.title': 'Nuestras Sedes',
    'locations.open': 'Abierto Ahora',
    'locations.closed': 'Cerrado',
    'locations.closedToday': 'Actualmente Cerrado',

    // Reviews
    'reviews.badge': 'Comunidad Panda',
    'reviews.title': 'Lo que dicen nuestros clientes',

    // Socials
    'socials.title': '¡Únete a la familia!',
    'socials.tagline': 'Síguenos en nuestras redes para no perderte ninguna promoción bomba y sorteos exclusivos.',

    // CTA
    'cta.title': '¿Con hambre?',
    'cta.button': 'Ver Menú Completo',

    // Menu View
    'menu.welcome': '¡Buen provecho!',
    'menu.empty': 'No hay productos aquí',
    'menu.ready': 'Listo para pedir',
    'menu.viewCart': 'Ver Carrito',
    'menu.total': 'Total',
    'menu.price': 'Precio',
    'menu.outOfStock': 'Agotado',

    // Cart
    'cart.title': 'Tu Pedido',
    'cart.checkout': 'Finalizar Pago',
    'cart.empty': 'Tu carrito está vacío',
    'cart.emptyTagline': '¡Agrega algo delicioso para comenzar!',
    'cart.specialInstructions': '¿Alguna instrucción especial?',
    'cart.deliveryMethod': 'Método de Entrega',
    'cart.delivery': 'Delivery',
    'cart.pickup': 'Pick-up',
    'cart.fullName': 'Nombre completo',
    'cart.whatsapp': 'WhatsApp de contacto',
    'cart.address': 'Dirección exacta de entrega',
    'cart.mapSelect': 'Seleccionar en el mapa',
    'cart.reference': 'Punto de referencia (Color de casa, local cercano...)',
    'cart.mapTitle': 'Ubicación de entrega',
    'cart.mapTagline': 'Arrastra el mapa hasta tu puerta',
    'cart.closeMap': 'Cerrar Mapa',
    'cart.shipping': 'Costo de Envío',
    'cart.orderTotal': 'Total del Pedido',
    'cart.inBolivares': 'En Bolívares',
    'cart.continue': 'Continuar al Pago',
    'cart.back': 'Volver',
    'cart.confirmWhatsApp': 'Pedir por WhatsApp',
    
    // Welcome Screen
    'welcome.greeting': '¡Bienvenido!',
    'welcome.selectLocation': 'Selecciona tu sede favorita',
    'welcome.noLocations': 'No hay sedes disponibles en este momento',
    'welcome.admin': 'Configuración del Sistema',

    // Dynamic Categories
    'cat.entradas': 'Entradas',
    'cat.platos-fuertes': 'Platos Fuertes',
    'cat.arroz-frito': 'Arroz Frito',
    'cat.especialidades': 'Especialidades',
    'cat.bebidas': 'Bebidas',

    // Dynamic Locations
    'loc.prebo.name': 'Prebo',
    'loc.prebo.address': 'Av. Andrés Eloy Blanco, Valencia',
    'loc.naguanagua.name': 'Naguanagua',
    'loc.naguanagua.address': 'CC La Granja, Naguanagua',
    'loc.san-diego.name': 'San Diego',
    'loc.san-diego.address': 'Av. Don Julio Centeno, San Diego',

    // Dynamic Products
    'prod.e1.name': 'Rollitos de Primavera',
    'prod.e1.desc': '4 piezas crujientes rellenas de vegetales frescos con salsa agridulce.',
    'prod.e2.name': 'Dumplings de Cerdo',
    'prod.e2.desc': '6 piezas de dumplings al vapor o fritos acompañados de salsa de soya.',
    'prod.e3.name': 'Wantán Frito',
    'prod.e3.desc': '8 piezas de wantán relleno de cerdo con salsa roja tradicional.',
    'prod.p1.name': 'Pollo Kung Pao',
    'prod.p1.desc': 'Pechuga de pollo salteada con vegetales, cacahuates y salsa picante.',
    'prod.p2.name': 'Carne con Brócoli',
    'prod.p2.desc': 'Tiras de res tiernas salteadas con brócoli fresco en salsa de ostión.',
    'prod.p3.name': 'Pollo a la Naranja',
    'prod.p3.desc': 'Famoso pollo crujiente cubierto con nuestra salsa cítrica secreta.',
    'prod.a1.name': 'Arroz Frito Especial',
    'prod.a1.desc': 'Clásico arroz frito con huevo, vegetales, pollo, carne y camarón.',
    'prod.a2.name': 'Arroz Frito Vegetal',
    'prod.a2.desc': 'Arroz salteado con mix de vegetales de temporada y soya ligera.',
    'prod.s1.name': 'Pato Pekín',
    'prod.s1.desc': 'Especialidad de la casa con piel crujiente y panqueques tradicionales.',
    'prod.s2.name': 'Costillas al Wok',
    'prod.s2.desc': 'Costillitas de cerdo melosas con salsa barbacoa cinco especias.',
    'prod.b1.name': 'Coca Cola 600ml',
    'prod.b1.desc': 'Envase no retornable de 600ml.',
    'prod.b2.name': 'Té Frío Limón',
    'prod.b2.desc': 'Té negro frío con un toque de limón natural.',
    'prod.b3.name': 'Agua Mineral',
    'prod.b3.desc': 'Botella de agua mineral sin gas 500ml.',

    // Dynamic Reviews
    'rev.0.name': 'Juan Pérez',
    'rev.0.body': 'La mejor comida china que he probado. El sabor es auténtico y las porciones son generosas.',
    'rev.1.name': 'Maria Garcia',
    'rev.1.body': 'El servicio es increíblemente rápido. Pedí a domicilio y llegó caliente y fresco en 20 minutos.',
    'rev.2.name': 'Carlos Ruiz',
    'rev.2.body': 'Excelente calidad-precio. Las sedes son muy limpias y el ambiente es genial para comer con amigos.',
    'rev.3.name': 'Ana Lopez',
    'rev.3.body': 'Amo el pollo agridulce, tiene la textura perfecta. Definitivamente mi lugar favorito para los domingos.'
  },
  en: {
    'nav.about': 'About Us',
    'nav.featured': 'Dishes',
    'nav.locations': 'Locations',
    'nav.reviews': 'Reviews',
    'nav.socials': 'Socials',
    'nav.orderNow': 'Order Now',
    'nav.home': 'Home',
    'nav.menu': 'Menu',

    'hero.tagline': 'THE BEST FOOD STRAIGHT TO YOUR TABLE!',
    'hero.cta': 'Place Order',

    'about.title': 'About Us',
    'about.default': 'At Panda Express, we are passionate about providing the best dining experience. Freshness, quality, and our characteristic flavor in every order.',

    'featured.badge': 'Panda Favorites',
    'featured.title': 'Featured Dishes',
    'featured.viewAll': 'View full menu',

    'locations.badge': 'Find Us',
    'locations.title': 'Our Locations',
    'locations.open': 'Open Now',
    'locations.closed': 'Closed',
    'locations.closedToday': 'Currently Closed',

    'reviews.badge': 'Panda Community',
    'reviews.title': 'What our customers say',

    'socials.title': 'Join the family!',
    'socials.tagline': 'Follow us on our networks to not miss any bomb promotions and exclusive giveaways.',

    'cta.title': 'Hungry?',
    'cta.button': 'View Full Menu',

    'menu.welcome': 'Enjoy your meal!',
    'menu.empty': 'No products here',
    'menu.ready': 'Ready to order',
    'menu.viewCart': 'View Cart',
    'menu.total': 'Total',
    'menu.price': 'Price',
    'menu.outOfStock': 'Out of Stock',

    'cart.title': 'Your Order',
    'cart.checkout': 'Checkout',
    'cart.empty': 'Your cart is empty',
    'cart.emptyTagline': 'Add something delicious to start!',
    'cart.specialInstructions': 'Any special instructions?',
    'cart.deliveryMethod': 'Delivery Method',
    'cart.delivery': 'Delivery',
    'cart.pickup': 'Pick-up',
    'cart.fullName': 'Full name',
    'cart.whatsapp': 'Contact WhatsApp',
    'cart.address': 'Exact delivery address',
    'cart.mapSelect': 'Select on map',
    'cart.reference': 'Reference point (House color, nearby store...)',
    'cart.mapTitle': 'Delivery Location',
    'cart.mapTagline': 'Drag the map to your door',
    'cart.closeMap': 'Close Map',
    'cart.shipping': 'Shipping Fee',
    'cart.orderTotal': 'Order Total',
    'cart.inBolivares': 'In Bolivares',
    'cart.continue': 'Continue to Payment',
    'cart.back': 'Back',
    'cart.confirmWhatsApp': 'Order via WhatsApp',

    'welcome.greeting': 'Welcome!',
    'welcome.selectLocation': 'Select your favorite location',
    'welcome.noLocations': 'No locations available right now',
    'welcome.admin': 'System Configuration',

    // Dynamic Categories
    'cat.entradas': 'Appetizers',
    'cat.platos-fuertes': 'Main Dishes',
    'cat.arroz-frito': 'Fried Rice',
    'cat.especialidades': 'Specialties',
    'cat.bebidas': 'Drinks',

    // Dynamic Locations
    'loc.prebo.name': 'Prebo',
    'loc.prebo.address': 'Andres Eloy Blanco Ave, Valencia',
    'loc.naguanagua.name': 'Naguanagua',
    'loc.naguanagua.address': 'La Granja Mall, Naguanagua',
    'loc.san-diego.name': 'San Diego',
    'loc.san-diego.address': 'Don Julio Centeno Ave, San Diego',

    // Dynamic Products
    'prod.e1.name': 'Spring Rolls',
    'prod.e1.desc': '4 crispy pieces filled with fresh vegetables with sweet and sour sauce.',
    'prod.e2.name': 'Pork Dumplings',
    'prod.e2.desc': '6 pieces of steamed or fried dumplings accompanied by soy sauce.',
    'prod.e3.name': 'Fried Wanton',
    'prod.e3.desc': '8 pieces of pork filled wanton with traditional red sauce.',
    'prod.p1.name': 'Kung Pao Chicken',
    'prod.p1.desc': 'Sautéed chicken breast with vegetables, peanuts and spicy sauce.',
    'prod.p2.name': 'Beef with Broccoli',
    'prod.p2.desc': 'Tender beef strips sautéed with fresh broccoli in oyster sauce.',
    'prod.p3.name': 'Orange Chicken',
    'prod.p3.desc': 'Famous crispy chicken covered in our secret citrus sauce.',
    'prod.a1.name': 'Special Fried Rice',
    'prod.a1.desc': 'Classic fried rice with egg, vegetables, chicken, beef and shrimp.',
    'prod.a2.name': 'Vegetable Fried Rice',
    'prod.a2.desc': 'Sautéed rice with a mix of seasonal vegetables and light soy.',
    'prod.s1.name': 'Peking Duck',
    'prod.s1.desc': 'House specialty with crispy skin and traditional pancakes.',
    'prod.s2.name': 'Wok Ribs',
    'prod.s2.desc': 'Mellow pork ribs with five spice barbecue sauce.',
    'prod.b1.name': 'Coca Cola 600ml',
    'prod.b1.desc': '600ml non-returnable bottle.',
    'prod.b2.name': 'Lemon Iced Tea',
    'prod.b2.desc': 'Cold black tea with a touch of natural lemon.',
    'prod.b3.name': 'Mineral Water',
    'prod.b3.desc': '500ml still mineral water bottle.',

    // Dynamic Reviews
    'rev.0.name': 'John Doe',
    'rev.0.body': 'The best Chinese food I have ever tried. The flavor is authentic and the portions are generous.',
    'rev.1.name': 'Maria Garcia',
    'rev.1.body': 'The service is incredibly fast. I ordered for home delivery and it arrived hot and fresh in 20 minutes.',
    'rev.2.name': 'Charles Smith',
    'rev.2.body': 'Excellent quality-price. The locations are very clean and the atmosphere is great for eating with friends.',
    'rev.3.name': 'Ann Lopez',
    'rev.3.body': 'I love the Orange chicken, it has the perfect texture. Definitely my favorite place for Sundays.'
  },
  zh: {
    'nav.about': '关于我们',
    'nav.featured': '特色菜肴',
    'nav.locations': '分店',
    'nav.reviews': '评价',
    'nav.socials': '社交媒体',
    'nav.orderNow': '立即下单',
    'nav.home': '首页',
    'nav.menu': '菜单',

    'hero.tagline': '美味佳肴，直达餐桌！',
    'hero.cta': '开始下单',

    'about.title': '关于我们',
    'about.default': '在熊猫快餐，我们致力于提供最佳的餐饮体验。每一份订单都保证新鲜、高质量和我们独特的风味。',

    'featured.badge': '熊猫推荐',
    'featured.title': '精选菜品',
    'featured.viewAll': '查看全部菜单',

    'locations.badge': '找到我们',
    'locations.title': '我们的分店',
    'locations.open': '正在营业',
    'locations.closed': '休息中',
    'locations.closedToday': '今日休息',

    'reviews.badge': '熊猫社区',
    'reviews.title': '客户评价',

    'socials.title': '加入我们的大家庭！',
    'socials.tagline': '关注我们的社交网络，不错过任何促销活动和专属抽奖。',

    'cta.title': '饿了吗？',
    'cta.button': '查看完整菜单',

    'menu.welcome': '用餐愉快！',
    'menu.empty': '此处没有产品',
    'menu.ready': '准备下单',
    'menu.viewCart': '查看购物车',
    'menu.total': '总计',
    'menu.price': '价格',
    'menu.outOfStock': '已售罄',

    'cart.title': '您的订单',
    'cart.checkout': '结算',
    'cart.empty': '购物车是空的',
    'cart.emptyTagline': '添加一些美味的东西开始吧！',
    'cart.specialInstructions': '有什么特殊要求吗？',
    'cart.deliveryMethod': '配送方式',
    'cart.delivery': '外送',
    'cart.pickup': '自提',
    'cart.fullName': '姓名',
    'cart.whatsapp': '联系电话',
    'cart.address': '详细送货地址',
    'cart.mapSelect': '在地图上选择',
    'cart.reference': '参考地点（房子颜色、附近商店...）',
    'cart.mapTitle': '送货位置',
    'cart.mapTagline': '将地图拖动到您的门前',
    'cart.closeMap': '关闭地图',
    'cart.shipping': '配送费',
    'cart.orderTotal': '订单总计',
    'cart.inBolivares': '玻利瓦尔金额',
    'cart.continue': '继续结算',
    'cart.back': '返回',
    'cart.confirmWhatsApp': '通过WhatsApp下单',

    'welcome.greeting': '欢迎光临！',
    'welcome.selectLocation': '选择您喜欢的分店',
    'welcome.noLocations': '目前没有可用的分店',
    'welcome.admin': '系统配置',

    // Dynamic Categories
    'cat.entradas': '开胃菜',
    'cat.platos-fuertes': '主菜',
    'cat.arroz-frito': '炒饭',
    'cat.especialidades': '特色菜',
    'cat.bebidas': '饮料',

    // Dynamic Locations
    'loc.prebo.name': 'Prebo',
    'loc.prebo.address': '瓦伦西亚，安德烈斯·埃洛伊·布兰科大道',
    'loc.naguanagua.name': 'Naguanagua',
    'loc.naguanagua.address': 'Naguanagua，La Granja 购物中心',
    'loc.san-diego.name': 'San Diego',
    'loc.san-diego.address': '圣地亚哥，唐·朱利奥·森特诺大道',

    // Dynamic Products
    'prod.e1.name': '春卷',
    'prod.e1.desc': '4块松脆的春卷，内填新鲜蔬菜，配以糖醋汁。',
    'prod.e2.name': '猪肉饺子',
    'prod.e2.desc': '6块蒸饺或煎饺，配以大豆酱。',
    'prod.e3.name': '炸云吞',
    'prod.e3.desc': '8块猪肉馅炸云吞，配以传统红酱。',
    'prod.p1.name': '宫保鸡丁',
    'prod.p1.desc': '嫩鸡胸肉与蔬菜、花生和辣酱一起翻炒。',
    'prod.p2.name': '西兰花牛肉',
    'prod.p2.desc': '嫩牛肉片与新鲜西兰花在蚝油中翻炒。',
    'prod.p3.name': '陈皮鸡',
    'prod.p3.desc': '著名的脆皮鸡，覆盖着我们的秘密柑橘酱。',
    'prod.a1.name': '特别炒饭',
    'prod.a1.desc': '经典炒饭，配有鸡蛋、蔬菜、鸡肉、牛肉和虾。',
    'prod.a2.name': '蔬菜炒饭',
    'prod.a2.desc': '加有当季蔬菜和淡酱油的翻炒米饭。',
    'prod.s1.name': '北京烤鸭',
    'prod.s1.desc': '本店特色菜，皮脆，配以传统薄饼。',
    'prod.s2.name': '锅烧排骨',
    'prod.s2.desc': '加有五香烧烤酱的醇厚猪排。',
    'prod.b1.name': '可口可乐 600ml',
    'prod.b1.desc': '600ml 非退还瓶装。',
    'prod.b2.name': '柠檬冰茶',
    'prod.b2.desc': '带有天然柠檬气息的冰红茶。',
    'prod.b3.name': '矿泉水',
    'prod.b3.desc': '500ml 无气矿泉水。',

    // Dynamic Reviews
    'rev.0.name': '张三',
    'rev.0.body': '我尝试过的最好的中餐。味道地道，分量足。',
    'rev.1.name': '李四',
    'rev.1.body': '服务非常快。我订了外卖，20分钟就送到，又热又新鲜。',
    'rev.2.name': '王五',
    'rev.2.body': '物美价廉。分店非常干净，环境非常适合和朋友一起吃饭。',
    'rev.3.name': '赵六',
    'rev.3.body': '我爱陈皮鸡，它的质地完美。绝对是我周日最喜欢去的地方。'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
