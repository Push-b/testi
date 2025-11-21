const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

// Cooldown (5 minutes)
const COOLDOWN = 300000;

// Random monsters
const MONSTERS = [
    { name: "Goblin", img: "https://i.ibb.co/tpFhnw1/goblin.png" },
    { name: "Orc", img: "https://i.ibb.co/ZT1FGP8/orc.png" },
    { name: "Skeleton", img: "https://i.ibb.co/HFjwcPT/skeleton.png" },
    { name: "Dark Knight", img: "https://i.ibb.co/N9CMWW6/darkknight.png" },
    { name: "Forest Wolf", img: "https://i.ibb.co/xhhWgjj/wolf.png" }
];

// Random fight scenes background
const FIGHT_SCENES = [
    "https://i.ibb.co/7jRbL06/fight1.jpg",
    "https://i.ibb.co/88Drjgf/fight2.jpg",
    "https://i.ibb.co/mS1QvZ6/fight3.jpg",
    "https://i.ibb.co/Z6nqG11/fight4.jpg"
];

// Calculate % damage
const percent = (x, y) => Math.round((x / 100) * y);

// Reward generator
const generateReward = (level) => {
    const rand = (max) => Math.round(Math.random() * max) * level;
    return {
        trash: rand(5),
        potion: rand(2),
        wood: rand(8),
        string: rand(8),
        iron: rand(5),
        gold: rand(3),
        diamond: rand(2)
    };
};

module.exports = {
    name: "adventure",
    aliases: ["advn"],
    category: "rpg",
    react: "⚔️",
    description: "RPG adventure with monsters, rewards and a fight image",

    async execute(client, arg, M) {

        // Cooldown system (manual)
        const lastAdv = await client.DB.get(`${M.sender}.adventure`);
        if (lastAdv && Date.now() - lastAdv < COOLDOWN) {
            let left = COOLDOWN - (Date.now() - lastAdv);
            let m = Math.floor(left / 60000);
            let s = Math.floor((left % 60000) / 1000);
            return M.reply(`⏳ *Wait ${m} min ${s} sec before your next adventure.*`);
        }

        // Player stats
        const level = await client.DB.get(`${M.sender}_LEVEL`) || 1;
        const health = await client.rpg.get(`${M.sender}.health`) || 100;
        const armor = await client.rpg.get(`${M.sender}.armor.durability`);
        const sword = await client.rpg.get(`${M.sender}.sword.durability`);

        if (!armor) return M.reply("🛡️ *You don’t have armor!*");
        if (!sword) return M.reply("⚔️ *You don’t have a sword!*");
        if (health < 30) return M.reply("❤️ *Your health is too low for adventure!*");

        await client.DB.set(`${M.sender}.adventure`, Date.now());

        // Random monster & scene
        const monster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
        const scene = FIGHT_SCENES[Math.floor(Math.random() * FIGHT_SCENES.length)];

        // Damage calculations
        const lostHealth = percent(10, health);
        const dmgArmor = percent(30, armor);
        const dmgSword = percent(5, sword);

        await client.rpg.sub(`${M.sender}.armor.durability`, dmgArmor);
        await client.rpg.sub(`${M.sender}.sword.durability`, dmgSword);
        await client.rpg.set(`${M.sender}.health`, health - lostHealth);

        // Rewards
        const reward = generateReward(level);

        // Build reward text
        let rewardText = "";
        for (let [item, amount] of Object.entries(reward)) {
            rewardText += `• ${item.toUpperCase()}: ${amount}\n`;
            await client.rpg.add(`${M.sender}[${item}]`, amount);
        }

        // IMAGE GENERATION
        const canvas = createCanvas(900, 600);
        const ctx = canvas.getContext("2d");

        const bg = await loadImage(scene);
        const mon = await loadImage(monster.img);

        // Draw fight background
        ctx.drawImage(bg, 0, 0, 900, 600);

        // Add monster
        ctx.drawImage(mon, 540, 200, 300, 300);

        // Dark overlay
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, 900, 600);

        ctx.fillStyle = "#fff";
        ctx.font = "36px Arial Black";

        ctx.fillText(`⚔️ ADVENTURE RESULT`, 40, 60);
        ctx.font = "28px Arial";

        ctx.fillText(`Monster: ${monster.name}`, 40, 120);
        ctx.fillText(`❤️ Lost Health: ${lostHealth}`, 40, 170);
        ctx.fillText(`🛡️ Armor Damage: ${dmgArmor}`, 40, 220);
        ctx.fillText(`🗡️ Sword Damage: ${dmgSword}`, 40, 270);

        ctx.font = "30px Arial Black";
        ctx.fillText("🎁 Rewards:", 40, 330);

        ctx.font = "26px Arial";
        let y = 370;
        for (let [item, amt] of Object.entries(reward)) {
            ctx.fillText(`${item.toUpperCase()}: ${amt}`, 40, y);
            y += 34;
        }

        const image = canvas.toBuffer();

        return await client.sendMessage(
            M.from,
            { image, caption: `⚔️ *You fought a ${monster.name}!*` },
            { quoted: M }
        );
    }
};
