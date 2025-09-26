
document.addEventListener('DOMContentLoaded', async () => {
    // Получение ссылок на контейнер для отображения статуса
    // и контейнер для отрисовки дерева значений
    const statusDiv = document.getElementById('status');
    const treeContainer = document.getElementById('tree-container');

    // Элементы управления
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const btnExpandAll = document.getElementById('expand-all');
    const btnCollapseAll = document.getElementById('collapse-all');
    
    //Переменные состояния 
    let treeData = null;
    let searchIndex = []; // Единый индекс для узлов (1-4) и значений (5)

    // ---------- RENDER ----------
    // Создание дерева
    function renderTree(data) {
        // Очистка контейнера перед рендерингом нового дерева
        treeContainer.innerHTML = '';
        // Валидация входных данных
        if (!Array.isArray(data) || data.length === 0) {
            treeContainer.innerHTML = '<div class="status error">Пустые или неверные данные</div>';
            return;
        }
        // Создание основного UL-элемента для отображения
        const ul = document.createElement('ul');
        ul.className = 'tree';
        // Рендеринг корневых узлов дерева
        data.forEach((item, idx) => {
            const li = createTreeNode(item, 1, [idx]);
            ul.appendChild(li);
        });
        // Добавление готового дерева в контейнер
        treeContainer.appendChild(ul);
    }
    // Создание узлов дерева
    function createTreeNode(node, level, path) {
        // Создание базовых html элементов
        const li = document.createElement('li');
        const div = document.createElement('div');
        div.className = `node level${level}`;
        div.dataset.path = path.join('-');

        // Переменные
        let title = '';
        let children = [];
        let values = [];
        
        // Определение содержимого узла, в зависимости от уровня 
        switch (level) {
            case 1: {
                title = node.Отрасль || node['Отрасль'] || 'Без названия';
                children = node['Приоритетные технологии'] || node.Приоритетные_технологии || [];
                break;
            }
            case 2: {
                if (typeof node === 'string') {
                    title = node;
                } else if (node && typeof node === 'object') {
                    title = node['Приоритетные технологии'] || node.Приоритетные_технологии || "Технология не определена";
                } else {
                    title = 'Технология';
                }

                children = node.Источники || [];
                if (!Array.isArray(children) || children.length === 0) {
                    const sectorIndex = path[0];
                    const sector = Array.isArray(treeData) ? treeData[sectorIndex] : null;
                    if (sector && Array.isArray(sector.Источники)) children = sector.Источники;
                }
                break;
            }
            case 3: {
                title = node.Источник || node['Источник'] || node.Тип || 'Источник';
                children = node.Наименования || [];
                break;
            }
            case 4: {
                title = node.Наименование || node.Название || 'Наименование';
                values = node.Значения || node['Список значений'] || [];
                break;
            }
        }

        // Формирование заголовка узла
        const titleSpan = document.createElement('span');
        titleSpan.textContent = String(title);
        div.appendChild(titleSpan);
        
        // Подсчет и отображение количества значений для уровней 1-3
        if (level < 4) {
            const leaves = countLeaves(children, level + 1);
            if (leaves > 0) {
                const cnt = document.createElement('span');
                cnt.className = 'count';
                cnt.textContent = `(${leaves})`;
                div.appendChild(cnt);
            }
        }

        li.appendChild(div);
        // Добавление дочерних узлов рекурсивно
        if (level < 4) {
            const sub = document.createElement('ul');
            sub.style.display = 'none';
            if (Array.isArray(children)) {
                children.forEach((child, idx) => {
                    const childLi = createTreeNode(child, level + 1, [...path, idx]);
                    sub.appendChild(childLi);
                });
            }
            li.appendChild(sub);
            // Обработчик нажатия для раскрытия сворачивания
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                div.classList.toggle('expanded');
                sub.style.display = sub.style.display === 'block' ? 'none' : 'block';
            });
        } else {
            // Обработка листовых узлов
            const valuesContainer = document.createElement('div');
            valuesContainer.className = 'values-container';
            valuesContainer.style.display = 'none';
            li.appendChild(valuesContainer);

            div.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleValuesForm(div, String(title), values);
            });
        }
        // Возврат результата в виде готового <li> элемента
        return li;
    }

    // Функция подсчета значений
    function countLeaves(items, currentLevel) {
        // Проверка на массив данных
        if (!Array.isArray(items)) return 0;
        
        // Для уровня 4 считаем количество наименований, а не значений
        if (currentLevel === 4) {
            return items.length; // Просто возвращаем количество элементов
        }
        
        // Для уровней 1-3 продолжаем рекурсию
        let sum = 0;
        items.forEach((it) => {
            let next = [];
            if (currentLevel === 1) next = it && (it.Приоритетные_технологии || []);
            if (currentLevel === 2) next = it && (it.Источники || []);
            if (currentLevel === 3) next = it && (it.Наименования || []);
            sum += countLeaves(next, currentLevel + 1);
        });
        return sum;
    }

    //Функция отображения формы значений 5-го уровня 
    function toggleValuesForm(nodeEl, title, values) {
        // Осуществляем поиск родительских элементов
        const li = nodeEl.closest('li');
        let form = li.querySelector(':scope > .values-container > .values-form');
        const container = li.querySelector(':scope > .values-container');
        // Проверка существования формы
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
            container.style.display = form.style.display;
            return;
        }
        // Если форма не существует - создаем новую
        container.style.display = 'block';
        form = document.createElement('div');
        form.className = 'values-form';
        // Создаем и добавляем заголовок 
        const t = document.createElement('div');
        t.className = 'form-title';
        t.textContent = title;
        form.appendChild(t);
        // Создаем и добавляем список значений
        const list = document.createElement('ul');
        list.className = 'values-list-minimal';

        (values || []).forEach((v) => {
            const li = document.createElement('li');
            li.textContent = String(v);
            list.appendChild(li);
        });

        form.appendChild(list);
        // Добавляем форму в контейнер
        container.appendChild(form);
    }

    // ---------- BUILD SEARCH INDEX (узлы 1–4 + значения 5) ----------
    // Создание поискового индекса
    function buildSearchIndex(data) {
        // Инициализация
        searchIndex = [];
        const breadcrumbs = [];
        // Функция обхода дерева
        function rec(item, level, path) {
            // Обработка массивов данных
            if (Array.isArray(item)) {
                item.forEach((it, idx) => rec(it, level, [...path, idx]));
                return;
            }
            let text = '';
            let children = [];
            let values = [];
            // Извлечение данных по уровням
            switch (level) {
                case 1:
                    text = item.Отрасль || '';
                    breadcrumbs[0] = text;
                    children = item['Приоритетные технологии'] || item.Приоритетные_технологии || [];
                    // индекс узла 1
                    if (text) pushNode(text, level, path, makeCrumb(1));
                    break;
                case 2:
                    if (typeof item === 'string') text = item;
                    else if (item && typeof item === 'object') text = item.Название || item.Технология || '';
                    breadcrumbs[1] = text;
                    children = item.Источники || [];
                    if (!Array.isArray(children) || children.length === 0) {
                        const sectorIndex = path[0];
                        const sector = Array.isArray(treeData) ? treeData[sectorIndex] : null;
                        if (sector && Array.isArray(sector.Источники)) children = sector.Источники;
                    }
                    if (text) pushNode(text, level, path, makeCrumb(2));
                    break;
                case 3:
                    text = item.Источник || item.Тип || '';
                    breadcrumbs[2] = text;
                    children = item.Наименования || [];
                    if (text) pushNode(text, level, path, makeCrumb(3));
                    break;
                case 4:
                    text = item.Наименование || item.Название || '';
                    breadcrumbs[3] = text;
                    values = item.Значения || item['Список значений'] || [];
                    if (text) pushNode(text, level, path, makeCrumb(4));
                    // значения — уровень 5, путь до 4 уровня сохраняем
                    if (Array.isArray(values)) {
                        values.forEach((v, vidx) => {
                            const s = String(v);
                            searchIndex.push({
                                type: 'value',
                                level: 5,
                                text: s,
                                path: [...path],  // путь до узла 4
                                valueIndex: vidx,
                                crumb: makeCrumb(5, s),
                            });
                        });
                    }
                    break;
            }

            if (Array.isArray(children) && level < 4) {
                children.forEach((child, idx) => rec(child, level + 1, [...path, idx]));
            }
        }
        // Добавляем узел в индекс
        function pushNode(text, level, path, crumb) {
            searchIndex.push({ type: 'node', level, text: String(text), path: [...path], crumb });
        }
        // Формируем breadcrumbs
        function makeCrumb(depth, valueText) {
            const arr = [];
            if (breadcrumbs[0]) arr.push(breadcrumbs[0]);
            if (depth >= 2 && breadcrumbs[1]) arr.push(breadcrumbs[1]);
            if (depth >= 3 && breadcrumbs[2]) arr.push(breadcrumbs[2]);
            if (depth >= 4 && breadcrumbs[3]) arr.push(breadcrumbs[3]);
            if (depth >= 5 && valueText) arr.push(String(valueText));
            return arr.join(' › ');
        }

        rec(data, 1, []);
    }

    // ---------- HELPERS ----------
    // Генерация CSS-селектора по указанному пути
    function nodeSelectorFromPath(path) { return `.node[data-path="${path.join('-')}"]`; }
    // Нахождение узла дерева по указанному пути 
    function findNodeByPath(path) { return treeContainer.querySelector(nodeSelectorFromPath(path)); }
    // Раскрытие родителей указанного узла
    function expandParents(node) {
        // Сбор родительских элементов
        let cur = node.closest('li');
        const parents = [];
        while (cur) {
            const parentNode = cur.querySelector(':scope > .node');
            if (parentNode) parents.push(parentNode);
            cur = cur.parentElement?.closest('li');
        }
        // Раскрытие родительских элементов
        parents.reverse().forEach((p) => {
            // Раскрываем только уровни 1–3
            if (!p.classList.contains('expanded') && !p.classList.contains('level4')) {
                p.click();
            }
        });
    }
    // Значения 4-го уровня
    function ensureValuesOpenAt(path) {
        // Поиск узла
        const node = findNodeByPath(path);
        if (!node) return null;
        expandParents(node);
        // Открыть значения у 4-го уровня
        if (!node.closest('li').querySelector(':scope > .values-container > .values-form')) {
            node.click();
        } else {

            const container = node.closest('li').querySelector(':scope > .values-container');
            const form = container && container.querySelector(':scope > .values-form');
            if (form) { container.style.display = 'block'; form.style.display = 'block'; }
        }
        // Возврат списка значений
        return node.closest('li').querySelector('.values-form .values-list-minimal');
    }
    // Прокрутка до элемента и подсветка
    function scrollFlash(el) {
        if (!el) return;
        el.style.backgroundColor = ' #1FAEE9';
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => (el.style.backgroundColor = ''), 1200);
    }
    // Экранирование символов 
    function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    // Подсветка найденных значений
    function highlight(text, term) {
        const re = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        return String(text).replace(re, '<span class="search-highlight">$1</span>');
    }

    // ---------- SEARCH ----------
    // Отображение результатов поиска
    function renderSearchResults(term, matches) {
        // Пустые результаты
        if (!matches.length) {
            searchResults.innerHTML = '<div class="no-results">Совпадений не найдено</div>';
            searchResults.style.display = 'block';
            return;
        }
        // Генерация html с результатами
        searchResults.innerHTML = `
      <div class="results-count">Найдено: ${matches.length}</div>
      <div class="search-results-list">
        ${matches.map((m, i) => `
          <div class="search-result-item"
               data-type="${m.type}"
               data-level="${m.level}"
               data-path="${m.path.join('-')}"
               ${m.type === 'value' ? `data-value-index="${m.valueIndex}"` : ''}>
            <div class="result-text">${highlight(m.text, term)}</div>
            <div class="result-path">${m.crumb || ('уровень ' + m.level)}</div>
          </div>`).join('')}
      </div>
    `;
        searchResults.style.display = 'block';

        // Обработчик кликов
        const list = searchResults.querySelector('.search-results-list');
        list.onclick = (e) => {
            const item = e.target.closest('.search-result-item');
            if (!item) return;
            const type = item.dataset.type;
            const level = Number(item.dataset.level);
            const path = item.dataset.path.split('-').filter(Boolean).map((x) => Number(x));
            const valueIndex = Number(item.dataset.valueIndex || 0);
            if (type === 'value' && level === 5) {
                navigateToValuePath(path, valueIndex);
            } else {
                navigateToNodePath(path);
            }


            searchResults.style.display = 'none';
        };
    }
    // Поиск по индексу
    function performSearch() {
        // Валидация ввода
        const term = (searchInput.value || '').trim().toLowerCase();
        if (term.length < 2) {
            searchResults.innerHTML = '<div class="no-results">Введите минимум 2 символа</div>';
            searchResults.style.display = 'block';
            return;
        }
        // Фильтрация результатов
        const matches = searchIndex.filter((m) => m.text.toLowerCase().includes(term));
        // Отображаем результат
        renderSearchResults(term, matches);
    }
    //  Навигация к узлу дерева по указанному пути
    function navigateToNodePath(path) {
        // Находим элемент
        const node = findNodeByPath(path);
        if (!node) return;
        // Если элемент найден - раскрываем путь до него
        expandParents(node);
        setTimeout(() => scrollFlash(node), 150);
    }
    //  Навигация к значению по указанному пути и индексу
    function navigateToValuePath(path, valueIndex) {
        // Открываем форму значений
        const list = ensureValuesOpenAt(path);
        if (!list) return;
        // Получаем все элементы списка значений
        const items = list.querySelectorAll('li');
        // Получаем безопасный индекс в пределах массива
        const idx = Math.max(0, Math.min(items.length - 1, Number.isFinite(valueIndex) ? valueIndex : 0));
        // Выбираем элемент
        const el = items[idx] || items[0];
        // Переходим и подсвечиваем
        scrollFlash(el);
    }

    // ---------- CONTROLS ----------
    // Разворачиваем дерево до 3-го уровня
    btnExpandAll.addEventListener('click', () => {
        treeContainer.querySelectorAll('.node.level1, .node.level2, .node.level3').forEach((n) => {
            const ul = n.closest('li')?.querySelector(':scope > ul');
            if (ul && ul.style.display !== 'block') n.click();
        });
    });
    // Сворачиваем дерево до 3-го уровня
    btnCollapseAll.addEventListener('click', () => {
        treeContainer.querySelectorAll('.node.level1, .node.level2, .node.level3').forEach((n) => {
            const ul = n.closest('li')?.querySelector(':scope > ul');
            if (ul && ul.style.display !== 'none') n.click();
        });
        treeContainer.querySelectorAll('.values-container').forEach((c) => c.style.display = 'none');
    });

    // ---------- SEARCH EVENTS ----------
    // Задержка выполнения функции
    function debounce(fn, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; }
    // Обработчик явного действия пользователя - клик
    searchButton.addEventListener('click', performSearch);
    // Обработчик явного действия пользователя - кнопка
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    // Ввод текста с debounce
    searchInput.addEventListener('input', debounce(performSearch, 250));
    // Обработчик явного действия пользователя - клик вне области поиска
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) searchResults.style.display = 'none';
    });

    // ---------- DATA LOADING ----------
    try {
        // Пробуем загрузить .json файл с помощью Fetch API
        const res = await fetch('output.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Передаем загруженные данные для дальнейшей обработки
        treeData = data;
        statusDiv.textContent = '';
        statusDiv.className = 'status success';
        renderTree(data);
        buildSearchIndex(data);
    } catch (e) {
        // Отображаем ошибки
        statusDiv.textContent = 'Ошибка загрузки данных: ' + e.message + '. Проверьте, что в корне проекта, рядом с HTML файлом, находится иерархический .json файл с подготовленными данными';
        statusDiv.className = 'status error';
    }
});
