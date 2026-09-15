/* =========================================================
 * 周末城市探索指南 · 数据层
 * 说明：演示用内置数据 + 模拟天气，真实部署时把 WEATHER_API
 * 与 ACTIVITIES 换成接口返回即可（结构保持一致）。
 * ========================================================= */

// 当前城市（可扩展为定位 / 选择）
const CITY = "杭州";

// 活动类型字典（用于偏好与筛选）
const ACTIVITY_TYPES = [
  { key: "exhibition", name: "展览", emoji: "🖼️" },
  { key: "market",     name: "市集", emoji: "🛍️" },
  { key: "show",       name: "演出", emoji: "🎤" },
  { key: "hiking",     name: "徒步", emoji: "🥾" },
  { key: "walk",       name: "城市漫步", emoji: "🚶" },
  { key: "workshop",   name: "手作工坊", emoji: "🎨" },
];

// 模拟“实时天气”。真实场景调用和风/OpenWeather 等接口替换本函数。
// 提供三种可切换状态，方便演示“雨天优先室内 / 晴天优先户外”的推荐逻辑。
const WEATHER_PRESETS = {
  sunny:  { code: "sunny",  label: "晴",   temp: 24, emoji: "☀️", outdoor: true,  wind: "微风", aqi: 38, tip: "天气超棒，最适合出门浪！" },
  cloudy: { code: "cloudy", label: "多云", temp: 20, emoji: "⛅", outdoor: true,  wind: "微风", aqi: 52, tip: "体感舒适，室内外都宜出行。" },
  rainy:  { code: "rainy",  label: "小雨", temp: 16, emoji: "🌧️", outdoor: false, wind: "东南风3级", aqi: 30, tip: "湿冷有雨，优先安排室内活动哦～" },
};

