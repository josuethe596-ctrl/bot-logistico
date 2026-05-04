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
const CANAL_FIN_DIA = '1499930571785375744';

// Hilos para adv y registro
const HILO_ADV = '1500992168288981143';
const HILO_REGISTRO = '1500992124546711572';
const HILO_ADV2 = '1501002001885167776';
const HILO_REGISTRO2 = '1501002052149444628';

// ===== ROLES POR PERMISO =====
const ROLES_STAFF = ['1249089576270696508', '1249089640632422470'];
const ROL_USUARIO = '1249089172308885576';
const ROL_ESPECIAL = '1249095569150836781';

// /adv /adv2 /registro /registro2
const ROLES_REGISTRO = [
  '1467236078007353487',
  '1467236084445614223',
  '1467236378478903468',
  '1467236381691609423'
];

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

// ===== FUNCIONES DE VERIFICACIÓN =====
function tieneAlgunRol(member, rolesArray) {
  return rolesArray.some(rolId => member.roles.cache.has(rolId));
}

// ===== FUNCION PARA OBTENER CANAL/HILO CON CACHE FORZADA =====
async function obtenerCanal(channelId) {
  try {
    // Primero intentar con fetch (para hilos)
    const canal = await client.channels.fetch(channelId, { force: true });
    return canal;
  } catch (err) {
    console.error(`Error al obtener canal/hilo ${channelId}:`, err.message);
    return null;
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

  // ===== MENSAJE FIN DEL DIA =====
  if (canalFinDia && canalFinDia.isTextBased()) {
    const embedFinDia = new EmbedBuilder()
      .setColor(0x1B4332)
      .setDescription(`Fin del dia ${fechaNY}`);
    
    await canalFinDia.send({ embeds: [embedFinDia] });
  }

  // ===== TABLERO PRINCIPAL LIMPIO =====
  const lineasPrincipal = rankingOrdenado.map(([id, efectividades], index) => {
    const member = guildPrincipal?.members.cache.get(id);
    const nombre = member ? member.displayName || member.user.username : 'Desconocido';
    const posicion = (index + 1).toString().padStart(2, '0');
    const barra = '▬'.repeat(Math.min(Math.floor(efectividades / 5) + 1, 15));
    return `\`${posicion}\` ${nombre} ${barra} ${efectividades}`;
  });

  const embedPrincipal = new EmbedBuilder()
    .setColor(0x1B4332)
    .setTitle('EFECTIVIDADES DEL DIA')
    .setDescription(lineasPrincipal.join('\n') || 'Sin registros disponibles')
    .setFooter({ text: `${fechaNY} | Cierre automatico` });

  // ===== TABLERO STAFF LIMPIO =====
  const lineasStaff = rankingOrdenado.map(([id, efectividades], index) => {
    const memberPrincipal = guildPrincipal?.members.cache.get(id);
    const memberStaff = guildStaff?.members.cache.get(id);
    const nombre = memberPrincipal ? memberPrincipal.displayName || memberPrincipal.user.username : 'Desconocido';
    const posicion = (index + 1).toString().padStart(2, '0');
    const total = rankingOrdenado.reduce((a, b) => a + b[1], 0);
    const porcentaje = total > 0 ? ((efectividades / total) * 100).toFixed(1) : 0;
    const sincronizacion = memberStaff ? 'Activo' : 'Inactivo';

    return `\`${posicion}\` ${nombre}\n` +
           `Efectividades: ${efectividades} | ${porcentaje}% | ${sincronizacion}`;
  });

  const totalEfectividades = rankingOrdenado.reduce((a, b) => a + b[1], 0);
  const promedio = rankingOrdenado.length > 0 ? (totalEfectividades / rankingOrdenado.length).toFixed(1) : 0;

  const embedStaff = new EmbedBuilder()
    .setColor(0x1B4332)
    .setTitle('EFECTIVIDADES DETALLADAS - STAFF')
    .setDescription(lineasStaff.join('\n\n') || 'Sin registros disponibles')
    .addFields({
      name: 'Resumen',
      value: `Total: ${totalEfectividades} | Promedio: ${promedio} | Participantes: ${rankingOrdenado.length}`
    })
    .setFooter({ text: `${fechaNY} | Informacion confidencial` });

  await canalPrincipal.send({ embeds: [embedPrincipal] });
  await canalStaff.send({ embeds: [embedStaff] });
  
  console.log(`Tablero automatico enviado: ${fechaNY}`);
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

  // ===== ADVERTENCIAS =====
  new SlashCommandBuilder()
    .setName('adv')
    .setDescription('Enviar advertencia al hilo principal')
    .addUserOption(o => o.setName('nombre').setDescription('Usuario a advertir').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razon de la advertencia').setRequired(true))
    .addStringOption(o => o.setName('conteo').setDescription('Conteo de advertencias (ej: 1/2)').setRequired(true))
    .addUserOption(o => o.setName('firma').setDescription('Responsable de la advertencia').setRequired(true)),

  new SlashCommandBuilder()
    .setName('adv2')
    .setDescription('Enviar advertencia al hilo secundario')
    .addUserOption(o => o.setName('nombre').setDescription('Usuario a advertir').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razon de la advertencia').setRequired(true))
    .addStringOption(o => o.setName('conteo').setDescription('Conteo de advertencias (ej: 1/2)').setRequired(true))
    .addUserOption(o => o.setName('firma').setDescription('Responsable de la advertencia').setRequired(true)),

  // ===== REGISTROS =====
  new SlashCommandBuilder()
    .setName('registro')
    .setDescription('Enviar registro de cambio de rol al hilo principal')
    .addUserOption(o => o.setName('nombre').setDescription('Usuario afectado').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razon del cambio').setRequired(true))
    .addRoleOption(o => o.setName('retira').setDescription('Rol que se retira').setRequired(true))
    .addRoleOption(o => o.setName('concede').setDescription('Rol que se concede').setRequired(true))
    .addUserOption(o => o.setName('firma').setDescription('Responsable del registro').setRequired(true)),

  new SlashCommandBuilder()
    .setName('registro2')
    .setDescription('Enviar registro de cambio de rol al hilo secundario')
    .addUserOption(o => o.setName('nombre').setDescription('Usuario afectado').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razon del cambio').setRequired(true))
    .addRoleOption(o => o.setName('retira').setDescription('Rol que se retira').setRequired(true))
    .addRoleOption(o => o.setName('concede').setDescription('Rol que se concede').setRequired(true))
    .addUserOption(o => o.setName('firma').setDescription('Responsable del registro').setRequired(true))
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
  const userId = interaction.user.id;

  try {

    // ===== AGREGAR =====
    if (interaction.commandName === 'agregar') {
      if (!tieneAlgunRol(interaction.member, ROLES_STAFF)) {
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

      const embed = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setDescription(`Se agregaron ${cantidad} efectividades a ${usuario.username}. Total: ${data[usuario.id]}`);

      return interaction.reply({ embeds: [embed] });
    }

    // ===== QUITAR =====
    if (interaction.commandName === 'quitar') {
      if (!tieneAlgunRol(interaction.member, ROLES_STAFF)) {
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

      const embed = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setDescription(`Se retiraron ${cantidad} efectividades a ${usuario.username}. Total: ${data[usuario.id]}`);

      return interaction.reply({ embeds: [embed] });
    }

    // ===== MEP =====
    if (interaction.commandName === 'mep') {
      if (!interaction.member.roles.cache.has(ROL_USUARIO)) {
        return interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
      }

      const efectividades = data[userId] || 0;

      const embed = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setTitle('Consulta de Efectividades')
        .setDescription(`Usuario: ${interaction.user.username}\nEfectividades actuales: ${efectividades}`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== TABLERO =====
    if (interaction.commandName === 'tablero') {
      if (!tieneAlgunRol(interaction.member, ROLES_STAFF)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const guildPrincipal = client.guilds.cache.get(GUILD_PRINCIPAL);
      const guildStaff = client.guilds.cache.get(GUILD_STAFF);

      const canalPrincipal = guildPrincipal?.channels.cache.get(CANAL_PRINCIPAL);
      const canalStaff = guildStaff?.channels.cache.get(CANAL_STAFF);

      const rankingOrdenado = Object.entries(data).sort((a, b) => b[1] - a[1]);
      const fechaHoy = new Date().toLocaleDateString('es-ES', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const lineasPrincipal = rankingOrdenado.map(([id, efectividades], index) => {
        const member = guildPrincipal?.members.cache.get(id);
        const nombre = member ? member.displayName || member.user.username : 'Desconocido';
        const posicion = (index + 1).toString().padStart(2, '0');
        const barra = '▬'.repeat(Math.min(Math.floor(efectividades / 5) + 1, 15));
        return `\`${posicion}\` ${nombre} ${barra} ${efectividades}`;
      });

      const embedPrincipal = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('EFECTIVIDADES DEL DIA')
        .setDescription(lineasPrincipal.join('\n') || 'Sin registros disponibles')
        .setFooter({ text: `${fechaHoy} | Generado por ${interaction.user.username}` });

      const lineasStaff = rankingOrdenado.map(([id, efectividades], index) => {
        const memberPrincipal = guildPrincipal?.members.cache.get(id);
        const memberStaff = guildStaff?.members.cache.get(id);
        const nombre = memberPrincipal ? memberPrincipal.displayName || memberPrincipal.user.username : 'Desconocido';
        const posicion = (index + 1).toString().padStart(2, '0');
        const total = rankingOrdenado.reduce((a, b) => a + b[1], 0);
        const porcentaje = total > 0 ? ((efectividades / total) * 100).toFixed(1) : 0;
        const sincronizacion = memberStaff ? 'Activo' : 'Inactivo';

        return `\`${posicion}\` ${nombre}\n` +
               `Efectividades: ${efectividades} | ${porcentaje}% | ${sincronizacion}`;
      });

      const totalEfectividades = rankingOrdenado.reduce((a, b) => a + b[1], 0);
      const promedio = rankingOrdenado.length > 0 ? (totalEfectividades / rankingOrdenado.length).toFixed(1) : 0;

      const embedStaff = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('EFECTIVIDADES DETALLADAS - STAFF')
        .setDescription(lineasStaff.join('\n\n') || 'Sin registros disponibles')
        .addFields({
          name: 'Resumen',
          value: `Total: ${totalEfectividades} | Promedio: ${promedio} | Participantes: ${rankingOrdenado.length}`
        })
        .setFooter({ text: `${fechaHoy} | Generado por ${interaction.user.tag}` });

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
      if (enviadoPrincipal) mensajes.push('Tablero publicado en canal principal');
      if (enviadoStaff) mensajes.push('Tablero publicado en canal de Staff');
      if (!enviadoPrincipal) mensajes.push('Fallo al publicar en canal principal');
      if (!enviadoStaff) mensajes.push('Fallo al publicar en canal de Staff');

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setDescription(mensajes.join('\n'));

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== RESETS =====
    if (interaction.commandName === 'resets') {
      if (!tieneAlgunRol(interaction.member, ROLES_STAFF)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      for (const id in data) {
        data[id] = 0;
      }

      saveData(data);

      const embed = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setTitle('Reinicio Completado')
        .setDescription('Todos los registros han sido restablecidos a cero. El sistema esta listo para nueva acumulacion.');

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== TS3 =====
    if (interaction.commandName === 'ts3') {
      if (!interaction.member.roles.cache.has(ROL_ESPECIAL)) {
        return interaction.reply({ content: 'No tienes permiso para acceder a esta informacion.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Terminos y Condiciones - TS3')
        .setDescription(
          'Al aceptar la cuenta de TS3 estas obligado a seguir estos terminos y condiciones. El incumplimiento resultara en veto de la faccion y posibles sanciones adicionales.\n\n' +
          'Restricciones:\n' +
          '- No compartir la cuenta con personas externas a la faccion\n' +
          '- No realizar modificaciones sin autorizacion de alto mando logistico\n' +
          '- No cambiar la contrasena del correo asociado para beneficio propio\n' +
          '- No utilizar las herramientas para perjudicar a miembros de la faccion\n\n' +
          'Para continuar escribe /siacepto'
        );

      return interaction.reply({ embeds: [embed] });
    }

    // ===== TS3 PC =====
    if (interaction.commandName === 'ts3pc') {
      if (!interaction.member.roles.cache.has(ROL_ESPECIAL)) {
        return interaction.reply({ content: 'No tienes permiso para acceder a esta informacion.', ephemeral: true });
      }

      const embedDescarga = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Descarga de TS3 para PC')
        .setDescription('https://www.teamspeak.com/en/downloads/#ts3client');

      const embedGuia1 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Proceso de Registro - Imagen 1')
        .setImage('https://images-ext-1.discordapp.net/external/hKs4ua6_y46K-SJdjgSS2beO6PT21-musbkcZCRHPDE/https/cdn.nekotina.com/guilds/1203420760467832923/3bf1e200-4d80-4ad2-acfc-eb7ba57315b0.jpg?format=webp');

      const embedGuia2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Proceso de Registro - Imagen 2')
        .setImage('https://images-ext-1.discordapp.net/external/C2p2PuAsqPDnkCwLX6CizbYAx8x5_9V-Reex7aAFyxQ/https/cdn.nekotina.com/guilds/1203420760467832923/1ca176e1-a55a-4294-b290-307fbef8c4fc.jpg?format=webp');

      const embedPaso1 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Configuracion: Herramientas > Opciones')
        .setImage('https://media.discordapp.net/attachments/1481019380103119081/1481021781086306457/TeamSpeak_3_30_09_2025_17_15_54.png?ex=69f8fd84&is=69f7ac04&hm=2909c47dd36047995750173867867b4828bccdfd943d82cafa111b22756b385b&=&format=webp&quality=lossless');

      const embedPaso2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Configuracion: Asignar tecla para hablar')
        .setImage('https://media.discordapp.net/attachments/1481019380103119081/1481021815357968427/TeamSpeak_3_30_09_2025_17_17_39.png?ex=69f8fd8c&is=69f7ac0c&hm=31c2d4baf74e2a426f1531662cb3df725573c10b8dda90a8a2733c03ee8beb12&=&format=webp&quality=lossless');

      await interaction.reply({ content: 'Guia de instalacion TS3 para PC:', embeds: [embedDescarga] });
      await interaction.followUp({ embeds: [embedGuia1] });
      await interaction.followUp({ embeds: [embedGuia2] });
      await interaction.followUp({ embeds: [embedPaso1] });
      await interaction.followUp({ embeds: [embedPaso2] });

      return;
    }

    // ===== ANDROID =====
    if (interaction.commandName === 'android') {
      if (!interaction.member.roles.cache.has(ROL_ESPECIAL)) {
        return interaction.reply({ content: 'No tienes permiso para acceder a esta informacion.', ephemeral: true });
      }

      const embedPrincipal = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Macros-android')
        .setDescription(
          'A continuacion se te presentan 20 macros diferentes, con roles completos, para cualquier tipo de situaciones en patrullajes.\n\n' +
          'Explorador de archivos usado en el video: https://play.google.com/store/apps/details?id=ru.zdevs.zarchiver\n\n' +
          'Se te presenta el archivo (macros) compatible con cualquier tipo de version de Android.'
        );

      const embedNota1 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Nota 1')
        .setDescription('Una vez aplicado el mas macros activar el apartado: (Monetloader) tener activado antes de descargar y colocar dicho archivo.');

      const embedNota2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Nota 2')
        .setDescription('Antes de colocar dichas macros asegurarse de no tener otro archivo monetloader, en uso, pues este archivo contiene para poder crashear el APK para evitar el uso de cheats o ventajas que te de otro archivo monetloader.');

      const embedNota3 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Nota 3')
        .setDescription('Para agregar macros puedes usar el comando (/cmdhm) y con este mismo se habren dicho apartados para agregar hasta 45 tipos de macros diferentes.');

      const embedNota4 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Nota 4')
        .setDescription('Las macros o el archivo monetloader ya tiene un sistema de renderizado, FOV y el aspect ratio este ultimo sirve para estirar la pantalla no se recomienda estirar mucho ya que se bajaran tus posibilidades de abrir fuegos contra ciudadanos en dicho caso.');

      const embedVideo = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Video explicativo de como se ponen en android')
        .setDescription('https://youtube.com/shorts/bU0KblaBXOM?feature=share');

      const embedArchivo = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Archivo necesario')
        .setDescription('https://www.mediafire.com/file/2hypm27ga94jo46/monetloader+(1).7z/file');

      await interaction.reply({ content: 'Paquete de macros para Android:', embeds: [embedPrincipal] });
      await interaction.followUp({ embeds: [embedNota1] });
      await interaction.followUp({ embeds: [embedNota2] });
      await interaction.followUp({ embeds: [embedNota3] });
      await interaction.followUp({ embeds: [embedNota4] });
      await interaction.followUp({ embeds: [embedVideo] });
      await interaction.followUp({ embeds: [embedArchivo] });

      return;
    }

    // ===== PC =====
    if (interaction.commandName === 'pc') {
      if (!interaction.member.roles.cache.has(ROL_ESPECIAL)) {
        return interaction.reply({ content: 'No tienes permiso para acceder a esta informacion.', ephemeral: true });
      }

      const embedMacros = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Macros Actualizadas para PC')
        .setDescription('https://www.mediafire.com/file/u8q6bferz6igasf/Macros_USMC_Logistica_v9.pdf/file');

      const embedArchivo = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Archivo de Roles y Macros')
        .setDescription('https://www.mediafire.com/file/ysctncbpyxum385/LUA_Macros_V2.zip/file');

      const embedTutorial = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Tutorial de Instalacion')
        .setDescription('https://youtu.be/NLNJ3AZ-X2Y');

      const embedVideo = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Video Explicativo - Macros en el Juego')
        .setDescription('https://youtu.be/6yEqI8ML4eY');

      await interaction.reply({ content: 'Recursos para PC:', embeds: [embedMacros] });
      await interaction.followUp({ embeds: [embedArchivo] });
      await interaction.followUp({ embeds: [embedTutorial] });
      await interaction.followUp({ embeds: [embedVideo] });

      return;
    }

    // ===== ADV =====
    if (interaction.commandName === 'adv') {
      if (!tieneAlgunRol(interaction.member, ROLES_REGISTRO)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const nombre = interaction.options.getUser('nombre');
      const razon = interaction.options.getString('razon');
      const conteo = interaction.options.getString('conteo');
      const firma = interaction.options.getUser('firma');

      const canalAdv = await obtenerCanal(HILO_ADV);

      if (!canalAdv) {
        return interaction.reply({ content: 'No se pudo acceder al hilo de advertencias. Verifique que el bot tenga permisos en el hilo.', ephemeral: true });
      }

      if (!canalAdv.isTextBased()) {
        return interaction.reply({ content: 'El hilo encontrado no permite mensajes de texto.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('Formato de advertencia')
        .setDescription(
          `Nombre: ${nombre}\n` +
          `Razon: ${razon}\n` +
          `Conteo: ${conteo}\n\n` +
          `Firma: ${firma}`
        );

      await canalAdv.send({ embeds: [embed] });

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setDescription('Advertencia enviada al hilo principal.');

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== ADV2 =====
    if (interaction.commandName === 'adv2') {
      if (!tieneAlgunRol(interaction.member, ROLES_REGISTRO)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const nombre = interaction.options.getUser('nombre');
      const razon = interaction.options.getString('razon');
      const conteo = interaction.options.getString('conteo');
      const firma = interaction.options.getUser('firma');

      const canalAdv2 = await obtenerCanal(HILO_ADV2);

      if (!canalAdv2) {
        return interaction.reply({ content: 'No se pudo acceder al hilo de advertencias secundario. Verifique que el bot tenga permisos en el hilo.', ephemeral: true });
      }

      if (!canalAdv2.isTextBased()) {
        return interaction.reply({ content: 'El hilo encontrado no permite mensajes de texto.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('Formato de advertencia')
        .setDescription(
          `Nombre: ${nombre}\n` +
          `Razon: ${razon}\n` +
          `Conteo: ${conteo}\n\n` +
          `Firma: ${firma}`
        );

      await canalAdv2.send({ embeds: [embed] });

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setDescription('Advertencia enviada al hilo secundario.');

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== REGISTRO =====
    if (interaction.commandName === 'registro') {
      if (!tieneAlgunRol(interaction.member, ROLES_REGISTRO)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const nombre = interaction.options.getUser('nombre');
      const razon = interaction.options.getString('razon');
      const retira = interaction.options.getRole('retira');
      const concede = interaction.options.getRole('concede');
      const firma = interaction.options.getUser('firma');

      const canalRegistro = await obtenerCanal(HILO_REGISTRO);

      if (!canalRegistro) {
        return interaction.reply({ content: 'No se pudo acceder al hilo de registro. Verifique que el bot tenga permisos en el hilo.', ephemeral: true });
      }

      if (!canalRegistro.isTextBased()) {
        return interaction.reply({ content: 'El hilo encontrado no permite mensajes de texto.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Formato de registro')
        .setDescription(
          `Nombre: ${nombre}\n\n` +
          `Razon: ${razon}\n\n` +
          `Se le retira: ${retira}\n\n` +
          `Se le concede: ${concede}\n\n` +
          `Firma del responsable: ${firma}`
        );

      await canalRegistro.send({ embeds: [embed] });

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setDescription('Registro enviado al hilo principal.');

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== REGISTRO2 =====
    if (interaction.commandName === 'registro2') {
      if (!tieneAlgunRol(interaction.member, ROLES_REGISTRO)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const nombre = interaction.options.getUser('nombre');
      const razon = interaction.options.getString('razon');
      const retira = interaction.options.getRole('retira');
      const concede = interaction.options.getRole('concede');
      const firma = interaction.options.getUser('firma');

      const canalRegistro2 = await obtenerCanal(HILO_REGISTRO2);

      if (!canalRegistro2) {
        return interaction.reply({ content: 'No se pudo acceder al hilo de registro secundario. Verifique que el bot tenga permisos en el hilo.', ephemeral: true });
      }

      if (!canalRegistro2.isTextBased()) {
        return interaction.reply({ content: 'El hilo encontrado no permite mensajes de texto.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Formato de registro')
        .setDescription(
          `Nombre: ${nombre}\n\n` +
          `Razon: ${razon}\n\n` +
          `Se le retira: ${retira}\n\n` +
          `Se le concede: ${concede}\n\n` +
          `Firma del responsable: ${firma}`
        );

      await canalRegistro2.send({ embeds: [embed] });

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x2D5A3D)
        .setDescription('Registro enviado al hilo secundario.');

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== SIACEPTO =====
    if (interaction.commandName === 'siacepto') {
      if (!interaction.member.roles.cache.has(ROL_USUARIO)) {
        return interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
      }

      const embedInstalacion = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Instalacion de TS3 en Android - Paso 1')
        .setDescription('Seleccionar "continue without logging in" para iniciar sin credenciales personales.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029507519840257/IMG-20251112-WA0000.jpg');

      const embedPaso2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Paso 2 - Anadir servidor')
        .setDescription('Localizar la opcion para agregar un nuevo servidor.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029508036001873/IMG-20251112-WA0001.jpg');

      const embedPaso3 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Paso 3 - Configuracion de datos')
        .setDescription('Completar los campos con la informacion proporcionada.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438029508543512606/IMG-20251112-WA0003.jpg');

      const embedConfig = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Configuracion - Paso 1: Ajustes')
        .setDescription('Acceder al menu de ajustes de la aplicacion.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035784434323496/IMG-20251112-WA0004.jpg');

      const embedConfig2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Configuracion - Paso 2: Opciones de audio')
        .setDescription('Activar Push to talk, superposicion de PTT y manos libres para optimizar la experiencia.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035784832651394/IMG-20251112-WA0005.jpg');

      const embedConfig3 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Configuracion - Paso 3: Sensor de proximidad')
        .setDescription('Desactivar el sensor de proximidad para evitar interrupciones.')
        .setImage('https://cdn.discordapp.com/attachments/1285053860435726396/1438035785332031529/IMG-20251112-WA0006.jpg');

      const embedCuenta = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Credenciales de acceso - Junior Enlisted')
        .setDescription(
          `Correo: KenwayHaytham005@gmail.com\n` +
          `Contrasena: UMCSacceso501\n\n` +
          'Advertencia: El uso de estas credenciales implica la aceptacion de los terminos establecidos. Cualquier comparticion no autorizada o modificacion indebida sera sancionada.'
        );

      await interaction.reply({ content: `${interaction.user.username} ha aceptado los terminos. Procediendo con la entrega de credenciales y guia:` });
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
      interaction.followUp({ content: 'Se produjo un error en el sistema.', ephemeral: true });
    } else {
      interaction.reply({ content: 'Se produjo un error en el sistema.', ephemeral: true });
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
