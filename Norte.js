// Norte — launcher estável para Scriptable
// Instale este arquivo uma vez no Scriptable com o nome "Norte".

const GITHUB_OWNER = "felipesoousa";
const GITHUB_REPOSITORY = "norte-scriptable";
const GITHUB_BRANCH = "main";
const GITHUB_PATH = "NovaTarefa.js";
const TOKEN_KEY = "norte-scriptable-github-token";
const CACHE_FILE = "NortePayload.js";
const CACHE_META_FILE = "NortePayload.meta.json";

const local = FileManager.local();
const cachePath = local.joinPath(local.documentsDirectory(), CACHE_FILE);
const metadataPath = local.joinPath(local.documentsDirectory(), CACHE_META_FILE);

async function run() {
  const token = await obterToken();
  if (token) {
    try {
      await atualizarCache(token);
    } catch (error) {
      console.warn(`Norte: atualização indisponível (${error.message || error}).`);
    }
  }

  if (!local.fileExists(cachePath)) {
    await informarIndisponivel(token ? "Não consegui baixar o Norte agora." : "É preciso configurar o acesso ao Norte.");
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

async function obterToken() {
  if (Keychain.contains(TOKEN_KEY)) return Keychain.get(TOKEN_KEY);

  const alerta = new Alert();
  alerta.title = "Conectar o Norte ao GitHub";
  alerta.message = "Cole o token de leitura do repositório privado norte-scriptable. Ele será guardado apenas no Keychain deste iPhone.";
  alerta.addSecureTextField("Token GitHub", "");
  alerta.addAction("Salvar e continuar");
  alerta.addCancelAction("Agora não");
  if ((await alerta.presentAlert()) === -1) return null;

  const token = (alerta.textFieldValue(0) || "").trim();
  if (!token) return null;
  Keychain.set(TOKEN_KEY, token);
  return token;
}

async function atualizarCache(token) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}`;
  const request = new Request(url);
  request.headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  request.timeoutInterval = 12;
  const resposta = await request.loadJSON();
  if (!resposta || !resposta.sha || !resposta.content) throw new Error("resposta inválida do GitHub");

  const meta = lerMetadados();
  if (meta.sha === resposta.sha && local.fileExists(cachePath)) return;

  const codigo = Data.fromBase64String(resposta.content.replace(/\n/g, "")).toRawString();
  if (!codigo.includes("module.exports") || !codigo.includes("run")) throw new Error("arquivo remoto não parece ser o módulo do Norte");

  const temporario = `${cachePath}.novo`;
  local.writeString(temporario, codigo);
  if (local.fileExists(cachePath)) local.remove(cachePath);
  local.move(temporario, cachePath);
  local.writeString(metadataPath, JSON.stringify({ sha: resposta.sha, atualizado_em: Date.now() }));
}

function lerMetadados() {
  if (!local.fileExists(metadataPath)) return {};
  try { return JSON.parse(local.readString(metadataPath)); } catch (_) { return {}; }
}

async function informarIndisponivel(texto) {
  const alerta = new Alert();
  alerta.title = "Norte indisponível";
  alerta.message = `${texto}\n\nConfira a internet e o token do GitHub.`;
  alerta.addAction("OK");
  await alerta.presentAlert();
}

await run();
