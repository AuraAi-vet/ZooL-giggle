const code = `
function foo() {
    // console.error("in comment");
    const a = "console.error('in string')";
    const b = 'console.error("in string")';
    const c = \`console.error("in template string")\`;
    /*
       console.error("in multi
       line comment")
    */
    console.error("real error");
}
`;

function hasConsoleErrorLinter(snippet: string): boolean {
  const cleanSnippet = snippet
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove single line comments
    .replace(/`[^`]*`/g, '') // Remove template literals
    .replace(/"(?:\\.|[^"\\])*"/g, '') // Remove double quote strings
    .replace(/'(?:\\.|[^'\\])*'/g, ''); // Remove single quote strings

  return /\bconsole\s*\.\s*error\b/.test(cleanSnippet);
}

console.log(hasConsoleErrorLinter(code));

const code2 = `
function foo() {
    // console.error("in comment");
}
`;
console.log(hasConsoleErrorLinter(code2));

const code3 = `
const a = "console.error";
`;
console.log(hasConsoleErrorLinter(code3));
