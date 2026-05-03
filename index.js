const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG (YA LISTO) =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1500333360344469524';
const GUILD_ID = '1488371938265923705';
const ROL_STAFF = '1489732918124347544';

const DATA_FILE = './data.json';

// ===== DATA =====
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== COMANDOS =====
const commands = [

  new SlashCommandBuilder()
    .setName('agregar')
    .setDescription('Agregar efectividad')
    .addUserOption(o =>
      o.setName('usuario')
        .setDescription('Usuario')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName('puntos')
        .setDescription('Cantidad de puntos')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('mep')
    .setDescription('Ver tus puntos'),

  new SlashCommandBuilder()
    .setName('diaend')
    .setDescription('Ver ranking del día')

].map(c => c.toJSON());

// ===== REGISTRAR =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('clientReady', async () => {
  console.log('Bot de efectividad listo');

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
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
        return interaction.reply({
          content: 'No tienes permiso para usar este comando.',
          ephemeral: true
        });
      }

      const usuario = interaction.options.getUser('usuario');
      const puntos = interaction.options.getInteger('puntos');

      if (!data[usuario.id]) data[usuario.id] = 0;

      data[usuario.id] += puntos;

      saveData(data);

      return interaction.reply(
        `Se agregaron ${puntos} puntos a ${usuario.username}.\nTotal actual: ${data[usuario.id]}`
      );
    }

    // ===== MEP =====
    if (interaction.commandName === 'mep') {

      const puntos = data[userId] || 0;

      return interaction.reply({
        content: `Tienes ${puntos} puntos de efectividad.`,
        ephemeral: true
      });
    }

    // ===== DIAEND =====
    if (interaction.commandName === 'diaend') {

      let lista = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .map(([id, puntos]) => `> <@${id}> — ${puntos} puntos`);

      return interaction.reply({
        content: `**RESUMEN DEL DÍA**\n\n${lista.join('\n') || 'Sin datos registrados'}`
      });
    }

  } catch (error) {
    console.error(error);
    interaction.reply({ content: 'Error.', ephemeral: true });
  }
});

client.login(TOKEN);
