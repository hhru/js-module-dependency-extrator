# js-module-dependency-extrator

## Описание

Плагин парсит js файлы, и извлекает зависимости amd модулей, по call expression "define"

```
extractModuleDependenciesFromGlob([
    файлы для парсинга
], {
    saveFileName: - имя файла
    saveFilePath: - путь, куда сохранять список зависимостей
    saveFileExt: - расширение файла
    modulesPath: - путь до корня модулей
    template: Функция которая возвращает шаблон контента(string), в качестве аргумента передается массив зависимостей, если не передать контентом сохраненного файла будет JSON представление.',
});
```

## Зачем

Нужно правильно формировать чанки, потому что webpack-у необходим список полных зависимостей. А анонимный чанк содержит только рутовые компоненты. Иначе нам нужно это делать в ручную.

## Установка

```sh
$ yarn install js-module-dependency-extrator
```

## Запуск тестов

 ```sh
 $ yarn test
 ```

## Пример использования в Node окружении

```javascript
const extractStaticValueFromGlob = require('babel-parser-parse-static-trl');

extractStaticValueFromGlob(['/Component/*.jsx'], {
    staticPropName: 'customProps',
    saveFileName: 'Component',
    saveFilePath: 'customPath',
    saveFileExt: 'js',
});
```
