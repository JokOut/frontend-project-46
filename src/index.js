import { readFileSync } from 'fs';
import * as path from 'path';
import _ from 'lodash';

const getData = (filepath) => readFileSync(path.resolve(process.cwd(), '__fixtures__', filepath));
const stepIndent = 4;
const getIndent = (depth) => ' '.repeat(depth * stepIndent);

const buildTree = (data1, data2) => {
  const keys = _.sortBy(_.union(_.keys(data1), _.keys(data2)));

  const diff = keys.map((key) => {
    if (_.isObject(data1[key]) && _.isObject(data2[key])) {
      return { key, children: buildTree(data1[key], data2[key]), type: 'nested' };
    }
    if (!Object.hasOwn(data1, key)) {
      return { key, value2: data2[key], type: 'added' };
    }
    if (!Object.hasOwn(data2, key)) {
      return { key, value1: data1[key], type: 'deleted' };
    }
    if (data1[key] !== data2[key]) {
      return {
        key, value1: data1[key], value2: data2[key], type: 'changed',
      };
    }
    return { key, value1: data1[key], type: 'unchanged' };
  });

  return diff;
};

const getValue = (node, depth) => {
  if (!_.isObject(node)) {
    return node;
  }
  const bracketEndIndent = getIndent(depth - 1);
  const lines = Object.entries(node).map(([key, value]) => `${getIndent(depth)}${key}: ${getValue(value, depth + 1)}`);

  return [
    '{',
    ...lines,
    `${bracketEndIndent}}`,
  ].join('\n');
};

const stylish = (data, depth = 1) => {
  const indent = getIndent(depth).slice(0, getIndent(depth) - 2);
  const bracketEndIndent = getIndent(depth - 1);

  const lines = data.flatMap((diff) => {
    switch (diff.type) {
      case 'nested':
        return `${indent}  ${diff.key}: ${stylish(diff.children, depth + 1)}`;
      case 'added':
        return `${indent}+ ${diff.key}: ${getValue(diff.value2, depth + 1)}`;
      case 'deleted':
        return `${indent}- ${diff.key}: ${getValue(diff.value1, depth + 1)}`;
      case 'unchanged':
        return `${indent}  ${diff.key}: ${getValue(diff.value1, depth + 1)}`;
      case 'changed':
        return [
          `${indent}- ${diff.key}: ${getValue(diff.value1, depth + 1)}`,
          `${indent}+ ${diff.key}: ${getValue(diff.value2, depth + 1)}`,
        ];
      default:
        throw new Error(`Unknown type of data: ${diff.type}`);
    }
  });

  return [
    '{',
    ...lines,
    `${bracketEndIndent}}`,
  ].join('\n');
};

const gendiff = (filePath1, filePath2) => {
  const data1 = JSON.parse(getData(filePath1));
  const data2 = JSON.parse(getData(filePath2));
  return stylish(buildTree(data1, data2));
};
  
  export default gendiff;