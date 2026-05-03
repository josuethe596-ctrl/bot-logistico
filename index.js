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
    .setName('ts3pc')
    .setDescription('Guia de instalacion TS3 para PC'),

  new SlashCommandBuilder()
    .setName('android')
    .setDescription('Macros y archivo monetloader para Android'),

  new SlashCommandBuilder()
    .setName('siacepto')
    .setDescription('Aceptar terminos y recibir guia de instalacion TS3 Android')
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

      // ===== RANKING PRINCIPAL =====
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
          lineasPrincipal.length > 0 
            ? lineasPrincipal.join('\n') 
            : 'Sin datos registrados'
        )
        .addFields({
          name: ' ',
          value: `\`Actualizado: ${new Date().toLocaleDateString('es-ES')} | Por: ${interaction.user.username}\``,
          inline: false
        })
        .setFooter({ text: 'USMC - Sistema de Efectividades' });

      // ===== RANKING STAFF =====
      const lineasStaff = rankingOrdenado
        .map(([id, efectividades], index) => {
          const memberPrincipal = guildPrincipal?.members.cache.get(id);
          const memberStaff = guildStaff?.members.cache.get(id);
          const nombre = memberPrincipal ? memberPrincipal.displayName || memberPrincipal.user.username : 'Usuario desconocido';
          const tag = memberPrincipal?.user.tag || 'N/A';
          const posicion = (index + 1).toString().padStart(2, '0');
          const total = rankingOrdenado.reduce((a, b) => a + b[1], 0);
          const porcentaje = total > 0 ? ((efectividades / total) * 100).toFixed(1) : 0;
          const estado = memberStaff ? 'Sincronizado' : 'No presente';

          return `\`#${posicion}\` **${nombre}**\n` +
                 `ID: \`${id}\`\n` +
                 `Usuario: ${tag}\n` +
                 `Efectividades: **${efectividades}** (${porcentaje}%)\n` +
                 `Estado Staff: ${estado}`;
        });

      const totalEfectividades = rankingOrdenado.reduce((a, b) => a + b[1], 0);
      const promedio = rankingOrdenado.length > 0 ? (totalEfectividades / rankingOrdenado.length).toFixed(1) : 0;

      const embedStaff = new EmbedBuilder()
        .setTitle('RANKING DETALLADO - STAFF')
        .setColor(0x1B4332)
        .setDescription(
          lineasStaff.length > 0 
            ? lineasStaff.join('\n\n') 
            : 'Sin datos registrados'
        )
        .addFields(
          {
            name: 'RESUMEN',
            value: 
              `Total participantes: **${rankingOrdenado.length}**\n` +
              `Total efectividades: **${totalEfectividades}**\n` +
              `Promedio: **${promedio}**\n` +
              `Ejecutado por: **${interaction.user.tag}**`,
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

    // ===== TS3 PC =====
    if (interaction.commandName === 'ts3pc') {
      const embedDescarga = new EmbedBuilder()
        .setTitle('Link De Descarga Del TS3 (PC)')
        .setColor(0x1B4332)
        .setDescription('https://www.teamspeak.com/en/downloads/#ts3client');

      const embedGuia1 = new EmbedBuilder()
        .setTitle('Guia 1')
        .setColor(0x1B4332)
        .setDescription('Fotos De Guias Para El Proceso De Registro De TS3 (PC).')
        .setImage('https://images-ext-1.discordapp.net/external/hKs4ua6_y46K-SJdjgSS2beO6PT21-musbkcZCRHPDE/https/cdn.nekotina.com/guilds/1203420760467832923/3bf1e200-4d80-4ad2-acfc-eb7ba57315b0.jpg?format=webp');

      const embedGuia2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setImage('https://images-ext-1.discordapp.net/external/C2p2PuAsqPDnkCwLX6CizbYAx8x5_9V-Reex7aAFyxQ/https/cdn.nekotina.com/guilds/1203420760467832923/1ca176e1-a55a-4294-b290-307fbef8c4fc.jpg?format=webp');

      const embedPaso1 = new EmbedBuilder()
        .setTitle('Paso 1 (Apretar en "Herramientas" >> "Opciones")')
        .setColor(0x1B4332)
        .setImage('https://media.discordapp.net/attachments/1481019380103119081/1481021781086306457/TeamSpeak_3_30_09_2025_17_15_54.png?ex=69f8fd84&is=69f7ac04&hm=2909c47dd36047995750173867867b4828bccdfd943d82cafa111b22756b385b&=&format=webp&quality=lossless');

      const embedPaso2 = new EmbedBuilder()
        .setTitle('Paso 2. (Asignar tecla para hablar)')
        .setColor(0x1B4332)
        .setImage('https://media.discordapp.net/attachments/1481019380103119081/1481021815357968427/TeamSpeak_3_30_09_2025_17_17_39.png?ex=69f8fd8c&is=69f7ac0c&hm=31c2d4baf74e2a426f1531662cb3df725573c10b8dda90a8a2733c03ee8beb12&=&format=webp&quality=lossless');

      await interaction.reply({ content: 'Aqui tienes la guia de instalacion de TS3 para PC:' });
      await interaction.followUp({ embeds: [embedDescarga] });
      await interaction.followUp({ embeds: [embedGuia1] });
      await interaction.followUp({ embeds: [embedGuia2] });
      await interaction.followUp({ embeds: [embedPaso1] });
      await interaction.followUp({ embeds: [embedPaso2] });

      return;
    }

    // ===== ANDROID =====
    if (interaction.commandName === 'android') {
      const embedInfo = new EmbedBuilder()
        .setTitle('Macros-android')
        .setColor(0x1B4332)
        .setDescription(
          'A continuacion se te presentan 20 macros diferentes, con roles completos, para cualquier tipo de situaciones en patrullajes.\n\n' +
          '**Explorador de archivos usado en el video:**\nhttps://play.google.com/store/apps/details?id=ru.zdevs.zarchiver\n\n' +
          '**Se te presenta el archivo (macros) compatible con cualquier tipo de version de android.**'
        );

      const embedNota1 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Nota 1')
        .setDescription(
          'Una vez aplicado el mas macros activar el apartado: **(Monetloader)** tener activado antes de descargar y colocar dicho archivo.'
        );

      const embedNota2 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Nota 2')
        .setDescription(
          'Antes de colocar dichas macros asegurarse de no tener otro archivo monetloader en uso, pues este archivo contiene para poder crashear el APK para evitar el uso de cheats o ventajas que te de otro archivo monetloader.'
        );

      const embedNota3 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Nota 3')
        .setDescription(
          'Para agregar macros puedes usar el comando `/cmdhm` y con este mismo se habren dicho apartados para agregar hasta **45 tipos de macros diferentes**.'
        );

      const embedNota4 = new EmbedBuilder()
        .setColor(0x1B4332)
        .setTitle('Nota 4')
        .setDescription(
          'Las macros o el archivo monetloader ya tiene un sistema de renderizado, FOV y el aspect ratio. Este ultimo sirve para estirar la pantalla, no se recomienda estirar mucho ya que se bajaran tus posibilidades de abrir fuegos contra ciudadanos en dicho caso.'
        );

      await interaction.reply({ content: 'Aqui tienes la informacion de macros para Android:' });
      await interaction.followUp({ embeds: [embedInfo] });
      await interaction.followUp({ embeds: [embedNota1] });
      await interaction.followUp({ embeds: [embedNota2] });
      await interaction.followUp({ embeds: [embedNota3] });
      await interaction.followUp({ embeds: [embedNota4] });
      await interaction.followUp({
        content: '**Video tutorial:**',
        files: ['https://cdn.discordapp.com/attachments/1479296105819803799/1479302677275082924/screen-20260305-210418.mp4?ex=69f8ab3a&is=69f759ba&hm=52d7641d14c10066ebaa658137bdd5155bc4e3c7ac9ac106bfb6cbc9d2906d96&']
      });
      await interaction.followUp({
        content: '**Archivo monetloader.7z:**',
        files: ['https://cdn.discordapp.com/attachments/1479296105819803799/1479302678096908471/monetloader.7z?ex=69f8ab3a&is=69f759ba&hm=c5f6f50de71f61443210794fcc061fc4c9651968f270221da57c0cb1c5e37a88&']
      });

      return;
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
