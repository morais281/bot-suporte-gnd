const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Sistema para manter o Render ativo
app.get('/', (req, res) => {
  res.send('🚀 Bot Supremo Online e Ativo!');
});

app.listen(port, () => {
  console.log(`💻 Servidor Web ativo na porta ${port}`);
});

// ==========================================
// 🔥 CÓDIGO DO DISCORD DO TEU BOT
// ==========================================
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ] 
});

// --- 🛠️ CONFIGURAÇÃO DOS TEUS IDS ---
const TOKEN = process.env.DISCORD_TOKEN;
const ID_CARGO_STAFF = '1499088671025004544'; 
const ID_CANAL_LOGS = '1499089270021820476';   

const CAT_GERAIS = '1499088921118773453';
const CAT_VIPS = '1499088908611227808';
const CAT_BUGS = '1499088913002926341';
const CAT_ORGS = '1499088905516093522';
const CAT_BANS = '1499088916899430430';

const ticketsAtivos = new Map();

client.once('ready', async () => {
    console.log(`🔥 MAQUINA LIGADA! Bot online em: ${client.user.tag}`);

    const comandos = [
        new SlashCommandBuilder()
            .setName('ticket')
            .setDescription('Envia o painel de suporte avançado para a comunidade'),
        new SlashCommandBuilder()
            .setName('embed')
            .setDescription('Cria um comunicado porreito em Embed (Apenas Staff)')
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: comandos });
        console.log('✨ Tudo sincronizado! Comandos /ticket e /embed prontos a bombar.');
    } catch (error) {
        console.error('Houve um stress a registar os comandos:', error);
    }
});

