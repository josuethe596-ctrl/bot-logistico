const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
    .setDescription('Reiniciar todas las efectividades a 0 (Solo Staff)'),

  new SlashCommandBuilder()
    .setName('ts3')
    .setDescription('Ver términos y condiciones de TS3'),

  new SlashCommandBuilder()
    .setName('siacepto')
    .setDescription('Aceptar términos y recibir guía de instalación TS3')
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

      for (const id in data) {
        data[id] = 0;
      }

      saveData(data);

      return interaction.reply({
        content: '✅ Todas las efectividades han sido reiniciadas a **0**. ¡Empieza de nuevo!',
        ephemeral: true
      });
    }

    // ===== TS3 =====
    if (interaction.commandName === 'ts3') {
      const embed = new EmbedBuilder()
        .setTitle('📋 Términos y Condiciones - TS3')
        .setColor(0xFF0000)
        .setDescription(
          'Al aceptar la cuenta de TS3 estás obligado a seguir estos términos y condiciones. Si llegas a romper estos mismos serás vetado de la facción y estarás predispuesto a recibir consecuencias aún mayores.\n\n' +
          '• No compartir la cuenta a personas ajenas a la facción.\n' +
          '• Prohibido hacer modificaciones sin previa autorización de los altos mandos logísticos.\n' +
          '• Cambiar la contraseña de la cuenta de correo electrónico para beneficio propio.\n' +
          '• Perjudicar de cualquier manera haciendo uso de las herramientas otorgadas por el personal logístico a cualquier miembro de la facción.\n\n' +
          '**¿Aceptas los términos y condiciones?**\n' +
          'Escribe `/siacepto` para continuar.'
        )
        .setFooter({ text: 'USMC - Personal Logístico' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== SIACEPTO =====
    if (interaction.commandName === 'siacepto') {
      // Paso a paso instalación
      const embedInstalacion = new EmbedBuilder()
        .setTitle('📱 Paso a paso para la instalación del TS3 en Android')
        .setColor(0x0099FF)
        .setDescription(
          '**Paso 1.** Selecciona la opción **"continue without logging in"** para iniciar en TS3 sin tener que loguear con tus datos.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029507519840257/IMG-20251112-WA0000.jpg');

      const embedPaso2 = new EmbedBuilder()
        .setColor(0x0099FF)
        .setDescription(
          '**Paso 2.** Busca la opción para añadir un servidor, señalada en la imagen del paso 2.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029508036001873/IMG-20251112-WA0001.jpg');

      const embedPaso3 = new EmbedBuilder()
        .setColor(0x0099FF)
        .setDescription(
          '**Paso 3.** Rellena los campos que aparecen en la imagen y sustituye con tus datos.\n\n¡Listo!'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029508543512606/IMG-20251112-WA0003.jpg');

      // Configuración TS3
      const embedConfig = new EmbedBuilder()
        .setTitle('⚙️ Configuración TS3 Android')
        .setColor(0xFFA500)
        .setDescription(
          '**Paso 1.** Dirígete a **ajustes**.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035784434323496/IMG-20251112-WA0004.jpg');

      const embedConfig2 = new EmbedBuilder()
        .setColor(0xFFA500)
        .setDescription(
          '**Paso 2.** Activa las opciones marcadas en la imagen. **Push to talk**, **superposición de PTT** y **manos libres** te ayudarán a tener una mejor experiencia al utilizar el TS3.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035784832651394/IMG-20251112-WA0005.jpg');

      const embedConfig3 = new EmbedBuilder()
        .setColor(0xFFA500)
        .setDescription(
          '**Paso 3.** Desactiva la opción **sensor de proximidad** mostrada en la imagen a continuación.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035785332031529/IMG-20251112-WA0006.jpg');

      // Cuenta
      const embedCuenta = new EmbedBuilder()
        .setTitle('🔐 Cuenta Junior Enlisted')
        .setColor(0x00FF00)
        .setDescription(
          '**Correo:**\n`KenwayHaytham005@gmail.com`\n\n' +
          '**Contraseña:**\n`USMCacceso1`\n\n' +
          '⚠️ **Recordatorio:** Antes de comenzar a utilizar este beneficio otorgado por la facción, recuerda que aceptas los **términos y condiciones** previamente establecidos. En caso de compartir estos datos con terceros o realizar modificaciones no autorizadas, estarás sujeto a sanciones faccionarias y administrativas graves.'
        )
        .setFooter({ text: 'USMC - Personal Logístico | Uso exclusivo para miembros autorizados' });

      // Enviar todos los embeds
      await interaction.reply({ content: '✅ Has aceptado los términos y condiciones. Aquí tienes la guía completa:', ephemeral: true });
      await interaction.followUp({ embeds: [embedInstalacion], ephemeral: true });
      await interaction.followUp({ embeds: [embedPaso2], ephemeral: true });
      await interaction.followUp({ embeds: [embedPaso3], ephemeral: true });
      await interaction.followUp({ embeds: [embedConfig], ephemeral: true });
      await interaction.followUp({ embeds: [embedConfig2], ephemeral: true });
      await interaction.followUp({ embeds: [embedConfig3], ephemeral: true });
      await interaction.followUp({ embeds: [embedCuenta], ephemeral: true });

      return;
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
