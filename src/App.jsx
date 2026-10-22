import React, { useState, useEffect, useRef } from "react";
import { useTideCloak } from "@tidecloak/react";
import { FIGHTERS } from "./game/fighters";
import { MAPS, DIFFICULTIES } from "./game/maps";
import { GameState } from "./game/state";
import { Engine3D } from "./game/engine3d";

export default function App() {
  const { authenticated, login, logout, getValueFromToken } = useTideCloak();

  // Persistent Game State
  const [save, setSave] = useState(() => GameState.load());
  const [currentTab, setCurrentTab] = useState("hangar"); // hangar, stages, inventory, upgrade, repair, shipyard, achievements, ingame, result
  const [selectedMap, setSelectedMap] = useState(MAPS[0]);
  const [selectedDiff, setSelectedDiff] = useState(DIFFICULTIES[0]);
  const [selectedStage, setSelectedStage] = useState(1);
  const [selectedAux, setSelectedAux] = useState(save.auxiliary || "shield_2s");

  // In-Game Live HUD Stats
  const [inGameStats, setInGameStats] = useState({
    hp: 1300,
    maxHp: 1300,
    score: 0,
    runGold: 0,
    runDiamonds: 0,
    wave: 1,
    remainingEnemies: 0,
    currentForm: "phoenix",
    cooldowns: { Q: 0, E: 0, R: 0, X: 0, AUX: 0 },
    bossHp: null,
    bossMaxHp: null,
    bossName: null,
    burnActive: false
  });
  const [gameResult, setGameResult] = useState(null);
  const [quorumModal, setQuorumModal] = useState(null);

  const containerRef = useRef(null);
  const engineRef = useRef(null);

  // Sync state to LocalStorage
  useEffect(() => {
    GameState.save(save);
  }, [save]);

  const activeFighter = FIGHTERS.find((f) => f.id === save.selectedFighterId) || FIGHTERS[0];
  const activeFighterStatus = save.fighterStatus[activeFighter.id] || { damaged: false, hpLevel: 1, dmgLevel: 1, speedLevel: 1 };

  const pilotName = authenticated
    ? getValueFromToken("name") || getValueFromToken("preferred_username") || "Tsar Sovereign Pilot"
    : "Pilot Anonymous (Demo)";

  // Launch Game Mission
  const handleDeploy = () => {
    if (activeFighterStatus.damaged) {
      alert("CẢNH BÁO: Chiến cơ này đang bị HƯ HỎNG THẬT SỰ! Hãy vào Trạm Sửa Chữa (Repair Bay) trước khi xuất kích.");
      setCurrentTab("repair");
      return;
    }
    setCurrentTab("ingame");
  };

  useEffect(() => {
    if (currentTab === "ingame" && containerRef.current) {
      // Calculate upgraded stats
      const upgradedFighter = {
        ...activeFighter,
        maxHp: activeFighter.maxHp + (activeFighterStatus.hpLevel - 1) * 220,
        bullet: {
          ...activeFighter.bullet,
          damage: activeFighter.bullet.damage + (activeFighterStatus.dmgLevel - 1) * 9
        }
      };

      const engine = new Engine3D(
        containerRef.current,
        upgradedFighter,
        selectedMap,
        selectedDiff,
        selectedAux,
        {
          onUpdateStats: (st) => setInGameStats(st),
          onGameOver: (result) => {
            if (!result.isWin) {
              // Hardcore Permadeath: Ship is broken, in-run loot is LOST!
              setSave((prev) => ({
                ...prev,
                fighterStatus: {
                  ...prev.fighterStatus,
                  [activeFighter.id]: {
                    ...prev.fighterStatus[activeFighter.id],
                    damaged: true
                  }
                }
              }));
            } else {
              // Extraction victory: Secure all loot!
              setSave((prev) => ({
                ...prev,
                gold: prev.gold + (result.savedGold || 0),
                diamonds: prev.diamonds + (result.savedDiamonds || 0),
                highestClearedStage: Math.max(prev.highestClearedStage, selectedStage + 1)
              }));
            }
            setGameResult(result);
            setCurrentTab("result");
          },
          onTideCloakNuke: (confirmFn) => {
            setQuorumModal({
              approvals: 0,
              required: 2,
              verified: false,
              onConfirm: () => {
                confirmFn();
                setQuorumModal(null);
              }
            });
          }
        }
      );

      engine.start();
      engineRef.current = engine;

      return () => {
        engine.destroy();
      };
    }
  }, [currentTab]);

  // Safe Extraction (Preserve 100% in-game loot & show extraction report)
  const handleSafeExtraction = () => {
    try {
      if (engineRef.current && typeof engineRef.current.extractSafely === "function") {
        engineRef.current.extractSafely();
        return;
      }
    } catch (e) {
      console.error("Safe extraction error:", e);
    }
    // Fallback: guaranteed safe extraction transition
    setSave((prev) => ({
      ...prev,
      gold: prev.gold + (inGameStats.runGold || 0),
      diamonds: prev.diamonds + (inGameStats.runDiamonds || 0)
    }));
    setGameResult({
      isWin: true,
      isExtracted: true,
      score: inGameStats.score || 0,
      savedGold: inGameStats.runGold || 0,
      savedDiamonds: inGameStats.runDiamonds || 0,
      shipDamaged: false
    });
    setCurrentTab("result");
  };

  // Immediate Exit to Hangar
  const handleEmergencyExit = () => {
    try {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    } catch (e) {
      console.error("Emergency exit error:", e);
    }
    setCurrentTab("hangar");
  };

  // Repair Damaged Ship (Real Damage Recovery)
  const handleRepairShip = (fId) => {
    const costGold = 1200;
    const costDiamonds = 10;
    if (save.gold < costGold || save.diamonds < costDiamonds) {
      alert("Không đủ Vàng hoặc Kim Cương để sửa chữa!");
      return;
    }
    setSave((prev) => ({
      ...prev,
      gold: prev.gold - costGold,
      diamonds: prev.diamonds - costDiamonds,
      fighterStatus: {
        ...prev.fighterStatus,
        [fId]: { ...prev.fighterStatus[fId], damaged: false }
      }
    }));
  };

  // Upgrade Ship Stats
  const handleUpgradeStat = (statKey) => {
    const currentLvl = activeFighterStatus[statKey] || 1;
    const costGold = currentLvl * 900;
    if (save.gold < costGold) {
      alert(`Cần ${costGold.toLocaleString()} Vàng để nâng cấp!`);
      return;
    }
    setSave((prev) => ({
      ...prev,
      gold: prev.gold - costGold,
      fighterStatus: {
        ...prev.fighterStatus,
        [activeFighter.id]: {
          ...prev.fighterStatus[activeFighter.id],
          [statKey]: currentLvl + 1
        }
      }
    }));
  };

  // Buy or Unlock Starfighter in Shipyard
  const handleUnlockShip = (fighter) => {
    const priceGold = 4000;
    const priceDiamonds = 35;
    if (save.gold < priceGold || save.diamonds < priceDiamonds) {
      alert("Không đủ Vàng hoặc Kim Cương để mua chiến cơ này!");
      return;
    }
    setSave((prev) => ({
      ...prev,
      gold: prev.gold - priceGold,
      diamonds: prev.diamonds - priceDiamonds,
      unlockedFighters: [...prev.unlockedFighters, fighter.id],
      selectedFighterId: fighter.id
    }));
  };

  const handleApproveQuorum = () => {
    if (!quorumModal) return;
    const nextApp = quorumModal.approvals + 1;
    if (nextApp >= quorumModal.required) {
      setQuorumModal({ ...quorumModal, approvals: nextApp, verified: true });
      setTimeout(() => {
        quorumModal.onConfirm();
      }, 500);
    } else {
      setQuorumModal({ ...quorumModal, approvals: nextApp });
    }
  };

  return (
    <div className="app-container">
      {/* TOP HEADER & RESOURCE BAR */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-title">CHIẾN CƠ SA HOÀNG</span>
          <span className="brand-badge">3D TSAR IMPERIUM</span>
        </div>

        {/* Currency & Pilot Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", gap: "18px", fontSize: "1.05rem", fontWeight: 700 }}>
            <span style={{ color: "#FFD700" }}>🪙 {save.gold.toLocaleString()} VÀNG</span>
            <span style={{ color: "#00E5FF" }}>💎 {save.diamonds} KIM CƯƠNG</span>
            <span style={{ color: "#10B981" }}>⚡ {save.fuel}/{save.maxFuel} NHIÊN LIỆU</span>
          </div>

          <div className="tidecloak-status">
            <div className={`tidecloak-pill ${authenticated ? "verified" : ""}`}>
              <span>{authenticated ? "🛡️" : "👤"}</span>
              <span>Phi công: <strong>{pilotName}</strong></span>
            </div>

            {authenticated ? (
              <button className="btn-tidecloak" onClick={() => logout()}>ĐĂNG XUẤT</button>
            ) : (
              <button className="btn-tidecloak" onClick={() => login()}>TIDECLOAK LOGIN</button>
            )}
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      {currentTab !== "ingame" && (
        <nav style={{ display: "flex", justifyContent: "center", gap: "10px", padding: "12px", background: "rgba(0,0,0,0.65)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { id: "hangar", label: "🏰 SẢNH CHIẾN CƠ" },
            { id: "stages", label: "🪐 72 ẢI CHIẾN DỊCH" },
            { id: "inventory", label: "🎒 RƯƠNG VẬT PHẨM" },
            { id: "upgrade", label: "⚡ NÂNG CẤP CHỈ SỐ" },
            { id: "repair", label: `🔧 XƯỞNG SỬA CHỮA ${Object.values(save.fighterStatus).some((s) => s.damaged) ? "⚠️" : ""}` },
            { id: "shipyard", label: "🔭 SĂN CHIẾN CƠ" },
            { id: "achievements", label: "🏆 THÀNH TỰU" }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn-tidecloak ${currentTab === tab.id ? "" : "quiet"}`}
              style={{
                background: currentTab === tab.id ? "linear-gradient(135deg, #FFD700, #FFA000)" : "rgba(255,255,255,0.06)",
                color: currentTab === tab.id ? "#000" : "#FFF",
                border: currentTab === tab.id ? "none" : "1px solid rgba(255,255,255,0.15)"
              }}
              onClick={() => setCurrentTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      {/* TAB 1: SẢNH CHIẾN CƠ HOÀNG GIA (HANGAR) */}
      {currentTab === "hangar" && (
        <section className="hangar-view">
          <h1 className="hangar-heading">HẠM ĐỘI SA HOÀNG VŨ TRỤ (IMPERIAL HANGAR)</h1>
          <p className="hangar-sub">Chọn chiến cơ sẵn sàng để xuất kích. Nếu chiến cơ bị hư hỏng sau tử nạn, bắt buộc phải sửa chữa trước!</p>

          <div className="ships-grid">
            {FIGHTERS.map((fighter) => {
              const isSelected = save.selectedFighterId === fighter.id;
              const isUnlocked = save.unlockedFighters.includes(fighter.id);
              const status = save.fighterStatus[fighter.id] || { damaged: false };

              return (
                <div
                  key={fighter.id}
                  className={`ship-card ${isSelected ? "selected" : ""} ${status.damaged ? "damaged" : ""}`}
                  style={{ opacity: isUnlocked ? 1 : 0.6 }}
                  onClick={() => {
                    if (isUnlocked) setSave({ ...save, selectedFighterId: fighter.id });
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.85rem", color: fighter.color, fontWeight: 700 }}>SERIAL: {fighter.id.toUpperCase()}</span>
                    {status.damaged ? (
                      <span style={{ background: "#FF1744", color: "#FFF", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                        BỊ HƯ HỎNG ⚠️
                      </span>
                    ) : (
                      <span style={{ color: "#00E676", fontSize: "0.8rem", fontWeight: 700 }}>100% SẴN SÀNG</span>
                    )}
                  </div>

                  {fighter.image ? (
                    <div style={{ height: "150px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "12px", background: "rgba(0,0,0,0.35)", borderRadius: "8px", padding: "8px" }}>
                      <img src={fighter.image} alt={fighter.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", filter: `drop-shadow(0 0 14px ${fighter.glowColor})` }} />
                    </div>
                  ) : (
                    <div className="ship-icon" style={{ color: fighter.color }}>🚀</div>
                  )}

                  <h3 className="ship-name">{fighter.name}</h3>
                  <span className="ship-title">{fighter.title}</span>

                  <div className="ship-stats">
                    <div>❤️ Máu: <strong>{fighter.maxHp} HP</strong></div>
                    <div>⚡ Tốc độ: <strong>{fighter.speed} Mach</strong></div>
                    <div>💥 Đạn: <strong>{fighter.bullet.type.toUpperCase()}</strong> ({fighter.bullet.damage} Dmg)</div>
                  </div>

                  <div className="skills-preview">
                    <div className="skills-preview-title">4 KĨ NĂNG ĐỘC NHẤT (Q-E-R-X):</div>
                    <div className="skills-tags">
                      {fighter.skills.map((s) => (
                        <span key={s.key} className="skill-tag" style={{ borderLeft: `3px solid ${fighter.color}` }}>
                          [{s.key}] {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn-launch" onClick={() => setCurrentTab("stages")}>
            CHỌN 72 ẢI CHIẾN DỊCH & XUẤT KÍCH (DEPLOY) ▶
          </button>
        </section>
      )}

      {/* TAB 2: 72 ẢI CHIẾN DỊCH (STAGES SELECTION) */}
      {currentTab === "stages" && (
        <section className="hangar-view" style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h1 className="hangar-heading">BẢN ĐỒ CHIẾN DỊCH (72 MÀN CHƠI • 3 CÕI VŨ TRỤ)</h1>
          <p className="hangar-sub">Mỗi môi trường gồm 24 màn chơi với bầy quái dàn trận cản đường và Cổng Xé Rách Không Gian.</p>

          {/* Active Ship Status Warning */}
          {activeFighterStatus.damaged && (
            <div style={{ background: "rgba(255, 23, 68, 0.2)", border: "2px solid #FF1744", padding: "16px", borderRadius: "8px", marginBottom: "24px", color: "#FF5252", textAlign: "center" }}>
              ⚠️ CHIẾN CƠ ĐANG CHỌN ({activeFighter.name}) ĐANG BỊ HƯ HỎNG THẬT SỰ! Không thể xuất kích.
              <button className="btn-tidecloak" style={{ marginLeft: "16px" }} onClick={() => setCurrentTab("repair")}>Đến Trạm Sửa Chữa</button>
            </div>
          )}

          {/* 3 Cosmic Environments */}
          <h3 style={{ color: "#FFD700", marginBottom: "12px", fontFamily: "Orbitron" }}>1. CHỌN CÕI VŨ TRỤ CHIẾN TRANH</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", width: "100%", marginBottom: "28px" }}>
            {MAPS.map((m) => (
              <div
                key={m.id}
                className={`ship-card ${selectedMap.id === m.id ? "selected" : ""}`}
                style={{ overflow: "hidden", padding: "12px" }}
                onClick={() => {
                  setSelectedMap(m);
                  setSelectedStage(m.stageRange[0]);
                }}
              >
                <div style={{ width: "100%", height: "110px", borderRadius: "8px", overflow: "hidden", marginBottom: "10px", border: selectedMap.id === m.id ? "2px solid #FFD700" : "1px solid rgba(255,255,255,0.15)", background: "#050814" }}>
                  <img src={m.image || "/maps/map_thien_ha.png"} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <h4 style={{ fontFamily: "Orbitron", color: "#FFF", marginBottom: "4px" }}>{m.name}</h4>
                <div style={{ fontSize: "0.75rem", color: "#38BDF8", fontWeight: 700, marginBottom: "6px" }}>MÀN {m.stageRange[0]} ĐẾN {m.stageRange[1]}</div>
                <p style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>{m.desc}</p>
              </div>
            ))}
          </div>

          {/* 24 Stages Selector for Selected Realm */}
          <h3 style={{ color: "#FFD700", marginBottom: "12px", fontFamily: "Orbitron" }}>2. CHỌN ẢI (MÀN {selectedMap.stageRange[0]} - {selectedMap.stageRange[1]})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "8px", width: "100%", marginBottom: "28px" }}>
            {Array.from({ length: 24 }, (_, i) => selectedMap.stageRange[0] + i).map((stg) => {
              const isUnlocked = stg <= (save.highestClearedStage || 1);
              const isSelected = selectedStage === stg;
              const isBossStage = stg % 8 === 0;

              return (
                <button
                  key={stg}
                  style={{
                    padding: "10px 4px",
                    borderRadius: "8px",
                    fontFamily: "Orbitron",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: isUnlocked ? "pointer" : "not-allowed",
                    background: isSelected ? "linear-gradient(135deg, #FFD700, #FFA000)" : isUnlocked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                    color: isSelected ? "#000" : isUnlocked ? (isBossStage ? "#FF5252" : "#FFF") : "#4B5563",
                    border: isBossStage ? "1px solid #FF1744" : isSelected ? "none" : "1px solid rgba(255,255,255,0.1)"
                  }}
                  disabled={!isUnlocked}
                  onClick={() => setSelectedStage(stg)}
                >
                  {isBossStage ? `💀${stg}` : stg}
                </button>
              );
            })}
          </div>

          {/* Difficulty Selection */}
          <h3 style={{ color: "#FFD700", marginBottom: "12px", fontFamily: "Orbitron" }}>3. CHỌN CẤP ĐỘ ĐỘ KHÓ</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", width: "100%", marginBottom: "28px" }}>
            {DIFFICULTIES.map((d) => (
              <div
                key={d.id}
                className={`ship-card ${selectedDiff.id === d.id ? "selected" : ""}`}
                style={{ borderColor: d.id === "hell" ? "#FF1744" : selectedDiff.id === d.id ? "#FFD700" : "" }}
                onClick={() => setSelectedDiff(d)}
              >
                <h4 style={{ fontFamily: "Orbitron", color: d.id === "hell" ? "#FF1744" : "#FFF", marginBottom: "6px" }}>{d.name}</h4>
                <p style={{ fontSize: "0.85rem", color: "#D1D5DB", marginBottom: "8px" }}>{d.desc}</p>
                <div style={{ fontSize: "0.8rem", color: "#FFD700" }}>⭐ Thưởng: x{d.goldRewardMul} Vàng + {d.diamondReward} Kim Cương</div>
              </div>
            ))}
          </div>

          {/* Auxiliary Loadout */}
          <h3 style={{ color: "#FFD700", marginBottom: "12px", fontFamily: "Orbitron" }}>4. THIẾT BỊ PHỤ TRỢ MANG THEO (HỒI CHIÊU 30S)</h3>
          <div style={{ display: "flex", gap: "20px", marginBottom: "36px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "rgba(255,255,255,0.06)", padding: "12px 20px", borderRadius: "8px", border: selectedAux === "shield_2s" ? "1px solid #00E676" : "1px solid transparent" }}>
              <input type="radio" name="aux" checked={selectedAux === "shield_2s"} onChange={() => setSelectedAux("shield_2s")} />
              <span>🛡️ <strong>LÁ CHẮN BẤT TỬ 2S</strong> (Miễn nhiễm 100% sát thương tức thời)</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "rgba(255,255,255,0.06)", padding: "12px 20px", borderRadius: "8px", border: selectedAux === "drone_fleet" ? "1px solid #00E676" : "1px solid transparent" }}>
              <input type="radio" name="aux" checked={selectedAux === "drone_fleet"} onChange={() => setSelectedAux("drone_fleet")} />
              <span>🛸 <strong>HẠM ĐỘI DRONE YỂM TRỢ</strong> (Triệu hồi 4 máy bay không người lái xả đạn 6s)</span>
            </label>
          </div>

          <button className="btn-launch" disabled={activeFighterStatus.damaged} onClick={handleDeploy}>
            XÁC NHẬN VÀO TRẬN (MÀN {selectedStage} • {selectedDiff.name}) ⚔️
          </button>
        </section>
      )}

      {/* TAB 3: RƯƠNG VẬT PHẨM (INVENTORY) */}
      {currentTab === "inventory" && (
        <section className="hangar-view" style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 className="hangar-heading">RƯƠNG VẬT PHẨM & TÀI NGUYÊN (INVENTORY)</h1>
          <p className="hangar-sub">Các tài nguyên, mảnh hợp kim và lõi năng lượng mang về an toàn từ các chuyến xuất kích.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", width: "100%" }}>
            {(save.inventory || []).map((item) => (
              <div key={item.id} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.8rem" }}>{item.icon}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: item.rarity === "UR" ? "#FFD700" : item.rarity === "SSR" ? "#00E5FF" : "#FF5252", color: "#000" }}>
                    {item.rarity}
                  </span>
                </div>
                <h4 style={{ fontFamily: "Orbitron", color: "#FFF", fontSize: "0.95rem" }}>{item.name}</h4>
                <p style={{ fontSize: "0.8rem", color: "#9CA3AF", margin: "6px 0" }}>{item.desc}</p>
                <div style={{ color: "#00E676", fontWeight: 700, fontSize: "0.85rem" }}>Số lượng: x{item.count}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: TRẠM NÂNG CẤP CHỈ SỐ */}
      {currentTab === "upgrade" && (
        <section className="hangar-view" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 className="hangar-heading">TRẠM NÂNG CẤP CHỈ SỐ: {activeFighter.name}</h1>
          <p className="hangar-sub">Sử dụng Vàng thu thập được từ các đợt quái vật để cường hóa sức mạnh chiến cơ.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", marginBottom: "32px" }}>
            {[
              { key: "hpLevel", name: "Cường Hóa Giáp & Máu (+220 HP)", lvl: activeFighterStatus.hpLevel },
              { key: "dmgLevel", name: "Cường Hóa Sát Thương Đạn (+9 Dmg)", lvl: activeFighterStatus.dmgLevel },
              { key: "speedLevel", name: "Cường Hóa Tốc Độ Động Cơ (+0.5 Mach)", lvl: activeFighterStatus.speedLevel }
            ].map((stat) => {
              const cost = stat.lvl * 900;
              return (
                <div key={stat.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", padding: "18px 24px", borderRadius: "8px" }}>
                  <div>
                    <h4 style={{ fontFamily: "Orbitron", color: "#FFF" }}>{stat.name}</h4>
                    <span style={{ color: "#00E676" }}>Cấp độ hiện tại: <strong>Cấp {stat.lvl}</strong></span>
                  </div>
                  <button className="btn-tidecloak" onClick={() => handleUpgradeStat(stat.key)}>
                    NÂNG CẤP ({cost.toLocaleString()} Vàng)
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 5: XƯỞNG SỬA CHỮA HƯ HỎNG THỰC TẾ (REPAIR BAY) */}
      {currentTab === "repair" && (
        <section className="hangar-view" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 className="hangar-heading">XƯỞNG SỬA CHỮA HƯ HỎNG THẬT SỰ (REPAIR BAY)</h1>
          <p className="hangar-sub">Nếu chiến cơ tử trận, nó sẽ bị phá hủy thật sự và bắt buộc phải sửa chữa bằng 1,200 Vàng + 10 Kim Cương mới xuất kích tiếp được.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", width: "100%" }}>
            {FIGHTERS.map((f) => {
              const st = save.fighterStatus[f.id] || { damaged: false };
              return (
                <div key={f.id} style={{ background: "rgba(255,255,255,0.05)", border: st.damaged ? "2px solid #FF1744" : "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h3 style={{ fontFamily: "Orbitron", color: f.color }}>{f.name}</h3>
                    <span style={{ color: st.damaged ? "#FF1744" : "#00E676", fontWeight: 700 }}>
                      {st.damaged ? "⚠️ BỊ PHÁ HỦY THẬT" : "✅ 100% NGUYÊN VẸN"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#9CA3AF", marginBottom: "14px" }}>{f.title}</p>
                  {st.damaged ? (
                    <button className="btn-launch" style={{ fontSize: "0.9rem", padding: "10px 20px" }} onClick={() => handleRepairShip(f.id)}>
                      SỬA CHỮA PHỤC HỒI (1,200 Vàng + 10 💎)
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>Chiến cơ đang ở trạng thái tốt nhất.</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 6: SHIPYARD (SĂN CHIẾN CƠ) */}
      {currentTab === "shipyard" && (
        <section className="hangar-view" style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 className="hangar-heading">XƯỞNG ĐÓNG TÀU & SĂN CHIẾN CƠ HOÀNG GIA</h1>
          <p className="hangar-sub">Mở khóa các cỗ máy chiến tranh độc quyền của Đế chế Sa Hoàng.</p>

          <div className="ships-grid">
            {FIGHTERS.map((f) => {
              const isUnlocked = save.unlockedFighters.includes(f.id);
              return (
                <div key={f.id} className="ship-card">
                  {f.image ? (
                    <div style={{ height: "140px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "12px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "6px" }}>
                      <img src={f.image} alt={f.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", filter: `drop-shadow(0 0 12px ${f.glowColor})` }} />
                    </div>
                  ) : (
                    <div className="ship-icon" style={{ color: f.color }}>🚀</div>
                  )}
                  <h3 className="ship-name">{f.name}</h3>
                  <span className="ship-title">{f.title}</span>
                  <div style={{ marginTop: "16px" }}>
                    {isUnlocked ? (
                      <span style={{ color: "#00E676", fontWeight: 700 }}>ĐÃ SỞ HỮU TRONG HANGAR</span>
                    ) : (
                      <button className="btn-launch" style={{ fontSize: "0.85rem", padding: "10px 18px" }} onClick={() => handleUnlockShip(f)}>
                        MUA CHIẾN CƠ (4,000 Vàng + 35 💎)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 7: THÀNH TỰU */}
      {currentTab === "achievements" && (
        <section className="hangar-view" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 className="hangar-heading">THÀNH TỰU SĂN LÙNG VŨ TRỤ</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
            {save.achievements.map((ach) => (
              <div key={ach.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", padding: "16px 20px", borderRadius: "8px" }}>
                <div>
                  <h4 style={{ fontFamily: "Orbitron", color: "#FFD700" }}>{ach.name}</h4>
                  <p style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>{ach.desc}</p>
                </div>
                <div>
                  <span style={{ color: "#00E676" }}>Phần thưởng: {ach.rewardGold ? `${ach.rewardGold} Vàng` : `${ach.rewardDiamonds} Kim Cương`}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VIEW 8: GIAO DIỆN TRONG TRẬN 3D HUD (IN-GAME HUD) */}
      {currentTab === "ingame" && (
        <section className="game-view">
          {/* TOP HUD BAR */}
          <div className="game-hud">
            <div className="hud-stat">
              <span style={{ color: "#FFD700", fontWeight: 700 }}>GIÁP:</span>
              <div className="hp-bar-container">
                <div
                  className={`hp-bar ${inGameStats.hp / inGameStats.maxHp < 0.3 ? "danger" : ""}`}
                  style={{ width: `${Math.max(0, (inGameStats.hp / inGameStats.maxHp) * 100)}%` }}
                />
              </div>
              <span>{inGameStats.hp} / {inGameStats.maxHp}</span>
            </div>

            {/* In-Run Loot Tracker */}
            <div className="hud-stat">
              <span style={{ color: "#FFD700" }}>🪙 Nhặt: +{inGameStats.runGold}</span>
              <span style={{ color: "#00E5FF", marginLeft: "10px" }}>💎 +{inGameStats.runDiamonds}</span>
            </div>

            <div className="hud-stat">
              <span style={{ color: "#EA80FC" }}>ĐỢT:</span>
              <strong style={{ color: "#FFF" }}>{inGameStats.wave} / 9</strong>
              {inGameStats.remainingEnemies > 0 && (
                <span style={{ color: "#FF5252", marginLeft: "6px" }}>({inGameStats.remainingEnemies} Cản đường)</span>
              )}
            </div>

            {/* Extraction & Direct Exit Buttons */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                style={{
                  background: "#10B981",
                  color: "#FFF",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontFamily: "Orbitron",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)"
                }}
                onClick={handleSafeExtraction}
                title="Bảo toàn 100% Vàng & Kim Cương vừa nhặt được trong trận"
              >
                RÚT LUI AN TOÀN [ESC] 🚁
              </button>

              <button
                style={{
                  background: "#EF4444",
                  color: "#FFF",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontFamily: "Orbitron",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  boxShadow: "0 0 8px rgba(239, 68, 68, 0.3)"
                }}
                onClick={handleEmergencyExit}
                title="Thoát trận ngay lập tức về Hangar"
              >
                THOÁT ✕
              </button>
            </div>
          </div>

          {/* BOSS HP BAR & BURN AURA WARNING */}
          {inGameStats.bossHp !== null && (
            <div className="boss-hud">
              <div className="boss-title">⚠️ ĐẠI BOSS: {inGameStats.bossName} ⚠️</div>
              <div className="boss-hp-bar">
                <div
                  className="boss-hp-fill"
                  style={{ width: `${Math.max(0, (inGameStats.bossHp / inGameStats.bossMaxHp) * 100)}%` }}
                />
              </div>
              {inGameStats.burnActive && (
                <div style={{ color: "#FF5252", fontSize: "0.8rem", marginTop: "4px", fontWeight: 700, animation: "pulse 1s infinite" }}>
                  🔥 HIỆU ỨNG THIÊU ĐỐT SA HOÀNG ĐANG ĐỐT CHÁY MÁU TỰ ĐỘNG!
                </div>
              )}
            </div>
          )}

          {/* 3D CANVAS CONTAINER (Chase Camera Viewport) */}
          <div className="canvas-wrapper" style={{ width: "900px", height: "700px" }}>
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          </div>

          {/* SKILLS DOCK: Q, E, R, X + SPACE AUXILIARY */}
          <div className="skills-dock">
            {activeFighter.skills.map((skill) => {
              const cd = Math.ceil(inGameStats.cooldowns[skill.key] || 0);
              let displayName = skill.name;

              // Dual-form indicator for Bóng Ma Vũ Trụ
              if (activeFighter.id === "void_phantom" && skill.key === "Q") {
                displayName = inGameStats.currentForm === "phoenix" ? "Dạng Hỏa Phụng ⇄ [Q]" : "Dạng Thiên Nguyệt ⇄ [Q]";
              }

              return (
                <div key={skill.key} className="skill-slot">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="skill-key">[{skill.key}]</span>
                    {skill.requiresTideCloak && <span style={{ fontSize: "0.75rem", color: "#00E676" }}>🛡️ TIDE</span>}
                  </div>
                  <div className="skill-name">{displayName}</div>
                  <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{skill.desc}</div>
                  {cd > 0 && <div className="skill-cd-overlay">{cd}s</div>}
                </div>
              );
            })}

            {/* Auxiliary Equipment Button */}
            <div className="skill-slot" style={{ borderColor: "#00E676" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="skill-key">[SPACE / R-CLICK]</span>
                <span style={{ fontSize: "0.75rem", color: "#00E676" }}>PHỤ TRỢ</span>
              </div>
              <div className="skill-name">{selectedAux === "shield_2s" ? "Bất Tử 2s" : "Hạm Đội Drone"}</div>
              <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>Hồi chiêu 30s</div>
              {Math.ceil(inGameStats.cooldowns.AUX || 0) > 0 && (
                <div className="skill-cd-overlay">{Math.ceil(inGameStats.cooldowns.AUX)}s</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* VIEW 9: GAME RESULT MODAL */}
      {currentTab === "result" && gameResult && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title" style={{ color: gameResult.isWin ? "#FFD700" : "#FF1744" }}>
              {gameResult.isWin ? (gameResult.isExtracted ? "🚁 RÚT LUI THÀNH CÔNG!" : "🏆 HẠ GỤC ĐẠI BOSS!") : "💀 CHIẾN CƠ BỊ PHÁ HỦY THẬT SỰ!"}
            </h2>

            {!gameResult.isWin ? (
              <div style={{ background: "rgba(255, 23, 68, 0.15)", border: "1px solid #FF1744", padding: "16px", borderRadius: "8px", marginBottom: "20px", color: "#FF5252" }}>
                <p style={{ fontWeight: 700, marginBottom: "6px" }}>CƠ CHẾ HƯ HỎNG THẬT SỰ & MẤT TOÀN BỘ VẬT PHẨM:</p>
                <p>Chiến cơ của bạn đã bị nát vụn trên chiến trường. Toàn bộ <strong>{gameResult.lostGold} Vàng</strong> và <strong>{gameResult.lostDiamonds} Kim Cương</strong> nhặt được trong trận đã BỊ MẤT TRẮNG!</p>
                <p style={{ marginTop: "6px" }}>Bạn phải vào Xưởng Sửa Chữa (Repair Bay) trước khi có thể xuất kích lại.</p>
              </div>
            ) : (
              <div style={{ background: "rgba(0, 230, 118, 0.15)", border: "1px solid #00E676", padding: "16px", borderRadius: "8px", marginBottom: "20px", color: "#00E676" }}>
                <p style={{ fontWeight: 700, marginBottom: "6px" }}>BẢO TOÀN TÀI NGUYÊN CHIẾN THUẬT THÀNH CÔNG:</p>
                <p>Bạn đã mang về an toàn: <strong>+{gameResult.savedGold} Vàng</strong> và <strong>+{gameResult.savedDiamonds} Kim Cương</strong>!</p>
              </div>
            )}

            <button className="btn-launch" onClick={() => setCurrentTab("hangar")}>
              QUAY VỀ SẢNH HANGAR
            </button>
          </div>
        </div>
      )}

      {/* TIDECLOAK QUORUM MODAL */}
      {quorumModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title">🛡️ TIDECLOAK QUORUM VERIFICATION</h2>
            <p style={{ color: "#E0E7FF", marginBottom: "16px" }}>
              Kích hoạt <strong>SIÊU BOM SA HOÀNG</strong> yêu cầu chữ ký phi tập trung đa bên (Quorum Consensus) để chống xâm nhập:
            </p>
            <div style={{ background: "rgba(255,255,255,0.06)", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <div>Chữ ký đồng thuận: <strong>{quorumModal.approvals} / {quorumModal.required}</strong></div>
              <div style={{ color: quorumModal.verified ? "#00E676" : "#FFD700", marginTop: "4px" }}>
                {quorumModal.verified ? "✅ XÁC THỰC THÀNH CÔNG! BẮT ĐẦU NỔ!" : "Đang chờ chữ ký phi công liên minh..."}
              </div>
            </div>
            {!quorumModal.verified && (
              <button className="btn-launch" style={{ fontSize: "0.95rem", padding: "10px 24px" }} onClick={handleApproveQuorum}>
                KÝ DUYỆT CHỮ KÝ MẬT MÃ ({quorumModal.approvals + 1}/{quorumModal.required})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