// 1. COMANDOS SLASH
client.on('interactionCreate', async (interaction) => {
    const dadosTicket = ticketsAtivos.get(interaction.channel?.id);

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'ticket') {
            const embedPainel = new EmbedBuilder()
                .setColor('#00ffc8')
                .setTitle('🎫 CENTRAL DE ATENDIMENTO & SUPORTE')
                .setDescription('Boas! Precisas de falar com a nossa equipa, tirar dúvidas, resolver problemas com o teu VIP ou reportar um bug? Estás no sítio certo!\n\n**Escolhe a categoria adequada** no menu abaixo para abrir um chat privado e direto com a Staff.\n\n*⚠️ Evita abrir tickets à toa para não sobrecarregar a equipa. Tamo junto!*')
                .addFields(
                    { name: '⏰ Resposta Rápida', value: '🟢 Disponível 24/7 (Respondemos o mais rápido possível!)', inline: false },
                    { name: '🔒 Totalmente Seguro', value: 'O teu atendimento é 100% privado e confidencial.', inline: false }
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `${interaction.guild.name} • Suporte Ativo`, iconURL: client.user.displayAvatarURL() });

            const menuSelecao = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('selecionar_motivo_ticket')
                    .setPlaceholder('Seleciona o motivo do teu contacto aqui...')
                    .addOptions([
                        { label: 'Assuntos Gerais', description: 'Dúvidas comuns, sugestões ou suporte geral', value: 'geral', emoji: '💬' },
                        { label: 'Área VIP', description: 'Dúvidas, ativações ou problemas com o teu plano', value: 'vip', emoji: '👑' },
                        { label: 'Reportar Bugs', description: 'Encontraste um erro? Avisa-nos aqui para resolvermos', value: 'bug', emoji: '🐛' },
                        { label: 'Gestor de Organização', description: 'Assuntos e suporte direcionados às Organizações', value: 'org', emoji: '🛡️' },
                        { label: 'Contestar Ban', description: 'Pedir revisão de punições aplicadas no servidor', value: 'ban', emoji: '🚫' },
                    ])
            );
            await interaction.reply({ content: '✅ Painel de atendimento enviado com sucesso!', ephemeral: true });
            return await interaction.channel.send({ embeds: [embedPainel], components: [menuSelecao] });
        }

        if (interaction.commandName === 'embed') {
            if (!interaction.member.roles.cache.has(ID_CARGO_STAFF)) {
                return interaction.reply({ content: '❌ Esbarra aí! Só a Staff pode usar este comando.', ephemeral: true });
            }

            const modal = new ModalBuilder().setCustomId('modal_criar_embed').setTitle('🎨 CRIADOR DE ANÚNCIOS');
            const inputTitulo = new TextInputBuilder().setCustomId('embed_titulo').setLabel('Título do Anúncio:').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Escreve algo chamativo...');
            const inputDescricao = new TextInputBuilder().setCustomId('embed_descricao').setLabel('Texto do Anúncio:').setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Mete aqui o texto detalhado da mensagem...');

            modal.addComponents(new ActionRowBuilder().addComponents(inputTitulo), new ActionRowBuilder().addComponents(inputDescricao));
            return await interaction.showModal(modal);
        }
    }

    // 2. CRIAÇÃO DO TICKET VIA DROPDOWN
    if (interaction.isStringSelectMenu() && interaction.customId === 'selecionar_motivo_ticket') {
        const guild = interaction.guild; const escolha = interaction.values[0];
        let categoriaAlvo = ''; let nomeVisual = ''; let corEmbed = '#ffffff';
        if (escolha === 'geral') { categoriaAlvo = CAT_GERAIS; nomeVisual = 'Assuntos Gerais 💬'; corEmbed = '#5865F2'; }
        if (escolha === 'vip') { categoriaAlvo = CAT_VIPS; nomeVisual = 'Área VIP 👑'; corEmbed = '#FEE75C'; }
        if (escolha === 'bug') { categoriaAlvo = CAT_BUGS; nomeVisual = 'Reporte de Bug 🐛'; corEmbed = '#ED4245'; }
        if (escolha === 'org') { categoriaAlvo = CAT_ORGS; nomeVisual = 'Gestor de Organização ✨'; corEmbed = '#57F287'; }
        if (escolha === 'ban') { categoriaAlvo = CAT_BANS; nomeVisual = 'Contestação de Ban 🚫'; corEmbed = '#EB459E'; }

        const nomeCanal = `${escolha}-${interaction.user.username}`.toLowerCase();
        const canalExiste = guild.channels.cache.find(c => c.name === nomeCanal);
        if (canalExiste) return interaction.reply({ content: `⚠️ Calma lá! Já tens um ticket aberto para esta categoria: ${canalExiste}`, ephemeral: true });

        await interaction.reply({ content: `⚡ Segura aí, estamos a montar o teu ticket de **${nomeVisual}**...`, ephemeral: true });

        const ticketChannel = await guild.channels.create({
            name: nomeCanal, type: ChannelType.GuildText, parent: categoriaAlvo,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                { id: ID_CARGO_STAFF, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
            ],
        });

        ticketsAtivos.set(ticketChannel.id, { jogadorId: interaction.user.id, staffId: null, category: nomeVisual });

        const embedTicket = new EmbedBuilder()
            .setColor(corEmbed)
            .setTitle(`🎯 SUPORTE ATIVO: ${nomeVisual.toUpperCase()}`)
            .setDescription(`Boas ${interaction.user}!\n\nEste é o teu canal privado. Deixa já uma **explicação detalhada** sobre o teu problema ou dúvida para adiantar o processo.\n\nA nossa equipa de <@&${ID_CARGO_STAFF}> já foi alertada e cola aqui num instante.\n\n**📊 GESTÃO DO TICKET:**\n👤 **Dono do Ticket:** <@${interaction.user.id}>\n👮 **Staff Encarregue:** *Aguardando que um Staff assuma...*`)
            .setFooter({ text: 'Membros da Staff podem usar o painel abaixo para controlar o ticket.' });

        const fila1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('assumir_ticket').setLabel('Assumir Atendimento').setEmoji('🛡️').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );
        const fila2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ping_jogador').setLabel('Chamar Jogador').setEmoji('👤').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ping_staff').setLabel('Alertar Staff').setEmoji('📢').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('add_membro_modal').setLabel('Puxar Membro').setEmoji('➕').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('renomear_canal_modal').setLabel('Alterar Nome').setEmoji('✏️').setStyle(ButtonStyle.Secondary)
        );

        await ticketChannel.send({ content: `🔔 **Aviso de Suporte:** ${interaction.user} | <@&${ID_CARGO_STAFF}>`, embeds: [embedTicket], components: [fila1, fila2] });
        return await interaction.editReply({ content: `🚀 Tudo pronto! O teu ticket foi criado aqui: ${ticketChannel}` });
    }

    // 3. ENVIO DOS MODALS
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_criar_embed') {
            const titulo = interaction.fields.getTextInputValue('embed_titulo');
            const descricao = interaction.fields.getTextInputValue('embed_descricao');
            const embed = new EmbedBuilder().setColor('#00ffc8').setTitle(`📢 ${titulo.toUpperCase()}`).setDescription(descricao).setTimestamp().setFooter({ text: `${interaction.guild.name} • Comunicado Oficial` });
            await interaction.reply({ content: '🔥 Feito! Embed enviada num piscar de olhos.', ephemeral: true });
            return await interaction.channel.send({ embeds: [embed] });
        }

        if (interaction.customId === 'modal_add_membro') {
            const idMembro = interaction.fields.getTextInputValue('id_membro');
            const membro = await interaction.guild.members.fetch(idMembro).catch(() => null);
            if (!membro) return interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('❌ Esse ID não corresponde a nenhum membro válido do servidor!')], ephemeral: true });
            await interaction.channel.permissionOverwrites.edit(membro.id, { ViewChannel: true, SendMessages: true, AttachFiles: true });
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription(`➕ **Entrada Autorizada:** O membro <@${membro.id}> foi adicionado ao ticket por ${interaction.user}.`)] });
        }

        if (interaction.customId === 'modal_renomear') {
            const novoNome = interaction.fields.getTextInputValue('novo_nome').toLowerCase().replace(/\s+/g, '-');
            await interaction.channel.setName(novoNome);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setDescription(`✏️ **Nome Atualizado:** O canal foi rebatizado para **${novoNome}**.`)] });
        }
    }

    // 4. BOTOES
    if (interaction.isButton()) {
        if (interaction.customId === 'ping_jogador') {
            if (!dadosTicket) return interaction.reply({ content: 'Erro ao carregar dados do ticket.', ephemeral: true });
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setDescription(`🔔 <@${dadosTicket.jogadorId}>, a nossa equipa está à tua espera aqui no chat! Dá um sinal de vida.`)] });
        }
        if (interaction.customId === 'ping_staff') {
            return interaction.reply({ content: `<@&${ID_CARGO_STAFF}>`, embeds: [new EmbedBuilder().setColor('#FEE75C').setDescription(`📢 <@&${ID_CARGO_STAFF}>, este atendimento precisa de um bocado de atenção da vossa parte!`)] });
        }
        if (interaction.customId === 'add_membro_modal') {
            const modal = new ModalBuilder().setCustomId('modal_add_membro').setTitle('Puxar Membro Pro Ticket');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('id_membro').setLabel('Mete aqui o ID do gajo:').setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }
        if (interaction.customId === 'renomear_canal_modal') {
            const modal = new ModalBuilder().setCustomId('modal_renomear').setTitle('Mudar Nome do Canal');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('novo_nome').setLabel('Novo nome do ticket:').setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'assumir_ticket') {
            if (!interaction.member.roles.cache.has(ID_CARGO_STAFF)) return interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('❌ Calma lá, parceiro. Tu não fazes parte da Staff para assumir isto!')], ephemeral: true });
            if (dadosTicket && dadosTicket.staffId) return interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('❌ Tarde demais! Este ticket já foi agarrado por outro Staff.')], ephemeral: true });

            if (dadosTicket) dadosTicket.staffId = interaction.user.id;
            await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription(`👮 **Suporte Iniciado:** O Staff ${interaction.user} assumiu as rédeas deste atendimento!`)] });

            const embedOriginal = interaction.message.embeds[0];
            const novaEmbed = EmbedBuilder.from(embedOriginal).setDescription(`Olá <@${dadosTicket.jogadorId}>,\n\nExplica detalhadamente a tua situação.\n\n**📊 GESTÃO DO TICKET:**\n👤 **Dono do Ticket:** <@${dadosTicket.jogadorId}>\n👮 **Staff Encarregue:** <@${interaction.user.id}>`);
            const fila1Atualizada = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger));
            const fila2Mantida = new ActionRowBuilder().addComponents(interaction.message.components[1].components.map(c => ButtonBuilder.from(c)));
            return await interaction.message.edit({ embeds: [novaEmbed], components: [fila1Atualizada, fila2Mantida] });
        }

        if (interaction.customId === 'fechar_ticket') {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('🔒 **O atendimento terminou!** Vou fechar o ticket e apagar este canal em 5 segundos...')] });
            if (dadosTicket) {
                const jogador = await client.users.fetch(dadosTicket.jogadorId).catch(() => null);
                if (jogador) {
                    const embedFeed = new EmbedBuilder().setColor('#5865F2').setTitle('⭐ A TUA OPINIÃO CONTA!').setDescription(`O teu ticket no servidor foi encerrado.\n\nPara nos ajudares a melhorar a comunidade, clica abaixo e avalia a qualidade do atendimento que recebeste:`);
                    const staffId = dadosTicket.staffId || 'ninguem';
                    const estrelas = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`voto_1_${staffId}`).setLabel('1 ⭐ Bad').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`voto_2_${staffId}`).setLabel('2 ⭐ Mágico').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`voto_3_${staffId}`).setLabel('3 ⭐ OK').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`voto_4_${staffId}`).setLabel('4 ⭐ Top').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`voto_5_${staffId}`).setLabel('5 ⭐ Brutal').setStyle(ButtonStyle.Primary)
                    );
                    await jogador.send({ embeds: [embedFeed], components: [estrelas] }).catch(() => null);
                }
            }
            return setTimeout(() => { interaction.channel.delete().catch(console.error); }, 5000);
        }

        if (interaction.customId.startsWith('voto_')) {
            const partes = interaction.customId.split('_'); const nota = partes[1]; const staffAtendeuId = partes[2];
            await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription(`⭐ **Feedback Registado:** Obrigado por dares uma nota de **${nota}/5**!`)], ephemeral: true });
            await interaction.message.edit({ components: [] });

            const guildParaLog = client.guilds.cache.first(); const canalLogs = guildParaLog.channels.cache.get(ID_CANAL_LOGS);
            if (canalLogs) {
                const embedResultadoFeed = new EmbedBuilder().setColor('#FEE75C').setTitle('📊 NOVO FEEDBACK RECEBIDO').addFields({ name: '👮 Staff Avaliado', value: staffAtendeuId === 'ninguem' ? '*Ninguém*' : `<@${staffAtendeuId}>`, inline: true }, { name: '⭐ Classificação', value: `**${nota} / 5 Estrelas**` }).setTimestamp();
                return canalLogs.send({ embeds: [embedResultadoFeed] });
            }
        }
    }
});

