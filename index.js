const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

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
const CANAL_ANUNCIOS = '1499835071245586544';
const CANAL_ANUNCIOS_LS = '1465188998099243090';
const CANAL_ANUNCIOS_CH = '1308186822937153546';

const HILO_TICKETS = '1501741776933879859';

// ===== ROLES =====
const ROLES_STAFF = ['1249089576270696508', '1249089640632422470'];
const ROL_USUARIO = '1249089172308885576';
const ROL_ESPECIAL = '1249095569150836781';
const ROLES_ANUNCIOS = ['1499828342499573970', '1467162969774227713'];
const ROLES_ROLESTS3 = ['1499828342499573970', '1467162969774227713'];
const ROLES_RES = ['1499828342499573970', '1467162969774227713'];

// ===== IMAGENES DE SOLDADOS (URLs) =====
const FOTOS_SOLDADO = {
  'soldado1': 'https://media.discordapp.net/attachments/1500299269855379610/1503540408242802738/8d71445b-3453-4e76-948d-90a2cdb2010b.png?ex=6a03b89f&is=6a02671f&hm=b33e70dab9fefcf078c055aa0844182a609edb8d8dc45bda6bc2cb0896ac63ad&=&format=webp&quality=lossless',
  'soldado2': 'https://media.discordapp.net/attachments/1500299269855379610/1503541583914733628/aa466a4f-4dc0-4d0f-8d18-5e7c686cbc64.png?ex=6a03b9b8&is=6a026838&hm=a95fa74a495adc2a9bbaf2af34ff82899ed7f00469035d1e66c96ad5893e0420&=&format=webp&quality=lossless',
  'soldado3': 'https://media.discordapp.net/attachments/1500299269855379610/1503541820867739648/461db43f-e68c-447b-9e12-3258f6141164.png?ex=6a03b9f0&is=6a026870&hm=1943f9864dfdbe9d2e23787e106769046d7bb435bbd63ead8eb1d04c884d3088&=&format=webp&quality=lossless',
  'soldado4': 'https://media.discordapp.net/attachments/1500299269855379610/1503543886537166889/86901073-03f5-407e-a9c8-0640a54c88eb.png?ex=6a03bbdd&is=6a026a5d&hm=56199df5e89844786af92ba69729a2f11b5f563daa6959cb147854fef7d56e84&=&format=webp&quality=lossless',
  'soldado5': 'https://media.discordapp.net/attachments/1500299269855379610/1503544447323996170/58a2b2e4-a1c4-4c1f-a778-744858aeafe8.png?ex=6a03bc62&is=6a026ae2&hm=e4586c4b3f385a37a905d45492846b39267b02591cfef5f1be9a723a0d28c097&=&format=webp&quality=lossless',
  'soldado6': 'https://media.discordapp.net/attachments/1500299269855379610/1503546826710581248/c632e67d-eb7f-449a-bad4-ebe620f8d936.png?ex=6a03be9a&is=6a026d1a&hm=c93fcbc2ba237562df592e32140407f9616b57f9919e569f2233ff1f8220ad6f&=&format=webp&quality=lossless',
  'soldado7': 'https://media.discordapp.net/attachments/1500299269855379610/1503546852463743098/a9ab0a26-7b2c-4440-919a-4f1818656c76.png?ex=6a03bea0&is=6a026d20&hm=6d63432d36f9c24ab3cb38fe6b0a67d6a94d870de955030044765bcc84b6b367&=&format=webp&quality=lossless',
  'soldado8': 'https://media.discordapp.net/attachments/1500299269855379610/1503549951886626847/b5a5c496-0ab2-493a-a072-f4baf8fe7a08.png?ex=6a03c183&is=6a027003&hm=9d3d94227af2f912ff864422f71501d1c9b2e70db9fa96513b4132c1943d1fcb&=&format=webp&quality=lossless'
};

