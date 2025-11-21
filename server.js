const { createCanvas, loadImage } = require("canvas");

// Blacksmith recipes (unchanged logic)
const blacksmith = {
  createsword: {
    iron: { id: 3, material: { wood: 5, iron: 7, string: 4 }, durability: 125 },
    gold: { id: 4, material: { wood: 5, string: 4, gold: 7 }, durability: 150 },
    diamond: { id: 6, material: { wood: 5, string: 4, diamond: 7 }, durability: 200 },
    emerald: { id: 7, material: { wood: 5, string: 4, emerald: 7 }, durability: 175 }
  },
  createarmor: {
    iron: { id: 3, material: { wood: 5, iron: 7, string: 4 }, durability: 125 },
    gold: { id: 4, material: { wood: 5, string: 4, gold: 7 }, durability: 150 },
    diamond: { id: 6, material: { wood: 5, string: 4, diamond: 7 }, durability: 502 },
    emerald: { id: 7, material: { wood: 5, string: 4, emerald: 7 }, durability: 770 }
  },
  createpickaxe: {
    iron: { id: 3, material: { wood: 5, iron: 7, string: 4 }, durability: 125 },
    gold: { id: 4, material: { wood: 5, string: 4, gold: 7 }, durability: 550 },
    diamond: { id: 6, material: { wood: 5, string: 4, diamond: 7 }, durability: 900 },
    emerald: { id: 7, material: { wood: 5, string: 4, emerald: 7 }, durability: 1000 }
  },
  createfishingrod: {
    normal: { id: true, material: { wood: 5, string: 15 }, durability: 150 }
  }
};

const createlist = Object.keys(blacksmith);

// Replace with your realistic art image URLs (Style A). These are example placeholders.
// You can replace these with any hosted images you prefer.
const ITEM_ART = {
  createsword: {
    iron: "https://i.ibb.co/Br4mR2k/iron-sword-realistic.png",
    gold: "https://i.ibb.co/4WQv0rZ/gold-sword-realistic.png",
    diamond: "https://i.ibb.co/4FJm7sR/diamond-sword-realistic.png",
    emerald: "https://i.ibb.co/ZG1q2xB/emerald-sword-realistic.png"
  },
  createarmor: {
    iron: "https://i.ibb.co/1r2k5gX/iron-armor-realistic.png",
    gold: "https://i.ibb.co/6rCwz1p/gold-armor-realistic.png",
    diamond: "https://i.ibb.co/r4g8kT6/diamond-armor-realistic.png",
    emerald: "https://i.ibb.co/9n0z5Mw/emerald-armor-realistic.png"
  },
  createpickaxe: {
    iron: "https://i.ibb.co/9q9cJ7N/iron-pick-realistic.png",
    gold: "https://i.ibb.co/0sK2dFq/gold-pick-realistic.png",
    diamond: "https://i.ibb.co/2g0V8bZ/diamond-pick-realistic.png",
    emerald: "https://i.ibb.co/bXhGJ7M/emerald-pick-realistic.png"
  },
  createfishingrod: {
    normal: "https://i.ibb.co/Xy3fLxG/fishing-rod-realistic.png"
  }
};

// Small icon images for materials (optional). Fallbacks drawn if unavailable.
const MATERIAL_ICON = {
  wood: "https://i.ibb.co/0s2yX7G/wood-icon.png",
  iron: "https://i.ibb.co/3rJ1Z9P/iron-icon.png",
  string: "https://i.ibb.co/y8b9bYt/string-icon.png",
  gold: "https://i.ibb.co/6b1XGf7/gold-icon.png",
  diamond: "https://i.ibb.co/ZVf0mKj/diamond-icon.png",
  emerald: "https://i.ibb.co/8zG1r2C/emerald-icon.png"
};

