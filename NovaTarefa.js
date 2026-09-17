// Norte — módulo de inserção rápida para Scriptable
// Este arquivo é baixado pelo launcher Norte.js. Não armazena credenciais.

const BOOKMARK = "ClickUP";
const REL_INBOX = "Subprojeto_applocal/export/inbox_captura.ndjson";
const TRIAGEM_LIST_ID = "901327229268";
const TRIAGEM_LIST_NAME = "Triagem";

async function run() {
  const fm = FileManager.iCloud();
  let root;
  try {
    root = fm.bookmarkedPath(BOOKMARK);
  } catch (_) {
    await mensagem("Bookmark não encontrado", `No Scriptable, crie um File Bookmark chamado "${BOOKMARK}" apontando para a pasta ClickUP no iCloud.`);
    return;
  }

  const inboxPath = fm.joinPath(root, REL_INBOX);
  const fila = lerFila(fm, inboxPath);
  const menu = new Alert();
  menu.title = "Norte — inserção rápida";
  menu.message = fila.length ? `${fila.length} item(ns) aguardando importação no Mac.` : "Fila vazia — tudo já foi importado.";
  menu.addAction("⚡ Inserção rápida");
  menu.addAction(`📋 Ver fila pendente (${fila.length})`);
  menu.addCancelAction("Fechar");

  const escolha = await menu.presentSheet();
  if (escolha === 0) await capturar(fm, inboxPath);
  if (escolha === 1) await verFila(fm, inboxPath);
}

async function capturar(fm, inboxPath) {
  const formulario = new Alert();
  formulario.title = "Inserção rápida";
  formulario.message = "Triagem · Execução Imediata · Urgente\n\nA reclassificação será feita no computador.";
  formulario.addTextField("Título da tarefa", "");
  formulario.addTextField("Descrição (opcional)", "");
  formulario.addAction("Adicionar");
  formulario.addCancelAction("Cancelar");
  if ((await formulario.present()) === -1) return;

  const nome = (formulario.textFieldValue(0) || "").trim();
  const desc = (formulario.textFieldValue(1) || "").trim();
  if (!nome) return mensagem("Sem título", "A tarefa precisa de um título.");

  const ts = Date.now();
  anexarNaFila(fm, inboxPath, {
    nome,
    prio: "urgente",
    tipo: "exec",
    lista_id: TRIAGEM_LIST_ID,
    lista_nome: TRIAGEM_LIST_NAME,
    parent_id: null,
    parent_nome: null,
    desc,
    ts,
    uid: `${ts}-${Math.floor(Math.random() * 100000)}`,
  });

  const total = lerFila(fm, inboxPath).length;
  await mensagem("✅ Adicionado à Triagem", `"${nome}"\nExecução Imediata · Urgente\n\n${total} item(ns) aguardando importação no Mac.`);
}

async function verFila(fm, inboxPath) {
  const itens = lerFila(fm, inboxPath);
  if (!itens.length) return mensagem("Fila vazia", "Nada pendente de importação no Mac.");

  const escolhido = await escolherTabela(
    `Fila pendente (${itens.length}) — toque para remover`,
    itens.map(item => ({ label: item.nome, sub: `${hora(item.ts)} · ${item.lista_nome || TRIAGEM_LIST_NAME}`, value: item }))
  );
  if (!escolhido) return;

  const confirmacao = new Alert();
  confirmacao.title = "Remover da fila?";
  confirmacao.message = `"${escolhido.value.nome}"\n\nNão altera nada que já foi importado no Mac.`;
  confirmacao.addDestructiveAction("Remover");
  confirmacao.addCancelAction("Manter");
  if ((await confirmacao.presentAlert()) !== 0) return;

  removerDaFila(fm, inboxPath, escolhido.value.uid);
  await mensagem("Removido", "Item retirado da fila de captura.");
}

function lerFila(fm, inboxPath) {
  if (!fm.fileExists(inboxPath)) return [];
  try {
    if (!fm.isFileDownloaded(inboxPath)) fm.downloadFileFromiCloud(inboxPath);
    return fm.readString(inboxPath).split("\n").map(linha => linha.trim()).filter(Boolean)
      .map(linha => { try { return JSON.parse(linha); } catch (_) { return null; } }).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function anexarNaFila(fm, inboxPath, registro) {
  let conteudo = "";
  if (fm.fileExists(inboxPath)) {
    if (!fm.isFileDownloaded(inboxPath)) fm.downloadFileFromiCloud(inboxPath);
    conteudo = fm.readString(inboxPath);
    if (conteudo.length && !conteudo.endsWith("\n")) conteudo += "\n";
  }
  fm.writeString(inboxPath, conteudo + JSON.stringify(registro) + "\n");
}

function removerDaFila(fm, inboxPath, uid) {
  const conteudo = lerFila(fm, inboxPath).filter(registro => registro.uid !== uid)
    .map(registro => JSON.stringify(registro)).join("\n");
  fm.writeString(inboxPath, conteudo ? `${conteudo}\n` : "");
}

function hora(ts) {
  if (!ts) return "?";
  const data = new Date(ts);
  const dois = valor => String(valor).padStart(2, "0");
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)} ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

function escolherTabela(titulo, itens) {
  return new Promise(resolve => {
    const tabela = new UITable();
    tabela.showSeparators = true;
    const cabecalho = new UITableRow();
    cabecalho.isHeader = true;
    cabecalho.addText(titulo);
    tabela.addRow(cabecalho);
    let escolhido = null;
    for (const item of itens) {
      const linha = new UITableRow();
      linha.addText(item.label, item.sub || "");
      linha.dismissOnSelect = true;
      linha.onSelect = () => { escolhido = item; };
      tabela.addRow(linha);
    }
    tabela.present(false).then(() => resolve(escolhido));
  });
}

async function mensagem(titulo, texto) {
  const alerta = new Alert();
  alerta.title = titulo;
  alerta.message = texto;
  alerta.addAction("OK");
  await alerta.presentAlert();
}

module.exports = { run };
