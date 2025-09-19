document.addEventListener('DOMContentLoaded', async function () {
    const statusDiv = document.getElementById('status');
    const treeContainer = document.getElementById('tree-container');
    let treeData = null;

    // Создаем форму поиска
    function createSearchForm() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        
        searchContainer.innerHTML = `
            <input type="text" id="search-input" placeholder="Поиск по странице...">
            <button id="search-button">Найти</button>
            <div id="search-results" class="search-results"></div>
        `;
        
        document.querySelector('h1').after(searchContainer);
        
        return {
            searchInput: document.getElementById('search-input'),
            searchButton: document.getElementById('search-button'),
            searchResults: document.getElementById('search-results')
        };
    }

    const searchElements = createSearchForm();
    const searchInput = searchElements.searchInput;
    const searchButton = searchElements.searchButton;
    const searchResults = document.getElementById('search-results');

    // Функция поиска по всем данным
    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            searchResults.innerHTML = '<div class="no-results">Введите минимум 2 символа</div>';
            searchResults.style.display = 'block';
            return;
        }
        
        removeHighlights();
        const matches = [];
        
        // Поиск по узлам дерева
        const allNodes = treeContainer.querySelectorAll('.node');
        allNodes.forEach(node => {
            const text = node.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                const level = parseInt(node.className.match(/level(\d+)/)[1]);
                matches.push({
                    text: node.textContent,
                    element: node,
                    level: level,
                    type: 'node'
                });
            }
        });
        
        // Поиск по значениям 5-го уровня (если формы значений уже открыты)
        const allValues = treeContainer.querySelectorAll('.values-list-minimal li');
        allValues.forEach(value => {
            const text = value.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                matches.push({
                    text: value.textContent,
                    element: value,
                    level: 5,
                    type: 'value'
                });
            }
        });
        
        // Если значения не найдены в DOM, ищем в данных
        if (matches.length === 0 && treeData) {
            searchInData(treeData, 1, searchTerm, matches);
        }
        
        // Показываем результаты
        if (matches.length > 0) {
            searchResults.innerHTML = `
                <div class="results-count">Найдено совпадений: ${matches.length}</div>
                <div class="search-results-list">
                    ${matches.map((match, index) => createSearchResultItem(match, searchTerm, index)).join('')}
                </div>
            `;
            
            const resultItems = searchResults.querySelectorAll('.search-result-item');
            resultItems.forEach((item, index) => {
                item.addEventListener('click', () => {
                    handleSearchResultClick(matches[index]);
                });
            });
            
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div class="no-results">Совпадений не найдено</div>';
            searchResults.style.display = 'block';
        }
    }

    // Рекурсивный поиск по данным JSON
    function searchInData(data, level, searchTerm, matches, parentPath = []) {
        if (!data) return;
        
        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                const currentPath = [...parentPath, index];
                searchInData(item, level, searchTerm, matches, currentPath);
            });
            return;
        }
        
        let text = '';
        let children = [];
        let values = [];
        
        switch (level) {
            case 1:
                text = data.Отрасль || data['Отрасль'] || '';
                children = data.Приоритетные_технологии || data['Приоритетные технологии'] || [];
                break;
            case 2:
                text = data.Приоритетные_технологии || data['Приоритетные технологии'] || '';
                children = data.Источники || [];
                break;
            case 3:
                text = data.Источник || '';
                children = data.Наименования || [];
                break;
            case 4:
                text = data.Наименование || '';
                values = data.Значения || data['Список значений'] || [];
                break;
        }
        
        // Поиск в текущем элементе
        if (text && text.toString().toLowerCase().includes(searchTerm)) {
            matches.push({
                text: text.toString(),
                level: level,
                type: 'node',
                path: [...parentPath],
                data: data
            });
        }
        
        // Поиск в значениях 5-го уровня
        if (level === 4 && values && Array.isArray(values)) {
            values.forEach((value, valueIndex) => {
                const valueText = value.toString();
                if (valueText.toLowerCase().includes(searchTerm)) {
                    matches.push({
                        text: valueText,
                        level: 5,
                        type: 'value',
                        path: [...parentPath],
                        parentData: data,
                        valueIndex: valueIndex
                    });
                }
            });
        }
        
        // Рекурсивный поиск в дочерних элементах
        if (children && Array.isArray(children) && level < 4) {
            children.forEach((child, childIndex) => {
                const childPath = [...parentPath, childIndex];
                searchInData(child, level + 1, searchTerm, matches, childPath);
            });
        }
    }

    function createSearchResultItem(match, searchTerm, index) {
        if (match.type === 'value') {
            let parentText = '';
            if (match.parentData) {
                parentText = match.parentData.Наименование || match.parentData['Наименование'] || '';
            } else if (match.element) {
                const parentNode = match.element.closest('li')?.querySelector('.node');
                parentText = parentNode ? parentNode.textContent : 'Неизвестный родитель';
            }
            
            return `
                <div class="search-result-item" data-index="${index}">
                    <div class="result-text">
                        <span class="value-indicator">✓</span> 
                        ${highlightMatch(match.text, searchTerm)}
                    </div>
                    <div class="result-path">в: ${parentText} (уровень 5)</div>
                </div>
            `;
        } else {
            return `
                <div class="search-result-item" data-index="${index}">
                    <div class="result-text">${highlightMatch(match.text, searchTerm)}</div>
                    <div class="result-path">уровень ${match.level}</div>
                </div>
            `;
        }
    }

    function handleSearchResultClick(match) {
        searchResults.style.display = 'none';
        searchInput.value = match.text;
        
        if (match.type === 'value') {
            navigateToValue(match);
        } else {
            navigateToNode(match);
        }
    }

    function navigateToValue(match) {
        // Если элемент уже есть в DOM
        if (match.element) {
            const valueElement = match.element;
            const parentLi = valueElement.closest('li');
            const level4Node = parentLi ? parentLi.querySelector('.node') : null;
            
            if (level4Node) {
                expandAllParents(level4Node);
                
                setTimeout(() => {
                    // Открываем форму значений если нужно
                    if (!level4Node.classList.contains('expanded')) {
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        level4Node.dispatchEvent(clickEvent);
                    }
                    
                    // Подсвечиваем и скроллим
                    setTimeout(() => {
                        valueElement.style.backgroundColor = '#fffacd';
                        valueElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        
                        setTimeout(() => {
                            valueElement.style.backgroundColor = '';
                        }, 3000);
                    }, 300);
                }, 300);
            }
        } 
        // Если элемента нет в DOM, находим по пути
        else if (match.path) {
            const level4Node = findNodeByPath(match.path);
            
            if (level4Node) {
                // Раскрываем всех родителей
                expandAllParents(level4Node);
                
                // Даем время на раскрытие
                setTimeout(() => {
                    // Открываем форму значений
                    if (!level4Node.classList.contains('expanded')) {
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        level4Node.dispatchEvent(clickEvent);
                    }
                    
                    // Подсвечиваем значение после открытия формы
                    setTimeout(() => {
                        const valuesContainer = level4Node.parentNode.querySelector('.values-form');
                        if (valuesContainer) {
                            const valueElements = valuesContainer.querySelectorAll('li');
                            if (valueElements[match.valueIndex]) {
                                valueElements[match.valueIndex].style.backgroundColor = '#fffacd';
                                valueElements[match.valueIndex].scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center'
                                });
                                
                                // Также скроллим к узлу 4-го уровня
                                level4Node.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'nearest'
                                });
                                
                                setTimeout(() => {
                                    valueElements[match.valueIndex].style.backgroundColor = '';
                                }, 3000);
                            }
                        }
                    }, 300);
                }, 300);
            }
        }
    }

    function navigateToNode(match) {
        if (match.element) {
            const targetNode = match.element;
            expandAllParents(targetNode);
            
            setTimeout(() => {
                scrollToTreeNode(targetNode);
            }, 300);
        } else if (match.path) {
            const targetNode = findNodeByPath(match.path);
            if (targetNode) {
                expandAllParents(targetNode);
                
                setTimeout(() => {
                    scrollToTreeNode(targetNode);
                }, 300);
            }
        }
    }

    function findNodeByPath(path) {
        console.log('Finding node by path:', path);
        let currentContainer = treeContainer.querySelector('ul.tree');
        
        for (let i = 0; i < path.length; i++) {
            if (!currentContainer) {
                console.log('No container found at step', i);
                return null;
            }
            
            const nodes = currentContainer.querySelectorAll('li > .node');
            console.log('Nodes found:', nodes.length, 'at step', i);
            
            if (nodes.length > path[i]) {
                const node = nodes[path[i]];
                console.log('Found node:', node.textContent);
                
                // Если это последний элемент пути, возвращаем узел
                if (i === path.length - 1) {
                    return node;
                }
                
                // Раскрываем узел если нужно
                if (!node.classList.contains('expanded')) {
                    console.log('Expanding node:', node.textContent);
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    node.dispatchEvent(clickEvent);
                }
                
                // Переходим к дочернему контейнеру
                const li = node.closest('li');
                if (li) {
                    const childContainer = li.querySelector('ul');
                    if (childContainer) {
                        currentContainer = childContainer;
                        console.log('Moving to child container');
                    } else {
                        console.log('No child container found');
                        return null;
                    }
                } else {
                    console.log('No LI element found');
                    return null;
                }
            } else {
                console.log('Node index out of bounds:', path[i], 'max:', nodes.length - 1);
                return null;
            }
        }
        
        return null;
    }

    function expandAllParents(node) {
        console.log('Expanding parents for:', node.textContent);
        let current = node.closest('li');
        const parents = [];
        
        // Собираем всех родителей
        while (current) {
            const parentNode = current.querySelector('.node');
            if (parentNode) {
                parents.push(parentNode);
                console.log('Added parent:', parentNode.textContent);
            }
            current = current.parentElement?.closest('li');
        }
        
        // Раскрываем родителей (от корня к листьям)
        parents.reverse().forEach(parent => {
            if (!parent.classList.contains('expanded')) {
                console.log('Expanding parent:', parent.textContent);
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                parent.dispatchEvent(clickEvent);
            } else {
                console.log('Parent already expanded:', parent.textContent);
            }
        });
    }

    function highlightMatch(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
        return text.toString().replace(regex, '<span class="highlight-match">$1</span>');
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function removeHighlights() {
        const highlightedNodes = treeContainer.querySelectorAll('.node[style*="background-color"]');
        highlightedNodes.forEach(node => {
            node.style.backgroundColor = '';
        });
        
        const highlightedValues = treeContainer.querySelectorAll('.values-list-minimal li[style*="background-color"]');
        highlightedValues.forEach(value => {
            value.style.backgroundColor = '';
        });
    }

    function scrollToTreeNode(targetNode) {
        if (!targetNode) return;

        targetNode.style.backgroundColor = '#fffacd';
        targetNode.style.transition = 'background-color 0.3s';
        
        targetNode.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
        
        setTimeout(() => {
            targetNode.style.backgroundColor = '';
        }, 3000);
    }

    // Обработчики событий
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    searchInput.addEventListener('input', debounce(performSearch, 300));

    // Загрузка данных
    try {
        const response = await fetch('/output.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        treeData = data;
        statusDiv.textContent = "";
        statusDiv.className = "status success";
        renderTree(data);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        statusDiv.textContent = `Ошибка: ${error.message}`;
        statusDiv.className = "status error";
    }

    // Функции отрисовки дерева остаются без изменений
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
        }

        // Логика подсчёта
        function countChildrenItems(items, currentLevel) {
            let count = 0;
            if (items && Array.isArray(items)) {
                items.forEach(item => {
                    if (currentLevel === 4) count++;
                    if (currentLevel < 4) {
                        let nextLevelChildren = [];
                        switch (currentLevel) {
                            case 1: nextLevelChildren = item.Приоритетные_технологии || item['Приоритетные технологии'] || []; break;
                            case 2: nextLevelChildren = item.Источники || []; break;
                            case 3: nextLevelChildren = item.Наименования || []; break;
                        }
                        count += countChildrenItems(nextLevelChildren, currentLevel + 1);
                    }
                });
            }
            return count;
        }

        if (level < 5) {
            childrenCount = countChildrenItems(children, level + 1);
        }

        div.innerHTML = `<span>${title}</span>`;

        if (childrenCount > 0 && level < 4) {
            div.innerHTML += `<span class="count">(${childrenCount})</span>`;
        }

        li.appendChild(div);

        if ((children && children.length > 0 && level < 4) || (level === 4 && values.length > 0)) {
            div.addEventListener('click', function (e) {
                e.stopPropagation();

                if (level === 4) {
                    toggleValuesForm(this, title, values);
                    return;
                }

                this.classList.toggle('expanded');
                const childContainer = this.nextElementSibling;
                childContainer.style.display = childContainer.style.display === 'block' ? 'none' : 'block';
            });

            let childContainer;

            if (level === 4) {
                childContainer = document.createElement('div');
                childContainer.className = 'values-container';
                childContainer.style.display = 'none';
            } else {
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
        const existingForm = nodeElement.parentNode.querySelector('.values-form');

        if (existingForm) {
            existingForm.remove();
            return;
        }

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

        nodeElement.parentNode.insertBefore(form, nodeElement.nextSibling);
    }
});