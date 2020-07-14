import { window } from 'vscode';

const getPath = (line: string) => (line.match(/\'(.+)\'/) || [])[1];

const sortByReference = (arr: string[], reference: string[]) => {
  arr.sort((a, b) => {
    const aPath = getPath(a);
    const bPath = getPath(b);
    return reference.indexOf(aPath) - reference.indexOf(bPath);
  });
  return arr;
};

const arryToStr = (arr: string[]) => (arr.length ? arr.join('\n') + '\n\n' : '');

const removeEmptyLines = (str: string) =>
  str
    .split('\n')
    .filter((line) => line)
    .join('\n');

const isPackage = (str: string) => /from \'([a-z]|@)(.+)\';/.test(str);

const isComponent = (str: string) => /from \'(.+)\/[A-Z](.+)\';/.test(str);

const sortPackages = (arr: string[]) => {
  const HEADER = [
    'react',
    'react-dom',
    'redux',
    'react-redux',
    'prop-types',
    'react-router',
    'react-router-dom',
    'mage-react-router',
  ];
  const FOOTER = ['moka-ui', 'sugar-design', '@SDFoundation'];

  let first: string[] = [];
  let second: string[] = [];
  let third: string[] = [];

  arr.forEach((el) => {
    const pack = getPath(el);
    if (HEADER.includes(pack)) {
      first.push(el);
    } else if (FOOTER.includes(pack)) {
      third.push(el);
    } else {
      second.push(el);
    }
  });

  const secondPathList = second.map((el) => getPath(el)).sort();
  first = sortByReference(first, HEADER);
  second = sortByReference(second, secondPathList);
  third = sortByReference(third, FOOTER);

  return [...first, ...second, ...third];
};

const sortOthers = (arr: string[]) => {
  const pathList = arr.map((el) => getPath(el)).sort();
  return sortByReference(arr, pathList);
};

const sort = (text: string) => {
  /**
   * 引入的依赖，如react, redux
   */
  let packages: string[] = [];
  /**
   * 组件
   */
  let components: string[] = [];
  /**
   * utils, constants...
   */
  let utils: string[] = [];
  /**
   * 引入的样式
   */
  let styles: string[] = [];

  const lines = removeEmptyLines(text)
    .split(';\n')
    .map((line) => (line.endsWith(';') ? line : line + ';'));

  lines.forEach((line) => {
    if (line.endsWith(".styl';")) {
      styles.push(line);
    } else if (isPackage(line)) {
      packages.push(line);
    } else if (isComponent(line)) {
      components.push(line);
    } else {
      utils.push(line);
    }
  });

  return (
    arryToStr(sortPackages(packages)) +
    arryToStr(sortOthers(components)) +
    arryToStr(sortOthers(utils)) +
    arryToStr(styles)
  );
};

export function sortCurrentDocument() {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  const { document, selection } = editor;
  const text = document.getText(selection);
  const sortedText = sort(text);

  return editor.edit((edit) => edit.replace(selection, sortedText));
}
