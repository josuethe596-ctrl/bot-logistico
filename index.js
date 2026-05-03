const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

// ===== SEGURIDAD GLOBAL =====
process.on('uncaughtException', err => {
  console.error('ERROR GLOBAL:', err);
});
process.on('unhandledRejection', err => {
  console.error('PROMISE ERROR:', err);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('❌ ERROR: NO HAY TOKEN EN VARIABLES');
  process.exit(1);
}

const CLIENT_ID = '1500333360344469524';
const GUILD_ID = '1488371938265923705';
const ROL_STAFF = '1489732918124347544';

const DATA_FILE = './data.json';

// ===== ASEGURAR JSON =====
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
    .setDescription('Agregar puntos')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
    .addIntegerOption(o => o.setName('puntos').setDescription('Cantidad').setRequired(true)),

  new SlashCommandBuilder()
    .setName('mep')
    .setDescription('Ver tus puntos'),

  new SlashCommandBuilder()
    .setName('diaend')
    .setDescription('Ranking')
].map(c => c.toJSON());

// ===== REGISTRAR =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('clientReady', async () => {
  console.log('✅ Bot iniciado correctamente');

  try {
    console.log('🔄 Registrando comandos...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados');
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
      const puntos = interaction.options.getInteger('puntos');

      if (!data[usuario.id]) data[usuario.id] = 0;

      data[usuario.id] += puntos;

      saveData(data);

      return interaction.reply(`+${puntos} puntos a ${usuario.username}. Total: ${data[usuario.id]}`);
    }

    // ===== MEP =====
    if (interaction.commandName === 'mep') {
      const puntos = data[userId] || 0;

      return interaction.reply({
        content: `Tienes ${puntos} puntos.`,
        ephemeral: true
      });
    }

    // ===== DIAEND =====
    if (interaction.commandName === 'diaend') {
      const lista = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .map(([id, puntos]) => `> <@${id}> — ${puntos}`);

      return interaction.reply({
        content: `**RANKING**\n\n${lista.join('\n') || 'Sin datos'}`
      });
    }

  } catch (err) {
    console.error('ERROR INTERACCION:', err);

    if (interaction.replied) {
      interaction.followUp({ content: 'Error.', ephemeral: true });
    } else {
      interaction.reply({ content: 'Error.', ephemeral: true });
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
