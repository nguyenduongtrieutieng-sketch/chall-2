// Definitions for the 6 Legendary Tsar Starfighters
// Updated strictly according to user blueprints and key bindings: Q, E, R, X
export const FIGHTERS = [
  {
    id: "tsar_eternal",
    name: "Sa Hoàng Bất Diệt",
    title: "Imperial Sovereign Dreadnought",
    image: "/ships/Sa Hoàng Bất Diệt.png",
    color: "#FFD700", // Imperial Gold
    glowColor: "rgba(255, 215, 0, 0.9)",
    speed: 7.0,
    maxHp: 1300,
    bullet: {
      type: "plasma",
      damage: 42,
      speed: 16,
      fireRate: 130, // ms
      color: "#FFE066",
      size: 6.5,
      shape: "orb"
    },
    skills: [
      {
        key: "Q",
        name: "Khiên Hoàng Kim Rồng Vàng",
        desc: "Lá chắn rồng vàng bất tử & phản xạ 100% đạn đạo la-de trong 4s",
        cooldown: 12,
        duration: 4,
        type: "shield"
      },
      {
        key: "E",
        name: "Bão Tố Plasma 16 Tia",
        desc: "Xả chùm 16 tia plasma cánh cung quét sạch thiên thạch và quái vật",
        cooldown: 8,
        type: "barrage"
      },
      {
        key: "R",
        name: "Siêu Bom Sa Hoàng (Tsar Bomba)",
        desc: "Kích hoạt đầu đạn hủy diệt hạt nhân vũ trụ (5000 Sát thương toàn màn hình)",
        cooldown: 25,
        type: "screen_nuke",
        requiresTideCloak: true
      },
      {
        key: "X",
        name: "Pháo Thần Công Titan Mega-Beam",
        desc: "Tia hủy diệt xuyên tâm cực đại thiêu rụi toàn bộ hạm đội trên đường bay",
        cooldown: 14,
        duration: 3,
        type: "laser_beam"
      }
    ]
  },
  {
    id: "void_phantom",
    name: "Bóng Ma Vũ Trụ",
    title: "Void Transformer (Hỏa Phụng ⇄ Thiên Nguyệt)",
    image: "/ships/Bóng ma vũ trụ với 2 trạng thái.png",
    color: "#EA80FC", // Neon Violet
    glowColor: "rgba(234, 128, 252, 0.9)",
    speed: 8.5,
    maxHp: 950,
    hasDualForms: true,
    currentForm: "phoenix", // 'phoenix' (Hỏa Phụng) or 'moon' (Thiên Nguyệt)
    bullet: {
      type: "feather_laser",
      damage: 28,
      speed: 20,
      fireRate: 90,
      color: "#FF5722",
      size: 5,
      shape: "feather"
    },
    skills: [
      {
        key: "Q",
        name: "Chuyển Dạng Nhật Nguyệt",
        desc: "Biến hình tức thời giữa Hỏa Phụng và Thiên Nguyệt + Tàng hình vô ảnh 2s",
        cooldown: 5,
        duration: 2,
        type: "transform_shift"
      },
      {
        key: "E",
        name: "Drone Cánh Phượng / Khiên Trăng",
        desc: "[Hỏa Phụng] Tách đôi cánh làm Drone bắn tỉa / [Thiên Nguyệt] Vòm khiên nguyệt quang",
        cooldown: 9,
        type: "dual_e_skill"
      },
      {
        key: "R",
        name: "Nhật Nguyệt Đồng Quy (Eclipse)",
        desc: "Hiện tượng Nhật Thực Vũ Trụ hợp thể Thái Dương & Trăng Khuyết hủy diệt toàn cõi",
        cooldown: 24,
        type: "eclipse_nuke",
        requiresTideCloak: true
      },
      {
        key: "X",
        name: "Tốc Biến Hỏa Vũ / Nguyệt Vực",
        desc: "[Hỏa Phụng] Tốc biến để lại vệt lửa / [Thiên Nguyệt] Hố xoáy kéo quái vào tâm",
        cooldown: 7,
        type: "dual_x_skill"
      }
    ]
  },
  {
    id: "thunder_judgement",
    name: "Lôi Đình Phán Quyết (Thanh Long)",
    title: "72m Imperial Azure Dragon Dreadnought",
    image: "/ships/Lôi đình phán quyết.png",
    color: "#00E5FF", // Cyan Electric
    glowColor: "rgba(0, 229, 255, 0.9)",
    speed: 7.2,
    maxHp: 1150,
    bullet: {
      type: "lightning_torpedo",
      damage: 36,
      speed: 17,
      fireRate: 115,
      color: "#80D8FF",
      size: 6,
      shape: "torpedo"
    },
    skills: [
      {
        key: "Q",
        name: "Khiên Thủy Triều Xoáy Nước",
        desc: "Vòng xoáy nước lôi điện cuộn quanh thân tàu, chặn và phản đạn 3.5s",
        cooldown: 11,
        duration: 3.5,
        type: "shield"
      },
      {
        key: "E",
        name: "Mìn Định Vị & Lôi Đình Giật Lan",
        desc: "Thả 3 quả mìn cơ học tạo lưới điện liên kết giật lan liên tục giữa bầy quái",
        cooldown: 8,
        type: "chain_lightning_mines"
      },
      {
        key: "R",
        name: "Thanh Long Xuất Thế",
        desc: "Thần Long lôi điện khổng lồ giáng thế, cuộn quanh và gầm thét quét sạch hạm đội",
        cooldown: 25,
        type: "azure_dragon_nuke",
        requiresTideCloak: true
      },
      {
        key: "X",
        name: "Dịch Chuyển Siêu Thanh Lưỡi Nước",
        desc: "Lướt siêu thanh để lại tàn ảnh sóng âm và lưỡi nước cắt đôi mọi quái vật",
        cooldown: 7.5,
        type: "dash_blade"
      }
    ]
  },
  {
    id: "boreal_valkyrie",
    name: "Băng Hà Cực Bắc",
    title: "Imperial Aurora (Russian Empire Space Fighter)",
    image: "/ships/Băng Hà Cực Bắc.png",
    color: "#7DD3FC", // Glacial Sky Cyan
    glowColor: "rgba(125, 211, 252, 0.9)",
    speed: 7.5,
    maxHp: 1100,
    bullet: {
      type: "cryo_shard",
      damage: 32,
      speed: 18,
      fireRate: 105,
      color: "#E0F2FE",
      size: 5.5,
      shape: "crystal"
    },
    skills: [
      {
        key: "Q",
        name: "Bão Tuyết Lạnh Giá",
        desc: "Phóng luồng hàn băng lượng tử làm chậm 60% tốc độ của toàn bộ quái trong 4s",
        cooldown: 10,
        duration: 4,
        type: "frost_slow"
      },
      {
        key: "E",
        name: "Khôi Phục Khiên Băng Tinh",
        desc: "Lớp giáp băng hà tái tạo hấp thụ sát thương và hồi phục ngay 30% giáp",
        cooldown: 12,
        type: "shield_regen"
      },
      {
        key: "R",
        name: "Đại Bàng Sa Hoàng Đóng Băng Cõi",
        desc: "Linh hồn đại bàng 2 đầu vỗ cánh giải phóng bão tuyết đóng băng cứng toàn cõi",
        cooldown: 26,
        type: "freeze_all_nuke",
        requiresTideCloak: true
      },
      {
        key: "X",
        name: "Lướt Cực Quang Xuyên Thủng",
        desc: "Bọc mình trong hào quang cực quang xanh biếc, lao xuyên giáp quái vật",
        cooldown: 8,
        type: "aurora_dash"
      }
    ]
  },
  {
    id: "solar_phoenix",
    name: "Bão Lửa Địa Ngục",
    title: "Chiến Sa Hoàng Thần Binh (Mach 6.5)",
    image: "/ships/Bão Lửa Địa Ngục.jpg",
    color: "#EF4444", // Crimson Titan Red
    glowColor: "rgba(239, 68, 68, 0.9)",
    speed: 6.8,
    maxHp: 1350,
    wingsExpanded: false,
    bullet: {
      type: "magma_slug",
      damage: 48,
      speed: 15,
      fireRate: 160,
      color: "#F97316",
      size: 7,
      shape: "molten_ball"
    },
    skills: [
      {
        key: "Q",
        name: "Mở Rộng Cánh Chiến Đấu",
        desc: "Bung cánh phân tầng cơ học: Tăng 50% sát thương pháo và mở rộng 2 nòng súng phụ",
        cooldown: 10,
        duration: 6,
        type: "wing_expand_buff"
      },
      {
        key: "E",
        name: "Cột Lửa Hỏa Diệm Xuyên Hàng",
        desc: "Phun chùm lửa dung nham thiêu đốt xuyên thẳng hàng ngũ quái vật cản đường",
        cooldown: 8,
        type: "fire_column"
      },
      {
        key: "R",
        name: "Địa Ngục Dung Nham Hủy Diệt",
        desc: "Kích nổ buồng đốt plasma kép, biến chiến trường thành biển lửa thiêu rụi tất cả",
        cooldown: 25,
        type: "inferno_nuke",
        requiresTideCloak: true
      },
      {
        key: "X",
        name: "Thu Gọn Cánh Bứt Tốc Mach 6.5",
        desc: "Thu cánh khí động học, tăng vọt tốc độ bay và lướt né 100% đạn trong 2s",
        cooldown: 7,
        type: "turbo_dash"
      }
    ]
  },
  {
    id: "chronos_prime",
    name: "Kẻ Thao Túng Hư Không",
    title: "Void Manipulator (Special Warship Mach 6.8)",
    image: "/ships/Kẻ Thao Túng Hư Không.png",
    color: "#8B5CF6", // Singularity Violet
    glowColor: "rgba(139, 92, 246, 0.9)",
    speed: 7.8,
    maxHp: 1050,
    bullet: {
      type: "void_singularity",
      damage: 35,
      speed: 19,
      fireRate: 110,
      color: "#C084FC",
      size: 6,
      shape: "singularity"
    },
    skills: [
      {
        key: "Q",
        name: "Lỗ Đen Mini Nuốt Chửng Đạn",
        desc: "Tạo vòng xoáy hấp dẫn nuốt toàn bộ đạn đạo của địch xung quanh trong 3.5s",
        cooldown: 11,
        duration: 3.5,
        type: "blackhole_absorb"
      },
      {
        key: "E",
        name: "Dịch Chuyển FTL Ra Sau Lưng Quái",
        desc: "Bẻ cong không-thời gian, biến mất và xuất hiện đột kích ngay sau lưng kẻ thù",
        cooldown: 7.5,
        type: "ftl_jump"
      },
      {
        key: "R",
        name: "Vết Nứt Hư Không Xé Rách Cõi",
        desc: "Xé toạc chiều không gian, hút toàn bộ quái vật và Boss vào chân không dị điểm",
        cooldown: 26,
        type: "spacetime_rift_nuke",
        requiresTideCloak: true
      },
      {
        key: "X",
        name: "Bung Vành Đai Event Horizon",
        desc: "Kích hoạt vành đai sự kiện xoay tròn, tạo sóng phản chấn đẩy lùi và gây choáng",
        cooldown: 9,
        type: "event_horizon_pulse"
      }
    ]
  }
];