// 本周末活动（演示数据）
// indoor: 是否室内；fitWeather: 该活动在哪种天气下更适配
// distance: 距学校/市中心的公里数；price: 票价(元)；people: [最适合下限, 上限]
const ACTIVITIES = [
  {
    id: "a01", title: "西湖群山轻徒步 · 龙井到九溪", type: "hiking", emoji: "🥾",
    cover: "linear-gradient(135deg,#43cea2,#185a9d)",
    date: "周六", time: "09:00-13:00", location: "龙井村入口", district: "西湖区",
    price: 0, indoor: false, fitWeather: "sunny", distance: 12, people: [2, 6],
    transport: "地铁1号线 → 龙翔桥站换乘公交27路至龙井村",
    tags: ["免费", "出片", "中等强度"],
    desc: "从龙井茶园一路下坡到九溪烟树，茶香伴溪水，约6公里，3小时轻松走完。沿途可补给茶水。",
    tips: "穿防滑运动鞋；带足饮用水；雨天石阶较滑，建议改期。",
    rating: 4.8, joined: 312,
  },
  {
    id: "a02", title: "天目里 · 独立艺术书展", type: "exhibition", emoji: "🖼️",
    cover: "linear-gradient(135deg,#ff9a9e,#fad0c4)",
    date: "周六-周日", time: "10:00-21:00", location: "天目里 11号楼", district: "西湖区",
    price: 45, indoor: true, fitWeather: "rainy", distance: 8, people: [1, 3],
    transport: "地铁3号线 古墩路站 B口步行600米",
    tags: ["室内", "文艺", "可盖章"],
    desc: "30+ 独立出版品牌集合，限量艺术书、zine、海报现场发售，配套创作者分享会。",
    tips: "现场可盖限定印章，建议带空白本；周末下午人多，错峰前往体验更佳。",
    rating: 4.7, joined: 540,
  },
  {
    id: "a03", title: "武林夜市 · 复古市集", type: "market", emoji: "🛍️",
    cover: "linear-gradient(135deg,#f6d365,#fda085)",
    date: "周五-周日", time: "16:00-22:30", location: "武林路步行街", district: "拱墅区",
    price: 0, indoor: false, fitWeather: "sunny", distance: 5, people: [1, 4],
    transport: "地铁2号线 中河北路站 C口步行400米",
    tags: ["免费进场", "小吃", "手作"],
    desc: "复古穿搭、手工饰品、古着摊位齐聚，配现场乐队与街头美食，学生党夜逛首选。",
    tips: "小吃按件计费，预留50元预算；人多保管好手机钱包。",
    rating: 4.6, joined: 1280,
  },
  {
    id: "a04", title: "MAO Livehouse · 独立乐队专场", type: "show", emoji: "🎤",
    cover: "linear-gradient(135deg,#667eea,#764ba2)",
    date: "周六", time: "20:00-22:30", location: "MAO Livehouse 杭州", district: "上城区",
    price: 120, indoor: true, fitWeather: "rainy", distance: 6, people: [2, 5],
    transport: "地铁1号线 城站站 步行800米",
    tags: ["现场", "音乐", "夜场"],
    desc: "三支新锐独立乐队连演，氛围炸裂，站区前排视野最佳，学生票有优惠。",
    tips: "提前30分钟到场选好位置；现场禁外带饮品；注意末班地铁时间。",
    rating: 4.9, joined: 220,
  },
  {
    id: "a05", title: "运河边 · 城市漫步夜游", type: "walk", emoji: "🚶",
    cover: "linear-gradient(135deg,#30cfd0,#330867)",
    date: "周五-周日", time: "19:00-21:00", location: "拱宸桥东", district: "拱墅区",
    price: 0, indoor: false, fitWeather: "cloudy", distance: 7, people: [1, 4],
    transport: "地铁5号线 拱宸桥站 A口",
    tags: ["免费", "夜景", "拍照"],
    desc: "沿京杭大运河慢走，拱宸桥灯光、老粮仓改造街区，适合边走边聊的松弛夜游。",
    tips: "河边风大，带件外套；部分路段照明偏暗，建议结伴。",
    rating: 4.5, joined: 430,
  },
  {
    id: "a06", title: "陶艺手作工坊 · 拉胚体验", type: "workshop", emoji: "🎨",
    cover: "linear-gradient(135deg,#a8edea,#fed6e3)",
    date: "周六-周日", time: "14:00-16:30", location: "象山艺术公社", district: "西湖区",
    price: 89, indoor: true, fitWeather: "rainy", distance: 15, people: [1, 2],
    transport: "地铁6号线 美院象山站 步行1.2公里",
    tags: ["室内", "动手", "可带走"],
    desc: "1对4小班教学，从揉泥到拉胚上釉，成品烧制后邮寄到家，零基础友好。",
    tips: "穿耐脏衣物；作品需7天烧制，支持邮寄；含一杯手冲。",
    rating: 4.8, joined: 96,
  },
  {
    id: "a07", title: "良渚古城 · 文化徒步", type: "hiking", emoji: "🏞️",
    cover: "linear-gradient(135deg,#56ab2f,#a8e063)",
    date: "周日", time: "08:30-12:30", location: "良渚古城遗址公园", district: "余杭区",
    price: 30, indoor: false, fitWeather: "sunny", distance: 22, people: [2, 8],
    transport: "地铁2号线 → 良渚站 换乘公交 1222路",
    tags: ["世界遗产", "开阔", "骑行"],
    desc: "五千年文明实证地，芦苇荡、鹿苑、稻田，可租单车环园，适合一群朋友野餐式出游。",
    tips: "园区大，建议租自行车；自备零食饮水；防晒必备。",
    rating: 4.7, joined: 268,
  },
  {
    id: "a08", title: "湖滨银泰 · 潮流市集", type: "market", emoji: "🧋",
    cover: "linear-gradient(135deg,#ff758c,#ff7eb3)",
    date: "周六-周日", time: "11:00-21:00", location: "湖滨in77 C区", district: "上城区",
    price: 0, indoor: true, fitWeather: "rainy", distance: 4, people: [1, 4],
    transport: "地铁1号线 龙翔桥站 D口",
    tags: ["室内", "潮玩", "美食"],
    desc: "室内潮玩市集，盲盒、插画、特调饮品，空调环境雨天也不怕，逛吃一体。",
    tips: "商场可寄存；餐饮人均40-60元；周末人流量大。",
    rating: 4.4, joined: 870,
  },
  {
    id: "a09", title: "浙江省博物馆 · 特展导览", type: "exhibition", emoji: "🏛️",
    cover: "linear-gradient(135deg,#c79081,#dfa579)",
    date: "周六-周日", time: "09:00-17:00", location: "浙江省博物馆(之江馆)", district: "西湖区",
    price: 0, indoor: true, fitWeather: "rainy", distance: 14, people: [1, 3],
    transport: "地铁6号线 之浦路站 换乘公交",
    tags: ["免费", "室内", "需预约"],
    desc: "之江馆常设展 + 限时特展，越王剑、良渚玉琮镇馆，学生证免预约通道。",
    tips: "提前在公众号预约；周一闭馆；馆内禁止闪光灯。",
    rating: 4.8, joined: 640,
  },
  {
    id: "a10", title: "西溪湿地 · 绿堤漫步", type: "walk", emoji: "🌿",
    cover: "linear-gradient(135deg,#11998e,#38ef7d)",
    date: "周六-周日", time: "07:30-17:30", location: "西溪国家湿地公园", district: "西湖区",
    price: 60, indoor: false, fitWeather: "cloudy", distance: 10, people: [1, 5],
    transport: "地铁3号线 西溪湿地南站 A口",
    tags: ["自然", "拍照", "船游"],
    desc: "城市里的湿地秘境，绿堤、秋雪庵、摇橹船，清晨人少鸟多，最适合放空漫步。",
    tips: "学生票半价凭证件；船票另购；穿舒适鞋。",
    rating: 4.6, joined: 510,
  },
  {
    id: "a11", title: "嘻游喜剧 · 周末开放麦", type: "show", emoji: "😂",
    cover: "linear-gradient(135deg,#fc5c7d,#6a82fb)",
    date: "周五-周六", time: "19:30-21:30", location: "大笑喜剧空间", district: "滨江区",
    price: 39, indoor: true, fitWeather: "rainy", distance: 13, people: [2, 6],
    transport: "地铁1号线 滨和路站 步行700米",
    tags: ["室内", "解压", "互动"],
    desc: "新晋脱口秀开放麦，学生票白菜价，现场即兴互动多，社恐也能笑出声。",
    tips: "前排可能被cue；不支持退票；开场前10分钟入场。",
    rating: 4.7, joined: 180,
  },
  {
    id: "a12", title: "北山街 · 老建筑citywalk", type: "walk", emoji: "🏛️",
    cover: "linear-gradient(135deg,#ee9ca7,#ffdde1)",
    date: "周六", time: "15:00-18:00", location: "北山街", district: "西湖区",
    price: 0, indoor: false, fitWeather: "sunny", distance: 6, people: [1, 4],
    transport: "地铁1号线 凤起路站 步行1公里",
    tags: ["免费", "民国风", "出片"],
    desc: "一条街看尽民国别墅与梧桐，黄昏光线最美，沿途咖啡馆可随时歇脚。",
    tips: "傍晚逆光出片；部分老宅为私宅请勿误入；带充电宝。",
    rating: 4.5, joined: 360,
  },
];

// 组队广场初始帖子（用户可新增）
const SEED_TEAMS = [
  { id: "t1", actId: "a01", user: "柚子", people: 3, total: 5, note: "周六龙井徒步缺2人，女生优先～", time: "周六 09:00", contact: "评论区扣1" },
  { id: "t2", actId: "a04", user: "阿K",   people: 2, total: 4, note: "MAO现场拼票人，一起前排蹦！", time: "周六 20:00", contact: "私信我" },
  { id: "t3", actId: "a09", user: "小满", people: 1, total: 3, note: "省博特展想找个搭子一起看，可拼车", time: "周日 10:00", contact: "留言就行" },
];

const STORAGE_KEYS = {
  prefs: "wge_prefs",
  checkins: "wge_checkins",
  teams: "wge_teams",
  weather: "wge_weather",
  favs: "wge_favs",
  onboarded: "wge_onboarded",
};
