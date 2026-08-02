import { useState } from "react";

const data = [
  {
    rank: 1,
    method: "Upgrade Buildings",
    icon: "🏗️",
    xpRate: "★★★★★",
    xpAmount: "Hundreds per upgrade",
    frequency: "Always active",
    tip: "Long upgrades = most XP. Keep all builders busy 24/7 on high-level structures.",
    color: "#FFD700",
    glow: "#FFD70060",
    badge: "BEST",
    badgeColor: "#FFD700",
  },
  {
    rank: 2,
    method: "Donate Troops",
    icon: "🤝",
    xpRate: "★★★★☆",
    xpAmount: "1 XP/housing space • 5 XP/spell space • 30 XP/siege",
    frequency: "Every cooldown",
    tip: "Since March 2025, training time was removed. Donate instantly for small resource cost — spam it!",
    color: "#00E5FF",
    glow: "#00E5FF60",
    badge: "SPAM",
    badgeColor: "#00bcd4",
  },
  {
    rank: 3,
    method: "Destroy Town Halls",
    icon: "⚔️",
    xpRate: "★★★☆☆",
    xpAmount: "XP = TH level destroyed",
    frequency: "Every attack",
    tip: "Target high TH-level bases in multiplayer. A TH16 gives 16 XP per raid.",
    color: "#FF6B35",
    glow: "#FF6B3560",
    badge: "ATTACK",
    badgeColor: "#e64a19",
  },
  {
    rank: 4,
    method: "Complete Achievements",
    icon: "📋",
    xpRate: "★★★☆☆",
    xpAmount: "Varies — big bursts on completion",
    frequency: "One-time each",
    tip: "3-tier achievements give massive XP chunks. Prioritize donation, war, and attack-based ones.",
    color: "#B04FFF",
    glow: "#B04FFF60",
    badge: "PASSIVE",
    badgeColor: "#7b1fa2",
  },
  {
    rank: 5,
    method: "Clear Obstacles",
    icon: "🌿",
    xpRate: "★★☆☆☆",
    xpAmount: "Small but consistent",
    frequency: "As they spawn",
    tip: "Bushes, trees, and gem boxes. Clears every 8 hours on average. Never let them pile up.",
    color: "#4CAF50",
    glow: "#4CAF5060",
    badge: "EASY",
    badgeColor: "#2e7d32",
  },
  {
    rank: 6,
    method: "Single-Player Campaign",
    icon: "🗺️",
    xpRate: "★★☆☆☆",
    xpAmount: "TH level XP per goblin map win",
    frequency: "One-time",
    tip: "Complete all goblin map missions early. Easy XP source for beginners with no cost.",
    color: "#FF9800",
    glow: "#FF980060",
    badge: "EARLY",
    badgeColor: "#e65100",
  },
];