// ==========================================
// 🔥 MÓDULO DE LOGS SUPREMO (DO SERVIDOR)
// ==========================================
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const canalLogs = newMember.guild.channels.cache.get(ID_CANAL_LOGS); if (!canalLogs) return;
    const embed = new EmbedBuilder().setTimestamp().setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }));

    if (!oldMember.communicationDisabledUntilTimestamp && newMember.communicationDisabledUntilTimestamp) {
        embed.setColor('#ff9f43').setTitle('🤫 TIMEOUT APLICADO').setDescription(`O utilizador ${newMember} levou mute/castigo até <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>.`);
        return canalLogs.send({ embeds: [embed] });
    }
    if (oldMember.communicationDisabledUntilTimestamp && !newMember.communicationDisabledUntilTimestamp) {
        embed.setColor('#57F287').setTitle('🔊 TIMEOUT REMOVIDO').setDescription(`O castigo do utilizador ${newMember} foi levantado.`);
        return canalLogs.send({ embeds: [embed] });
    }
    const cargosAdicionados = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const cargosRemovidos = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
    if (cargosAdicionados.size > 0) {
        embed.setColor('#3498db').setTitle('🛡️ CARGO ATRIBUÍDO').setDescription(`O membro ${newMember} recebeu o cargo:\n${cargosAdicionados.map(r => `${r}`).join(', ')}`);
        return canalLogs.send({ embeds: [embed] });
    }
    if (cargosRemovidos.size > 0) {
        embed.setColor('#ED4245').setTitle('🛡️ CARGO RETIRADO').setDescription(`Foram retirados os cargos ao membro ${newMember}:\n${cargosRemovidos.map(r => `${r}`).join(', ')}`);
        return canalLogs.send({ embeds: [embed] });
    }
});

