const fs = require('fs');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = dir + '/' + file;
        if (fs.statSync(p).isDirectory()) {
            processDir(p);
        } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
            let content = fs.readFileSync(p, 'utf8');
            content = content.replace(/import React(, {[^}]+})? from 'react';\n/g, (match, p1) => {
                if (p1) {
                    return `import ${p1.trim().replace(/^,?\s*\{/, '{')} from 'react';\n`;
                }
                return '';
            });
            content = content.replace(/import React from 'react';/g, '');
            fs.writeFileSync(p, content);
        }
    }
}
processDir('./src');
