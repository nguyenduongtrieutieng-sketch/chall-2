// Persistent Game State Manager (Gold, Diamonds, Durability, Upgrades, Inventory, 72 Stages, Achievements)
const STORAGE_KEY = "CHIEN_CO_SA_HOANG_SAVE_V2";

const DEFAULT_STATE = {
  gold: 25000,
  diamonds: 250,
  fuel: 50,
  maxFuel: 50,
  currentStage: 1,
  highestClearedStage: 1,
  selectedFighterId: "tsar_eternal",
  unlockedFighters: [
    "tsar_eternal",
    "void_phantom",
    "thunder_judgement",
    "boreal_valkyrie",
    "solar_phoenix",
    "chronos_prime"
  ],
  auxiliary: "shield_2s", // 'shield_2s' or 'tsar_support'
  fighterStatus: {
    tsar_eternal: { damaged: false, hpLevel: 1, dmgLevel: 1, speedLevel: 1 },
    void_phantom: { damaged: false, hpLevel: 1, dmgLevel: 1, speedLevel: 1 },
    thunder_judgement: { damaged: false, hpLevel: 1, dmgLevel: 1, speedLevel: 1 },
    boreal_valkyrie: { damaged: false, hpLevel: 1, dmgLevel: 1, speedLevel: 1 },
    solar_phoenix: { damaged: false, hpLevel: 1, dmgLevel: 1, speedLevel: 1 },
    chronos_prime: { damaged: false, hpLevel: 1, dmgLevel: 1, speedLevel: 1 }
  },
  inventory: [
    { id: "tsar_core", name: "Lõi Năng Lượng Sa Hoàng", type: "core", rarity: "UR", icon: "👑", count: 3, desc: "Lõi nhiệt hạch sa hoàng siêu nén dùng nâng cấp kỹ năng R." },
    { id: "thunder_crystal", name: "Đá Lôi Đình Cổ Đại", type: "crystal", rarity: "SSR", icon: "⚡", count: 12, desc: "Linh thạch dẫn sét dùng sửa chữa và cường hóa Thanh Long." },
    { id: "cryo_crystal", name: "Cực Quang Băng Tinh", type: "crystal", rarity: "SSR", icon: "❄️", count: 8, desc: "Băng tinh vĩnh cửu cõi Băng Hà Cực Bắc dùng phục hồi giáp." },
    { id: "void_shard", name: "Mảnh Vỡ Hư Không", type: "shard", rarity: "SSR", icon: "🌀", count: 15, desc: "Mảnh dị điểm lỗ đen dùng mở khóa công nghệ bẻ cong không gian." },
    { id: "titan_alloy", name: "Hợp Kim Titan Đen", type: "metal", rarity: "SR", icon: "🧱", count: 35, desc: "Vật liệu giáp chính để sửa chữa thân tàu bị gãy vỡ tại Xưởng." },
    { id: "ftl_coolant", name: "Dung Dịch Làm Mát FTL", type: "material", rarity: "SR", icon: "🧪", count: 20, desc: "Dung dịch tản nhiệt cho động cơ Mach 6.5." },
    { id: "invul_cell", name: "Hộp Năng Lượng Bất Tử 2s", type: "consumable", rarity: "SR", icon: "🛡️", count: 5, desc: "Trang bị phụ trợ kích hoạt trường lực bất khả xâm phạm." },
    { id: "tsar_insignia", name: "Phù Hiệu Viện Trợ Sa Hoàng", type: "consumable", rarity: "SR", icon: "📡", count: 4, desc: "Gọi phi đội tiêm kích Sa Hoàng yểm trợ hỏa lực toàn diện." }
  ],
  achievements: [
    { id: "first_blood", name: "Phát Súng Đầu Tiên", desc: "Hạ gục quái vật ngoài hành tinh đầu tiên", unlocked: true, rewardGold: 500 },
    { id: "wave_9_survivor", name: "Phá Vỡ Phong Tỏa", desc: "Vượt qua toàn bộ 9 Đợt Quái cản đường trong 1 màn", unlocked: false, rewardDiamonds: 50 },
    { id: "boss_killer", name: "Kẻ Diệt Thần", desc: "Tiêu diệt thành công 1 trong 4 Đại Boss", unlocked: false, rewardDiamonds: 80 },
    { id: "hell_master", name: "Chúa Tể Địa Ngục", desc: "Sống sót và chiến thắng ở độ khó Địa Ngục (thiêu đốt 0.5%/s)", unlocked: false, rewardDiamonds: 200 },
    { id: "tsar_fleet", name: "Đại Hạm Đội Sa Hoàng", desc: "Sở hữu và cường hóa trọn bộ 6 chiến cơ", unlocked: false, rewardGold: 20000 }
  ]
};

export class GameState {
  static load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          fighterStatus: { ...DEFAULT_STATE.fighterStatus, ...(parsed.fighterStatus || {}) },
          inventory: parsed.inventory || DEFAULT_STATE.inventory
        };
      }
      return { ...DEFAULT_STATE };
    } catch (e) {
      return { ...DEFAULT_STATE };
    }
  }

  static save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }
}