// ===== LOGOS DE REGIMIENTOS (URLs) =====
const REGIMIENTOS = {
  '3rd_marines': {
    nombre: '3rd Marine Division',
    abreviatura: '3rd MARDIV',
    logo: 'https://media.discordapp.net/attachments/1464318898609586339/1468827872591479009/3DMARDIV_Vector_Caltrap.png?ex=6a03574e&is=6a0205ce&hm=a15959ec843c6603171187549f0ccec53abe7e646aa1ec5cc562a85ff64a7462&=&format=webp&quality=lossless&width=980&height=978'
  },
  '1st_raiders': {
    nombre: '1st Regiment Marine Raiders',
    abreviatura: '1st Raiders',
    logo: 'https://media.discordapp.net/attachments/1464319159222538333/1467258914784673995/image.png?ex=6a0390d9&is=6a023f59&hm=164e7b0c7a9edc07be622130a93c312e7884f27e9bfb76d5e550021e372a4bf3&=&format=webp&quality=lossless'
  },
  '3rd_aircraft': {
    nombre: '3rd Marine Aircraft Wing',
    abreviatura: '3rd MAW',
    logo: 'https://media.discordapp.net/attachments/1464848436007538760/1467510044751827134/image.png?ex=6a03293b&is=6a01d7bb&hm=d9b0b7fd06eab0ad32088ce34b607bc0a6b04001178f445ab9f8a9b485a2fcde&=&format=webp&quality=lossless'
  },
  '3rd_littoral': {
    nombre: '3rd Marine Littoral Regiment',
    abreviatura: '3rd MLR',
    logo: 'https://media.discordapp.net/attachments/1467255078221250652/1467255835779534988/image.png?ex=6a038dfb&is=6a023c7b&hm=51859d6567072b9090cc8308fe4780d614d32459531d8b2a8ad55d6391a5135a&=&format=webp&quality=lossless'
  },
  'clr3': {
    nombre: 'Combat Logistics Regiment 3',
    abreviatura: 'CLR-3',
    logo: 'https://media.discordapp.net/attachments/1465025861269852399/1467520645465378917/image.png?ex=6a03331b&is=6a01e19b&hm=48ae53319cc6d03f0a19b1fb29aa2939f97e34615f2c431930187fd1449eb430&=&format=webp&quality=lossless'
  },
  'mcrd_sandiego': {
    nombre: 'Marine Corps Recruit Depot (San Diego)',
    abreviatura: 'MCRD San Diego',
    logo: 'https://media.discordapp.net/attachments/1464301222470090753/1464312536257269802/image.png?ex=6a0364d2&is=6a021352&hm=f3f74f8f61820b62fa2007a6c7a74458d238ff4a251379f12dcd03e8b565fabd&=&format=webp&quality=lossless'
  }
};

const DATA_FILE = './data.json';
const TICKETS_FILE = './tickets.json';

// ===== CREAR JSON SI NO EXISTE =====
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}');
  console.log('data.json creado automaticamente');
}

