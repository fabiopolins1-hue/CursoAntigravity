// Chave utilizada para persistir os dados no LocalStorage
const STORAGE_KEY = 'meu_dia_tarefas';

// Seleção dos elementos do DOM
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const exportJsonBtn = document.getElementById('export-json-btn');
const importJsonInput = document.getElementById('import-json-input');

/**
 * Recupera as tarefas salvas no LocalStorage.
 * @returns {Array<{ id: number, text: string }>}
 */
function getTasksFromStorage() {
    const tasksJSON = localStorage.getItem(STORAGE_KEY);
    try {
        return tasksJSON ? JSON.parse(tasksJSON) : [];
    } catch (error) {
        console.error('Erro ao ler tarefas do LocalStorage:', error);
        return [];
    }
}

/**
 * Salva a lista atualizada de tarefas no LocalStorage.
 * @param {Array<{ id: number, text: string }>} tasks
 */
function saveTasksToStorage(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Atualiza a visibilidade da mensagem de lista vazia.
 * @param {boolean} isEmpty
 */
function toggleEmptyState(isEmpty) {
    if (emptyState) {
        emptyState.style.display = isEmpty ? 'block' : 'none';
    }
}

/**
 * Renderiza todas as tarefas na tela a partir do LocalStorage.
 */
function renderTasks() {
    const tasks = getTasksFromStorage();

    // Limpa a lista existente antes de renderizar
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        toggleEmptyState(true);
        return;
    }

    toggleEmptyState(false);

    // Cria os elementos visuais para cada tarefa
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';

        const spanText = document.createElement('span');
        spanText.className = 'task-text';
        spanText.textContent = task.text;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-delete';
        deleteButton.textContent = 'Excluir';
        deleteButton.type = 'button';

        // Evento de clique para excluir a tarefa
        deleteButton.addEventListener('click', () => {
            deleteTask(task.id);
        });

        li.appendChild(spanText);
        li.appendChild(deleteButton);
        taskList.appendChild(li);
    });
}

/**
 * Adiciona uma nova tarefa à lista e ao LocalStorage.
 * @param {Event} event
 */
function addTask(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();

    // Validação: se o campo estiver vazio, avisa o usuário
    if (taskText === '') {
        alert('Por favor, digite uma tarefa antes de adicionar!');
        taskInput.focus();
        return;
    }

    const tasks = getTasksFromStorage();

    // Criação do objeto com ID único por timestamp
    const newTask = {
        id: Date.now(),
        text: taskText
    };

    tasks.push(newTask);
    saveTasksToStorage(tasks);
    renderTasks();

    // Limpa o campo e foca novamente para facilitar próximas adições
    taskInput.value = '';
    taskInput.focus();
}

/**
 * Exclui uma tarefa pelo seu ID e atualiza o LocalStorage.
 * @param {number} taskId
 */
function deleteTask(taskId) {
    const tasks = getTasksFromStorage();
    const updatedTasks = tasks.filter(task => task.id !== taskId);

    saveTasksToStorage(updatedTasks);
    renderTasks();
}

/**
 * Exporta as tarefas atuais gerando o download de um arquivo 'tarefas.json'.
 */
function exportTasksToJSON() {
    const tasks = getTasksFromStorage();

    if (tasks.length === 0) {
        alert('Não há tarefas para exportar!');
        return;
    }

    // Converte o array de tarefas em texto JSON formatado
    const jsonString = JSON.stringify(tasks, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Cria um link temporário para forçar o download no navegador
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'tarefas.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);
}

/**
 * Importa tarefas a partir de um arquivo JSON selecionado pelo usuário.
 * @param {Event} event
 */
function importTasksFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (!Array.isArray(importedData)) {
                throw new Error('O arquivo JSON deve conter uma lista de tarefas (array).');
            }

            // Normaliza os dados importados garantindo id e text
            const sanitizedTasks = importedData.map((item, index) => ({
                id: item.id || Date.now() + index,
                text: typeof item === 'string' ? item : (item.text || 'Tarefa sem nome')
            }));

            saveTasksToStorage(sanitizedTasks);
            renderTasks();
            alert(`${sanitizedTasks.length} tarefa(s) importada(s) com sucesso!`);
        } catch (error) {
            alert('Erro ao carregar o arquivo JSON. Certifique-se de que o formato é válido.');
            console.error(error);
        } finally {
            // Reseta o input para permitir selecionar o mesmo arquivo novamente se desejar
            event.target.value = '';
        }
    };

    reader.readAsText(file);
}

/**
 * Se for o primeiro acesso e o LocalStorage estiver vazio,
 * tenta carregar as tarefas padrão do arquivo tarefas.json via fetch.
 */
async function loadDefaultTasksIfEmpty() {
    if (localStorage.getItem(STORAGE_KEY) === null) {
        try {
            const response = await fetch('tarefas.json');
            if (response.ok) {
                const defaultTasks = await response.json();
                if (Array.isArray(defaultTasks)) {
                    saveTasksToStorage(defaultTasks);
                    renderTasks();
                }
            }
        } catch (e) {
            // Caso abra direto como file:// (onde fetch local pode ser restrito pelo navegador), apenas renderiza normalmente
            renderTasks();
        }
    }
}

// Inicialização dos eventos ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
    taskForm.addEventListener('submit', addTask);

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportTasksToJSON);
    }

    if (importJsonInput) {
        importJsonInput.addEventListener('change', importTasksFromJSON);
    }

    renderTasks();
    loadDefaultTasksIfEmpty();
});
