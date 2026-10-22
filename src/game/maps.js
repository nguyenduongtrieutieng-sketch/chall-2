// 3 Cosmic Battleground Environments, 72 Scripted Stages, and 4 Epic Bosses with 8/10/15 Skills
export const MAPS = [
  {
    id: "thien_ha_sa_hoang",
    name: "Thiên Hà Sa Hoàng",
    title: "Imperial Cosmic Galaxy",
    desc: "Chiến trường thiên hà vô tận của Đế chế Sa Hoàng, ngập tràn ánh sao tinh vân cô-ban huyền ảo.",
    image: "/maps/map1_thien_ha_sa_hoang.png",
    stageRange: [1, 24],
    bgGradient: ["#040714", "#0d2040", "#104e7a"],
    ambientColor: 0x38bdf8,
    particleColor: "#7dd3fc",
    debrisType: "ice_crystal",
    enemyTheme: "cryo",
    bossId: "frost_sovereign"
  },
  {
    id: "inferno_hell",
    name: "Bão Lửa Địa Ngục",
    title: "Inferno Solar Flarestorm",
    desc: "Biển lửa plasma rực cháy, quầng lửa mặt trời phóng thích và thiên thạch nham thạch nóng đỏ.",
    image: "/maps/map2_bao_lua_dia_nguc.png",
    stageRange: [25, 48],
    bgGradient: ["#1c0404", "#4a0b0b", "#7f1d1d"],
    ambientColor: 0xef4444,
    particleColor: "#f97316",
    debrisType: "molten_magma",
    enemyTheme: "magma",
    bossId: "inferno_behemoth"
  },
  {
    id: "void_singularity",
    name: "Hư Không Dị Điểm",
    title: "Cosmic Void Singularity",
    desc: "Dị điểm lỗ đen siêu khối lượng bẻ cong không-thời gian, chân không tím biếc và vết nứt không gian.",
    image: "/maps/map3_hu_khong_di_diem.png",
    stageRange: [49, 72],
    bgGradient: ["#0f051d", "#1e0e38", "#2e1065"],
    ambientColor: 0x8b5cf6,
    particleColor: "#c084fc",
    debrisType: "void_fragment",
    enemyTheme: "void",
    bossId: "void_overlord"
  }
];

export const DIFFICULTIES = [
  {
    id: "normal",
    name: "TRUNG BÌNH (NORMAL)",
    desc: "Quái vật tiêu chuẩn, Boss mở khóa 8 skill. Đạn đạo cân bằng, thích hợp rèn luyện kỹ năng.",
    hpMul: 1.0,
    dmgMul: 1.0,
    burnRate: 0.0,
    bossSkillsCount: 8,
    goldRewardMul: 1.0,
    diamondReward: 10
  },
  {
    id: "hard",
    name: "KHÓ (HARD)",
    desc: "Quái trâu hơn +40%, Boss mở khóa 10 skill, giảm 25% hồi chiêu, môi trường thiêu đốt 0.2% HP/s.",
    hpMul: 1.4,
    dmgMul: 1.35,
    burnRate: 0.002, // 0.2% / sec
    bossSkillsCount: 10,
    goldRewardMul: 2.2,
    diamondReward: 35
  },
  {
    id: "hell",
    name: "ĐỊA NGỤC (HELL)",
    desc: "Cực độ tàn bạo! Quái máu +150%, Boss mở khóa 15 skill, môi trường thiêu đốt 0.5% HP/s, tốc độ skill tăng lũy tiến!",
    hpMul: 2.5,
    dmgMul: 2.0,
    burnRate: 0.005, // 0.5% / sec
    bossSkillsCount: 15,
    goldRewardMul: 5.0,
    diamondReward: 120
  }
];

