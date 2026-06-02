const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

// ===== PROTECCION ANTI-CRASH =====
process.on('uncaughtException', err => console.error('ERROR GLOBAL:', err));
process.on('unhandledRejection', err => console.error('PROMISE ERROR:', err));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== CONFIG =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1500333360344469524';

// ===== GUILDS Y CANALES =====
const GUILD_PRINCIPAL = '1123790874741047356';
const GUILD_STAFF = '1464318287683780836';

const CANAL_PRINCIPAL = '1500533467166015638';
const CANAL_STAFF = '1500352253293498561';
const CANAL_FIN_DIA = '1499930571785375744';

// Hilo de foro para tickets
const HILO_TICKETS = '1501741776933879859';

// Hilo de foro para logs de comandos
const HILO_LOGS = '1511440920233382049';

// ===== ROLES POR PERMISO =====
const ROLES_STAFF = ['1249089576270696508', '1249089640632422470'];
const ROL_USUARIO = '1249089172308885576';
const ROL_ESPECIAL = '1249095569150836781';

// Roles para /rolests3
const ROLES_ROLESTS3 = ['1499828342499573970', '1467162969774227713'];

// Roles para /res y /resta
const ROLES_RES = ['1499828342499573970', '1467162969774227713'];

const DATA_FILE = './data.json';
const TICKETS_FILE = './tickets.json';
const PERMISOS_FILE = './permisos.json';

// ===== CREAR JSON SI NO EXISTE =====
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}');
  console.log('data.json creado automaticamente');
}

if (!fs.existsSync(TICKETS_FILE)) {
  fs.writeFileSync(TICKETS_FILE, '{}');
  console.log('tickets.json creado automaticamente');
}

if (!fs.existsSync(PERMISOS_FILE)) {
  fs.writeFileSync(PERMISOS_FILE, '{}');
  console.log('permisos.json creado automaticamente');
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

function loadTickets() {
  try {
    return JSON.parse(fs.readFileSync(TICKETS_FILE));
  } catch {
    console.log('tickets.json corrupto, reiniciando...');
    fs.writeFileSync(TICKETS_FILE, '{}');
    return {};
  }
}

function saveTickets(data) {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2));
}

function loadPermisos() {
  try {
    return JSON.parse(fs.readFileSync(PERMISOS_FILE));
  } catch {
    console.log('permisos.json corrupto, reiniciando...');
    fs.writeFileSync(PERMISOS_FILE, '{}');
    return {};
  }
}

function savePermisos(data) {
  fs.writeFileSync(PERMISOS_FILE, JSON.stringify(data, null, 2));
}

// ===== FUNCIONES DE VERIFICACION =====
function tieneAlgunRol(member, rolesArray) {
  return rolesArray.some(rolId => member.roles.cache.has(rolId));
}

// ===== VERIFICAR SI USUARIO TIENE PERMISO PARA COMANDO STAFF =====
function tienePermisoStaff(member, commandName) {
  const comandosStaff = ['agregar', 'quitar', 'tablero', 'resets'];

  if (!comandosStaff.includes(commandName)) return true;

  if (tieneAlgunRol(member, ROLES_STAFF)) return true;

  if (tieneAlgunRol(member, [ROL_ESPECIAL])) return true;

  const permisos = loadPermisos();
  const userId = member.user.id;

  if (permisos[userId] && permisos[userId].includes(commandName)) return true;

  return false;
}

// ===== FUNCION PARA OBTENER RANGO DE UN MIEMBRO =====
function obtenerRango(member) {
  const rangos = ['COL', 'MAJ', 'CPT', 'LT', 'WO-1', 'WO-2', 'WO-3', 'SPC', 'SGT', 'CPL', 'LCPL', 'PFC', 'PVT'];

  for (const rango of rangos) {
    const rolRango = member.roles.cache.find(r => 
      r.name.toUpperCase().includes(rango) || r.name.toUpperCase().startsWith(rango)
    );
    if (rolRango) {
      return rango;
    }
  }
  return 'PVT';
}

// ===== FUNCION PARA OBTENER NOMBRE DE DISPLAY =====
function obtenerNombreDisplay(member) {
  if (member && member.displayName) {
    return member.displayName;
  }
  if (member && member.user) {
    return member.user.username;
  }
  return 'Desconocido';
}

// ===== FUNCION PARA OBTENER CANAL/HILO CON SOPORTE FORO =====
async function obtenerCanal(channelId) {
  try {
    let canal = await client.channels.fetch(channelId, { force: true });

    if (canal && canal.isThread && canal.isThread()) {
      if (canal.archived) {
        try {
          await canal.setArchived(false);
          console.log(`Hilo ${channelId} desarchivado automaticamente`);
        } catch (archiveErr) {
          console.warn(`No se pudo desarchivar hilo ${channelId}:`, archiveErr.message);
        }
      }
    }

    return canal;
  } catch (err) {
    console.error(`Error al obtener canal/hilo ${channelId}:`, err.message);
    return null;
  }
}

