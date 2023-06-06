/**
 * Copyright 2023 Prof. Ms. Ricardo Leme All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict' //modo estrito

/**
 * obtemDados.
 * Obtem dados da collection a partir do Firebase.
 * @param {string} collection - Nome da collection no Firebase
 * @return {object} - Uma tabela com os dados obtidos
 */
async function obtemDados(collection) {
  let spinner = document.getElementById('carregandoDados')
  let tabela = document.getElementById('tabelaDados')
  await firebase.database().ref(collection).orderByChild('nome').on('value', (snapshot) => {
    tabela.innerHTML = ''
    let cabecalho = tabela.insertRow()
    cabecalho.className = 'fundo-verde-claro'    
    cabecalho.insertCell().textContent = 'Nome do Produto'
    cabecalho.insertCell().textContent = 'Data da Compra'
    cabecalho.insertCell().textContent = 'Nº da Nota Fiscal'
    cabecalho.insertCell().textContent = 'É Produto Congelado?'
    cabecalho.insertCell().textContent = 'Preço de Custo'
    cabecalho.insertCell().textContent = 'Preço de Venda'
    cabecalho.insertCell().innerHTML = 'Opções'

    snapshot.forEach(item => {
      // Dados do Firebase
      let db = item.ref._delegate._path.pieces_[0] //collection
      let id = item.ref._delegate._path.pieces_[1] //id do registro   
      //Criando as novas linhas na tabela
      let novaLinha = tabela.insertRow()
      novaLinha.insertCell().innerHTML = '<small>' + item.val().nome + '</small>'
      novaLinha.insertCell().textContent = new Date(item.val().dcompra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
      novaLinha.insertCell().innerHTML = '<small>' + item.val().nfe + '</small>'
      novaLinha.insertCell().textContent = item.val().congelado
      novaLinha.insertCell().textContent = new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(item.val().pcusto)
      novaLinha.insertCell().textContent = new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(item.val().pvenda)
      novaLinha.insertCell().innerHTML = `<button class='btn btn-sm btn-danger' onclick=remover('${db}','${id}')><i class="bi bi-trash"></i></button>
      <button class='btn btn-sm btn-warning' onclick=carregaDadosAlteracao('${db}','${id}')><i class="bi bi-pencil-square"></i></button>`

    })
    let rodape = tabela.insertRow()
    rodape.className = 'fundo-verde-claro'
    rodape.insertCell().colSpan = "6"
    rodape.insertCell().innerHTML = totalRegistros(collection)

  })
  spinner.classList.add('d-none') //oculta o carregando...
}

/**
 * obtemDados.
 * Obtem dados da collection a partir do Firebase.
 * @param {string} db - Nome da collection no Firebase
 * @param {integer} id - Id do registro no Firebase
 * @return {object} - Os dados do registro serão vinculados aos inputs do formulário.
 */

async function carregaDadosAlteracao(db, id) {
  await firebase.database().ref(db + '/' + id).on('value', (snapshot) => {
    document.getElementById('id').value = id
    document.getElementById('nome').value = snapshot.val().nome
    document.getElementById('cnpj').value = snapshot.val().cnpj
    document.getElementById('nfe').value = snapshot.val().nfe
    document.getElementById('Data da Compra').value = snapshot.val().dcompra
    document.getElementById('Preço de Compra').value = snapshot.val().pcusto
    document.getElementById('Preço de Venda').value = snapshot.val().pvenda
    if (snapshot.val().congelado === 'NÃO') {
      document.getElementById('congeladonao').checked = true
    }else if (snapshot.val().congelado === 'SIM'){
      document.getElementById('congeladosim').checked = true
    }else{
      document.getElementById('congeladonaointerfere').checked = true
    }
    
  });

  document.getElementById('nome').focus() //Definimos o foco no campo nome
}

/**
 * incluir.
 * Inclui os dados do formulário na collection do Firebase.
 * @param {object} event - Evento do objeto clicado
 * @param {string} collection - Nome da collection no Firebase
 * @return {null} - Snapshot atualizado dos dados
 */

function salvar(event, collection) {
  event.preventDefault() // evita que o formulário seja recarregado
  //Verifica os campos obrigatórios
  if (document.getElementById('nome').value === '') { alerta('⚠️É obrigatório informar o nome do produto!', 'warning') }
  else if (document.getElementById('nfe').value === '') { alerta('⚠️É obrigatório informar o número da nota fiscal!', 'warning') }
  else if (document.getElementById('dcompra').value === '') { alerta('⚠️É obrigatório informar a data da compra!', 'warning') }
  else if (document.getElementById('pcusto').value < 0 || document.getElementById('pcusto').value > 300) { alerta('⚠️O peso deve ser um número entre 0 a 300', 'warning') }
  else if (document.getElementById('id').value !== '') { alterar(event, collection) }
  else { incluir(event, collection) }
}

async function incluir(event, collection) {
  let usuarioAtual = firebase.auth().currentUser
  let botaoSalvar = document.getElementById('btnSalvar')
  botaoSalvar.innerText = 'Aguarde...'
  event.preventDefault()
  //Obtendo os campos do formulário
  const form = document.forms[0];
  const data = new FormData(form);
  //Obtendo os valores dos campos
  const values = Object.fromEntries(data.entries());  
  //Enviando os dados dos campos para o Firebase
  return await firebase.database().ref(collection).push({
    nome: values.nome.toUpperCase(),
    nfe: values.nfe.toLowerCase(),
    congelado: values.congelado.toUpperCase(),
    dcompra: document.getElementById("dcompra").value,
    pcusto: document.getElementById("pcusto").value,
    pvenda: document.getElementById("pvenda").value,
    cnpj: document.getElementById("cnpj").value,  
    usuarioInclusao: {
      uid: usuarioAtual.uid,
      nome: usuarioAtual.displayName,
      urlImagem: usuarioAtual.photoURL,
      email: usuarioAtual.email,
      dataInclusao: new Date()
    }
  })
    .then(() => {
      alerta(`✅ Registro incluído com sucesso!`, 'success')
      document.getElementById('formCadastro').reset() //limpa o form
      //Limpamos o avatar do cliente
      botaoSalvar.innerHTML = '<i class="bi bi-save-fill"></i> Salvar'
    })
    .catch(error => {
      alerta('❌ Falha ao incluir: ' + error.message, 'danger')
    })

}

async function alterar(event, collection) {
  let usuarioAtual = firebase.auth().currentUser
  let botaoSalvar = document.getElementById('btnSalvar')
  botaoSalvar.innerText = 'Aguarde...'
  event.preventDefault()
  //Obtendo os campos do formulário
  const form = document.forms[0];
  const data = new FormData(form);
  //Obtendo os valores dos campos
  const values = Object.fromEntries(data.entries());
  //Enviando os dados dos campos para o Firebase
  return await firebase.database().ref().child(collection + '/' + values.id).update({
    nome: values.nome.toUpperCase(),
    nfe: values.nfe.toLowerCase(),
    congelado: values.congelado.toUpperCase(),
    dcompra: document.getElementById("dcompra").value,
    pcusto: document.getElementById("pcusto").value,
    pvenda: document.getElementById("pvenda").value,
    cnpj: document.getElementById("cnpj").value,
    usuarioAlteracao: {
      uid: usuarioAtual.uid,
      nome: usuarioAtual.displayName,
      urlImagem: usuarioAtual.photoURL,
      email: usuarioAtual.email,
      dataAlteracao: new Date()
    }
  })
    .then(() => {
      alerta('✅ Registro alterado com sucesso!', 'success')
      document.getElementById('formCadastro').reset()
      document.getElementById('id').value = ''
      botaoSalvar.innerHTML = '<i class="bi bi-save-fill"></i> Salvar'
    })
    .catch(error => {
      console.error(error.code)
      console.error(error.message)
      alerta('❌ Falha ao alterar: ' + error.message, 'danger')
    })
}

/**
 * remover.
 * Remove os dados da collection a partir do id passado.
 * @param {string} db - Nome da collection no Firebase
 * @param {integer} id - Id do registro no Firebase
 * @return {null} - Snapshot atualizado dos dados
 */
async function remover(db, id) {
  if (window.confirm("⚠️Confirma a exclusão do registro?")) {
    let dadoExclusao = await firebase.database().ref().child(db + '/' + id)
    dadoExclusao.remove()
      .then(() => {
        alerta('✅ Registro removido com sucesso!', 'success')
      })
      .catch(error => {
        console.error(error.code)
        console.error(error.message)
        alerta('❌ Falha ao excluir: ' + error.message, 'danger')
      })
  }
}

/**
 * totalRegistros
 * Retornar a contagem do total de registros da collection informada
 * @param {string} collection - Nome da collection no Firebase
 * @param {integer} id - Id do registro no Firebase
 * @return {null} - Snapshot atualizado dos dados
 */

function totalRegistros(collection) {
  var retorno = '...'
  firebase.database().ref(collection).on('value', (snap) => {
    if (snap.numChildren() === 0) {
      retorno = '⚠️ Ainda não há nenhum registro cadastrado!'
    } else {
      retorno = `Total: <span class="badge fundo-laranja-escuro"> ${snap.numChildren()} </span>`
    }
  })
  return retorno
}
/**
 * Formata o valor do campo de CPF com pontos e traço enquanto o usuário digita os dados.
 *
 * @param {object} campo - O campo de entrada do CPF.
 */
function formatarCNPJ(campo) {
  // Remove caracteres não numéricos
  var cnpj = campo.value.replace(/\D/g, '');

  // Adiciona pontos e traço conforme o usuário digita
  cnpj = cnpj.replace(/(\d{2})(\d)/, '$1.$2');
  cnpj = cnpj.replace(/(\d{3})(\d)/, '$1.$2');
  cnpj = cnpj.replace(/(\d{3})(\d)/, '$1.$2');
  cnpj = cnpj.replace(/(\d{4})(\d)/, '$1.$2');
  cnpj = cnpj.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  // Atualiza o valor do campo
  campo.value = cnpj;
}