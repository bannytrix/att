// Projeto de DWS: consumo de API pública usando Fetch, JSON e DOM.

const formulario = document.querySelector('#form-cep');
const campoCep = document.querySelector('#cep');
const botaoBuscar = document.querySelector('#botao-buscar');
const mensagem = document.querySelector('#mensagem');
const resultado = document.querySelector('#resultado');

// Aplica a máscara 00000-000 enquanto a pessoa digita.
campoCep.addEventListener('input', () => {
  const numeros = campoCep.value.replace(/\D/g, '').slice(0, 8);
  campoCep.value = numeros.length > 5
    ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
    : numeros;
});

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault(); // Impede que o formulário recarregue a página.
  buscarCEP(campoCep.value);
});

// Os botões de exemplo preenchem o campo e executam a consulta.
document.querySelectorAll('[data-cep]').forEach((botao) => {
  botao.addEventListener('click', () => {
    campoCep.value = botao.dataset.cep;
    campoCep.dispatchEvent(new Event('input'));
    buscarCEP(campoCep.value);
  });
});

async function buscarCEP(cepDigitado) {
  // Remove tudo que não for número para montar a URL da API.
  const cep = cepDigitado.replace(/\D/g, '');

  esconderResultado();
  limparMensagem();

  // Validação básica: um CEP brasileiro deve ter 8 números.
  if (cep.length !== 8) {
    mostrarMensagem('Digite um CEP válido com 8 números.', 'error');
    campoCep.focus();
    return;
  }

  botaoBuscar.disabled = true;
  botaoBuscar.textContent = 'Buscando...';
  mostrarMensagem('Consultando a API ViaCEP...', 'loading');

  try {
    // fetch() faz uma requisição HTTP para a API pública.
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

    // Trata respostas HTTP que indiquem falha.
    if (!resposta.ok) {
      throw new Error('O servidor respondeu com um erro.');
    }

    // Converte a resposta JSON em um objeto JavaScript.
    const dados = await resposta.json();

    // A ViaCEP retorna erro: true quando o CEP não é encontrado.
    if (dados.erro) {
      throw new Error('CEP não encontrado. Confira os números e tente novamente.');
    }

    // Atualiza os elementos HTML sem recarregar a página (manipulação do DOM).
    preencherCampo('rua', dados.logradouro);
    preencherCampo('bairro', dados.bairro);
    preencherCampo('complemento', dados.complemento);
    preencherCampo('cidade', dados.localidade);
    preencherCampo('estado', dados.uf);
    preencherCampo('cep-resultado', dados.cep);
    preencherCampo('ddd', dados.ddd);

    resultado.hidden = false;
    mostrarMensagem('Endereço encontrado com sucesso!', 'success');
  } catch (erro) {
    // Captura falhas de conexão, respostas inesperadas e CEPs não encontrados.
    esconderResultado();
    const mensagemErro = erro instanceof TypeError
      ? 'Não foi possível conectar à API. Verifique sua internet e tente novamente.'
      : (erro.message || 'Não foi possível buscar esse CEP. Tente novamente.');
    mostrarMensagem(mensagemErro, 'error');
  } finally {
    // O botão sempre volta ao normal, mesmo quando ocorre um erro.
    botaoBuscar.disabled = false;
    botaoBuscar.innerHTML = 'Buscar CEP <span aria-hidden="true">→</span>';
  }
}

function preencherCampo(id, valor) {
  // textContent exibe texto com segurança, sem interpretar HTML recebido da API.
  document.getElementById(id).textContent = valor || 'Não informado';
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `message ${tipo}`;
}

function limparMensagem() {
  mensagem.textContent = '';
  mensagem.className = 'message';
}

function esconderResultado() {
  resultado.hidden = true;
}