// ===== FUNCION PARA LOGS DE COMANDOS =====
async function enviarLog(interaction, comando, detalles = '') {
  try {
    const hiloLogs = await obtenerCanal(HILO_LOGS);
    if (!hiloLogs || !hiloLogs.isTextBased()) {
      console.log('Hilo de logs no disponible');
      return;
    }

    const fechaHora = new Date().toLocaleString('es-ES', { 
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const member = interaction.member;
    const rango = member ? obtenerRango(member) : 'PVT';
    const nombre = member ? obtenerNombreDisplay(member) : interaction.user.username;
    const userId = interaction.user.id;
    const canalNombre = interaction.channel?.name || 'DM';
    const canalId = interaction.channelId || 'N/A';

    let logMensaje = `> **\`[${fechaHora}]\`**\n`;
    logMensaje += `> **Comando:** /${comando}\n`;
    logMensaje += `> **Usuario:** ${nombre} (\`${userId}\`)\n`;
    logMensaje += `> **Rango:** ${rango}\n`;
    logMensaje += `> **Canal:** #${canalNombre} (\`${canalId}\`)\n`;
    if (detalles) {
      logMensaje += `> **Detalles:** ${detalles}\n`;
    }
    logMensaje += `> ─────────────────────────────`;

    await hiloLogs.send(logMensaje);
  } catch (err) {
    console.error('Error enviando log:', err.message);
  }
}

// ===== FUNCION PARA ENVIAR TABLERO AUTOMATICO =====
async function enviarTableroAutomatico() {
  const data = loadData();

  const guildPrincipal = client.guilds.cache.get(GUILD_PRINCIPAL);
  const guildStaff = client.guilds.cache.get(GUILD_STAFF);

  const canalPrincipal = guildPrincipal?.channels.cache.get(CANAL_PRINCIPAL);
  const canalStaff = guildStaff?.channels.cache.get(CANAL_STAFF);
  const canalFinDia = guildPrincipal?.channels.cache.get(CANAL_FIN_DIA);

  if (!canalPrincipal || !canalStaff) {
    console.log('Canales no disponibles para envio automatico');
    return;
  }

  const rankingOrdenado = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const fechaNY = new Date().toLocaleDateString('es-ES', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (canalFinDia && canalFinDia.isTextBased()) {
    const embedFinDia = new EmbedBuilder()
      .setColor(0x8B0000)
      .setDescription(`Fin del dia ${fechaNY}`);

    await canalFinDia.send({ embeds: [embedFinDia] });
  }

  // ===== TABLERO PRINCIPAL - SOLO NOMBRE DE DISPLAY =====
  const lineasPrincipal = rankingOrdenado.map(([id, efectividades]) => {
    const member = guildPrincipal?.members.cache.get(id);
    const nombre = member ? obtenerNombreDisplay(member) : 'Desconocido';
    return `> **${nombre}** — ${efectividades} Efectividades`;
  });

  const mensajePrincipal = `**\`\`EFECTIVIDADES DEL DIA\`\`**

${lineasPrincipal.join('\n') || '> Sin registros disponibles'}`;
  await canalPrincipal.send(mensajePrincipal);

  // ===== TABLERO STAFF - INFORME DETALLADO =====
  const totalEfectividades = rankingOrdenado.reduce((a, b) => a + b[1], 0);
  const promedio = rankingOrdenado.length > 0 ? (totalEfectividades / rankingOrdenado.length).toFixed(1) : 0;

  const lineasStaff = rankingOrdenado.map(([id, efectividades], index) => {
    const memberPrincipal = guildPrincipal?.members.cache.get(id);
    const memberStaff = guildStaff?.members.cache.get(id);
    const nombre = memberPrincipal ? obtenerNombreDisplay(memberPrincipal) : 'Desconocido';
    const posicion = (index + 1).toString().padStart(2, '0');
    const porcentaje = totalEfectividades > 0 ? ((efectividades / totalEfectividades) * 100).toFixed(1) : 0;
    const sincronizacion = memberStaff ? 'Activo' : 'Inactivo';

    return ` \`${posicion}\` **${nombre}**\nEfectividades: \`${efectividades}\` | Porcentaje: \`${porcentaje}%\` | Staff: \`${sincronizacion}\``;
  });

  const mensajeStaff = `**\`\`INFORME DETALLADO DE EFECTIVIDADES - STAFF\`\`**\n\n**Fecha:** ${fechaNY}\n**Total de efectividades:** \`${totalEfectividades}\`\n**Promedio por miembro:** \`${promedio}\`\n**Participantes:** \`${rankingOrdenado.length}\`\n\n${lineasStaff.join('\n\n') || '> Sin registros disponibles'}\n\n> *Informacion confidencial - Solo personal autorizado*`;
  await canalStaff.send(mensajeStaff);

  console.log('Tablero automatico enviado: ' + fechaNY);
}

// ===== SISTEMA DE HORARIO AUTOMATICO =====
function iniciarHorarioAutomatico() {
  setInterval(() => {
    const ahora = new Date();
    const opciones = { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false };
    const horaNY = ahora.toLocaleString('en-US', opciones);

    if (horaNY === '00:00') {
      enviarTableroAutomatico();
    }
  }, 60000);

  console.log('Sistema de horario automatico activado. Verificando hora NY cada minuto.');
}

// ===== COMANDOS =====
const commands = [
  new SlashCommandBuilder()
    .setName('agregar')
    .setDescription('Agregar efectividades a un usuario')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a agregar').setRequired(true)),

  new SlashCommandBuilder()
    .setName('quitar')
    .setDescription('Quitar efectividades a un usuario')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a quitar').setRequired(true)),

  new SlashCommandBuilder()
    .setName('mep')
    .setDescription('Consultar tus efectividades actuales'),

  new SlashCommandBuilder()
    .setName('tablero')
    .setDescription('Publicar ranking en canales designados'),

  new SlashCommandBuilder()
    .setName('resets')
    .setDescription('Reiniciar todas las efectividades a cero'),

  new SlashCommandBuilder()
    .setName('permisos')
    .setDescription('Gestionar permisos de comandos staff para usuarios')
    .addSubcommand(sub =>
      sub.setName('dar')
        .setDescription('Dar permiso a un usuario para usar un comando staff')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a dar permiso').setRequired(true))
        .addStringOption(o => o.setName('comando')
          .setDescription('Comando al que dar permiso')
          .setRequired(true)
          .addChoices(
            { name: '/agregar', value: 'agregar' },
            { name: '/quitar', value: 'quitar' },
            { name: '/tablero', value: 'tablero' },
            { name: '/resets', value: 'resets' }
          )))
    .addSubcommand(sub =>
      sub.setName('quitar')
        .setDescription('Quitar permiso a un usuario para usar un comando staff')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a quitar permiso').setRequired(true))
        .addStringOption(o => o.setName('comando')
          .setDescription('Comando al que quitar permiso')
          .setRequired(true)
          .addChoices(
            { name: '/agregar', value: 'agregar' },
            { name: '/quitar', value: 'quitar' },
            { name: '/tablero', value: 'tablero' },
            { name: '/resets', value: 'resets' }
          )))
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Ver permisos de un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(true))),

  new SlashCommandBuilder()
    .setName('ts3')
    .setDescription('Terminos y condiciones de TS3'),

  new SlashCommandBuilder()
    .setName('ts3pc')
    .setDescription('Guia de instalacion TS3 para PC'),

  new SlashCommandBuilder()
    .setName('android')
    .setDescription('Macros y archivo monetloader para Android'),

  new SlashCommandBuilder()
    .setName('pc')
    .setDescription('Macros actualizadas y guia para PC'),

  new SlashCommandBuilder()
    .setName('siacepto')
    .setDescription('Aceptar terminos y recibir guia TS3 Android'),

  new SlashCommandBuilder()
    .setName('rolests3')
    .setDescription('Tutorial basico de TS3'),

  new SlashCommandBuilder()
    .setName('res')
    .setDescription('Agregar punto por ticket atendido')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario que atendio el ticket').setRequired(true)),

  new SlashCommandBuilder()
    .setName('resta')
    .setDescription('Mostrar tablero de puntos de tickets')
].map(c => c.toJSON());

// ===== REGISTRAR COMANDOS =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log('Bot iniciado correctamente');
  console.log('Registrando comandos...');

  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_PRINCIPAL), { body: commands });
    console.log('Comandos registrados en servidor PRINCIPAL');

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_STAFF), { body: commands });
    console.log('Comandos registrados en servidor STAFF');

    iniciarHorarioAutomatico();

  } catch (err) {
    console.error('ERROR REGISTRANDO COMANDOS:', err);
  }
});

