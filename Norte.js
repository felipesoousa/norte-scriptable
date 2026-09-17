// Norte — launcher estável para Scriptable
// Instale este arquivo uma vez no Scriptable com o nome "Norte".

const GITHUB_OWNER = "felipesoousa";
const GITHUB_REPOSITORY = "norte-scriptable";
const GITHUB_BRANCH = "main";
const GITHUB_PATH = "NovaTarefa.js";
const CACHE_FILE = "NortePayload.js";

const local = FileManager.local();
const cachePath = local.joinPath(local.documentsDirectory(), CACHE_FILE);

async function run() {
  try {
    await atualizarCache();
  } catch (error) {
    console.warn(`Norte: atualização indisponível (${error.message || error}).`);
  }

  if (!local.fileExists(cachePath)) {
    await informarIndisponivel("Não consegui baixar o Norte agora.");
    return;
  }

  try {
    const modulo = importModule(cachePath);
    if (!modulo || typeof modulo.run !== "function") throw new Error("módulo inválido");
    await modulo.run();
  } catch (error) {
    await informarIndisponivel(`A cópia local do Norte não pôde abrir: ${error.message || error}`);
  }
}

async function atualizarCache() {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/${GITHUB_BRANCH}/${GITHUB_PATH}`;
  const request = new Request(url);
  request.timeoutInterval = 12;
  const codigo = await request.loadString();
  if (!codigo.includes("module.exports") || !codigo.includes("run")) throw new Error("arquivo remoto não parece ser o módulo do Norte");

  const temporario = `${cachePath}.novo`;
  local.writeString(temporario, codigo);
  if (local.fileExists(cachePath)) local.remove(cachePath);
  local.move(temporario, cachePath);
}

async function informarIndisponivel(texto) {
  const alerta = new Alert();
  alerta.title = "Norte indisponível";
  alerta.message = `${texto}\n\nConfira a internet e tente novamente.`;
  alerta.addAction("OK");
  await alerta.presentAlert();
}

await run();
