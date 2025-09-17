document.addEventListener('DOMContentLoaded', async function () {
    const statusDiv = document.getElementById('status');
    const treeContainer = document.getElementById('tree-container');

    // Пробуем загрузить многоуровневый json и обрабатываем ошибки, если загрузка не удалась
    try {
        const response = await fetch('output.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        statusDiv.textContent = "";
        statusDiv.className = "status success";
        renderTree(data);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        statusDiv.textContent = `Ошибка: ${error.message}`;
        statusDiv.className = "status error";
    }

    function renderTree(data) {
        treeContainer.innerHTML = '';

        if (!Array.isArray(data)) {
            treeContainer.innerHTML = '<div class="error">Ожидался массив в корне JSON</div>';
            return;
        }

        if (data.length === 0) {
            treeContainer.innerHTML = '<div class="error">Данные пусты</div>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'tree';

        data.forEach(item => {
            const li = createTreeNode(item, 1);
            ul.appendChild(li);
        });

        treeContainer.appendChild(ul);
    }

    function createTreeNode(node, level) {
        const li = document.createElement('li');
        const div = document.createElement('div');
        div.className = `node level${level}`;

        let title = '';
        let children = [];
        let values = [];
        let childrenCount = 0;

        // Определяем структуру в зависимости от уровня
        switch (level) {
            case 1:
                title = node.Отрасль || 'Неизвестная отрасль';
                children = node.Приоритетные_технологии || node['Приоритетные технологии'] || [];
                break;
            case 2:
                title = node.Приоритетные_технологии || node['Приоритетные технологии'] || 'Неизвестные технологии';
                children = node.Источники || [];
                break;
            case 3:
                title = node.Источник || 'Неизвестный источник';
                children = node.Наименования || [];
                break;
            case 4:
                title = node.Наименование || 'Неизвестное наименование';
                values = node.Значения || node['Список значений'] || [];
                break;
            case 5:
                title = node || 'Неизвестное значение';
                break;
        }

        // Логика подсчёта: считаем все уровни, кроме 5-го
        function countChildrenItems(items, currentLevel) {
            let count = 0;

            if (items && Array.isArray(items)) {
                items.forEach(item => {
                    // Считаем только элементы 4-го уровня (наименования)
                    if (currentLevel === 4) {
                        count++;
                    }

                    // Рекурсивно считаем подэлементы (но не заходим глубже 4-го уровня)
                    if (currentLevel < 4) {
                        let nextLevelChildren = [];
                        switch (currentLevel) {
                            case 1:
                                nextLevelChildren = item.Приоритетные_технологии || item['Приоритетные технологии'] || [];
                                break;
                            case 2:
                                nextLevelChildren = item.Источники || [];
                                break;
                            case 3:
                                nextLevelChildren = item.Наименования || [];
                                break;
                        }
                        count += countChildrenItems(nextLevelChildren, currentLevel + 1);
                    }
                });
            }
            return count;
        }

        // Вызываем подсчет для всех уровней, кроме 5-го
        if (level < 5) {
            childrenCount = countChildrenItems(children, level + 1);
        }

        div.innerHTML = `<span>${title}</span>`;

        // Показываем счетчик только если есть что показывать и это не 5-й уровень
        if (childrenCount > 0 && level < 4) {
            div.innerHTML += `<span class="count">(${childrenCount})</span>`;
        }

        li.appendChild(div);

        if ((children && children.length > 0 && level < 4) || (level === 4 && values.length > 0)) {
            div.addEventListener('click', function (e) {
                e.stopPropagation();

                if (level === 4) {
                    // Для 4-го уровня отображаем значения в форме под элементом
                    toggleValuesForm(this, title, values);
                    return;
                }

                this.classList.toggle('expanded');
                const childContainer = this.nextElementSibling;
                childContainer.style.display = childContainer.style.display === 'block' ? 'none' : 'block';
            });

            let childContainer;

            if (level === 4) {
                // Для 4-го уровня создаем контейнер для значений
                childContainer = document.createElement('div');
                childContainer.className = 'values-container';
                childContainer.style.display = 'none';
            } else {
                // Для остальных уровней создаем обычный список
                childContainer = document.createElement('ul');
                childContainer.style.display = 'none';

                children.forEach(child => {
                    const childLi = createTreeNode(child, level + 1);
                    childContainer.appendChild(childLi);
                });
            }

            li.appendChild(childContainer);
        } else {
            div.style.cursor = 'default';
        }

        return li;
    }

    function toggleValuesForm(nodeElement, title, values) {
        // Проверяем, есть ли уже открытая форма
        const existingForm = nodeElement.parentNode.querySelector('.values-form');

        // Если форма уже открыта - закрываем её
        if (existingForm) {
            existingForm.remove();
            return;
        }

        // Создаем минималистичную форму
        const form = document.createElement('div');
        form.className = 'values-form';

        const formTitle = document.createElement('div');
        formTitle.className = 'form-title';
        formTitle.textContent = title;

        const valuesList = document.createElement('ul');
        valuesList.className = 'values-list-minimal';

        values.forEach(value => {
            const li = document.createElement('li');
            li.textContent = value;
            valuesList.appendChild(li);
        });

        form.appendChild(formTitle);
        form.appendChild(valuesList);

        // Вставляем форму после элемента
        nodeElement.parentNode.insertBefore(form, nodeElement.nextSibling);
    }
});
