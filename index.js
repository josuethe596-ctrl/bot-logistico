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
const ROL_STAFF_PRINCIPAL = '1465107741550051369';
const ROL_STAFF_STAFF = '1489732918124347544';

const DATA_FILE = './data.json';

// ===== CREAR JSON SI NO EXISTE =====
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}');
  console.log('data.json creado automáticamente');
}

// ===== DATA =====
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    console.log('JSON corrupto, reiniciando...');
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
    .setDescription('Ver terminos y condiciones de TS3'),

  new SlashCommandBuilder()
    .setName('siacepto')
    .setDescription('Aceptar terminos y recibir guia de instalacion TS3')
].map(c => c.toJSON());

// ===== REGISTRAR COMANDOS EN AMBOS SERVIDORES =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log('Bot iniciado correctamente');
  console.log('Registrando comandos...');

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_PRINCIPAL),
      { body: commands }
    );
    console.log('Comandos registrados en servidor PRINCIPAL');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_STAFF),
      { body: commands }
    );
    console.log('Comandos registrados en servidor STAFF');

  } catch (err) {
    console.error('ERROR REGISTRANDO COMANDOS:', err);
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

      // ===== RANKING PRINCIPAL - ESTILO LIMPIO VERDE OSCURO =====
      const lineasPrincipal = rankingOrdenado
        .map(([id, efectividades], index) => {
          const member = guildPrincipal?.members.cache.get(id);
          const nombre = member ? member.displayName || member.user.username : 'Usuario desconocido';
          const posicion = index + 1;
          const barra = '▬'.repeat(Math.min(Math.floor(efectividades / 5) + 1, 20));
          return `\`#${posicion.toString().padStart(2, '0')}\` ┃ **${nombre}** ${barra} ${efectividades}`;
        });

      const embedPrincipal = new EmbedBuilder()
        .setTitle('RANKING DE EFECTIVIDADES')
        .setColor(0x1B4332)
        .setDescription(
          '```ansi\n' +
          '\u001b[2;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n' +
          '```' +
          (lineasPrincipal.length > 0 
            ? '\n' + lineasPrincipal.join('\n') + '\n' 
            : '\nSin datos registrados\n') +
          '```ansi\n' +
          '\u001b[2;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n' +
          '```'
        )
        .addFields({
          name: ' ',
          value: `\`Actualizado: ${new Date().toLocaleDateString('es-ES')} | Por: ${interaction.user.username}\``,
          inline: false
        })
        .setFooter({ text: 'USMC - Sistema de Efectividades' });

      // ===== RANKING STAFF - ESTILO DETALLADO VERDE OSCURO =====
      const lineasStaff = rankingOrdenado
        .map(([id, efectividades], index) => {
          const memberPrincipal = guildPrincipal?.members.cache.get(id);
          const memberStaff = guildStaff?.members.cache.get(id);
          const nombre = memberPrincipal ? memberPrincipal.displayName || memberPrincipal.user.username : 'Usuario desconocido';
          const username = memberPrincipal?.user.username || 'N/A';
          const tag = memberPrincipal?.user.tag || 'N/A';
          const posicion = (index + 1).toString().padStart(2, '0');
          const porcentaje = rankingOrdenado.reduce((a, b) => a + b[1], 0) > 0 
            ? ((efectividades / rankingOrdenado.reduce((a, b) => a + b[1], 0)) * 100).toFixed(1) 
            : 0;
          const estado = memberStaff ? 'Sincronizado' : 'No presente';

          return `\`#${posicion}\` **${nombre}**\n` +
                 `\u001b[2;32m│\u001b[0m ID: \`${id}\`\n` +
                 `\u001b[2;32m│\u001b[0m Usuario: ${tag}\n` +
                 `\u001b[2;32m│\u001b[0m Efectividades: **${efectividades}** (${porcentaje}%)\n` +
                 `\u001b[2;32m│\u001b[0m Estado Staff: ${estado}`;
        });

      const totalEfectividades = rankingOrdenado.reduce((a, b) => a + b[1], 0);
      const promedio = rankingOrdenado.length > 0 ? (totalEfectividades / rankingOrdenado.length).toFixed(1) : 0;

      const embedStaff = new EmbedBuilder()
        .setTitle('RANKING DETALLADO - STAFF')
        .setColor(0x1B4332)
        .setDescription(
          '```ansi\n' +
          '\u001b[2;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n' +
          '```' +
          (lineasStaff.length > 0 
            ? '\n' + lineasStaff.join('\n\n') + '\n' 
            : '\nSin datos registrados\n') +
          '```ansi\n' +
          '\u001b[2;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n' +
          '```'
        )
        .addFields(
          {
            name: 'RESUMEN',
            value: 
              `\u001b[2;32m▸\u001b[0m Total participantes: **${rankingOrdenado.length}**\n` +
              `\u001b[2;32m▸\u001b[0m Total efectividades: **${totalEfectividades}**\n` +
              `\u001b[2;32m▸\u001b[0m Promedio: **${promedio}**\n` +
              `\u001b[2;32m▸\u001b[0m Ejecutado por: **${interaction.user.tag}**`,
            inline: false
          }
        )
        .setFooter({ text: 'USMC - Staff Logistico | Informacion confidencial' })
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
      if (enviadoPrincipal) mensajes.push('Enviado al canal principal');
      if (enviadoStaff) mensajes.push('Enviado al canal de Staff');
      if (!enviadoPrincipal) mensajes.push('No se pudo enviar al canal principal');
      if (!enviadoStaff) mensajes.push('No se pudo enviar al canal de Staff');

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
        content: 'Todas las efectividades han sido reiniciadas a 0. Empieza de nuevo.',
        ephemeral: true
      });
    }

    // ===== TS3 =====
    if (interaction.commandName === 'ts3') {
      const embed = new EmbedBuilder()
        .setTitle('Terminos y Condiciones - TS3')
        .setColor(0x1B4332)
        .setDescription(
          'Al aceptar la cuenta de TS3 estas obligado a seguir estos terminos y condiciones. Si llegas a romper estos mismos seras vetado de la faccion y estaras predispuesto a recibir consecuencias aun mayores.\n\n' +
          '• No compartir la cuenta a personas ajenas a la faccion.\n' +
          '• Prohibido hacer modificaciones sin previa autorizacion de los altos mandos logisticos.\n' +
          '• Cambiar la contrasena de la cuenta de correo electronico para beneficio propio.\n' +
          '• Perjudicar de cualquier manera haciendo uso de las herramientas otorgadas por el personal logistico a cualquier miembro de la faccion.\n\n' +
          'Aceptas los terminos y condiciones?\n' +
          'Escribe `/siacepto` para continuar.'
        )
        .setFooter({ text: 'USMC - Personal Logistico' });

      return interaction.reply({ embeds: [embed] });
    }

    // ===== SIACEPTO =====
    if (interaction.commandName === 'siacepto') {
      const embedInstalacion = new EmbedBuilder()
        .setTitle('Paso a paso para la instalacion del TS3 en Android')
        .setColor(0x1B4332)
        .setDescription(
          'Paso 1. Selecciona la opcion "continue without logging in" para iniciar en TS3 sin tener que loguear con tus datos.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029507519840257/IMG-20251112-WA0000.jpg');

      const embedPaso2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setDescription(
          'Paso 2. Busca la opcion para anadir un servidor, senalada en la imagen del paso 2.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029508036001873/IMG-20251112-WA0001.jpg');

      const embedPaso3 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setDescription(
          'Paso 3. Rellena los campos que aparecen en la imagen y sustituye con tus datos.\n\nListo!'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029508543512606/IMG-20251112-WA0003.jpg');

      const embedConfig = new EmbedBuilder()
        .setTitle('Configuracion TS3 Android')
        .setColor(0x1B4332)
        .setDescription(
          'Paso 1. Dirigete a ajustes.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035784434323496/IMG-20251112-WA0004.jpg');

      const embedConfig2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setDescription(
          'Paso 2. Activa las opciones marcadas en la imagen. Push to talk, superposicion de PTT y manos libres te ayudaran a tener una mejor experiencia al utilizar el TS3.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035784832651394/IMG-20251112-WA0005.jpg');

      const embedConfig3 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setDescription(
          'Paso 3. Desactiva la opcion sensor de proximidad mostrada en la imagen a continuacion.'
        )
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035785332031529/IMG-20251112-WA0006.jpg');

      const embedCuenta = new EmbedBuilder()
        .setTitle('Cuenta Junior Enlisted')
        .setColor(0x1B4332)
        .setDescription(
          'Correo:\n`KenwayHaytham005@gmail.com`\n\n' +
          'Contrasena:\n`USMCacceso1`\n\n' +
          'Recordatorio: Antes de comenzar a utilizar este beneficio otorgado por la faccion, recuerda que aceptas los terminos y condiciones previamente establecidos. En caso de compartir estos datos con terceros o realizar modificaciones no autorizadas, estaras sujeto a sanciones faccionarias y administrativas graves.'
        )
        .setFooter({ text: 'USMC - Personal Logistico | Uso exclusivo para miembros autorizados' });

      await interaction.reply({ content: `${interaction.user.username} ha aceptado los terminos y condiciones. Aqui tienes la guia completa:` });
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