client.on('channelCreate', (channel) => {
    const canalLogs = channel.guild.channels.cache.get(ID_CANAL_LOGS); if (!canalLogs || channel.name.includes('-')) return;
    canalLogs.send({ embeds: [new EmbedBuilder().setColor('#57F287').setTitle('📁 NOVO CANAL CRIADO').setDescription(`Canal criado: **${channel.name}**`).setTimestamp()] });
});

client.on('channelDelete', (channel) => {
    const canalLogs = channel.guild.channels.cache.get(ID_CANAL_LOGS); if (!canalLogs || channel.name.includes('-')) return;
    canalLogs.send({ embeds: [new EmbedBuilder().setColor('#ED4245').setTitle('🗑️ CANAL ELIMINADO').setDescription(`O canal **${channel.name}** foi apagado.`).setTimestamp()] });
});

client.on('messageDelete', (message) => {
    if (message.author?.bot || !message.guild) return;
    const canalLogs = message.guild.channels.cache.get(ID_CANAL_LOGS); if (!canalLogs) return;
    canalLogs.send({ embeds: [new EmbedBuilder().setColor('#ED4245').setTitle('🗑️ MENSAGEM APAGADA').setDescription(`O membro ${message.author} apagou uma mensagem em ${message.channel}:\n\n**Conteúdo:**\n\`${message.content || '[Ficheiro/Media]'}\``).setTimestamp()] });
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author?.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;
    const canalLogs = oldMessage.guild.channels.cache.get(ID_CANAL_LOGS); if (!canalLogs) return;
    canalLogs.send({ embeds: [new EmbedBuilder().setColor('#FEE75C').setTitle('✏️ MENSAGEM EDITADA').setDescription(`O membro ${oldMessage.author} editou uma mensagem em ${oldMessage.channel}:\n\n⬅️ **Antes:** \`${oldMessage.content}\`\n➡️ **Depois:** \`${newMessage.content}\``).setTimestamp()] });
});