if (!fs.existsSync(TICKETS_FILE)) {
  fs.writeFileSync(TICKETS_FILE, '{}');
  console.log('tickets.json creado automaticamente');
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

// ===== FUNCIONES DE VERIFICACION =====
function tieneAlgunRol(member, rolesArray) {
  return rolesArray.some(rolId => member.roles.cache.has(rolId));
}

function obtenerRango(member) {
  const rangos = ['COL', 'MAJ', 'CPT', 'LT', 'WO-1', 'WO-2', 'WO-3', 'SPC', 'SGT', 'CPL', 'LCPL', 'PFC', 'PVT'];
  for (const rango of rangos) {
    const rolRango = member.roles.cache.find(r => 
      r.name.toUpperCase().includes(rango) || r.name.toUpperCase().startsWith(rango)
    );
    if (rolRango) return rango;
  }
  return 'PVT';
}

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

  const lineasPrincipal = rankingOrdenado.map(([id, efectividades], index) => {
    const member = guildPrincipal?.members.cache.get(id);
    const rango = member ? obtenerRango(member) : 'PVT';
    const nombre = member ? member.displayName || member.user.username : 'Desconocido';
    const posicion = (index + 1).toString().padStart(2, '0');
    return '\`' + posicion + '\` ' + rango + ' | ' + nombre + ' = ' + efectividades;
  });

  const embedPrincipal = new EmbedBuilder()
    .setColor(0x8B0000)
    .setTitle('EFECTIVIDADES DEL DIA')
    .setDescription(lineasPrincipal.join('\n') || 'Sin registros disponibles')
    .setFooter({ text: fechaNY + ' | Cierre automatico' });

  const lineasStaff = rankingOrdenado.map(([id, efectividades], index) => {
    const memberPrincipal = guildPrincipal?.members.cache.get(id);
    const memberStaff = guildStaff?.members.cache.get(id);
    const rango = memberPrincipal ? obtenerRango(memberPrincipal) : 'PVT';
    const nombre = memberPrincipal ? memberPrincipal.displayName || memberPrincipal.user.username : 'Desconocido';
    const posicion = (index + 1).toString().padStart(2, '0');
    const total = rankingOrdenado.reduce((a, b) => a + b[1], 0);
    const porcentaje = total > 0 ? ((efectividades / total) * 100).toFixed(1) : 0;
    const sincronizacion = memberStaff ? 'Activo' : 'Inactivo';
    return '\`' + posicion + '\` ' + rango + ' | ' + nombre + '\n' +
           'Efectividades: ' + efectividades + ' | ' + porcentaje + '% | ' + sincronizacion;
  });

  const totalEfectividades = rankingOrdenado.reduce((a, b) => a + b[1], 0);
  const promedio = rankingOrdenado.length > 0 ? (totalEfectividades / rankingOrdenado.length).toFixed(1) : 0;

  const embedStaff = new EmbedBuilder()
    .setColor(0x8B0000)
    .setTitle('EFECTIVIDADES DETALLADAS - STAFF')
    .setDescription(lineasStaff.join('\n\n') || 'Sin registros disponibles')
    .addFields({
      name: 'Resumen',
      value: 'Total: ' + totalEfectividades + ' | Promedio: ' + promedio + ' | Participantes: ' + rankingOrdenado.length
    })
    .setFooter({ text: fechaNY + ' | Informacion confidencial' });

  await canalPrincipal.send({ embeds: [embedPrincipal] });
  await canalStaff.send({ embeds: [embedStaff] });
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
    .setDescription('Mostrar tablero de puntos de tickets'),

  new SlashCommandBuilder()
    .setName('anuncios')
    .setDescription('Enviar anuncio al canal de anuncios')
    .addStringOption(o => o.setName('texto').setDescription('Texto del anuncio').setRequired(true)),

  new SlashCommandBuilder()
    .setName('anunciosls1')
    .setDescription('Enviar anuncio al canal LS1')
    .addStringOption(o => o.setName('texto').setDescription('Texto del anuncio').setRequired(true)),

  new SlashCommandBuilder()
    .setName('anunciosls2')
    .setDescription('Enviar anuncio al canal LS2')
    .addStringOption(o => o.setName('texto').setDescription('Texto del anuncio').setRequired(true)),

  new SlashCommandBuilder()
    .setName('anunciosch')
    .setDescription('Enviar anuncio al canal CH')
    .addStringOption(o => o.setName('texto').setDescription('Texto del anuncio').setRequired(true)),

  // ===== NUEVO COMANDO /CARNET =====
  new SlashCommandBuilder()
    .setName('carnet')
    .setDescription('Generar carnet de identificacion militar')
    .addStringOption(o => 
      o.setName('nombre_completo')
        .setDescription('Nombre completo del marine')
        .setRequired(true)
        .setMaxLength(40)
    )
    .addStringOption(o => 
      o.setName('foto_soldado')
        .setDescription('Elige tu foto de soldado')
        .setRequired(true)
        .addChoices(
          { name: 'Soldado 1', value: 'soldado1' },
          { name: 'Soldado 2', value: 'soldado2' },
          { name: 'Soldado 3', value: 'soldado3' },
          { name: 'Soldado 4', value: 'soldado4' },
          { name: 'Soldado 5', value: 'soldado5' },
          { name: 'Cupula de la faccion', value: 'soldado6' },
          { name: 'Cupula', value: 'soldado7' },
          { name: 'Fuerzas Especiales', value: 'soldado8' }
        )
    )
    .addStringOption(o => 
      o.setName('rango')
        .setDescription('Tu rango')
        .setRequired(true)
        .addChoices(
          { name: 'Private (PVT)', value: 'PVT' },
          { name: 'Private First Class (PFC)', value: 'PFC' },
          { name: 'Lance Corporal (LCPL)', value: 'LCPL' },
          { name: 'Corporal (CPL)', value: 'CPL' },
          { name: 'Sergeant (SGT)', value: 'SGT' },
          { name: 'Staff Sergeant (SSGT)', value: 'SSGT' },
          { name: 'Gunnery Sergeant (GYSGT)', value: 'GYSGT' },
          { name: 'Master Sergeant (MSGT)', value: 'MSGT' },
          { name: 'First Sergeant (1SGT)', value: '1SGT' },
          { name: 'Master Gunnery Sergeant (MGYSGT)', value: 'MGYSGT' },
          { name: 'Sergeant Major (SGTMAJ)', value: 'SGTMAJ' },
          { name: 'Warrant Officer 1 (WO-1)', value: 'WO-1' },
          { name: 'Chief Warrant Officer 2 (CWO-2)', value: 'CWO-2' },
          { name: 'Chief Warrant Officer 3 (CWO-3)', value: 'CWO-3' },
          { name: 'Chief Warrant Officer 4 (CWO-4)', value: 'CWO-4' },
          { name: 'Chief Warrant Officer 5 (CWO-5)', value: 'CWO-5' },
          { name: 'Second Lieutenant (2LT)', value: '2LT' },
          { name: 'First Lieutenant (1LT)', value: '1LT' },
          { name: 'Captain (CPT)', value: 'CPT' },
          { name: 'Major (MAJ)', value: 'MAJ' },
          { name: 'Lieutenant Colonel (LTCOL)', value: 'LTCOL' },
          { name: 'Colonel (COL)', value: 'COL' },
          { name: 'Brigadier General (BGEN)', value: 'BGEN' },
          { name: 'Major General (MAJGEN)', value: 'MAJGEN' },
          { name: 'Lieutenant General (LTGEN)', value: 'LTGEN' },
          { name: 'General (GEN)', value: 'GEN' }
        )
    )
    .addStringOption(o => 
      o.setName('pay_grade')
        .setDescription('Grado de pago')
        .setRequired(true)
        .addChoices(
          { name: 'E-1', value: 'E-1' },
          { name: 'E-2', value: 'E-2' },
          { name: 'E-3', value: 'E-3' },
          { name: 'E-4', value: 'E-4' },
          { name: 'E-5', value: 'E-5' },
          { name: 'E-6', value: 'E-6' },
          { name: 'E-7', value: 'E-7' },
          { name: 'E-8', value: 'E-8' },
          { name: 'E-9', value: 'E-9' },
          { name: 'W-1', value: 'W-1' },
          { name: 'W-2', value: 'W-2' },
          { name: 'W-3', value: 'W-3' },
          { name: 'W-4', value: 'W-4' },
          { name: 'W-5', value: 'W-5' },
          { name: 'O-1', value: 'O-1' },
          { name: 'O-2', value: 'O-2' },
          { name: 'O-3', value: 'O-3' },
          { name: 'O-4', value: 'O-4' },
          { name: 'O-5', value: 'O-5' },
          { name: 'O-6', value: 'O-6' },
          { name: 'O-7', value: 'O-7' },
          { name: 'O-8', value: 'O-8' },
          { name: 'O-9', value: 'O-9' },
          { name: 'O-10', value: 'O-10' }
        )
    )
    .addStringOption(o => 
      o.setName('especialidad')
        .setDescription('Tu MOS o especialidad')
        .setRequired(true)
        .setMaxLength(30)
    )
    .addStringOption(o => 
      o.setName('regimiento')
        .setDescription('Selecciona tu regimiento')
        .setRequired(true)
        .addChoices(
          { name: '3rd Marine Division', value: '3rd_marines' },
          { name: '1st Regiment Marine Raiders', value: '1st_raiders' },
          { name: '3rd Marine Aircraft Wing', value: '3rd_aircraft' },
          { name: '3rd Marine Littoral Regiment', value: '3rd_littoral' },
          { name: 'Combat Logistics Regiment 3', value: 'clr3' },
          { name: 'Marine Corps Recruit Depot (San Diego)', value: 'mcrd_sandiego' }
        )
    )
    .addStringOption(o => 
      o.setName('fecha_ingreso')
        .setDescription('Fecha de ingreso (DD/MM/AA)')
        .setRequired(true)
    )
    .addStringOption(o => 
      o.setName('fecha_expiracion')
        .setDescription('Fecha de expiracion (DD/MM/AA)')
        .setRequired(true)
    )
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

      const member = interaction.guild?.members.cache.get(usuario.id);
      const nombreDisplay = member ? member.displayName || member.user.username : usuario.username;

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription('Se agregaron ' + cantidad + ' efectividades a ' + nombreDisplay + '. Total: ' + data[usuario.id]);

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

      const member = interaction.guild?.members.cache.get(usuario.id);
      const nombreDisplay = member ? member.displayName || member.user.username : usuario.username;

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription('Se retiraron ' + cantidad + ' efectividades a ' + nombreDisplay + '. Total: ' + data[usuario.id]);

      return interaction.reply({ embeds: [embed] });
    }

    // ===== MEP =====
    if (interaction.commandName === 'mep') {
      if (!interaction.member.roles.cache.has(ROL_USUARIO)) {
        return interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
      }

      const efectividades = data[userId] || 0;

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('CONSULTA DE EFECTIVIDADES')
        .setDescription('Usuario: ' + interaction.user.username + '\nEfectividades actuales: ' + efectividades);

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
        const rango = member ? obtenerRango(member) : 'PVT';
        const nombre = member ? member.displayName || member.user.username : 'Desconocido';
        const posicion = (index + 1).toString().padStart(2, '0');
        return '\`' + posicion + '\` ' + rango + ' | ' + nombre + ' = ' + efectividades;
      });

      const embedPrincipal = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('EFECTIVIDADES DEL DIA')
        .setDescription(lineasPrincipal.join('\n') || 'Sin registros disponibles')
        .setFooter({ text: fechaHoy + ' | Generado por ' + interaction.user.username });

      const lineasStaff = rankingOrdenado.map(([id, efectividades], index) => {
        const memberPrincipal = guildPrincipal?.members.cache.get(id);
        const memberStaff = guildStaff?.members.cache.get(id);
        const rango = memberPrincipal ? obtenerRango(memberPrincipal) : 'PVT';
        const nombre = memberPrincipal ? memberPrincipal.displayName || memberPrincipal.user.username : 'Desconocido';
        const posicion = (index + 1).toString().padStart(2, '0');
        const total = rankingOrdenado.reduce((a, b) => a + b[1], 0);
        const porcentaje = total > 0 ? ((efectividades / total) * 100).toFixed(1) : 0;
        const sincronizacion = memberStaff ? 'Activo' : 'Inactivo';

        return '\`' + posicion + '\` ' + rango + ' | ' + nombre + '\n' +
               'Efectividades: ' + efectividades + ' | ' + porcentaje + '% | ' + sincronizacion;
      });

      const totalEfectividades = rankingOrdenado.reduce((a, b) => a + b[1], 0);
      const promedio = rankingOrdenado.length > 0 ? (totalEfectividades / rankingOrdenado.length).toFixed(1) : 0;

      const embedStaff = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('EFECTIVIDADES DETALLADAS - STAFF')
        .setDescription(lineasStaff.join('\n\n') || 'Sin registros disponibles')
        .addFields({
          name: 'Resumen',
          value: 'Total: ' + totalEfectividades + ' | Promedio: ' + promedio + ' | Participantes: ' + rankingOrdenado.length
        })
        .setFooter({ text: fechaHoy + ' | Generado por ' + interaction.user.tag });

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
        .setColor(0x8B0000)
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
        .setColor(0x8B0000)
        .setTitle('REINICIO COMPLETADO')
        .setDescription('Todos los registros han sido restablecidos a cero. El sistema esta listo para nueva acumulacion.');

      return interaction.reply({ embeds: [embed], ephemeral: true });
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
      const nombreDisplay = member ? member.displayName || member.user.username : usuario.username;

      const hiloTickets = await obtenerCanal(HILO_TICKETS);

      if (hiloTickets && hiloTickets.isTextBased()) {
        const embedRegistro = new EmbedBuilder()
          .setColor(0x8B0000)
          .setTitle('REGISTRO DE TICKET')
          .setDescription(
            'Usuario: ' + nombreDisplay + '\n' +
            'Atendido por: ' + interaction.user.username + '\n' +
            'Puntos totales: ' + ticketsData[usuario.id] + '\n' +
            'Fecha: ' + new Date().toLocaleDateString('es-ES', { timeZone: 'America/New_York' })
          );

        await hiloTickets.send({ embeds: [embedRegistro] });
      }

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription('Se agrego 1 punto a ' + nombreDisplay + ' por ticket atendido. Total: ' + ticketsData[usuario.id]);

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
        const nombre = member ? member.displayName || member.user.username : 'Desconocido';
        const posicion = (index + 1).toString().padStart(2, '0');
        return '\`' + posicion + '\` ' + rango + ' | ' + nombre + ' = ' + puntos;
      });

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('TOP DE PUNTOS - TICKETS')
        .setDescription(lineas.join('\n') || 'Sin registros disponibles')
        .setFooter({ text: fechaHoy + ' | Generado por ' + interaction.user.username });

      return interaction.reply({ embeds: [embed] });
    }

    // ===== ANUNCIOS =====
    if (interaction.commandName === 'anuncios') {
      if (!tieneAlgunRol(interaction.member, ROLES_ANUNCIOS)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const texto = interaction.options.getString('texto');
      const canal = await obtenerCanal(CANAL_ANUNCIOS);

      if (!canal || !canal.isTextBased()) {
        return interaction.reply({ content: 'No se pudo acceder al canal de anuncios.', ephemeral: true });
      }

      const textoFormateado = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription(textoFormateado);

      await canal.send({ embeds: [embed] });

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription('Anuncio enviado correctamente.');

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== ANUNCIOSLS1 =====
    if (interaction.commandName === 'anunciosls1') {
      if (!tieneAlgunRol(interaction.member, ROLES_ANUNCIOS)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const texto = interaction.options.getString('texto');
      const canal = await obtenerCanal(CANAL_ANUNCIOS_LS);

      if (!canal || !canal.isTextBased()) {
        return interaction.reply({ content: 'No se pudo acceder al canal.', ephemeral: true });
      }

      const textoFormateado = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription(textoFormateado);

      await canal.send({ embeds: [embed] });

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription('Anuncio enviado a LS1 correctamente.');

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== ANUNCIOSLS2 =====
    if (interaction.commandName === 'anunciosls2') {
      if (!tieneAlgunRol(interaction.member, ROLES_ANUNCIOS)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const texto = interaction.options.getString('texto');
      const canal = await obtenerCanal(CANAL_ANUNCIOS_LS);

      if (!canal || !canal.isTextBased()) {
        return interaction.reply({ content: 'No se pudo acceder al canal.', ephemeral: true });
      }

      const textoFormateado = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription(textoFormateado);

      await canal.send({ embeds: [embed] });

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription('Anuncio enviado a LS2 correctamente.');

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
    }

    // ===== ANUNCIOSCH =====
    if (interaction.commandName === 'anunciosch') {
      if (!tieneAlgunRol(interaction.member, ROLES_ANUNCIOS)) {
        return interaction.reply({ content: 'Acceso denegado. Comando exclusivo para personal autorizado.', ephemeral: true });
      }

      const texto = interaction.options.getString('texto');
      const canal = await obtenerCanal(CANAL_ANUNCIOS_CH);

      if (!canal || !canal.isTextBased()) {
        return interaction.reply({ content: 'No se pudo acceder al canal.', ephemeral: true });
      }

      const textoFormateado = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription(textoFormateado);

      await canal.send({ embeds: [embed] });

      const embedConfirmacion = new EmbedBuilder()
        .setColor(0x8B0000)
        .setDescription('Anuncio enviado a CH correctamente.');

      return interaction.reply({ embeds: [embedConfirmacion], ephemeral: true });
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
          'Correo: KenwayHaytham005@gmail.com\n' +
          'Contrasena: UMCSacceso501\n\n' +
          'Advertencia: El uso de estas credenciales implica la aceptacion de los terminos establecidos. Cualquier comparticion no autorizada o modificacion indebida sera sancionada.'
        );

      await interaction.reply({ content: interaction.user.username + ' ha aceptado los terminos. Procediendo con la entrega de credenciales y guia:' });
      await interaction.followUp({ embeds: [embedInstalacion] });
      await interaction.followUp({ embeds: [embedPaso2] });
      await interaction.followUp({ embeds: [embedPaso3] });
      await interaction.followUp({ embeds: [embedConfig] });
      await interaction.followUp({ embeds: [embedConfig2] });
      await interaction.followUp({ embeds: [embedConfig3] });
      await interaction.followUp({ embeds: [embedCuenta] });

      return;
    }

    // ===== CARNET =====
    if (interaction.commandName === 'carnet') {
      if (!interaction.member.roles.cache.has(ROL_USUARIO)) {
        return interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
      }

      await interaction.deferReply();

      const nombreCompleto = interaction.options.getString('nombre_completo');
      const fotoKey = interaction.options.getString('foto_soldado');
      const rango = interaction.options.getString('rango');
      const payGrade = interaction.options.getString('pay_grade');
      const especialidad = interaction.options.getString('especialidad');
      const regimientoKey = interaction.options.getString('regimiento');
      const fechaIngreso = interaction.options.getString('fecha_ingreso');
      const fechaExpiracion = interaction.options.getString('fecha_expiracion');

      const regimientoData = REGIMIENTOS[regimientoKey];
      const fotoURL = FOTOS_SOLDADO[fotoKey];

      // === GENERAR CANVAS ===
      const canvas = createCanvas(800, 1200);
      const ctx = canvas.getContext('2d');

      // 1. FONDO NEGRO
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 800, 1200);

      // 2. BARRAS ROJAS
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(0, 0, 800, 40);
      ctx.fillRect(0, 1160, 800, 40);

      // 3. ESQUINAS
      ctx.fillStyle = '#8B0000';
      [
        [40, 40, 60], [760, 40, 60],
        [40, 1160, 60], [760, 1160, 60]
      ].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. MARCO
      ctx.strokeStyle = '#8B0000';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 1140);

      // 5. ENCABEZADO
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('UNITED STATES MARINE CORPS', 400, 75);
      ctx.fillStyle = '#c0c0c0';
      ctx.font = '16px Arial';
      ctx.fillText('OFFICIAL IDENTIFICATION CARD', 400, 95);

      // 6. FOTO DEL SOLDADO (desde URL)
      try {
        const fotoImage = await loadImage(fotoURL);
        const fotoX = 60, fotoY = 120, fotoW = 280, fotoH = 350;

        const ratio = Math.max(fotoW / fotoImage.width, fotoH / fotoImage.height);
        const shiftX = (fotoW - fotoImage.width * ratio) / 2;
        const shiftY = (fotoH - fotoImage.height * ratio) / 2;

        ctx.drawImage(
          fotoImage,
          0, 0, fotoImage.width, fotoImage.height,
          fotoX + shiftX, fotoY + shiftY,
          fotoImage.width * ratio, fotoImage.height * ratio
        );

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 4;
        ctx.strokeRect(fotoX, fotoY, fotoW, fotoH);

      } catch (imgErr) {
        console.error('Error foto soldado:', imgErr);
        ctx.fillStyle = '#333';
        ctx.fillRect(60, 120, 280, 350);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('IMAGEN NO', 200, 280);
        ctx.fillText('DISPONIBLE', 200, 310);
      }

      // 7. NOMBRE
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Arial';
      ctx.textAlign = 'center';
      
      const nombreUpper = nombreCompleto.toUpperCase();
      const partes = nombreUpper.split(' ');
      
      if (nombreUpper.length > 22) {
        const mitad = Math.ceil(partes.length / 2);
        ctx.fillText(partes.slice(0, mitad).join(' '), 200, 500);
        ctx.fillText(partes.slice(mitad).join(' '), 200, 530);
      } else {
        ctx.fillText(nombreUpper, 200, 515);
      }

      // 8. DATOS DERECHA
      const xDer = 400;
      let yPos = 140;

      function dibujarCampo(titulo, valor, color = '#FFD700') {
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(titulo.toUpperCase(), xDer, yPos);
        
        ctx.fillStyle = color;
        ctx.font = 'bold 30px Arial';
        ctx.fillText(valor.toUpperCase(), xDer, yPos + 32);
        
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xDer, yPos + 42);
        ctx.lineTo(740, yPos + 42);
        ctx.stroke();
        
        yPos += 72;
      }

      dibujarCampo('RANK', rango);
      dibujarCampo('PAY GRADE', payGrade);
      dibujarCampo('MOS / SPECIALTY', especialidad);
      dibujarCampo('DATE OF ENTRY', fechaIngreso);
      dibujarCampo('EXPIRATION DATE', fechaExpiracion, '#ff6666');
      dibujarCampo('UNIT / REGIMENT', regimientoData.abreviatura, '#ffffff');

      // 9. SEMPER FIDELIS
      ctx.save();
      ctx.translate(22, 720);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#8B0000';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SEMPER FIDELIS', 0, 0);
      ctx.restore();

      // 10. ESCUDO CENTRAL
      ctx.beginPath();
      ctx.arc(400, 760, 100, 0, Math.PI * 2);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 6;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(400, 760, 88, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('UNITED STATES', 400, 740);
      ctx.font = 'bold 22px Arial';
      ctx.fillText('MARINE CORPS', 400, 765);
      ctx.font = 'bold 12px Arial';
      ctx.fillText('SINCE 1775', 400, 790);

      // 11. LOGO DEL REGIMIENTO (desde URL)
      try {
        const logoImage = await loadImage(regimientoData.logo);
        const logoX = 580, logoY = 680, logoSize = 140;

        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 5, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        ctx.restore();

        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(regimientoData.abreviatura, logoX + logoSize/2, logoY + logoSize + 20);

      } catch (logoErr) {
        console.error('Error logo:', logoErr);
        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(regimientoData.abreviatura, 650, 750);
      }

      // 12. BANDERA USA
      ctx.fillStyle = '#3C3B6E';
      ctx.fillRect(60, 1040, 80, 55);
      ctx.fillStyle = '#B22234';
      for (let i = 0; i < 7; i += 2) {
        ctx.fillRect(140, 1040 + (i * 8), 40, 8);
      }
      ctx.fillStyle = '#FFFFFF';
      for (let i = 1; i < 6; i += 2) {
        ctx.fillRect(140, 1040 + (i * 8), 40, 8);
      }
      ctx.fillStyle = '#FFFFFF';
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 6; col++) {
          ctx.beginPath();
          ctx.arc(68 + (col * 12), 1048 + (row * 10), 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 13. TEXTO MARINES
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('MARINES', 155, 1075);
      
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '13px Arial';
      ctx.fillText('THE OFFICIAL WEBSITE OF THE UNITED', 155, 1095);
      ctx.fillText('STATES MARINE CORPS', 155, 1110);

      // 14. CODIGO DE BARRAS
      ctx.fillStyle = '#ffffff';
      const barX = 620;
      for (let i = 0; i < 35; i++) {
        const ancho = (i % 3 === 0) ? 4 : (i % 2 === 0 ? 3 : 2);
        const gap = (i % 5 === 0) ? 6 : 4;
        ctx.fillRect(barX + (i * gap), 940, ancho, 100);
      }
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`ID: USMC-${interaction.user.id.slice(-8).toUpperCase()}`, barX + 80, 1055);

      // 15. CHIP
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.roundRect(680, 1040, 90, 55, 10);
      ctx.fill();
      ctx.fillStyle = '#8B6914';
      ctx.beginPath();
      ctx.roundRect(685, 1045, 80, 45, 8);
      ctx.fill();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(695, 1055);
      ctx.lineTo(755, 1055);
      ctx.moveTo(695, 1068);
      ctx.lineTo(755, 1068);
      ctx.stroke();

      // 16. FOOTER
      ctx.fillStyle = '#666666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`CARD ID: ${interaction.user.id} | USMC OFFICIAL`, 780, 1145);

      // === EXPORTAR ===
      const buffer = await canvas.encode('png');
      const attachment = new AttachmentBuilder(buffer, { 
        name: `carnet_${interaction.user.id}.png` 
      });

      // Guardar en data.json
      if (!data.carnets) data.carnets = {};
      data.carnets[interaction.user.id] = {
        nombre: nombreCompleto,
        foto: fotoKey,
        rango: rango,
        payGrade: payGrade,
        especialidad: especialidad,
        regimiento: regimientoKey,
        fechaIngreso: fechaIngreso,
        fechaExpiracion: fechaExpiracion,
        generadoEn: new Date().toISOString()
      };
      saveData(data);

      const embed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle('🎖️ CARNET GENERADO')
        .setDescription(
          `**${nombreCompleto.toUpperCase()}**\n` +
          `Rango: **${rango}** (${payGrade})\n` +
          `Unidad: **${regimientoData.nombre}**\n` +
          `MOS: **${especialidad}**` 
        )
        .setImage(`attachment://carnet_${interaction.user.id}.png`)
        .setFooter({ text: `USMC ID: ${interaction.user.id.slice(-8)} | ${fechaIngreso} - ${fechaExpiracion}` });

      return interaction.editReply({ embeds: [embed], files: [attachment] });

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