module.exports = {
  name: 'blacksmith',
  aliases: [...createlist],
  category: 'rpg',
  react: '🔥',
  description: 'Forge tools, armor, and weapons with required materials',

  async execute(client, arg, M) {
    try {
      // Determine invoked subcommand (e.g., createsword, createarmor)
      const invoked = M.body.split(' ')[0].toLowerCase().slice(client.prefix.length).trim();
      const isMain = invoked === 'blacksmith';

      // If user asked just "blacksmith", show the textual menu (as before) + a small preview image
      if (isMain) {
        let text = '====🥢 *BLACKSMITH FORGE* 🥢====\n\n';
        const emojis = { createsword: '⚔️', createarmor: '🛡️', createpickaxe: '⛏️', createfishingrod: '🎣' };

        for (const category of createlist) {
          const title = client.utils.capitalize(category.replace('create', ''), true);
          text += `${emojis[category] || '🛠️'} *${title}*\n`;

          for (const type in blacksmith[category]) {
            const { material, durability } = blacksmith[category][type];
            const matStr = Object.entries(material).map(([mat, val]) => `${val}${mat}`).join(', ');
            text += `\n📗 *Type:* ${client.utils.capitalize(type)}\n` +
                    `⚖️ *Required:* ${matStr}\n` +
                    `💙 *Durability:* ${durability}\n` +
                    `💡 *Usage:* ${client.prefix}${category} ${type}\n`;
          }

          text += '\n────────────────────\n\n';
        }

        return M.reply(text);
      }

      // mapping to friendly tool name and selected type from args
      const typeMap = {
        createsword: 'sword',
        createarmor: 'armor',
        createpickaxe: 'pickaxe',
        createfishingrod: 'fishingrod'
      };

      const toolType = typeMap[invoked];
      const selectedItem = (arg || '').trim().toLowerCase();

      if (!toolType) return M.reply('❌ Invalid command! Use the main command to see options.');

      if (!selectedItem) {
        return M.reply(`❌ Please specify a type. Example: \`${client.prefix}${invoked} iron\``);
      }

      if (!blacksmith[invoked] || !blacksmith[invoked][selectedItem]) {
        return M.reply(`❌ *Invalid type!* Use \`${client.prefix}blacksmith\` to see valid options.`);
      }

      // Prevent crafting if the user already has the tool
      const existing = await client.rpg.get(`${M.sender}[${toolType}]`);
      if (existing) {
        return M.reply(`👴🏽⛏️ You already have a *${toolType}*. Return when it's broken.`);
      }

      // Check materials
      const materialsNeeded = blacksmith[invoked][selectedItem].material;
      for (const [mat, req] of Object.entries(materialsNeeded)) {
        const userMat = (await client.rpg.get(`${M.sender}[${mat}]`)) || 0;
        if (userMat < req) {
          return M.reply(`🚫 You're short of *${mat}*. Need ${req}, but you have ${userMat}.`);
        }
      }

      // Deduct materials
      for (const [mat, req] of Object.entries(materialsNeeded)) {
        await client.rpg.sub(`${M.sender}[${mat}]`, req);
      }

      // Give the tool: set type and durability
      await client.rpg.set(`${M.sender}[${toolType}].type`, selectedItem);
      await client.rpg.set(`${M.sender}[${toolType}].durability`, blacksmith[invoked][selectedItem].durability);

      // ========== Generate forged item image (Style A - Realistic) ==========
      const width = 1000;
      const height = 520;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Premium background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#0b0f13");
      grad.addColorStop(1, "#1b1f25");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle vignette
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, width, height);

      // Title
      ctx.fillStyle = "#FFD166";
      ctx.font = "bold 42px Serif";
      ctx.textAlign = "left";
      ctx.fillText("BLACKSMITH FORGE — ITEM FORGED", 40, 60);

      // Left panel (item art)
      const artX = 640;
      const artY = 100;
      const artW = 320;
      const artH = 320;

      // Try to load realistic item art image, fallback to drawing stylized weapon
      const artUrl = (ITEM_ART[invoked] && ITEM_ART[invoked][selectedItem]) || null;
      let artLoaded = false;
      if (artUrl) {
        try {
          const img = await loadImage(artUrl);
          // draw a soft glowing spotlight behind item
          ctx.save();
          ctx.globalAlpha = 0.25;
          const radial = ctx.createRadialGradient(artX + artW/2, artY + artH/2, 10, artX + artW/2, artY + artH/2, 220);
          radial.addColorStop(0, "#ffffff");
          radial.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(artX + artW/2, artY + artH/2, 220, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();

          ctx.drawImage(img, artX, artY, artW, artH);
          artLoaded = true;
        } catch (e) {
          artLoaded = false;
        }
      }

      if (!artLoaded) {
        // Fallback - draw stylized item
        ctx.save();
        ctx.fillStyle = "#2c2f33";
        ctx.fillRect(artX, artY, artW, artH);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.fillText(client.utils.capitalize(selectedItem), artX + artW/2, artY + artH/2);
        ctx.restore();
      }

      // Right panel (item details)
      const startX = 40;
      const startY = 120;

      // Name & stats
      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px Serif";
      ctx.fillText(`${client.utils.capitalize(selectedItem)} ${client.utils.capitalize(toolType)}`, startX, startY);

      ctx.font = "22px Arial";
      ctx.fillStyle = "#dfe6ee";
      const durability = blacksmith[invoked][selectedItem].durability;
      ctx.fillText(`Durability: ${durability}`, startX, startY + 48);

      // Materials list header
      ctx.fillStyle = "#FFD166";
      ctx.font = "bold 26px Arial";
      ctx.fillText("Materials Used:", startX, startY + 110);

      // Draw material icons & amounts
      let matY = startY + 150;
      const iconSize = 44;
      for (const [mat, amt] of Object.entries(materialsNeeded)) {
        // try loading material icon
        let iconLoaded = false;
        const iconUrl = MATERIAL_ICON[mat];
        if (iconUrl) {
          try {
            const icon = await loadImage(iconUrl);
            ctx.drawImage(icon, startX, matY - iconSize + 6, iconSize, iconSize);
            iconLoaded = true;
          } catch (e) {
            iconLoaded = false;
          }
        }

        if (!iconLoaded) {
          // fallback draw circle
          ctx.fillStyle = "#2b2f36";
          ctx.beginPath();
          ctx.arc(startX + iconSize/2, matY - iconSize/2 + 6, iconSize/2, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 18px Arial";
          ctx.textAlign = "center";
          ctx.fillText(mat[0].toUpperCase(), startX + iconSize/2, matY - iconSize/2 + 12);
        }

        // Material text
        ctx.textAlign = "left";
        ctx.fillStyle = "#e6eef8";
        ctx.font = "22px Arial";
        ctx.fillText(`${client.utils.capitalize(mat)} x ${amt}`, startX + iconSize + 16, matY);
        matY += 54;
      }

      // Footer: forged message & user
      const username = (await client.contact.getContact(M.sender, client)).username || M.pushName || "Adventurer";
      ctx.fillStyle = "#9fb3c8";
      ctx.font = "18px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Forged for: ${username}`, startX, height - 40);
      ctx.fillText(`Crafted at: The Grand Forge`, startX + 360, height - 40);

      // Send image
      const buffer = canvas.toBuffer("image/png");
      await client.sendMessage(M.from, {
        image: buffer,
        caption: `✅ *Success!* Your ${client.utils.capitalize(selectedItem)} ${client.utils.capitalize(toolType)} has been forged.\n📘 Durability: ${durability}`
      }, { quoted: M });

    } catch (err) {
      console.error("Blacksmith command error:", err);
      return M.reply("❌ Something went wrong while forging. Please try again later.");
    }
  }
};
