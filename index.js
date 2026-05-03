const express = require('express');
const app = express();

// KEEP ALIVE
app.get('/', (req, res) => {
  res.send('Bot activo');
});

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log('Web activa');
});

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// 🔑 CONFIG NUEVA
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1499918194209460275';
const GUILD_ID = '1123790874741047356';
const rolID = '1249140217663979622';

// 💰 PRECIOS
const precios = {
  m4: 20000,
  ak47: 3240,
  mp5: 2400,
  escopeta: 2400,
  deagle: 2400,
  tec9: 2000,
  uzi: 2000
};

// 📦 COMANDOS
const commands = [
  new SlashCommandBuilder()
    .setName('armamento')
    .setDescription('Ver catálogo de armamento USMC'),

  new SlashCommandBuilder()
    .setName('pago')
    .setDescription('Calcular total de armas')
    .addStringOption(option => option.setName('arma1').setDescription('Arma 1').setRequired(true))
    .addStringOption(option => option.setName('arma2').setDescription('Arma 2'))
    .addStringOption(option => option.setName('arma3').setDescription('Arma 3'))
    .addStringOption(option => option.setName('arma4').setDescription('Arma 4'))
    .addStringOption(option => option.setName('arma5').setDescription('Arma 5'))
].map(cmd => cmd.toJSON());

// 📡 REGISTRAR
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Comandos registrados');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`Bot listo como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // 🔒 Permiso por rol
  if (!interaction.member.roles.cache.has(rolID)) {
    return interaction.reply({ content: 'No tienes permiso', ephemeral: true });
  }

  // 📦 ARMAMENTO
  if (interaction.commandName === 'armamento') {

    const embed = new EmbedBuilder()
      .setTitle('Catálogo de Armamento - USMC')
      .setColor(0xffffff)
      .addFields(
        {
          name: 'M4',
          value: 'Disponible desde PVT oficial\nPrecio: $20.000'
        },
        {
          name: 'Armas disponibles',
          value:
            'AK-47 — $3.240\n' +
            'MP5 — $2.400\n' +
            'Escopeta — $2.400\n' +
            'Desert Eagle — $2.400\n' +
            'Tec-9 — $2.000\n' +
            'Uzi — $2.000'
        },
        {
          name: 'Packs',
          value:
            'Corto–Medio: Desert Eagle + Escopeta — $4.500\n' +
            'Medio I: MP5 + Escopeta — $4.400\n' +
            'Medio II: Tec-9 + Escopeta — $4.000\n' +
            'Medio III: Uzi + Escopeta — $4.000'
        },
        {
          name: 'Full Packs',
          value:
            'Full I: M4 + Desert Eagle + MP5 + Escopeta — $20.000\n' +
            'Full II: AK-47 + Desert Eagle + Tec-9 + Escopeta — $10.000'
        }
      );

    return interaction.reply({ embeds: [embed] });
  }

  // 💰 PAGO
  if (interaction.commandName === 'pago') {

    const armas = [
      interaction.options.getString('arma1'),
      interaction.options.getString('arma2'),
      interaction.options.getString('arma3'),
      interaction.options.getString('arma4'),
      interaction.options.getString('arma5')
    ];

    let total = 0;
    let usadas = [];

    for (let arma of armas) {
      if (!arma) continue;

      arma = arma.toLowerCase();

      if (precios[arma]) {
        total += precios[arma];
        usadas.push(arma);
      }
    }

    return interaction.reply(
      `Armas: ${usadas.join(', ')}\nTotal a pagar: $${total}\n\nDebes donar a la caja fuerte usando /donar y tomar captura y mandar comprobante de pago.`
    );
  }
});

client.login(TOKEN);
