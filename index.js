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

// ===== GUILDS Y CANALES =====
const GUILD_PRINCIPAL = '1123790874741047356';
const GUILD_STAFF = '1464318287683780836';

const CANAL_PRINCIPAL = '1500533467166015638';
const CANAL_STAFF = '1500352253293498561';

// ===== ROLES STAFF =====
const ROL_STAFF_PRINCIPAL = '1465107741550051369';  // Rol staff en Discord 1 (principal)
const ROL_STAFF_STAFF = '1489732918124347544';       // Rol staff en Discord 2 (staff)

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
    .setDescription('Ver ranking (Solo Staff)'),

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

// ===== REGISTRAR COMANDOS EN AMBOS SERVIDORES =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log('✅ Bot iniciado correctamente');
  console.log('🔄 Registrando comandos...');

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_PRINCIPAL),
      { body: commands }
    );
    console.log('✅ Comandos registrados en servidor PRINCIPAL');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_STAFF),
      { body: commands }
    );
    console.log('✅ Comandos registrados en servidor STAFF');

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

      // Verificar rol según el servidor donde se ejecuta
      const rolRequerido = interaction.guildId === GUILD_PRINCIPAL ? ROL_STAFF_PRINCIPAL : ROL_STAFF_STAFF;

      if (!interaction.member.roles.cache.has(rolRequerido)) {
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

      // Verificar rol según el servidor donde se ejecuta
      const rolRequerido = interaction.guildId === GUILD_PRINCIPAL ? ROL_STAFF_PRINCIPAL : ROL_STAFF_STAFF;

      if (!interaction.member.roles.cache.has(rolRequerido)) {
        return interaction.reply({ content: 'No autorizado.', ephemeral: true });
      }

      const guildPrincipal = client.guilds.cache.get(GUILD_PRINCIPAL);
      const guildStaff = client.guilds.cache.get(GUILD_STAFF);

      const canalPrincipal = guildPrincipal?.channels.cache.get(CANAL_PRINCIPAL);
      const canalStaff = guildStaff?.channels.cache.get(CANAL_STAFF);

      const rankingOrdenado = Object.entries(data)
        .sort((a, b) => b[1] - a[1]);

      // ===== EMBED PARA SERVIDOR PRINCIPAL =====
      const listaPrincipal = rankingOrdenado
        .map(([id, efectividades], index) => {
          const member = guildPrincipal?.members.cache.get(id);
          const nombre = member ? member.displayName || member.user.username : 'Usuario desconocido';
          const medalla = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•';
          return `${medalla} **${nombre}** — ${efectividades} efectividades`;
        });

      const embedPrincipal = new EmbedBuilder()
        .setTitle('🏆 RANKING DE EFECTIVIDADES')
        .setColor(0xFFD700)
        .setDescription(listaPrincipal.join('\n') || 'Sin datos')
        .setFooter({ text: `Actualizado por ${interaction.user.username}` })
        .setTimestamp();

      // ===== EMBED PARA SERVIDOR STAFF =====
      const listaStaff = rankingOrdenado
        .map(([id, efectividades], index) => {
          const memberPrincipal = guildPrincipal?.members.cache.get(id);
          const memberStaff = guildStaff?.members.cache.get(id);
          const nombre = memberPrincipal ? memberPrincipal.displayName || memberPrincipal.user.username : 'Usuario desconocido';
          const userTag = memberPrincipal?.user.tag || 'N/A#0000';
          const medalla = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const estaEnStaff = memberStaff ? '✅' : '❌';

          return `${medalla} **${nombre}**\n` +
                 `├ Usuario: \`${userTag}\`\n` +
                 `├ ID: \`${id}\`\n` +
                 `├ Efectividades: **${efectividades}**\n` +
                 `└ En servidor Staff: ${estaEnStaff}`;
        });

      const embedStaff = new EmbedBuilder()
        .setTitle('🏆 RANKING DETALLADO - STAFF')
        .setColor(0xFF4500)
        .setDescription(listaStaff.join('\n\n') || 'Sin datos')
        .addFields(
          { name: '📊 Total de participantes', value: `${rankingOrdenado.length}`, inline: true },
          { name: '🔢 Total de efectividades', value: `${rankingOrdenado.reduce((a, b) => a + b[1], 0)}`, inline: true },
          { name: '👤 Ejecutado por', value: `${interaction.user.tag}`, inline: true }
        )
        .setFooter({ text: 'USMC - Staff Logístico' })
        .setTimestamp();

      // Enviar a ambos canales
      let enviadoPrincipal = false;
      let enviadoStaff = false;

      if (canalPrincipal && canalPrincipal.isTextBased()) {
        await canalPrincipal.send({ embeds: [embedPrincipal] });
        enviadoPrincipal = true;
      }

      if (canalStaff && canalStaff.isTextBased()) {
        await canalStaff.send({ embeds: [embedStaff] });
        enviadoStaff = true;
      }

      const mensajes = [];
      if (enviadoPrincipal) mensajes.push('✅ Enviado al canal principal');
      if (enviadoStaff) mensajes.push('✅ Enviado al canal de Staff');
      if (!enviadoPrincipal) mensajes.push('❌ No se pudo enviar al canal principal');
      if (!enviadoStaff) mensajes.push('❌ No se pudo enviar al canal de Staff');

      return interaction.reply({
        content: mensajes.join('\n'),
        ephemeral: true
      });
    }

    // ===== RESETS =====
    if (interaction.commandName === 'resets') {

      const rolRequerido = interaction.guildId === GUILD_PRINCIPAL ? ROL_STAFF_PRINCIPAL : ROL_STAFF_STAFF;

      if (!interaction.member.roles.cache.has(rolRequerido)) {
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

      return interaction.reply({ embeds: [embed] });
    }

    // ===== SIACEPTO =====
    if (interaction.commandName === 'siacepto') {
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

      const embedCuenta = new EmbedBuilder()
        .setTitle('🔐 Cuenta Junior Enlisted')
        .setColor(0x00FF00)
        .setDescription(
          '**Correo:**\n`KenwayHaytham005@gmail.com`\n\n' +
          '**Contraseña:**\n`USMCacceso1`\n\n' +
          '⚠️ **Recordatorio:** Antes de comenzar a utilizar este beneficio otorgado por la facción, recuerda que aceptas los **términos y condiciones** previamente establecidos. En caso de compartir estos datos con terceros o realizar modificaciones no autorizadas, estarás sujeto a sanciones faccionarias y administrativas graves.'
        )
        .setFooter({ text: 'USMC - Personal Logístico | Uso exclusivo para miembros autorizados' });

      await interaction.reply({ content: `✅ **${interaction.user.username}** ha aceptado los términos y condiciones. Aquí tienes la guía completa:` });
      await interaction.followUp({ embeds: [embedInstalacion] });
      await interaction.followUp({ embeds: [embedPaso2] });
      await interaction.followUp({ embeds: [embedPaso3] });
      await interaction.followUp({ embeds: [embedConfig] });
      await interaction.followUp({ embeds: [embedConfig2] });
      await interaction.followUp({ embeds: [embedConfig3] });
      await interaction.followUp({ embeds: [embedCuenta] });

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