export const BOSS_ROSTER = {
  frost_sovereign: {
    name: "CỔ THẦN BĂNG TINH",
    title: "Frost Sovereign (Glacial Dreadnought)",
    maxHp: 22000,
    color: "#38bdf8",
    glowColor: 0x7dd3fc,
    skills: [
      // 8 Normal Skills
      "Pháo Băng Tinh Đơn Tuyến", "Chùm 5 Đạn Hàn Băng Nan Quạt", "Tia Laser Băng Giá Định Hướng", "Khiên Lăng Kính Băng Hấp Thụ 20%",
      "Thả 2 Mìn Băng Trôi Dạt", "Lướt Hàn Khí Đột Kích", "Triệu Hồi 4 Bọ Băng Tiếp Viện", "Sóng Xung Kích Đẩy Lùi",
      // 10 Hard Skills (+2)
      "Bão Tuyết Đóng Băng Khóa Phím 1.5s", "Mưa Mảnh Băng Khóa Mục Tiêu",
      // 15 Hell Skills (+5)
      "Hàn Băng Tuyệt Đối Xuyên Thấu", "Gai Băng Mặt Đất Trồi Lên", "Khiên Băng Bất Tử 3s Khi Máu < 30%", "Bão Đạn Xoắn Ốc 3 Lớp", "TUYỆT KỸ KỶ BĂNG HÀ VŨ TRỤ"
    ]
  },
  inferno_behemoth: {
    name: "CHÚA TỂ HỎA NGỤC",
    title: "Inferno Behemoth (Solar Colossus)",
    maxHp: 28000,
    color: "#ef4444",
    glowColor: 0xf97316,
    skills: [
      // 8 Normal Skills
      "Cầu Lửa Nham Thạch", "Pháo Chùm Dung Nham 5 Hướng", "Tia Laser Nhiệt Đỏ", "Khiên Magma Hấp Thụ",
      "Thả 2 Mìn Lửa Bốc Cháy", "Lướt Vệt Lửa Đốt Đường", "Triệu Hồi 4 Quái Dung Nham", "Sóng Xung Kích Hỏa Diệm",
      // 10 Hard Skills (+2)
      "Quét Tia Laser 360 Độ Quanh Màn Hình", "Mưa Thiên Thạch Nóng Chảy Khóa Tàu",
      // 15 Hell Skills (+5)
      "Cột Lửa Hạt Nhân Xuyên Thấu Không Gian", "Bão Lửa Thiêu Rụi 50% Màn Hình", "Cuồng Nộ: Tăng 100% Tốc Bắn", "Nổ Magma Phân Rã Giáp Thực Tế", "TUYỆT KỸ TẬN THẾ MẶT TRỜI"
    ]
  },
  void_overlord: {
    name: "KẺ THAO TÚNG HƯ KHÔNG",
    title: "Void Overlord (Singularity Warship)",
    maxHp: 35000,
    color: "#8b5cf6",
    glowColor: 0xc084fc,
    skills: [
      // 8 Normal Skills
      "Xung Xạ Không Gian Cong", "Chùm 6 Đạn Hư Không Tím", "Tia Laser Vết Nứt Hư Vô", "Khiên Hấp Thụ Lực Trường",
      "Thả 3 Mìn Dị Điểm Trôi", "Dịch Chuyển Tức Thời FTL", "Triệu Hồi 4 Quái Hư Không", "Sóng Xung Kích Bẻ Cong Tọa Độ",
      // 10 Hard Skills (+2)
      "Hố Đen Mini Nuốt Chửng Đạn Đạo", "Triệu Hồi 2 Phân Thân Ảo Ảnh Đánh Lừa",
      // 15 Hell Skills (+5)
      "Bão Đạn Xoay 3 Lớp Đối Xứng", "Khóa Di Chuyển Chiến Cơ Trong 1.5s", "Tráo Đổi Vị Trí Tức Thì Với Quái Con", "Vành Đai Event Horizon Phản Hồi Sát Thương", "TUYỆT KỸ VẾT NỨT TẬN DIỆT KHÔNG GIAN"
    ]
  },
  hive_mothership: {
    name: "HẠM ĐỘI MẸ NGOẠI LAI",
    title: "Alien Hive Mothership (High Boss)",
    maxHp: 40000,
    color: "#eab308",
    glowColor: 0xfacc15,
    skills: [
      // 8 Normal Skills
      "Pháo Plasma Sinh Học", "Chùm 8 Đạn Độc Sinh Vật", "Tia Acid Ăn Mòn", "Vỏ Giáp Kitin Hấp Thụ",
      "Thả 3 Kén Nổ Sinh Học", "Phun Mạng Nhện Giảm Tốc 50%", "Mở Cổng Thả Bầy Bọ Cảm Tử", "Sóng Tần Số Siêu Âm",
      // 10 Hard Skills (+2)
      "Chùm Tia Gamma Phân Rã Phân Tử", "Dựng 4 Trụ Năng Lượng Phụ Bất Tử",
      // 15 Hell Skills (+5)
      "Đại Hồng Thủy Axit Toàn Màn Hình", "Bão Trùng Tử Độc Hại Xoay Tròn", "Hút Máu Sinh Mệnh Phục Hồi 25% HP", "Xung Điện Từ Tê Liệt Hệ Thống Điều Khiển", "TUYỆT KỸ TUYỆT CHỦNG NGOẠI HÀNH TINH"
    ]
  }
};

// 3 Funny 3D Space Chicken Minion Archetypes (Gà Vũ Trụ Hài Hước)
export const BLOCKADE_MINIONS = {
  aegis_drone: {
    name: "Gà Trắng Mũ Phi Hành (Aegis Space Chicken)",
    type: "blockade_shield",
    hp: 420,
    speed: 3.5,
    stopY: 10,
    color: "#f8fafc",
    basicAttack: { damage: 14, interval: 1400, bulletColor: "#fffbeb" },
    skills: [
      { name: "Khiên Bong Bóng Vũ Trụ", desc: "Dựng vòm kính phi hành gia chặn 100% đạn bảo vệ bầy gà trong 3s", cooldown: 6 },
      { name: "Vỗ Cánh Đẩy Lùi", desc: "Vỗ cánh tạo sóng đẩy lùi chiến cơ ra xa", cooldown: 8 }
    ]
  },
  siege_turret: {
    name: "Gà Trống Pháo Trứng (Artillery Rooster)",
    type: "blockade_artillery",
    hp: 650,
    speed: 2.8,
    stopY: 14,
    color: "#ea580c",
    basicAttack: { damage: 22, interval: 1800, bulletColor: "#fef08a" },
    skills: [
      { name: "Đại Bác Phóng Trứng Lửa", desc: "Bắn loạt pháo trứng nhiệt hạch càn quét bản đồ", cooldown: 7 },
      { name: "Mưa 8 Trứng Phân Tán", desc: "Xả chùm 8 quả trứng tầm nhiệt đuổi theo chiến cơ", cooldown: 9 }
    ]
  },
  void_interceptor: {
    name: "Gà Ninja Dị Điểm (Void Ninja Chicken)",
    type: "blockade_flanker",
    hp: 350,
    speed: 5.0,
    stopY: 8,
    color: "#a855f7",
    basicAttack: { damage: 18, interval: 1200, bulletColor: "#c084fc" },
    skills: [
      { name: "Thả Trứng Nổ Hư Không", desc: "Đẻ 3 quả trứng bẫy nổ chậm trôi dạt", cooldown: 6.5 },
      { name: "Tốc Biến Vỗ Cánh", desc: "Tốc biến bẻ cong không gian đánh lừa radar", cooldown: 8 }
    ]
  }
};
