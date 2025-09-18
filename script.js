document.addEventListener('DOMContentLoaded', async function () {
    const statusDiv = document.getElementById('status');
    const treeContainer = document.getElementById('tree-container');

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

    // Создаем элементы поиска
    const searchElements = createSearchForm();
    const searchInput = searchElements.searchInput;
    const searchButton = searchElements.searchButton;
    const searchResults = document.getElementById('search-results');

    // Функция поиска
    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            searchResults.innerHTML = '<div class="no-results">Введите минимум 2 символа</div>';
            searchResults.style.display = 'block';
            return;
        }
        
        removeHighlights();
        
        // Ищем все узлы дерева с текстом
        const allNodes = treeContainer.querySelectorAll('.node');
        const matches = [];
        
        allNodes.forEach(node => {
            const text = node.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                matches.push(node);
            }
        });
        
        // Показываем результаты
        if (matches.length > 0) {
            searchResults.innerHTML = `<div>Найдено совпадений: ${matches.length}</div>`;
            
            matches.slice(0, 10).forEach(match => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                
                // Получаем полный текст
                const fullText = match.querySelector('span:first-child')?.textContent || match.textContent;
                resultItem.textContent = fullText;
                
                resultItem.addEventListener('click', () => {
                    searchResults.style.display = 'none';
                    searchInput.value = fullText;
                    scrollToTreeNode(match);
                });
                searchResults.appendChild(resultItem);
            });
            
            if (matches.length > 10) {
                searchResults.innerHTML += `<div class="no-results">... и еще ${matches.length - 10} совпадений</div>`;
            }
            
            searchResults.style.display = 'block';
            
        } else {
            searchResults.innerHTML = '<div class="no-results">Совпадений не найдено</div>';
            searchResults.style.display = 'block';
        }
    }

    function removeHighlights() {
        // Убираем фоновую подсветку
        const highlightedNodes = treeContainer.querySelectorAll('.node[style*="background-color"]');
        highlightedNodes.forEach(node => {
            node.style.backgroundColor = '';
        });
    }

    function scrollToTreeNode(targetNode) {
    console.log('=== START scrollToTreeNode ===');
    console.log('Starting scroll to node:', targetNode);
    console.log('Target node classes:', targetNode.className);
    
    if (!targetNode) {
        console.error('Node is undefined');
        return;
    }

    // Сохраняем оригинальный элемент для последующего использования
    const originalTarget = targetNode;
    const targetLevel = targetNode.className.match(/level(\d+)/)[1];
    console.log('Target level:', targetLevel);

    // Функция для раскрытия всех родителей
    function expandAllParents(node) {
        console.log('Expanding parents for level', targetLevel, 'node');
        
        let current = node;
        const parents = [];
        const levelsToExpand = [];

        // Собираем всех родителей до корня
        while (current && current !== treeContainer) {
            if (current.classList && current.classList.contains('node')) {
                const levelMatch = current.className.match(/level(\d+)/);
                if (levelMatch) {
                    const level = parseInt(levelMatch[1]);
                    parents.push({ element: current, level: level });
                    console.log('Added parent level', level, ':', current.textContent);
                    
                    // Добавляем в уровни для раскрытия (только уровни 1-3)
                    if (level < 4) {
                        levelsToExpand.push(level);
                    }
                }
            }
            
            // Поднимаемся вверх по иерархии
            current = current.parentElement;
            
            // Если это LI элемент, ищем в нем node
            if (current && current.tagName === 'LI') {
                const parentNode = current.querySelector('.node');
                if (parentNode && !parents.some(p => p.element === parentNode)) {
                    const levelMatch = parentNode.className.match(/level(\d+)/);
                    if (levelMatch) {
                        const level = parseInt(levelMatch[1]);
                        parents.push({ element: parentNode, level: level });
                        console.log('Added LI parent level', level, ':', parentNode.textContent);
                    }
                }
            }
        }

        console.log('Levels to expand:', levelsToExpand.sort());
        
        // Раскрываем родителей от высшего уровня к низшему
        const sortedParents = parents.sort((a, b) => a.level - b.level);
        console.log('Sorted parents by level:', sortedParents.map(p => p.level));

        for (const parent of sortedParents) {
            console.log('Processing parent level', parent.level, ':', parent.element.textContent);
            
            // Для уровней 1-3 раскрываем контейнеры
            if (parent.level < 4) {
                const parentElement = parent.element;
                
                // Ищем контейнер с дочерними элементами
                let childContainer = parentElement.nextElementSibling;
                
                // Если нет прямого sibling, ищем в структуре LI
                if (!childContainer || !childContainer.tagName) {
                    const parentLi = parentElement.closest('li');
                    if (parentLi) {
                        childContainer = parentLi.querySelector('ul, .values-container');
                    }
                }

                if (childContainer && (childContainer.tagName === 'UL' || childContainer.classList.contains('values-container'))) {
                    console.log('Child container found:', childContainer);
                    
                    if (childContainer.style.display === 'none') {
                        console.log('Expanding level', parent.level);
                        parentElement.classList.add('expanded');
                        childContainer.style.display = 'block';
                        console.log('Expanded:', parentElement.textContent);
                    } else {
                        console.log('Already expanded');
                    }
                } else {
                    console.log('No child container found for level', parent.level);
                }
            }
            
            console.log('---');
        }
    }

    // Раскрываем всех родителей
    expandAllParents(targetNode);

    // Даем время на раскрытие и затем скроллим к оригинальному элементу
    setTimeout(() => {
        console.log('=== START SCROLLING ===');
        
        // Используем оригинальный элемент, а не ищем по селектору
        if (originalTarget && document.contains(originalTarget)) {
            console.log('Scrolling to original target');
            
            const rect = originalTarget.getBoundingClientRect();
            console.log('Target position:', rect);
            
            // Подсвечиваем целевой узел
            originalTarget.style.backgroundColor = '#fffacd';
            originalTarget.style.transition = 'background-color 0.3s';
            
            // Принудительно скроллим к элементу
            originalTarget.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
            
            // Убираем подсветку через 2 секунды
            setTimeout(() => {
                originalTarget.style.backgroundColor = '';
                console.log('Removed highlight');
            }, 2000);
        } else {
            console.error('Original target not found in DOM after expansion');
            
            // Попробуем найти элемент по тексту как запасной вариант
            const searchText = originalTarget.textContent;
            const foundElement = Array.from(treeContainer.querySelectorAll('.node'))
                .find(node => node.textContent === searchText);
                
            if (foundElement) {
                console.log('Found element by text content, scrolling to it');
                foundElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }
        
        console.log('=== END SCROLLING ===');
    }, 600);
}

    function findAllParentLevels(node) {
        const levels = [];
        let current = node;
        
        while (current && current !== treeContainer) {
            if (current.classList && current.classList.contains('node')) {
                const levelMatch = current.className.match(/level(\d+)/);
                if (levelMatch) {
                    levels.push({
                        element: current,
                        level: parseInt(levelMatch[1]),
                        text: current.textContent
                    });
                }
            }
            
            // Поднимаемся вверх по иерархии
            if (current.parentElement) {
                current = current.parentElement;
            } else if (current.parentNode) {
                current = current.parentNode;
            } else {
                break;
            }
            
            // Ищем node элементы в родительских LI
            if (current.tagName === 'LI') {
                const parentNode = current.querySelector('.node');
                if (parentNode && !levels.some(item => item.element === parentNode)) {
                    const levelMatch = parentNode.className.match(/level(\d+)/);
                    if (levelMatch) {
                        levels.push({
                            element: parentNode,
                            level: parseInt(levelMatch[1]),
                            text: parentNode.textContent
                        });
                    }
                }
            }
        }
        
        return levels.sort((a, b) => a.level - b.level);

        // Функция для раскрытия всех родителей
        function expandAllParents(node) {
            console.log('Simple expansion for level', node.className);
            
            // Простой подход: идем вверх по иерархии и раскрываем все
            let current = node;
            
            while (current && current !== treeContainer) {
                // Если это node элемент уровня 1-3
                if (current.classList && current.classList.contains('node')) {
                    const levelMatch = current.className.match(/level(\d+)/);
                    if (levelMatch && parseInt(levelMatch[1]) < 4) {
                        console.log('Found expandable node level', levelMatch[1]);
                        
                        // Ищем контейнер с детьми
                        let childContainer = current.nextElementSibling;
                        if (!childContainer) {
                            const parentLi = current.closest('li');
                            if (parentLi) {
                                childContainer = parentLi.querySelector('ul');
                            }
                        }
                        
                        // Раскрываем если нашли контейнер и он скрыт
                        if (childContainer && childContainer.style.display === 'none') {
                            console.log('Expanding:', current.textContent);
                            current.classList.add('expanded');
                            childContainer.style.display = 'block';
                        }
                    }
                }
                
                current = current.parentElement;
            }
        }

        // Раскрываем всех родителей
        expandAllParents(targetNode);

        console.log('Waiting for expansion...');
        
        // Даем время на раскрытие и затем скроллим
        setTimeout(() => {
            console.log('=== START SCROLLING ===');
            console.log('Scrolling to target');
            console.log('Target node after expansion:', targetNode);
            
            // Проверяем, виден ли элемент после раскрытия
            const rect = targetNode.getBoundingClientRect();
            console.log('Bounding rect:', rect);
            
            // Подсвечиваем целевой узел
            targetNode.style.backgroundColor = '#fffacd';
            targetNode.style.transition = 'background-color 0.3s';
            
            // Скроллим к элементу
            if (targetNode.scrollIntoView) {
                const rect = targetNode.getBoundingClientRect();
                const isVisible = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );

                console.log('Is visible:', isVisible);

                if (!isVisible) {
                    console.log('Scrolling into view...');
                    targetNode.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                } else {
                    console.log('Already visible, no scroll needed');
                }
            }
            
            // Убираем подсветку через 2 секунды
            setTimeout(() => {
                if (targetNode) {
                    targetNode.style.backgroundColor = '';
                    console.log('Removed highlight');
                }
            }, 2000);
            
            console.log('=== END SCROLLING ===');
        }, 500); // Увеличиваем задержку для гарантии раскрытия
        
        console.log('=== END scrollToTreeNode ===');
    }

    // Обработчики событий для поиска
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Закрытие результатов при клике вне области поиска
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