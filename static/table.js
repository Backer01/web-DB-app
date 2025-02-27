async function loadTable() {
    const tableName = document.getElementById('table-name').value;

    const response = await fetch(`/data/${tableName}`);
    const data = await response.json();

    const tableHead = document.querySelector('#data-table thead tr');
    const tableBody = document.querySelector('#data-table tbody');

    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    addRowFields.innerHTML = '';

    if (data.length > 0) {
        const headers = Object.keys(data[0]);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = translate(header);
            tableHead.appendChild(th);

            // Поля для добавления строки
            const inputField = document.createElement('div');
            inputField.innerHTML = `<label>${translate(header)}: </label><input type="text" name="${header}">`;
            addRowFields.appendChild(inputField);
        });

        data.forEach(row => {
            const tr = document.createElement('tr');
            for (const key in row) {
                if (key.toLowerCase().includes('date')) { // Предполагаем, что даты содержат "date" в названии ключа
                    row[key] = formatDate(row[key]);
                }
            }
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header];
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
    }
}

async function loadAddRows() {
    const tableName = document.getElementById('table-name').value;

    const response = await fetch(`/data/${tableName}`);
    const data = await response.json();

    // const tableHead = document.querySelector('#data-table thead tr');
    // const tableBody = document.querySelector('#data-table tbody');

    addRowFields.innerHTML = '';

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        // Поля для добавления строки
        const inputField = document.createElement('div');
        inputField.innerHTML = `<label>${translate(header)}: </label><input type="text" name="${header}">`;
        addRowFields.appendChild(inputField);
    });
}

document.getElementById('fetch-params').addEventListener('click', async () => {
    const callType = document.getElementById('call-type').value;
    const procName = document.getElementById('proc-name').value;

    const response = await fetch(`/params/${callType}/${procName}`);
    const params = await response.json();
    const procParamsContainer = document.getElementById('proc-params');
    procParamsContainer.innerHTML = '';

    if (params.length > 0) {
        params.forEach(param => {
            if (param.param_name !== null && param.param_name.toLowerCase() !== 'null') {
                const paramGroup = document.createElement('div');
                tname = translate(param.param_name);
                ttype = translate(param.param_type);
                paramGroup.innerHTML = `
                    <label>${tname} (${ttype}):</label>
                    <input type="text" name="param" data-param-name="${tname}" placeholder="${ttype}" required>
                `;
                procParamsContainer.appendChild(paramGroup);
            }
        });
    } else {
        procParamsContainer.innerHTML = '<p>No parameters required.</p>';
    }
});

document.getElementById('db-call-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const callType = document.getElementById('call-type').value;
    const procName = document.getElementById('proc-name').value;
    const paramInputs = document.querySelectorAll('#proc-params input[name="param"]');
    const params = Array.from(paramInputs).map(input => input.value);

    const response = await fetch(`/call/${callType}/${procName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params })
    });

    const result = await response.json();

    if (response.ok) {
        if (callType === 'function') {
            alert(`Результат функции: ${result['result']}`);
        } else {
            alert('Процедура успешно выполнена!');
        }
    } else {
        alert('Ошибка: ' + JSON.stringify(result));
    }
});

function showNotification(message) {
    const notification = document.getElementById('result-notification');
    notification.style.display = 'block';
    notification.textContent = message;

    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

const filterFields = document.getElementById('filter-fields');
const addFilterBtn = document.getElementById('add-filter');
const addRowFields = document.getElementById('add-row-fields');

// Добавить новое поле для фильтрации
addFilterBtn.addEventListener('click', () => {
    const tableName = document.getElementById('table-name').value;

    if (!tableName) {
        alert('Сначала выберите таблицу!');
        return;
    }

    // Создаем группу фильтров
    const filterGroup = document.createElement('div');
    filterGroup.classList.add('filter-group');

    // Изначально пустой HTML для фильтра
    filterGroup.innerHTML = `
        <label>Столбец:</label>
        <select name="column" required>
            <option value="" disabled selected>Загрузка...</option>
        </select>
        <label>Значение:</label>
        <input type="text" name="value" placeholder="Значение для поиска" required>
        <label>Тип поиска:</label>
        <select name="searchType">
            <option value="LIKE">LIKE</option>
            <option value="=">=</option>
            <option value="<"><</option>
            <option value=">">></option>
            <option value="<="><=</option>
            <option value=">=">>=</option>
        </select>
        <button type="button" class="remove-filter">Убрать</button>
    `;

    filterFields.appendChild(filterGroup);

    // Удаление поля фильтрации
    filterGroup.querySelector('.remove-filter').addEventListener('click', () => {
        filterGroup.remove();
    });

    // Получение списка столбцов и заполнение выпадающего списка
    fetch(`/get_columns/${tableName}`)
        .then(response => response.json())
        .then(data => {
            const columnSelect = filterGroup.querySelector('select[name="column"]');
            columnSelect.innerHTML = '<option value="" disabled selected>Выберите столбец</option>';
            data.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = translate(column);
                columnSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Ошибка получения столбцов:', error);
            alert('Не удалось загрузить столбцы. Проверьте соединение с сервером.');
        });
});

// Обработка формы
document.getElementById('filter-form').addEventListener('submit', function(event) {
    event.preventDefault();
    loadAddRows();  // Для отображения столбцов в поле добавления строки
    const tableName = document.getElementById('table-name').value;

// Проверка, выбрана ли таблица
if (!tableName) {
alert('Сначала выберите таблицу!');
return;
}

const filterGroups = Array.from(document.querySelectorAll('.filter-group'));

// Сбор данных фильтров
const filters = filterGroups.map(group => {
const column = group.querySelector('select[name="column"]')?.value;
const value = group.querySelector('input[name="value"]')?.value;
const searchType = group.querySelector('select[name="searchType"]')?.value;

if (!column || !value || !searchType) {
    throw new Error('Одно из полей фильтрации не заполнено!');
}

return { column, value, searchType };
});

    fetch(`/data/${tableName}?filters=${encodeURIComponent(JSON.stringify(filters))}`)
        .then(response => response.json())
        .then(data => {
            const tableHead = document.querySelector('#data-table thead tr');
            const tableBody = document.querySelector('#data-table tbody');

            tableHead.innerHTML = '';
            tableBody.innerHTML = '';

            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = translate(header);
                    tableHead.appendChild(th);
                });
                data.forEach(row => {
                    const tr = document.createElement('tr');
                    for (const key in row) {
                        if (key.toLowerCase().includes('date')) {
                            row[key] = formatDate(row[key]);
                        }
                    }
                    headers.forEach(header => {
                        const td = document.createElement('td');
                        td.textContent = row[header];
                        tr.appendChild(td);
                    });
                    tableBody.appendChild(tr);
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
            }
        })
        .catch(error => {
            alert('Error: ' + error.message);
        });
});

// Обработка добавления строки
document.getElementById('add-row-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const tableName = document.getElementById('table-name').value;
    const formData = new FormData(this);
    const rowData = Object.fromEntries(formData.entries());

    const response = await fetch(`/add/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData)
    });

    response.json().then(res => {
        error_msg = res['error'];
        console.log(res['error']);
    });

    if (response.ok) {
        alert('Строка успешно добавлена!');
        loadTable();
    } else {
        alert('Ошибка добавления строки\n' + error_msg);
    }
});

