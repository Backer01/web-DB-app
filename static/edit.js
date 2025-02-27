function formatDate(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date)) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }
    return dateString; // Если не удаётся преобразовать, возвращаем исходное значение
}

const tableName = appConfig.tableName; // Используем глобальный объект
// console.log("Table name:", tableName);

// Загрузка данных таблицы
async function loadTable() {
    const response = await fetch(`/data/${tableName}`);
    const data = await response.json();

    const mainHeader = document.querySelector('#table-header');
    const tableHead = document.querySelector('#edit-table thead tr');
    const tableBody = document.querySelector('#edit-table tbody');

    mainHeader.innerHTML = '';
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    const tmp = document.createElement('label');
    tmp.textContent = 'Редактирование таблицы: "' + translate(tableName) + '"';
    mainHeader.appendChild(tmp);

    if (data.length > 0) {
        const headers = Object.keys(data[0]);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = translate(header);
            tableHead.appendChild(th);
        });

        const actionTh = document.createElement('th');
        actionTh.textContent = 'Действия';
        tableHead.appendChild(actionTh);

        data.forEach(row => {
            const tr = document.createElement('tr');
            for (const key in row) {
                if (key.toLowerCase().includes('date')) { // Предполагаем, что даты содержат "date" в названии ключа
                    row[key] = formatDate(row[key]);
                }
            }
            headers.forEach(header => {
                const td = document.createElement('td');
                if (header === 'ID') {
                    td.textContent = row[header];
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = row[header];
                    input.className = 'editable';
                    input.dataset.column = header;
                    td.appendChild(input);
                }
                tr.appendChild(td);
            });

            const actionTd = document.createElement('td');
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Сохранить';
            saveBtn.className = 'save-btn';
            saveBtn.addEventListener('click', () => saveRow(tr, row.ID));
            actionTd.appendChild(saveBtn);
            tr.appendChild(actionTd);

            tableBody.appendChild(tr);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
    }
}

// Сохранение изменений в строке
async function saveRow(row, id) {
    const inputs = row.querySelectorAll('input.editable');
    const updatedData = {};

    inputs.forEach(input => {
        const column = input.dataset.column;
        const value = input.value;
        updatedData[column] = value;
    });

    const response = await fetch(`/update/${tableName}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
    });
    // alert(`/update/${tableName}/${id}`);
    if (response.ok) {
        alert('Row updated successfully!');
    } else {
        const error = await response.json();
        alert('Error: ' + error.error);
    }
}

// Загрузка данных при загрузке страницы
loadTable();