client.on('guildMemberAdd', (member) => {
    const canalLogs = member.guild.channels.cache.get(ID_CANAL_LOGS); if (!canalLogs) return;
    canalLogs.send({ embeds: [new EmbedBuilder().setColor('#57F287').setTitle('📥 NOVO MEMBRO').setDescription(`O utilizador ${member} (**${member.user.tag}**) entrou no servidor.`).setTimestamp()] });
});

client.on('guildMemberRemove', (member) => {
    const canalLogs = member.guild.channels.cache.get(ID_CANAL_LOGS); if (!canalLogs) return;
    canalLogs.send({ embeds: [new EmbedBuilder().setColor('#ED4245').setTitle('📤 MEMBRO SAIU').setDescription(`O utilizador **${member.user.tag}** saiu do servidor.`).setTimestamp()] });
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const canalLogs = newState.guild.channels.cache.get(ID_CANAL_LOGS); if (!canalLogs) return;
    const membro = newState.member; const embed = new EmbedBuilder().setTimestamp();

    if (!oldState.channelId && newState.channelId) {
        return canalLogs.send({ embeds: [embed.setColor('#57F287').setTitle('🔊 ENTROU EM CALL').setDescription(`O membro ${membro} entrou em: **${newState.channel.name}**.`)] });
    }
    if (oldState.channelId && !newState.channelId) {
        return canalLogs.send({ embeds: [embed.setColor('#ED4245').setTitle('🔇 SAIU DA CALL').setDescription(`O membro ${membro} saiu de: **${oldState.channel.name}**.`)] });
    }
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        return canalLogs.send({ embeds: [embed.setColor('#FEE75C').setTitle('🔄 MOVIMENTAÇÃO DE CALL').setDescription(`O membro ${membro} mudou de call.\n⬅️ **De:** ${oldState.channel.name}\n➡️ **Para:** ${newState.channel.name}`)] });
    }
});

client.login(TOKEN);