// Обработка удаления строки
document.getElementById('delete-row-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const tableName = document.getElementById('table-name').value;
    const id = document.getElementById('delete-id').value;

    const response = await fetch(`/delete/${tableName}/${id}`, {
        method: 'DELETE'
    });

    response.json().then(res => {
        error_msg = res['error'];
        console.log(res['error']);
    });

    if (response.ok) {
        alert('Строка успешно удалена!');
        loadTable();
    } else {
        alert('Ошибка удаления строки.\n' + error_msg);
    }
});


// Загружаем список таблиц
async function loadTables() {
    const tableSelect = document.getElementById('table-name');
    try {
        const response = await fetch('/tables');
        const tables = await response.json();

        tableSelect.innerHTML = ''; // Очищаем список
        tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table;
            option.textContent = translate(table);
            tableSelect.appendChild(option);
        });
    } catch (error) {
        alert('Ошибка загрузки таблиц: ' + error.message);
    }
}

// Загружаем список процедур или функций
async function loadRoutines(routineType) {
    const routineSelect = document.getElementById('proc-name');
    try {
        const response = await fetch(`/routines/${routineType}`);
        const routines = await response.json();

        routineSelect.innerHTML = ''; // Очищаем список
        routines.forEach(routine => {
            const option = document.createElement('option');
            option.value = routine;
            option.textContent = translate(routine);
            routineSelect.appendChild(option);
        });
    } catch (error) {
        alert('Ошибка загрузки процедур/функций: ' + error.message);
    }
}

// Загружаем таблицы при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const routineTypeSelect = document.getElementById('call-type');
    routineTypeSelect.addEventListener('change', () => {
        const routineType = routineTypeSelect.value;
        loadRoutines(routineType);
    });

    // Изначально загружаем процедуры
    loadRoutines('procedure');
    loadTable();
});

document.addEventListener('DOMContentLoaded', () => {
    const tableSelect = document.getElementById('table-name');
    const editButton = document.getElementById('edit-button');

    // Функция обновления ссылки кнопки "Редактировать"
    const updateEditButton = () => {
        const selectedTable = tableSelect.value;
        editButton.onclick = () => {
            if (selectedTable) {
                window.location.href = `/edit/${selectedTable}`;
            } else {
                alert('Выберите таблицу для редактирования.');
            }
        };
    };

    // Загружаем список таблиц
    const loadTables = async () => {
        try {
            const response = await fetch('/tables');
            const tables = await response.json();

            tableSelect.innerHTML = ''; // Очищаем список
            tables.forEach(table => {
                const option = document.createElement('option');
                option.value = table;
                option.textContent = translate(table);
                tableSelect.appendChild(option);
            });

            // Обновляем ссылку на кнопку "Редактировать"
            updateEditButton();
        } catch (error) {
            alert('Ошибка загрузки таблиц: ' + error.message);
        }
    };

    // Обновляем кнопку "Редактировать" при изменении выбранной таблицы
    tableSelect.addEventListener('change', updateEditButton);

    // Загружаем таблицы при загрузке страницы
    loadTables();
});