// ===== INTERACCIONES =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = loadData();
  const ticketsData = loadTickets();
  const permisos = loadPermisos();
  const userId = interaction.user.id;

  try {

    // ===== AGREGAR =====
    if (interaction.commandName === 'agregar') {
      if (!tienePermisoStaff(interaction.member, 'agregar')) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const usuario = interaction.options.getUser('usuario');
      const cantidad = interaction.options.getInteger('cantidad');

      if (cantidad <= 0) {
        return interaction.reply({ content: 'La cantidad debe ser mayor a cero.', ephemeral: true });
      }

      if (!data[usuario.id]) data[usuario.id] = 0;
      data[usuario.id] += cantidad;
      saveData(data);

      const member = interaction.guild?.members.cache.get(usuario.id);
      const nombreDisplay = obtenerNombreDisplay(member) || usuario.username;

      await enviarLog(interaction, 'agregar', `Agrego ${cantidad} efectividades a ${nombreDisplay} (${usuario.id}). Total: ${data[usuario.id]}`);

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('EFECTIVIDADES AGREGADAS')
        .setDescription(`Se agregaron **${cantidad}** efectividades a **${nombreDisplay}**.\nTotal actual: **${data[usuario.id]}**`);

      return interaction.reply({ embeds: [embed] });
    }

    // ===== QUITAR =====
    if (interaction.commandName === 'quitar') {
      if (!tienePermisoStaff(interaction.member, 'quitar')) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const usuario = interaction.options.getUser('usuario');
      const cantidad = interaction.options.getInteger('cantidad');

      if (cantidad <= 0) {
        return interaction.reply({ content: 'La cantidad debe ser mayor a cero.', ephemeral: true });
      }

      if (!data[usuario.id]) data[usuario.id] = 0;
      data[usuario.id] -= cantidad;
      if (data[usuario.id] < 0) data[usuario.id] = 0;
      saveData(data);

      const member = interaction.guild?.members.cache.get(usuario.id);
      const nombreDisplay = obtenerNombreDisplay(member) || usuario.username;

      await enviarLog(interaction, 'quitar', `Quito ${cantidad} efectividades a ${nombreDisplay} (${usuario.id}). Total: ${data[usuario.id]}`);

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('EFECTIVIDADES RETIRADAS')
        .setDescription(`Se retiraron **${cantidad}** efectividades a **${nombreDisplay}**.\nTotal actual: **${data[usuario.id]}**`);

      return interaction.reply({ embeds: [embed] });
    }

    // ===== MEP =====
    if (interaction.commandName === 'mep') {
      if (!interaction.member.roles.cache.has(ROL_USUARIO)) {
        return interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
      }

      const efectividades = data[userId] || 0;

      await enviarLog(interaction, 'mep', `Consulto sus efectividades: ${efectividades}`);

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('CONSULTA DE EFECTIVIDADES')
        .setDescription(`**Usuario:** ${interaction.user.username}\n**Efectividades actuales:** ${efectividades}`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== TABLERO =====
    if (interaction.commandName === 'tablero') {
      if (!tienePermisoStaff(interaction.member, 'tablero')) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const guildPrincipal = client.guilds.cache.get(GUILD_PRINCIPAL);
      const guildStaff = client.guilds.cache.get(GUILD_STAFF);

      const canalPrincipal = guildPrincipal?.channels.cache.get(CANAL_PRINCIPAL);
      const canalStaff = guildStaff?.channels.cache.get(CANAL_STAFF);

      const rankingOrdenado = Object.entries(data).sort((a, b) => b[1] - a[1]);
      const fechaHoy = new Date().toLocaleDateString('es-ES', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      // ===== TABLERO PRINCIPAL - SOLO NOMBRE DE DISPLAY =====
      const lineasPrincipal = rankingOrdenado.map(([id, efectividades]) => {
        const member = guildPrincipal?.members.cache.get(id);
        const nombre = member ? obtenerNombreDisplay(member) : 'Desconocido';
        return `> **${nombre}** — ${efectividades} Efectividades`;
      });

      const mensajePrincipal = `**\`\`EFECTIVIDADES DEL DIA\`\`**\n\n${lineasPrincipal.join('\n') || '> Sin registros disponibles'}`;

      // ===== TABLERO STAFF - INFORME DETALLADO =====
      const totalEfectividades = rankingOrdenado.reduce((a, b) => a + b[1], 0);
      const promedio = rankingOrdenado.length > 0 ? (totalEfectividades / rankingOrdenado.length).toFixed(1) : 0;

      const lineasStaff = rankingOrdenado.map(([id, efectividades], index) => {
        const memberPrincipal = guildPrincipal?.members.cache.get(id);
        const memberStaff = guildStaff?.members.cache.get(id);
        const nombre = memberPrincipal ? obtenerNombreDisplay(memberPrincipal) : 'Desconocido';
        const posicion = (index + 1).toString().padStart(2, '0');
        const porcentaje = totalEfectividades > 0 ? ((efectividades / totalEfectividades) * 100).toFixed(1) : 0;
        const sincronizacion = memberStaff ? 'Activo' : 'Inactivo';

        return ` \`${posicion}\` **${nombre}**\nEfectividades: \`${efectividades}\` | Porcentaje: \`${porcentaje}%\` | Staff: \`${sincronizacion}\``;
      });

      const mensajeStaff = `**\`\`INFORME DETALLADO DE EFECTIVIDADES - STAFF\`\`**\n\n**Fecha:** ${fechaHoy}\n**Total de efectividades:** \`${totalEfectividades}\`\n**Promedio por miembro:** \`${promedio}\`\n**Participantes:** \`${rankingOrdenado.length}\`\n\n${lineasStaff.join('\n\n') || '> Sin registros disponibles'}\n\n> *Informacion confidencial - Solo personal autorizado*`;

      let enviadoPrincipal = false;
      let enviadoStaff = false;

      if (canalPrincipal && canalPrincipal.isTextBased()) {
        await canalPrincipal.send(mensajePrincipal);
        enviadoPrincipal = true;
      }

      if (canalStaff && canalStaff.isTextBased()) {
        await canalStaff.send(mensajeStaff);
        enviadoStaff = true;
      }

      const mensajes = [];
      if (enviadoPrincipal) mensajes.push('Tablero publicado en canal principal');
      if (enviadoStaff) mensajes.push('Tablero publicado en canal de Staff');
      if (!enviadoPrincipal) mensajes.push('Fallo al publicar en canal principal');
      if (!enviadoStaff) mensajes.push('Fallo al publicar en canal de Staff');

      await enviarLog(interaction, 'tablero', `Publico tablero. Principal: ${enviadoPrincipal ? 'OK' : 'FALLO'} | Staff: ${enviadoStaff ? 'OK' : 'FALLO'}`);

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('TABLERO PUBLICADO')
        .setDescription(mensajes.join('\n'));

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== RESETS =====
    if (interaction.commandName === 'resets') {
      if (!tienePermisoStaff(interaction.member, 'resets')) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      for (const id in data) {
        data[id] = 0;
      }

      saveData(data);

      await enviarLog(interaction, 'resets', 'Reinicio todas las efectividades a cero');

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('REINICIO COMPLETADO')
        .setDescription('Todos los registros han sido restablecidos a cero. El sistema esta listo para nueva acumulacion.');

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== PERMISOS =====
    if (interaction.commandName === 'permisos') {
      if (!tieneAlgunRol(interaction.member, ROLES_STAFF)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para STAFF.', ephemeral: true });
      }

      const subcommand = interaction.options.getSubcommand();
      const usuario = interaction.options.getUser('usuario');
      const comando = interaction.options.getString('comando');

      const memberUsuario = interaction.guild?.members.cache.get(usuario.id);
      const nombreUsuario = obtenerNombreDisplay(memberUsuario) || usuario.username;

      if (subcommand === 'dar') {
        if (!permisos[usuario.id]) permisos[usuario.id] = [];

        if (permisos[usuario.id].includes(comando)) {
          return interaction.reply({ content: `${nombreUsuario} ya tiene permiso para usar /${comando}.`, ephemeral: true });
        }

        permisos[usuario.id].push(comando);
        savePermisos(permisos);

        await enviarLog(interaction, 'permisos', `Dio permiso a ${nombreUsuario} (${usuario.id}) para usar /${comando}`);

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('PERMISO OTORGADO')
          .setDescription(`Se otorgo permiso a **${nombreUsuario}** para usar **/${comando}**.`);

        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === 'quitar') {
        if (!permisos[usuario.id] || !permisos[usuario.id].includes(comando)) {
          return interaction.reply({ content: `${nombreUsuario} no tiene permiso para usar /${comando}.`, ephemeral: true });
        }

        permisos[usuario.id] = permisos[usuario.id].filter(c => c !== comando);
        if (permisos[usuario.id].length === 0) delete permisos[usuario.id];
        savePermisos(permisos);

        await enviarLog(interaction, 'permisos', `Quito permiso a ${nombreUsuario} (${usuario.id}) para usar /${comando}`);

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('PERMISO REVOCADO')
          .setDescription(`Se revoco el permiso a **${nombreUsuario}** para usar **/${comando}**.`);

        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === 'ver') {
        const permisosUsuario = permisos[usuario.id] || [];

        let descripcion;
        if (permisosUsuario.length === 0) {
          descripcion = `**${nombreUsuario}** no tiene permisos personalizados.`;
        } else {
          descripcion = `**${nombreUsuario}** tiene permiso para usar:\n` + permisosUsuario.map(c => `- **/${c}**`).join('\n');
        }

        const embed = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('PERMISOS DE USUARIO')
          .setDescription(descripcion);

        return interaction.reply({ embeds: [embed] });
      }
    }

    // ===== TS3 =====
    if (interaction.commandName === 'ts3') {
      if (!interaction.member.roles.cache.has(ROL_ESPECIAL)) {
        return interaction.reply({ content: 'No tienes permiso para acceder a esta informacion.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('TERMINOS Y CONDICIONES - TS3')
        .setDescription(
          'Al aceptar la cuenta de TS3 estas obligado a seguir estos terminos y condiciones. El incumplimiento resultara en veto de la faccion y posibles sanciones adicionales.\n\n' +
          '**Restricciones:**\n' +
          '- No compartir la cuenta con personas externas a la faccion\n' +
          '- No realizar modificaciones sin autorizacion de alto mando logistico\n' +
          '- No cambiar la contrasena del correo asociado para beneficio propio\n' +
          '- No utilizar las herramientas para perjudicar a miembros de la faccion\n\n' +
          'Para continuar escribe **/siacepto**'
        );

      await enviarLog(interaction, 'ts3', 'Consulto terminos y condiciones TS3');

      return interaction.reply({ embeds: [embed] });
    }

    // ===== TS3 PC =====
    if (interaction.commandName === 'ts3pc') {
      if (!interaction.member.roles.cache.has(ROL_ESPECIAL)) {
        return interaction.reply({ content: 'No tienes permiso para acceder a esta informacion.', ephemeral: true });
      }

      const embedDescarga = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('DESCARGA DE TS3 PARA PC')
        .setDescription('https://www.teamspeak.com/en/downloads/#ts3client');

      const embedGuia1 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('PROCESO DE REGISTRO - IMAGEN 1')
        .setImage('https://images-ext-1.discordapp.net/external/hKs4ua6_y46K-SJdjgSS2beO6PT21-musbkcZCRHPDE/https/cdn.nekotina.com/guilds/1203420760467832923/3bf1e200-4d80-4ad2-acfc-eb7ba57315b0.jpg?format=webp');

      const embedGuia2 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('PROCESO DE REGISTRO - IMAGEN 2')
        .setImage('https://images-ext-1.discordapp.net/external/C2p2PuAsqPDnkCwLX6CizbYAx8x5_9V-Reex7aAFyxQ/https/cdn.nekotina.com/guilds/1203420760467832923/1ca176e1-a55a-4294-b290-307fbef8c4fc.jpg?format=webp');

      const embedPaso1 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('CONFIGURACION: HERRAMIENTAS > OPCIONES')
        .setImage('https://media.discordapp.net/attachments/1481019380103119081/1481021781086306457/TeamSpeak_3_30_09_2025_17_15_54.png?ex=69f8fd84&is=69f7ac04&hm=2909c47dd36047995750173867867b4828bccdfd943d82cafa111b22756b385b&=&format=webp&quality=lossless');

      const embedPaso2 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('CONFIGURACION: ASIGNAR TECLA PARA HABLAR')
        .setImage('https://media.discordapp.net/attachments/1481019380103119081/1481021815357968427/TeamSpeak_3_30_09_2025_17_17_39.png?ex=69f8fd8c&is=69f7ac0c&hm=31c2d4baf74e2a426f1531662cb3df725573c10b8dda90a8a2733c03ee8beb12&=&format=webp&quality=lossless');

      await interaction.reply({ content: 'Guia de instalacion TS3 para PC:', embeds: [embedDescarga] });
      await interaction.followUp({ embeds: [embedGuia1] });
      await interaction.followUp({ embeds: [embedGuia2] });
      await interaction.followUp({ embeds: [embedPaso1] });
      await interaction.followUp({ embeds: [embedPaso2] });

      await enviarLog(interaction, 'ts3pc', 'Consulto guia de instalacion TS3 para PC');

      return;
    }

    // ===== ANDROID =====
    if (interaction.commandName === 'android') {
      if (!interaction.member.roles.cache.has(ROL_ESPECIAL)) {
        return interaction.reply({ content: 'No tienes permiso para acceder a esta informacion.', ephemeral: true });
      }

      const embedPrincipal = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('MACROS-ANDROID')
        .setDescription(
          'A continuacion se te presentan 20 macros diferentes, con roles completos, para cualquier tipo de situaciones en patrullajes.\n\n' +
          'Explorador de archivos usado en el video: https://play.google.com/store/apps/details?id=ru.zdevs.zarchiver\n\n' +
          'Se te presenta el archivo (macros) compatible con cualquier tipo de version de Android.'
        );

      const embedNota1 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('NOTA 1')
        .setDescription('Una vez aplicado el mas macros activar el apartado: (Monetloader) tener activado antes de descargar y colocar dicho archivo.');

      const embedNota2 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('NOTA 2')
        .setDescription('Antes de colocar dichas macros asegurarse de no tener otro archivo monetloader, en uso, pues este archivo contiene para poder crashear el APK para evitar el uso de cheats o ventajas que te de otro archivo monetloader.');

      const embedNota3 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('NOTA 3')
        .setDescription('Para agregar macros puedes usar el comando (/cmdhm) y con este mismo se habren dicho apartados para agregar hasta 45 tipos de macros diferentes.');

      const embedNota4 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('NOTA 4')
        .setDescription('Las macros o el archivo monetloader ya tiene un sistema de renderizado, FOV y el aspect ratio este ultimo sirve para estirar la pantalla no se recomienda estirar mucho ya que se bajaran tus posibilidades de abrir fuegos contra ciudadanos en dicho caso.');

      const embedVideo = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('VIDEO EXPLICATIVO DE COMO SE PONEN EN ANDROID')
        .setDescription('https://youtube.com/shorts/bU0KblaBXOM?feature=share');

      const embedArchivo = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('ARCHIVO NECESARIO')
        .setDescription('https://www.mediafire.com/file/2hypm27ga94jo46/monetloader+(1).7z/file');

      await interaction.reply({ content: 'Paquete de macros para Android:', embeds: [embedPrincipal] });
      await interaction.followUp({ embeds: [embedNota1] });
      await interaction.followUp({ embeds: [embedNota2] });
      await interaction.followUp({ embeds: [embedNota3] });
      await interaction.followUp({ embeds: [embedNota4] });
      await interaction.followUp({ embeds: [embedVideo] });
      await interaction.followUp({ embeds: [embedArchivo] });

      await enviarLog(interaction, 'android', 'Consulto recursos de macros para Android');

      return;
    }

    // ===== PC =====
    if (interaction.commandName === 'pc') {
      if (!interaction.member.roles.cache.has(ROL_ESPECIAL)) {
        return interaction.reply({ content: 'No tienes permiso para acceder a esta informacion.', ephemeral: true });
      }

      const embedMacros = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('MACROS ACTUALIZADAS PARA PC')
        .setDescription('https://www.mediafire.com/file/u8q6bferz6igasf/Macros_USMC_Logistica_v9.pdf/file');

      const embedArchivo = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('ARCHIVO DE ROLES Y MACROS')
        .setDescription('https://www.mediafire.com/file/ysctncbpyxum385/LUA_Macros_V2.zip/file');

      const embedTutorial = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('TUTORIAL DE INSTALACION')
        .setDescription('https://youtu.be/NLNJ3AZ-X2Y');

      const embedVideo = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('VIDEO EXPLICATIVO - MACROS EN EL JUEGO')
        .setDescription('https://youtu.be/6yEqI8ML4eY');

      await interaction.reply({ content: 'Recursos para PC:', embeds: [embedMacros] });
      await interaction.followUp({ embeds: [embedArchivo] });
      await interaction.followUp({ embeds: [embedTutorial] });
      await interaction.followUp({ embeds: [embedVideo] });

      await enviarLog(interaction, 'pc', 'Consulto recursos de macros para PC');

      return;
    }

    // ===== ROLESTS3 =====
    if (interaction.commandName === 'rolests3') {
      if (!tieneAlgunRol(interaction.member, ROLES_ROLESTS3)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const embed1 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('TUTORIAL BASICO')
        .setDescription(
          '1. Ingresar a ts.newgamers.es, al conectarse exitosamente el Bot te enviara un MD pidiendo que te autentifiques.'
        )
        .setImage('https://media.discordapp.net/attachments/864728647151648778/1495585827789733898/image.png?ex=69fc8917&is=69fb3797&hm=aeadb9c244c77f574018b969e64920c18fb3c2b2c9d9be13d67b0824d210abec&=&format=webp&quality=lossless');

      const embed2 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription(
          '2. Entra a https://discord.com/channels/864709717979562014/864728343088988171 y utiliza /autentificar, copia ese codigo, lo necesitaras pronto.'
        )
        .setImage('https://media.discordapp.net/attachments/864728647151648778/1495586127204319242/image.png?ex=69fc895f&is=69fb37df&hm=e00b4c834041570efe5ea0fcffd026e4a8d3e8bc4430ef4509903c9390746f16&=&format=webp&quality=lossless');

      const embed3 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription(
          '3. Pega ese codigo al MD del Bot, fin del tutorial; simplemente ponte a patrullar en los canales correspondiente a tu faccion.'
        )
        .setImage('https://media.discordapp.net/attachments/864728647151648778/1495586281906769960/image.png?ex=69fc8984&is=69fb3804&hm=bf6e6e4cece85a0eae018d7848134e6b188ed7b47e33e5f3eff9890e7f689ebf&=&format=webp&quality=lossless');

      await interaction.reply({ embeds: [embed1] });
      await interaction.followUp({ embeds: [embed2] });
      await interaction.followUp({ embeds: [embed3] });

      await enviarLog(interaction, 'rolests3', 'Consulto tutorial basico de TS3');

      return;
    }

    // ===== RES =====
    if (interaction.commandName === 'res') {
      if (!tieneAlgunRol(interaction.member, ROLES_RES)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const usuario = interaction.options.getUser('usuario');

      if (!ticketsData[usuario.id]) ticketsData[usuario.id] = 0;
      ticketsData[usuario.id] += 1;
      saveTickets(ticketsData);

      const member = interaction.guild?.members.cache.get(usuario.id);
      const nombreDisplay = obtenerNombreDisplay(member) || usuario.username;

      const hiloTickets = await obtenerCanal(HILO_TICKETS);

      if (hiloTickets && hiloTickets.isTextBased()) {
        const embedRegistro = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('REGISTRO DE TICKET')
          .setDescription(
            `**Usuario:** ${nombreDisplay}\n` +
            `**Atendido por:** ${obtenerNombreDisplay(interaction.member)}\n` +
            `**Puntos totales:** ${ticketsData[usuario.id]}\n` +
            `**Fecha:** ${new Date().toLocaleDateString('es-ES', { timeZone: 'America/New_York' })}`
          );

        await hiloTickets.send({ embeds: [embedRegistro] });
      }

      await enviarLog(interaction, 'res', `Agrego 1 punto a ${nombreDisplay} (${usuario.id}) por ticket atendido. Total: ${ticketsData[usuario.id]}`);

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('PUNTO AGREGADO')
        .setDescription(`Se agrego **1 punto** a **${nombreDisplay}** por ticket atendido.\nTotal: **${ticketsData[usuario.id]}**`);

      return interaction.reply({ embeds: [embed] });
    }

    // ===== RESTA =====
    if (interaction.commandName === 'resta') {
      if (!tieneAlgunRol(interaction.member, ROLES_RES)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const guildPrincipal = client.guilds.cache.get(GUILD_PRINCIPAL);
      const rankingOrdenado = Object.entries(ticketsData).sort((a, b) => b[1] - a[1]);
      const fechaHoy = new Date().toLocaleDateString('es-ES', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const lineas = rankingOrdenado.map(([id, puntos], index) => {
        const member = guildPrincipal?.members.cache.get(id);
        const rango = member ? obtenerRango(member) : 'PVT';
        const nombre = member ? obtenerNombreDisplay(member) : 'Desconocido';
        const posicion = (index + 1).toString().padStart(2, '0');
        return `\`${posicion}\` **${nombre}** = ${puntos}`;
      });

      await enviarLog(interaction, 'resta', `Consulto tablero de tickets. ${rankingOrdenado.length} registros`);

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('TOP DE PUNTOS - TICKETS')
        .setDescription(lineas.join('\n') || 'Sin registros disponibles')
        .setFooter({ text: `${fechaHoy} | Generado por ${obtenerNombreDisplay(interaction.member)}` });

      return interaction.reply({ embeds: [embed] });
    }

    // ===== SIACEPTO =====
    if (interaction.commandName === 'siacepto') {
      if (!interaction.member.roles.cache.has(ROL_USUARIO)) {
        return interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
      }

      const embedInstalacion = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('INSTALACION DE TS3 EN ANDROID - PASO 1')
        .setDescription('Seleccionar "continue without logging in" para iniciar sin credenciales personales.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029507519840257/IMG-20251112-WA0000.jpg');

      const embedPaso2 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('PASO 2 - ANADIR SERVIDOR')
        .setDescription('Localizar la opcion para agregar un nuevo servidor.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029508036001873/IMG-20251112-WA0001.jpg');

      const embedPaso3 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('PASO 3 - CONFIGURACION DE DATOS')
        .setDescription('Completar los campos con la informacion proporcionada.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029508543512606/IMG-20251112-WA0003.jpg');

      const embedConfig = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('CONFIGURACION - PASO 1: AJUSTES')
        .setDescription('Acceder al menu de ajustes de la aplicacion.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035784434323496/IMG-20251112-WA0004.jpg');

      const embedConfig2 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('CONFIGURACION - PASO 2: OPCIONES DE AUDIO')
        .setDescription('Activar Push to talk, superposicion de PTT y manos libres para optimizar la experiencia.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035784832651394/IMG-20251112-WA0005.jpg');

      const embedConfig3 = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('CONFIGURACION - PASO 3: SENSOR DE PROXIMIDAD')
        .setDescription('Desactivar el sensor de proximidad para evitar interrupciones.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035785332031529/IMG-20251112-WA0006.jpg');

      const embedCuenta = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('CREDENCIALES DE ACCESO - JUNIOR ENLISTED')
        .setDescription(
          `**Correo:** KenwayHaytham005@gmail.com\n` +
          `**Contrasena:** UMCSacceso501\n\n` +
          '**Advertencia:** El uso de estas credenciales implica la aceptacion de los terminos establecidos. Cualquier comparticion no autorizada o modificacion indebida sera sancionada.'
        );

      await interaction.reply({ content: `${obtenerNombreDisplay(interaction.member)} ha aceptado los terminos. Procediendo con la entrega de credenciales y guia:` });
      await interaction.followUp({ embeds: [embedInstalacion] });
      await interaction.followUp({ embeds: [embedPaso2] });
      await interaction.followUp({ embeds: [embedPaso3] });
      await interaction.followUp({ embeds: [embedConfig] });
      await interaction.followUp({ embeds: [embedConfig2] });
      await interaction.followUp({ embeds: [embedConfig3] });
      await interaction.followUp({ embeds: [embedCuenta] });

      await enviarLog(interaction, 'siacepto', 'Acepto terminos y recibio credenciales TS3 Android');

      return;
    }

  } catch (err) {
    console.error('ERROR:', err);

    if (interaction.replied) {
      interaction.followUp({ content: 'Se produjo un error en el sistema.', ephemeral: true });
    } else {
      interaction.reply({ content: 'Se produjo un error en el sistema.', ephemeral: true });
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