export default function COCXPGuide() {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0c14 0%, #111827 50%, #0d1117 100%)",
      fontFamily: "'Georgia', serif",
      padding: "32px 16px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background texture */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `radial-gradient(circle at 20% 20%, #1a2a4a22 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, #2a1a3a22 0%, transparent 50%)`,
        pointerEvents: "none",
      }} />

      {/* Grid lines */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `linear-gradient(rgba(255,215,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,215,0,0.03) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(90deg, transparent, #FFD70033, transparent)",
            border: "1px solid #FFD70044",
            borderRadius: 4,
            padding: "4px 24px",
            marginBottom: 16,
            fontSize: 11,
            color: "#FFD700",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}>
            ⚡ Player Level Guide
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 46px)",
            fontWeight: 900,
            margin: "0 0 8px",
            background: "linear-gradient(180deg, #FFD700 0%, #FF8C00 60%, #FF4500 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
            letterSpacing: -1,
            lineHeight: 1.1,
          }}>
            XP FARMING MASTERY
          </h1>
          <p style={{
            color: "#8899aa",
            fontSize: 14,
            margin: 0,
            letterSpacing: 1,
          }}>
            CLASH OF CLANS — LEVEL UP FASTER THAN ANYONE
          </p>
          <div style={{
            width: 80,
            height: 2,
            background: "linear-gradient(90deg, transparent, #FFD700, transparent)",
            margin: "16px auto 0",
          }} />
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map((row, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === i
                  ? `linear-gradient(135deg, #0f1420 0%, #131c2e 100%)`
                  : `linear-gradient(135deg, #0c1018 0%, #10161e 100%)`,
                border: `1px solid ${hovered === i ? row.color + "88" : row.color + "33"}`,
                borderRadius: 12,
                padding: "20px 24px",
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                gap: 16,
                alignItems: "start",
                cursor: "default",
                transition: "all 0.25s ease",
                boxShadow: hovered === i
                  ? `0 0 30px ${row.glow}, 0 4px 20px #00000060, inset 0 0 40px ${row.glow}20`
                  : `0 2px 12px #00000040`,
                transform: hovered === i ? "translateX(4px)" : "translateX(0)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Accent line left */}
              <div style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: `linear-gradient(180deg, transparent, ${row.color}, transparent)`,
                opacity: hovered === i ? 1 : 0.4,
                transition: "opacity 0.25s",
                borderRadius: "12px 0 0 12px",
              }} />

              {/* Rank badge */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}>
                <div style={{
                  fontSize: 28,
                  lineHeight: 1,
                  filter: hovered === i ? `drop-shadow(0 0 8px ${row.color})` : "none",
                  transition: "filter 0.25s",
                }}>
                  {row.icon}
                </div>
                <div style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: row.color,
                  fontWeight: 700,
                  opacity: 0.7,
                }}>
                  #{row.rank}
                </div>
              </div>

              {/* Content */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#eef2ff",
                    letterSpacing: 0.3,
                  }}>
                    {row.method}
                  </span>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    background: row.badgeColor,
                    color: "#fff",
                    padding: "2px 7px",
                    borderRadius: 3,
                    letterSpacing: 1.5,
                  }}>
                    {row.badge}
                  </span>
                </div>

                <div style={{
                  fontSize: 12,
                  color: "#667788",
                  marginBottom: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 16px",
                }}>
                  <span>
                    <span style={{ color: "#445566" }}>XP: </span>
                    <span style={{ color: "#8899aa" }}>{row.xpAmount}</span>
                  </span>
                  <span>
                    <span style={{ color: "#445566" }}>Frequency: </span>
                    <span style={{ color: "#8899aa" }}>{row.frequency}</span>
                  </span>
                </div>

                <div style={{
                  fontSize: 12.5,
                  color: "#aabbcc",
                  lineHeight: 1.6,
                  borderLeft: `2px solid ${row.color}44`,
                  paddingLeft: 10,
                }}>
                  {row.tip}
                </div>
              </div>

              {/* Stars */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                minWidth: 80,
              }}>
                <div style={{
                  fontSize: 13,
                  color: row.color,
                  letterSpacing: 1,
                  filter: hovered === i ? `drop-shadow(0 0 4px ${row.color})` : "none",
                  transition: "filter 0.25s",
                }}>
                  {row.xpRate}
                </div>
                <div style={{
                  fontSize: 9,
                  color: "#445566",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}>
                  Efficiency
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tips Bar */}
        <div style={{
          marginTop: 32,
          background: "linear-gradient(135deg, #0f1420, #141c2c)",
          border: "1px solid #FFD70033",
          borderRadius: 12,
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}>
          <div style={{ gridColumn: "1 / -1", marginBottom: 4 }}>
            <span style={{
              fontSize: 10,
              color: "#FFD700",
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 700,
            }}>
              ⚡ Commander Tips
            </span>
          </div>
          {[
            { icon: "🔨", text: "Never let builders sit idle — even a cheap 1-hour upgrade gives XP" },
            { icon: "🛡️", text: "Clan War attacks double as XP + loot — never skip them" },
            { icon: "💎", text: "Season Pass rewards can fund faster upgrades and more XP" },
          ].map((tip, i) => (
            <div key={i} style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
              <span style={{ fontSize: 12, color: "#8899aa", lineHeight: 1.5 }}>{tip.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: 28,
          fontSize: 11,
          color: "#33445566",
          letterSpacing: 2,
        }}>
          CLASH OF CLANS — XP GUIDE 2026
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
