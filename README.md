# Norte Scriptable

Cliente móvel do Norte. Este repositório contém somente código; a fila e os dados do aplicativo continuam no iCloud.

## Instalação no iPhone

1. Crie um token fine-grained do GitHub limitado ao repositório `norte-scriptable`, com a permissão **Contents: Read**.
2. No Scriptable, crie um script chamado **Norte** e cole o conteúdo de `Norte.js`.
3. Execute **Norte**. Na primeira abertura, cole o token quando solicitado. Ele fica salvo no Keychain do iPhone.
4. Mantenha o File Bookmark `ClickUP` apontando para a pasta ClickUP no iCloud.

O launcher procura a versão atual em `main` toda vez que abre. Sem rede, ele usa a última cópia válida disponível no iPhone.

## Fluxo de captura

O nome digitado é preservado. Cada inserção rápida entra na lista **Triagem** como **Urgente** e **Execução Imediata**. O Mac importa a fila ao abrir o Norte local.
