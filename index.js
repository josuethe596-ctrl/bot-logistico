const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

// ===== PROTECCIÓN ANTI-CRASH =====
process.on('uncaughtException', err => console.error('ERROR GLOBAL:', err));
process.on('unhandledRejection', err => console.error('PROMISE ERROR:', err));

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1500333360344469524';
const GUILD_ID = '1488371938265923705';
const ROL_STAFF = '1489732918124347544';

const DATA_FILE = './data.json';

// ===== CREAR JSON SI NO EXISTE =====
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}');
  console.log('📁 data.json creado automáticamente');
}

// ===== DATA =====
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    console.log('⚠️ JSON corrupto, reiniciando...');
    fs.writeFileSync(DATA_FILE, '{}');
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder()
    .setName('agregar')
    .setDescription('Agregar efectividades')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
    .addIntegerOption(o => o.setName('efectividades').setDescription('Cantidad').setRequired(true)),

  new SlashCommandBuilder()
    .setName('mep')
    .setDescription('Ver tus efectividades'),

  new SlashCommandBuilder()
    .setName('diaend')
    .setDescription('Ver ranking'),

  new SlashCommandBuilder()
    .setName('resets')
    .setDescription('Reiniciar todas las efectividades a 0 (Solo Staff)')
].map(c => c.toJSON());

// ===== REGISTRAR =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('clientReady', async () => {
  console.log('✅ Bot iniciado correctamente');
  console.log('🔄 Registrando comandos...');

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados correctamente');
  } catch (err) {
    console.error('❌ ERROR REGISTRANDO COMANDOS:', err);
  }
});

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = loadData();
  const userId = interaction.user.id;

  try {

    // ===== AGREGAR =====
    if (interaction.commandName === 'agregar') {

      if (!interaction.member.roles.cache.has(ROL_STAFF)) {
        return interaction.reply({ content: 'No autorizado.', ephemeral: true });
      }

      const usuario = interaction.options.getUser('usuario');
      const efectividades = interaction.options.getInteger('efectividades');

      if (!data[usuario.id]) data[usuario.id] = 0;

      data[usuario.id] += efectividades;

      saveData(data);

      return interaction.reply(`+${efectividades} efectividades a ${usuario.username}. Total: ${data[usuario.id]}`);
    }

    // ===== MEP =====
    if (interaction.commandName === 'mep') {
      const efectividades = data[userId] || 0;

      return interaction.reply({
        content: `Tienes ${efectividades} efectividades.`,
        ephemeral: true
      });
    }

    // ===== DIAEND =====
    if (interaction.commandName === 'diaend') {
      const guild = interaction.guild;
      const lista = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .map(([id, efectividades]) => {
          const member = guild.members.cache.get(id);
          const nombre = member ? member.displayName || member.user.username : 'Usuario desconocido';
          return `> ${nombre} — ${efectividades} efectividades`;
        });

      return interaction.reply({
        content: `**RANKING DEL DÍA**\n\n${lista.join('\n') || 'Sin datos'}`
      });
    }

    // ===== RESETS =====
    if (interaction.commandName === 'resets') {

      if (!interaction.member.roles.cache.has(ROL_STAFF)) {
        return interaction.reply({ content: 'No autorizado.', ephemeral: true });
      }

      // Reiniciar todas las efectividades a 0
      for (const id in data) {
        data[id] = 0;
      }

      saveData(data);

      return interaction.reply({
        content: '✅ Todas las efectividades han sido reiniciadas a **0**. ¡Empieza de nuevo!',
        ephemeral: true
      });
    }

  } catch (err) {
    console.error('ERROR:', err);

    if (interaction.replied) {
      interaction.followUp({ content: 'Error.', ephemeral: true });
    } else {
      interaction.reply({ content: 'Error.', ephemeral: true });
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
